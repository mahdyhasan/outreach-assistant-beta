import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type EnrichmentType = 'basic' | 'detailed' | 'social';

export function useCompanyEnrichment() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const enrichCompany = async (companyId: string, type: EnrichmentType = 'basic') => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('company-enrichment', {
        body: {
          company_id: companyId,
          enrichment_type: type,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Enrichment Complete",
        description: `Successfully enriched company with ${type} data`,
      });

      return {
        success: true,
        data: data.data,
        enrichmentType: type,
      };

    } catch (error: any) {
      console.error('Company enrichment error:', error);
      toast({
        title: "Enrichment Failed",
        description: error.message || "Failed to enrich company data",
        variant: "destructive",
      });

      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    enrichCompany,
    loading,
  };
}