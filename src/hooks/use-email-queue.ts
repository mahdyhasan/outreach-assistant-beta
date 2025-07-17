import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailQueueItem {
  id: string;
  decision_maker_id: string;
  campaign_id: string | null;
  template_id: string;
  scheduled_time: string;
  sent_time: string | null;
  status: 'pending' | 'sent' | 'failed';
  open_count: number;
  last_opened: string | null;
  created_at: string;
  // Joined data
  decision_maker?: {
    first_name: string;
    last_name: string;
    email: string;
    designation: string;
    company: {
      company_name: string;
    };
  };
  template?: {
    name: string;
    subject: string;
    content: string;
  };
}

export const useEmailQueue = () => {
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select(`
          *,
          decision_maker:decision_makers (
            first_name,
            last_name,
            email,
            designation,
            company:companies (
              company_name
            )
          ),
          template:email_templates (
            name,
            subject,
            content
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueue((data || []) as EmailQueueItem[]);
    } catch (error) {
      console.error('Error fetching email queue:', error);
      toast({
        title: "Error",
        description: "Failed to load email queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async (leadId: string, templateId?: string) => {
    try {
      const response = await supabase.functions.invoke('email-generation', {
        body: { 
          leadId,
          templateId
        }
      });

      if (response.error) throw response.error;

      await fetchQueue(); // Refresh the queue
      toast({
        title: "Success",
        description: "Email generated and added to queue"
      });

      return response.data;
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: "Failed to generate email",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateEmailStatus = async (id: string, status: 'pending' | 'sent' | 'failed') => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setQueue(prev => prev.map(item => 
        item.id === id ? { ...item, status } : item
      ));

      toast({
        title: "Success",
        description: `Email status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating email status:', error);
      toast({
        title: "Error",
        description: "Failed to update email status",
        variant: "destructive"
      });
    }
  };

  const deleteFromQueue = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQueue(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Email removed from queue"
      });
    } catch (error) {
      console.error('Error deleting from queue:', error);
      toast({
        title: "Error",
        description: "Failed to remove email from queue",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return {
    queue,
    loading,
    generateEmail,
    updateEmailStatus,
    deleteFromQueue,
    refetch: fetchQueue
  };
};