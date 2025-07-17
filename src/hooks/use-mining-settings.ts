import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MiningSettings {
  id?: string;
  daily_limit: number;
  start_time: string;
  time_zone: string;
  enable_weekends: boolean;
  quality_threshold: number;
  deduplication_strength: string;
  enrichment_depth: string;
  auto_approve_high_score: boolean;
  high_score_threshold: number;
  daily_report_enabled: boolean;
  error_alerts_enabled: boolean;
  quota_warnings_enabled: boolean;
}

export interface DailyStats {
  companies_scraped: number;
  companies_approved: number;
  companies_rejected: number;
  decision_makers_found: number;
  sources_used: string[];
  avg_quality_score: number;
}

export function useMiningSettings() {
  const [settings, setSettings] = useState<MiningSettings | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch settings
      let { data: settingsData, error: settingsError } = await supabase
        .from('mining_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      // If no settings exist, create default ones
      if (!settingsData) {
        const defaultSettings = {
          user_id: user.id,
          daily_limit: 100,
          start_time: '09:00',
          time_zone: 'UTC',
          enable_weekends: false,
          quality_threshold: 70,
          deduplication_strength: 'high',
          enrichment_depth: 'standard',
          auto_approve_high_score: false,
          high_score_threshold: 90,
          daily_report_enabled: true,
          error_alerts_enabled: true,
          quota_warnings_enabled: true,
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('mining_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        settingsData = newSettings;
      }

      setSettings(settingsData);

      // Fetch today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData } = await supabase
        .from('daily_mining_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (statsData) {
        setDailyStats(statsData);
      } else {
        // Create today's stats record
        const { data: newStats } = await supabase
          .from('daily_mining_stats')
          .insert({
            user_id: user.id,
            date: today,
            companies_scraped: 0,
            companies_approved: 0,
            companies_rejected: 0,
            decision_makers_found: 0,
            sources_used: [],
            avg_quality_score: 0,
          })
          .select()
          .single();

        setDailyStats(newStats || {
          companies_scraped: 0,
          companies_approved: 0,
          companies_rejected: 0,
          decision_makers_found: 0,
          sources_used: [],
          avg_quality_score: 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching mining settings:', error);
      toast({
        title: "Error",
        description: "Failed to load mining settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<MiningSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !settings) return;

      const { error } = await supabase
        .from('mining_settings')
        .update(newSettings)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, ...newSettings });
      toast({
        title: "Settings Updated",
        description: "Your mining settings have been saved successfully",
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const updateDailyStats = async (updates: Partial<DailyStats>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('daily_mining_stats')
        .upsert({
          user_id: user.id,
          date: today,
          ...dailyStats,
          ...updates,
        });

      if (error) throw error;

      setDailyStats(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      console.error('Error updating daily stats:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    dailyStats,
    loading,
    updateSettings,
    updateDailyStats,
    refetch: fetchSettings,
  };
}