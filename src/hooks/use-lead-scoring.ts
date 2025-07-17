import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScoringCriteria {
  industry_fit?: number;
  company_size?: number;
  technology_stack?: number;
  growth_potential?: number;
  geographic_fit?: number;
}

export function useLeadScoring() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const scoreCompany = async (companyId: string, criteria?: ScoringCriteria) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('lead-scoring', {
        body: {
          company_id: companyId,
          scoring_criteria: criteria,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const scoreChange = data.score_change || 0;
      const changeText = scoreChange > 0 ? `+${scoreChange}` : scoreChange < 0 ? `${scoreChange}` : 'no change';

      toast({
        title: "Scoring Complete",
        description: `Lead score: ${data.score}/100 (${changeText})`,
      });

      return {
        success: true,
        score: data.score,
        breakdown: data.breakdown,
        reasoning: data.reasoning,
        previousScore: data.previous_score,
        scoreChange: data.score_change,
      };

    } catch (error: any) {
      console.error('Lead scoring error:', error);
      toast({
        title: "Scoring Failed",
        description: error.message || "Failed to score lead",
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
    scoreCompany,
    loading,
  };
}