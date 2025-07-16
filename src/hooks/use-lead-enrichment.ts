import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "./use-settings";
import { useToast } from "@/hooks/use-toast";

interface EnrichLeadParams {
  leadId: string;
  companyName: string;
  website?: string;
}

interface ScoreLeadParams {
  leadId: string;
  companyData: {
    company_name: string;
    company_size: string;
    industry: string;
    location: string;
    website?: string;
    enrichment_data?: any;
  };
}

export function useLeadEnrichment() {
  const queryClient = useQueryClient();
  const { getApiKey, isApiActive, scoringWeights, targetCountries } = useSettings();
  const { toast } = useToast();

  const enrichLeadMutation = useMutation({
    mutationFn: async ({ leadId, companyName, website }: EnrichLeadParams) => {
      const apolloApiKey = getApiKey('apollo');
      
      if (!apolloApiKey) {
        throw new Error('Apollo.io API key not configured. Please add it in Settings.');
      }

      const { data, error } = await supabase.functions.invoke('lead-enrichment', {
        body: {
          leadId,
          companyName,
          website,
          apolloApiKey,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch leads data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['recent-signals'] });
      
      toast({
        title: "Lead Enriched",
        description: `Successfully enriched ${variables.companyName} with additional data.`,
      });
    },
    onError: (error) => {
      console.error('Enrichment error:', error);
      toast({
        title: "Enrichment Failed",
        description: error.message || "Failed to enrich lead data.",
        variant: "destructive",
      });
    },
  });

  const scoreLeadMutation = useMutation({
    mutationFn: async ({ leadId, companyData }: ScoreLeadParams) => {
      const openaiApiKey = getApiKey('openai');
      
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please add it in Settings.');
      }

      const { data, error } = await supabase.functions.invoke('lead-scoring', {
        body: {
          leadId,
          companyData,
          scoringWeights,
          targetCountries,
          openaiApiKey,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch leads data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-scores'] });
      
      toast({
        title: "Lead Scored",
        description: `${variables.companyData.company_name} scored ${data.final_score} points.`,
      });
    },
    onError: (error) => {
      console.error('Scoring error:', error);
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score lead.",
        variant: "destructive",
      });
    },
  });

  const enrichAndScoreLead = async (params: EnrichLeadParams & { companyData: ScoreLeadParams['companyData'] }) => {
    try {
      // First enrich the lead
      if (isApiActive('apollo')) {
        await enrichLeadMutation.mutateAsync({
          leadId: params.leadId,
          companyName: params.companyName,
          website: params.website,
        });
      }

      // Then score the lead
      if (isApiActive('openai')) {
        await scoreLeadMutation.mutateAsync({
          leadId: params.leadId,
          companyData: params.companyData,
        });
      }
    } catch (error) {
      console.error('Enrich and score error:', error);
    }
  };

  return {
    enrichLead: enrichLeadMutation.mutate,
    scoreLead: scoreLeadMutation.mutate,
    enrichAndScoreLead,
    isEnriching: enrichLeadMutation.isPending,
    isScoring: scoreLeadMutation.isPending,
    isProcessing: enrichLeadMutation.isPending || scoreLeadMutation.isPending,
  };
}