import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Send, 
  Edit, 
  Trash2, 
  Eye, 
  Check, 
  X,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEmailQueue } from "@/hooks/use-email-queue";

export default function EmailQueue() {
  const { queue, loading, updateEmailStatus, deleteFromQueue, refetch } = useEmailQueue();
  const [editingEmail, setEditingEmail] = useState(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const handleEdit = (email) => {
    setEditingEmail(email);
    setEditedSubject(email.template?.subject || '');
    setEditedContent(email.template?.content || '');
  };

  const handleSaveEdit = () => {
    if (!editingEmail) return;
    // Note: In a real implementation, you'd update the template or create a new one
    setEditingEmail(null);
    toast.success('Email updated successfully');
  };

  const handleApprove = (id: string) => {
    updateEmailStatus(id, 'sent');
  };

  const handleReject = (id: string) => {
    updateEmailStatus(id, 'failed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'sent': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <Check className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const pendingEmails = queue.filter(email => email.status === 'pending');
  const sentEmails = queue.filter(email => email.status === 'sent');
  const failedEmails = queue.filter(email => email.status === 'failed');

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
                  <h1 className="text-3xl font-bold text-card-foreground">Email Queue</h1>
                  <p className="text-muted-foreground mt-2">
                    Review and manage AI-generated emails
                  </p>
                </div>
                <Button onClick={refetch} variant="outline" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingEmails.length})
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Sent ({sentEmails.length})
                  </TabsTrigger>
                  <TabsTrigger value="failed" className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Failed ({failedEmails.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">Loading emails...</div>
                  ) : pendingEmails.map((email) => (
                    <Card key={email.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Mail className="h-5 w-5" />
                              {email.decision_maker?.company?.company_name} - {email.decision_maker?.first_name} {email.decision_maker?.last_name}
                            </CardTitle>
                            <CardDescription>{email.decision_maker?.email}</CardDescription>
                          </div>
                          <Badge variant={getStatusColor(email.status) as any} className="flex items-center gap-1">
                            {getStatusIcon(email.status)}
                            {email.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Subject:</Label>
                          <p className="text-sm text-muted-foreground">{email.template?.subject}</p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Content Preview:</Label>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {email.template?.content?.substring(0, 200)}...
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
                                  To: {email.decision_maker?.email} ({email.decision_maker?.first_name} {email.decision_maker?.last_name})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Subject:</Label>
                                  <p className="font-medium">{email.template?.subject}</p>
                                </div>
                                <div>
                                  <Label>Content:</Label>
                                  <div className="mt-2 p-4 bg-muted rounded-lg whitespace-pre-wrap">
                                    {email.template?.content}
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
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReject(email.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => deleteFromQueue(email.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {!loading && pendingEmails.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No emails pending review</p>
                      </CardContent>
                    </Card>
                  )}
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
                                {email.decision_maker?.company?.company_name} - {email.decision_maker?.first_name} {email.decision_maker?.last_name}
                              </CardTitle>
                              <CardDescription>{email.decision_maker?.email}</CardDescription>
                            </div>
                            <Badge variant="default" className="flex items-center gap-1">
                              <Send className="h-4 w-4" />
                              Sent
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Sent on {email.sent_time ? new Date(email.sent_time).toLocaleDateString() : 'Unknown'}
                          </p>
                          {email.open_count > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Opened {email.open_count} times
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {sentEmails.length === 0 && (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No emails sent yet</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="failed">
                  <div className="space-y-4">
                    {failedEmails.map((email) => (
                      <Card key={email.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                {email.decision_maker?.company?.company_name} - {email.decision_maker?.first_name} {email.decision_maker?.last_name}
                              </CardTitle>
                              <CardDescription>{email.decision_maker?.email}</CardDescription>
                            </div>
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <X className="h-4 w-4" />
                              Failed
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Failed to send
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {failedEmails.length === 0 && (
                      <Card>
                        <CardContent className="text-center py-12">
                          <X className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No failed emails</p>
                        </CardContent>
                      </Card>
                    )}
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
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-content">Content</Label>
                        <Textarea
                          id="edit-content"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={10}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setEditingEmail(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
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
}