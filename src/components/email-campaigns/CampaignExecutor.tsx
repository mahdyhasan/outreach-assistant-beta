import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Clock, Users, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useZohoEmail } from '@/hooks/use-zoho-email';
import { EmailCampaign } from '@/hooks/use-email-campaigns';

interface CampaignExecutorProps {
  campaign: EmailCampaign;
  onCampaignUpdate: () => void;
}

interface QueuedEmail {
  id: string;
  decision_maker_id: string;
  template_id: string;
  scheduled_time: string;
  status: string;
  decision_makers: {
    first_name: string;
    last_name: string;
    email: string;
    companies: {
      company_name: string;
    };
  };
  email_templates: {
    name: string;
    subject: string;
    content: string;
  };
}

export const CampaignExecutor = ({ campaign, onCampaignUpdate }: CampaignExecutorProps) => {
  const { toast } = useToast();
  const { sendEmail, loading: emailLoading } = useZohoEmail();
  const [processing, setProcessing] = useState(false);
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([]);

  const loadQueuedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select(`
          id,
          decision_maker_id,
          template_id,
          scheduled_time,
          status,
          decision_makers (
            first_name,
            last_name,
            email,
            companies (
              company_name
            )
          ),
          email_templates (
            name,
            subject,
            content
          )
        `)
        .eq('campaign_id', campaign.id)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setQueuedEmails(data || []);
    } catch (error) {
      console.error('Error loading queued emails:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign emails",
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    if (campaign.status === 'active') {
      loadQueuedEmails();
    }
  }, [campaign.id, campaign.status]);

  const processPendingEmails = async () => {
    setProcessing(true);
    
    try {
      // Get emails that are due to be sent (scheduled_time <= now and status = 'pending')
      const now = new Date().toISOString();
      const dueEmails = queuedEmails.filter(
        email => email.status === 'pending' && email.scheduled_time <= now
      );

      if (dueEmails.length === 0) {
        toast({
          title: "No emails due",
          description: "No emails are scheduled to be sent at this time",
        });
        return;
      }

      let sentCount = 0;
      
      for (const queuedEmail of dueEmails) {
        try {
          // Replace template variables with actual data
          let emailContent = queuedEmail.email_templates.content;
          let emailSubject = queuedEmail.email_templates.subject;
          
          const contactName = `${queuedEmail.decision_makers.first_name} ${queuedEmail.decision_makers.last_name}`;
          const companyName = queuedEmail.decision_makers.companies.company_name;
          
          emailContent = emailContent
            .replace(/\{contactName\}/g, contactName)
            .replace(/\{firstName\}/g, queuedEmail.decision_makers.first_name)
            .replace(/\{lastName\}/g, queuedEmail.decision_makers.last_name)
            .replace(/\{companyName\}/g, companyName);
            
          emailSubject = emailSubject
            .replace(/\{contactName\}/g, contactName)
            .replace(/\{firstName\}/g, queuedEmail.decision_makers.first_name)
            .replace(/\{companyName\}/g, companyName);

          // Send the email via Zoho SMTP
          await sendEmail({
            to: queuedEmail.decision_makers.email,
            subject: emailSubject,
            htmlContent: emailContent,
            fromName: 'Outreach Assistant'
          });

          // Update email status to 'sent'
          await supabase
            .from('email_queue')
            .update({ 
              status: 'sent',
              sent_time: new Date().toISOString()
            })
            .eq('id', queuedEmail.id);

          sentCount++;
          
          // Add delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`Error sending email to ${queuedEmail.decision_makers.email}:`, error);
          
          // Update email status to 'failed'
          await supabase
            .from('email_queue')
            .update({ status: 'failed' })
            .eq('id', queuedEmail.id);
        }
      }

      toast({
        title: "Emails Sent",
        description: `Successfully sent ${sentCount} out of ${dueEmails.length} emails`,
      });

      // Reload the queued emails to reflect status changes
      await loadQueuedEmails();
      onCampaignUpdate();

    } catch (error) {
      console.error('Error processing emails:', error);
      toast({
        title: "Error",
        description: "Failed to process campaign emails",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const pauseCampaign = async () => {
    try {
      await supabase
        .from('email_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaign.id);

      toast({
        title: "Campaign Paused",
        description: "Email campaign has been paused",
      });

      onCampaignUpdate();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Error",
        description: "Failed to pause campaign",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async () => {
    try {
      await supabase
        .from('email_campaigns')
        .update({ status: 'active' })
        .eq('id', campaign.id);

      toast({
        title: "Campaign Resumed",
        description: "Email campaign has been resumed",
      });

      onCampaignUpdate();
    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Error",
        description: "Failed to resume campaign",
        variant: "destructive"
      });
    }
  };

  if (campaign.status !== 'active' && campaign.status !== 'paused') {
    return null;
  }

  const pendingEmails = queuedEmails.filter(e => e.status === 'pending');
  const sentEmails = queuedEmails.filter(e => e.status === 'sent');
  const failedEmails = queuedEmails.filter(e => e.status === 'failed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Campaign Execution
          </div>
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
            {campaign.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <div>
              <div className="text-sm text-muted-foreground">Pending</div>
              <div className="font-bold">{pendingEmails.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-sm text-muted-foreground">Sent</div>
              <div className="font-bold">{sentEmails.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-red-500" />
            <div>
              <div className="text-sm text-muted-foreground">Failed</div>
              <div className="font-bold">{failedEmails.length}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {campaign.status === 'active' && (
            <>
              <Button 
                onClick={processPendingEmails}
                disabled={processing || emailLoading || pendingEmails.length === 0}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {processing ? 'Sending...' : `Send ${pendingEmails.length} Emails`}
              </Button>
              <Button variant="outline" onClick={pauseCampaign}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            </>
          )}
          
          {campaign.status === 'paused' && (
            <Button onClick={resumeCampaign} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Resume Campaign
            </Button>
          )}
        </div>

        {queuedEmails.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2">
            <div className="text-sm font-medium">Email Queue:</div>
            {queuedEmails.slice(0, 10).map((email) => (
              <div key={email.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div>
                  <span className="font-medium">
                    {email.decision_makers.first_name} {email.decision_makers.last_name}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    • {email.email_templates.name}
                  </span>
                </div>
                <Badge variant={
                  email.status === 'sent' ? 'default' : 
                  email.status === 'failed' ? 'destructive' : 
                  'secondary'
                }>
                  {email.status}
                </Badge>
              </div>
            ))}
            {queuedEmails.length > 10 && (
              <div className="text-sm text-muted-foreground text-center">
                ... and {queuedEmails.length - 10} more emails
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};