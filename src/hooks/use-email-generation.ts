import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailGenerationRequest {
  leadId: string;
  template?: string;
  customPrompt?: string;
}

export const useEmailGeneration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateEmail = useMutation({
    mutationFn: async (request: EmailGenerationRequest) => {
      const { data, error } = await supabase.functions.invoke('email-generation', {
        body: request,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate email queue to refresh the list
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      
      toast({
        title: "Email Generated",
        description: "Email has been generated and added to the queue for review.",
      });
    },
    onError: (error: any) => {
      console.error('Email generation failed:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkGenerateEmails = useMutation({
    mutationFn: async (requests: EmailGenerationRequest[]) => {
      const results = await Promise.allSettled(
        requests.map(request => 
          supabase.functions.invoke('email-generation', {
            body: request,
          })
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      return { successful, failed, total: requests.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      
      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${data.successful} emails successfully. ${data.failed} failed.`,
      });
    },
    onError: (error: any) => {
      console.error('Bulk email generation failed:', error);
      toast({
        title: "Bulk Generation Failed",
        description: error.message || "Failed to generate emails in bulk.",
        variant: "destructive",
      });
    },
  });

  return {
    generateEmail,
    bulkGenerateEmails,
    isGenerating: generateEmail.isPending || bulkGenerateEmails.isPending,
  };
};