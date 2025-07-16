import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "./use-settings";
import { useToast } from "@/hooks/use-toast";

interface GenerateEmailParams {
  leadId: string;
  contactData: {
    contact_name: string;
    email: string;
    job_title: string;
  };
  companyData: {
    company_name: string;
    industry: string;
    company_size: string;
    location: string;
    website?: string;
    enrichment_data?: any;
  };
}

export function useEmailGeneration() {
  const queryClient = useQueryClient();
  const { getApiKey, isApiActive, emailSettings } = useSettings();
  const { toast } = useToast();

  const generateEmailMutation = useMutation({
    mutationFn: async ({ leadId, contactData, companyData }: GenerateEmailParams) => {
      const openaiApiKey = getApiKey('openai');
      
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please add it in Settings.');
      }

      if (!emailSettings.emailPrompt) {
        throw new Error('Email prompt not configured. Please set it up in Settings.');
      }

      const { data, error } = await supabase.functions.invoke('email-generation', {
        body: {
          leadId,
          contactData,
          companyData,
          emailPrompt: emailSettings.emailPrompt,
          signature: emailSettings.signature,
          openaiApiKey,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate email queue to show new email
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      
      toast({
        title: "Email Generated",
        description: `Email for ${variables.contactData.contact_name} has been generated and added to the queue for review.`,
      });
    },
    onError: (error) => {
      console.error('Email generation error:', error);
      toast({
        title: "Email Generation Failed",
        description: error.message || "Failed to generate email.",
        variant: "destructive",
      });
    },
  });

  const canGenerateEmails = isApiActive('openai') && !!emailSettings.emailPrompt;

  return {
    generateEmail: generateEmailMutation.mutate,
    isGenerating: generateEmailMutation.isPending,
    canGenerateEmails,
  };
}