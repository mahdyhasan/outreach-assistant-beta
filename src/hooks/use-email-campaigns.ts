import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  schedule_time: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaignStep {
  id: string;
  campaign_id: string;
  template_id: string;
  step_order: number;
  delay_days: number;
  channel: string;
}

export const useEmailCampaigns = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as EmailCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load email campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaign: Omit<EmailCampaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([{
          ...campaign,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => [data as EmailCampaign, ...prev]);
      toast({
        title: "Success",
        description: "Email campaign created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create email campaign",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<EmailCampaign>) => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCampaigns(prev => prev.map(c => c.id === id ? data as EmailCampaign : c));
      toast({
        title: "Success",
        description: "Email campaign updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update email campaign",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Email campaign deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete email campaign",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaigns
  };
};