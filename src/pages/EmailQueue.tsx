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
  Edit, 
  Trash2, 
  Eye, 
  Check, 
  X,
  Clock,
  AlertCircle
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface EmailQueueItem {
  id: string;
  lead_id: string;
  subject: string;
  content: string;
  status: 'pending_review' | 'approved' | 'sent' | 'rejected';
  recipient_email: string;
  recipient_name: string;
  company_name: string;
  generated_at: string;
  reviewed_at?: string;
  sent_at?: string;
}

const EmailQueue = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingEmail, setEditingEmail] = useState<EmailQueueItem | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedContent, setEditedContent] = useState("");

  // Fetch email queue
  const { data: emailQueue = [], isLoading } = useQuery({
    queryKey: ['email-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('generated_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailQueueItem[];
    },
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailQueueItem> }) => {
      const { data, error } = await supabase
        .from('email_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      toast({
        title: "Email Updated",
        description: "Email has been updated successfully.",
      });
      setEditingEmail(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue'] });
      toast({
        title: "Email Deleted",
        description: "Email has been removed from the queue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (email: EmailQueueItem) => {
    setEditingEmail(email);
    setEditedSubject(email.subject);
    setEditedContent(email.content);
  };

  const handleSaveEdit = () => {
    if (!editingEmail) return;
    
    updateEmailMutation.mutate({
      id: editingEmail.id,
      updates: {
        subject: editedSubject,
        content: editedContent,
      }
    });
  };

  const handleApprove = (id: string) => {
    updateEmailMutation.mutate({
      id,
      updates: {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      }
    });
  };

  const handleReject = (id: string) => {
    updateEmailMutation.mutate({
      id,
      updates: {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'warning';
      case 'approved': return 'success';
      case 'sent': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_review': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const pendingEmails = emailQueue.filter(email => email.status === 'pending_review');
  const approvedEmails = emailQueue.filter(email => email.status === 'approved');
  const sentEmails = emailQueue.filter(email => email.status === 'sent');
  const rejectedEmails = emailQueue.filter(email => email.status === 'rejected');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Email Queue</h1>
                <p className="text-muted-foreground mt-2">
                  Review, edit, and approve AI-generated emails before sending
                </p>
              </div>

              <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingEmails.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Approved ({approvedEmails.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Sent ({sentEmails.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Rejected ({rejectedEmails.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingEmails.map((email) => (
                    <Card key={email.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Mail className="h-5 w-5" />
                              {email.company_name} - {email.recipient_name}
                            </CardTitle>
                            <CardDescription>{email.recipient_email}</CardDescription>
                          </div>
                          <Badge variant={getStatusColor(email.status) as any} className="flex items-center gap-1">
                            {getStatusIcon(email.status)}
                            {email.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Subject:</Label>
                          <p className="text-sm text-muted-foreground">{email.subject}</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Content Preview:</Label>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {email.content.substring(0, 200)}...
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Email Preview</DialogTitle>
                                <DialogDescription>
                                  To: {email.recipient_email} ({email.recipient_name})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Subject:</Label>
                                  <p className="font-medium">{email.subject}</p>
                                </div>
                                <div>
                                  <Label>Content:</Label>
                                  <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                    {email.content}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="outline" size="sm" onClick={() => handleEdit(email)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleApprove(email.id)}
                            disabled={updateEmailMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReject(email.id)}
                            disabled={updateEmailMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => deleteEmailMutation.mutate(email.id)}
                            disabled={deleteEmailMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {pendingEmails.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No emails pending review</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Other tabs with similar structure for approved, sent, rejected */}
                <TabsContent value="approved">
                  {/* Similar structure for approved emails */}
                  <div className="space-y-4">
                    {approvedEmails.map((email) => (
                      <Card key={email.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                {email.company_name} - {email.recipient_name}
                              </CardTitle>
                              <CardDescription>{email.recipient_email}</CardDescription>
                            </div>
                            <Badge variant="default" className="flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              Approved
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Ready to send • Approved on {new Date(email.reviewed_at!).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sent">
                  <div className="space-y-4">
                    {sentEmails.map((email) => (
                      <Card key={email.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                {email.company_name} - {email.recipient_name}
                              </CardTitle>
                              <CardDescription>{email.recipient_email}</CardDescription>
                            </div>
                            <Badge variant="default" className="flex items-center gap-1">
                              <Send className="h-4 w-4" />
                              Sent
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Sent on {new Date(email.sent_at!).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rejected">
                  <div className="space-y-4">
                    {rejectedEmails.map((email) => (
                      <Card key={email.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                {email.company_name} - {email.recipient_name}
                              </CardTitle>
                              <CardDescription>{email.recipient_email}</CardDescription>
                            </div>
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <X className="h-4 w-4" />
                              Rejected
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Rejected on {new Date(email.reviewed_at!).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Edit Email Dialog */}
              {editingEmail && (
                <Dialog open={!!editingEmail} onOpenChange={() => setEditingEmail(null)}>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Edit Email</DialogTitle>
                      <DialogDescription>
                        Make changes to the email before approval
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-subject">Subject</Label>
                        <Input
                          id="edit-subject"
                          value={editedSubject}
                          onChange={(e) => setEditedSubject(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-content">Content</Label>
                        <Textarea
                          id="edit-content"
                          rows={15}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingEmail(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={updateEmailMutation.isPending}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmailQueue;
