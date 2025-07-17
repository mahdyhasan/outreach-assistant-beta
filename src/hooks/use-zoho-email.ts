import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName?: string;
}

export const useZohoEmail = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const sendEmail = async (emailData: EmailData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('send-smtp-email', {
        body: emailData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send email');
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to send email');
      }

      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${emailData.to}`,
      });

      return response.data;

    } catch (error) {
      console.error('Error sending email:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send email via Zoho SMTP';

      toast({
        title: "Email Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendBulkEmails = async (emails: EmailData[]) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    const results = [];

    try {
      for (const email of emails) {
        try {
          const result = await sendEmail(email);
          results.push({ success: true, email: email.to, result });
          
          // Add delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.push({ 
            success: false, 
            email: email.to, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      toast({
        title: "Bulk Email Complete",
        description: `${successCount} emails sent successfully, ${failureCount} failed`,
      });

      return results;

    } catch (error) {
      console.error('Error in bulk email send:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    sendBulkEmails,
    loading
  };
};