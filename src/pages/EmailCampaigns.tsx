import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  FileText,
  Send,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Copy,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import { useEmailCampaigns } from "@/hooks/use-email-campaigns";
import { EmailTemplateDialog } from "@/components/email-campaigns/EmailTemplateDialog";
import { CampaignDialog } from "@/components/email-campaigns/CampaignDialog";

const EmailCampaigns = () => {
  const { templates, loading: templatesLoading, createTemplate, updateTemplate, deleteTemplate } = useEmailTemplates();
  const { campaigns, loading: campaignsLoading, createCampaign, updateCampaign, deleteCampaign } = useEmailCampaigns();
  const { toast } = useToast();
  
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [emailStats, setEmailStats] = useState({
    totalSent: 0,
    totalPending: 0,
    totalOpened: 0,
    openRate: 0
  });

  const handleCreateTemplate = async (template) => {
    await createTemplate(template);
    setTemplateDialogOpen(false);
  };

  const handleUpdateTemplate = async (template) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, template);
      setEditingTemplate(null);
      setTemplateDialogOpen(false);
    }
  };

  const handleCreateCampaign = async (campaign) => {
    await createCampaign(campaign);
    setCampaignDialogOpen(false);
  };

  const handleUpdateCampaign = async (campaign) => {
    if (editingCampaign) {
      await updateCampaign(editingCampaign.id, campaign);
      setEditingCampaign(null);
      setCampaignDialogOpen(false);
    }
  };

  // Fetch email statistics
  useEffect(() => {
    const fetchEmailStats = async () => {
      try {
        const { data: emailQueue, error } = await supabase
          .from('email_queue')
          .select('status, open_count, sent_time');

        if (error) throw error;

        const totalSent = emailQueue?.filter(email => email.status === 'sent').length || 0;
        const totalPending = emailQueue?.filter(email => email.status === 'pending').length || 0;
        const totalOpened = emailQueue?.reduce((sum, email) => sum + (email.open_count || 0), 0) || 0;
        const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;

        setEmailStats({
          totalSent,
          totalPending,
          totalOpened,
          openRate
        });
      } catch (error) {
        console.error('Error fetching email stats:', error);
      }
    };

    fetchEmailStats();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'active': return 'default';
      case 'paused': return 'outline';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const handleDuplicateTemplate = async (template) => {
    try {
      await createTemplate({
        name: `${template.name} (Copy)`,
        subject: template.subject,
        content: template.content,
        is_default: false
      });
      toast({
        title: "Success",
        description: "Template duplicated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      await createCampaign({
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        status: 'draft',
        schedule_time: null
      });
      toast({
        title: "Success",
        description: "Campaign duplicated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive"
      });
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
                    Manage email templates and campaigns for lead outreach
                  </p>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Active Campaigns</div>
                        <div className="text-2xl font-bold">
                          {campaigns.filter(c => c.status === 'active').length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email Templates</div>
                        <div className="text-2xl font-bold">{templates.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Emails Sent</div>
                        <div className="text-2xl font-bold">{emailStats.totalSent}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Open Rate</div>
                        <div className="text-2xl font-bold">{emailStats.openRate}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Pending Emails</div>
                        <div className="text-2xl font-bold">{emailStats.totalPending}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-indigo-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Total Opens</div>
                        <div className="text-2xl font-bold">{emailStats.totalOpened}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="campaigns" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Email Campaigns</h2>
                    <Button onClick={() => setCampaignDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </div>

                  {campaignsLoading ? (
                    <div className="text-center py-8">Loading campaigns...</div>
                  ) : campaigns.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No email campaigns yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create your first campaign to start reaching out to leads
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {campaigns.map((campaign) => (
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
                                <Badge variant={getStatusColor(campaign.status)}>
                                  {campaign.status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCampaign(campaign);
                                    setCampaignDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDuplicateCampaign(campaign)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteCampaign(campaign.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Created {new Date(campaign.created_at).toLocaleDateString()}</span>
                              {campaign.schedule_time && (
                                <span>Scheduled for {new Date(campaign.schedule_time).toLocaleString()}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Email Templates</h2>
                    <Button onClick={() => setTemplateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </div>

                  {templatesLoading ? (
                    <div className="text-center py-8">Loading templates...</div>
                  ) : templates.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No email templates yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Create reusable templates for consistent messaging
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {templates.map((template) => (
                        <Card key={template.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  {template.name}
                                  {template.is_default && (
                                    <Badge variant="outline">Default</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>{template.subject}</CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingTemplate(template);
                                    setTemplateDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDuplicateTemplate(template)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteTemplate(template.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.content.substring(0, 150)}...
                            </p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Created {new Date(template.created_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      <EmailTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
      />

      <CampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        campaign={editingCampaign}
        onSave={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
      />
    </SidebarProvider>
  );
};

export default EmailCampaigns;