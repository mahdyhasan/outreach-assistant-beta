import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Send, 
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  BarChart
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  leads_count: number;
  emails_sent: number;
  responses_count: number;
}

const EmailCampaigns = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [followupPrompt, setFollowupPrompt] = useState(`Write 6 follow-up emails for this lead nurturing campaign. Each email should:
1. Be progressively more direct about the value proposition
2. Include different case studies or social proof
3. Address common objections
4. Have clear call-to-actions
5. Maintain a professional but friendly tone

Email 1: Introduction and problem identification
Email 2: Solution overview with case study
Email 3: Social proof and testimonials
Email 4: ROI focus and objection handling
Email 5: Urgency and limited time offer
Email 6: Final value proposition and direct ask`);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailCampaign[];
    },
  });

  // Fetch approved leads for campaign creation
  const { data: availableLeads = [] } = useQuery({
    queryKey: ['available-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, company_name, contact_name, email, status')
        .eq('status', 'approved')
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: { name: string; description: string; selectedLeads: string[] }) => {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaignData.name,
          description: campaignData.description,
          leads_count: campaignData.selectedLeads.length,
        })
        .select()
        .single();
      
      if (campaignError) throw campaignError;

      // Generate emails for selected leads
      for (const leadId of campaignData.selectedLeads) {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (lead) {
          // Generate initial email
          await supabase.functions.invoke('email-generation', {
            body: {
              leadId: lead.id,
              campaignId: campaign.id,
              emailType: 'initial',
              customPrompt: `Generate an initial outreach email for ${lead.contact_name} at ${lead.company_name}.`
            }
          });

          // Generate follow-up emails if prompt provided
          if (followupPrompt.trim()) {
            await supabase.functions.invoke('email-generation', {
              body: {
                leadId: lead.id,
                campaignId: campaign.id,
                emailType: 'followup_sequence',
                customPrompt: followupPrompt
              }
            });
          }
        }
      }

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      toast({
        title: "Campaign Created",
        description: "Email campaign created and emails generated successfully.",
      });
      setIsCreateDialogOpen(false);
      setCampaignName("");
      setCampaignDescription("");
      setSelectedTemplate("");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({
        title: "Campaign Deleted",
        description: "Email campaign has been deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a campaign name.",
        variant: "destructive",
      });
      return;
    }

    // For now, select all available leads
    const selectedLeads = availableLeads.map(lead => lead.id);
    
    if (selectedLeads.length === 0) {
      toast({
        title: "No Leads Available",
        description: "Please approve some leads first before creating a campaign.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      name: campaignName,
      description: campaignDescription,
      selectedLeads
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'paused': return 'warning';
      case 'completed': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-card-foreground">Email Campaigns</h1>
                  <p className="text-muted-foreground mt-2">
                    Create and manage email outreach campaigns
                  </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Email Campaign</DialogTitle>
                      <DialogDescription>
                        Set up a new email outreach campaign with AI-generated sequences
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          placeholder="e.g., Q1 Tech Startup Outreach"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="campaign-description">Description</Label>
                        <Textarea
                          id="campaign-description"
                          value={campaignDescription}
                          onChange={(e) => setCampaignDescription(e.target.value)}
                          placeholder="Brief description of this campaign..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="email-template">Email Template</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cold-outreach">Cold Outreach</SelectItem>
                            <SelectItem value="warm-introduction">Warm Introduction</SelectItem>
                            <SelectItem value="follow-up">Follow-up Sequence</SelectItem>
                            <SelectItem value="product-demo">Product Demo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="followup-prompt">Follow-up Email Prompt for ChatGPT</Label>
                        <Textarea
                          id="followup-prompt"
                          value={followupPrompt}
                          onChange={(e) => setFollowupPrompt(e.target.value)}
                          placeholder="Enter instructions for ChatGPT to generate follow-up emails..."
                          rows={6}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This prompt will be used to generate a sequence of follow-up emails
                        </p>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Available leads: {availableLeads.length}</p>
                        <p>All approved leads will be included in this campaign</p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateCampaign}
                          disabled={createCampaignMutation.isPending}
                        >
                          {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Total Campaigns</div>
                        <div className="text-2xl font-bold">{campaigns.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Emails Sent</div>
                        <div className="text-2xl font-bold">
                          {campaigns.reduce((sum, c) => sum + c.emails_sent, 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Total Leads</div>
                        <div className="text-2xl font-bold">
                          {campaigns.reduce((sum, c) => sum + c.leads_count, 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <BarChart className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Responses</div>
                        <div className="text-2xl font-bold">
                          {campaigns.reduce((sum, c) => sum + c.responses_count, 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaigns List */}
              <div className="space-y-4">
                {isLoading ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading campaigns...</p>
                    </CardContent>
                  </Card>
                ) : campaigns.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No email campaigns yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create your first campaign to start outreach
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Mail className="h-5 w-5" />
                              {campaign.name}
                            </CardTitle>
                            <CardDescription>{campaign.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(campaign.status) as any}>
                              {campaign.status}
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                              disabled={deleteCampaignMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Leads:</span> {campaign.leads_count}
                          </div>
                          <div>
                            <span className="font-medium">Emails Sent:</span> {campaign.emails_sent}
                          </div>
                          <div>
                            <span className="font-medium">Responses:</span> {campaign.responses_count}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmailCampaigns;