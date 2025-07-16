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
  AlertCircle
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface EmailQueueItem {
  id: string;
  decision_maker_id: string;
  subject: string;
  content: string;
  status: 'pending' | 'approved' | 'sent' | 'failed';
  recipient_email: string;
  recipient_name: string;
  company_name: string;
  created_at: string;
  sent_at?: string;
  approved_at?: string;
  error_message?: string;
}

// Mock data for prototype
const mockEmailQueue: EmailQueueItem[] = [
  {
    id: '1',
    decision_maker_id: '1',
    subject: 'Partnership Opportunity with TechCorp',
    content: `Hi Sarah,

I saw TechCorp's recent Series A announcement - congratulations! Your AI-powered software solutions for enterprises are impressive.

I'd love to discuss how our platform could help accelerate your growth during this exciting phase. We specialize in helping companies like yours scale their operations efficiently.

Would you be open to a brief 15-minute call this week to explore potential synergies?

Best regards,
Alex`,
    recipient_email: 'sarah.johnson@techcorp.com',
    recipient_name: 'Sarah Johnson',
    company_name: 'TechCorp Innovation',
    status: 'pending',
    created_at: '2024-01-19T09:00:00Z'
  },
  {
    id: '2',
    decision_maker_id: '3',
    subject: 'Scaling Solutions for StartupFlow',
    content: `Hi Emma,

I noticed StartupFlow is hiring aggressively - 10+ engineer positions posted! Your financial workflow automation platform is exactly the kind of innovative solution the market needs.

Our platform has helped similar fintech startups streamline their growth processes. Would you be interested in learning how we could support StartupFlow's expansion?

Looking forward to connecting,
Alex`,
    recipient_email: 'emma@startupflow.io',
    recipient_name: 'Emma Williams',
    company_name: 'StartupFlow',
    status: 'pending',
    created_at: '2024-01-19T10:30:00Z'
  },
  {
    id: '3',
    decision_maker_id: '4',
    subject: 'Congratulations on the AI Suite Launch',
    content: `Hi David,

Congratulations on launching the AI Analytics Suite! The market response has been fantastic from what I've seen.

I'd love to explore potential integrations between our platforms. Our solution could complement your analytics suite beautifully.

Would you be available for a quick call to discuss collaboration opportunities?

Best,
Alex`,
    recipient_email: 'david.rodriguez@datainsights.pro',
    recipient_name: 'David Rodriguez',
    company_name: 'DataInsights Pro',
    status: 'sent',
    created_at: '2024-01-18T14:00:00Z',
    sent_at: '2024-01-18T14:05:00Z'
  }
];

export default function EmailQueue() {
  const [emailQueue, setEmailQueue] = useState<EmailQueueItem[]>(mockEmailQueue);
  const [editingEmail, setEditingEmail] = useState<EmailQueueItem | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const handleEdit = (email: EmailQueueItem) => {
    setEditingEmail(email);
    setEditedSubject(email.subject);
    setEditedContent(email.content);
  };

  const handleSaveEdit = () => {
    if (!editingEmail) return;
    
    setEmailQueue(prev => prev.map(email => 
      email.id === editingEmail.id 
        ? { ...email, subject: editedSubject, content: editedContent }
        : email
    ));
    
    setEditingEmail(null);
    toast.success('Email updated successfully');
  };

  const handleApprove = (id: string) => {
    setEmailQueue(prev => prev.map(email => 
      email.id === id 
        ? { ...email, status: 'approved' as const, approved_at: new Date().toISOString() }
        : email
    ));
    toast.success('Email approved');
  };

  const handleReject = (id: string) => {
    setEmailQueue(prev => prev.map(email => 
      email.id === id 
        ? { ...email, status: 'failed' as const, error_message: 'Rejected by user' }
        : email
    ));
    toast.success('Email rejected');
  };

  const deleteEmail = (emailId: string) => {
    setEmailQueue(prev => prev.filter(email => email.id !== emailId));
    toast.success('Email deleted from queue');
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

  const pendingEmails = emailQueue.filter(email => email.status === 'pending');
  const approvedEmails = emailQueue.filter(email => email.status === 'approved');
  const sentEmails = emailQueue.filter(email => email.status === 'sent');
  const rejectedEmails = emailQueue.filter(email => email.status === 'failed');

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
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
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
                            onClick={() => deleteEmail(email.id)}
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

                <TabsContent value="approved">
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
                            Ready to send • Approved on {email.approved_at ? new Date(email.approved_at).toLocaleDateString() : 'Unknown'}
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
                            Failed - {email.error_message || 'No error message'}
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