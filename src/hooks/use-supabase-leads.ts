import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyLead {
  id: string;
  company_name: string;
  website?: string;
  industry?: string;
  employee_size?: string;
  founded?: string;
  description?: string;
  public_email?: string;
  public_phone?: string;
  linkedin_profile?: string;
  enrichment_data: any;
  ai_score: number;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  decision_makers?: DecisionMaker[];
  signals?: Signal[];
}

export interface DecisionMaker {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  designation: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_profile?: string;
  contact_type: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  company_id: string;
  signal_type: string;
  signal_title: string;
  signal_description?: string;
  detected_at: string;
  priority: string;
  signal_url?: string;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export function useSupabaseLeads() {
  const [leads, setLeads] = useState<CompanyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Fetch companies with their decision makers and signals (user-filtered)
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          decision_makers(*),
          signals(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads(companies || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (id: string, updates: Partial<CompanyLead>) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company updated successfully",
      });

      await fetchLeads();
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const enrichCompany = async (id: string, enrichmentType: string) => {
    try {
      // Here you would call your enrichment edge function
      // For now, we'll just update the enrichment_data field
      const { error } = await supabase
        .from('companies')
        .update({
          enrichment_data: {
            ...leads.find(l => l.id === id)?.enrichment_data,
            [`${enrichmentType}_enriched_at`]: new Date().toISOString()
          }
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Company enriched with ${enrichmentType} data`,
      });

      await fetchLeads();
    } catch (error) {
      console.error('Error enriching company:', error);
      toast({
        title: "Error", 
        description: "Failed to enrich company",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads,
    loading,
    refetch: fetchLeads,
    updateCompany,
    enrichCompany
  };
}