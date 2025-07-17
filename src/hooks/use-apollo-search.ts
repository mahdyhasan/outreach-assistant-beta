import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanySearchFilters {
  query: string;
  location?: string;
  industry?: string;
  size?: string;
  limit?: number;
}

export function useApolloSearch() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchCompanies = async (filters: CompanySearchFilters) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('apollo-company-search', {
        body: filters,
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Search Complete",
        description: `Found ${data.total_found} companies, added ${data.companies?.length || 0} new ones`,
      });

      return {
        success: true,
        companies: data.companies || [],
        totalFound: data.total_found || 0,
        decisionMakersFound: data.decision_makers_found || 0,
      };

    } catch (error: any) {
      console.error('Apollo search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search companies with Apollo",
        variant: "destructive",
      });

      return {
        success: false,
        error: error.message,
        companies: [],
        totalFound: 0,
        decisionMakersFound: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    searchCompanies,
    loading,
  };
}