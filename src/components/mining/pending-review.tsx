import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, X, Clock, Building, Globe, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface PendingReviewProps {
  pendingCount: number;
  onLeadsProcessed: (approved: number) => void;
}

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  job_title: string;
  company_size: string;
  industry: string;
  location: string;
  website: string;
  ai_score: number;
  final_score: number;
  status: string;
  source: string;
  enrichment_data: any;
}

export const PendingReview = ({ pendingCount, onLeadsProcessed }: PendingReviewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Fetch pending leads from database
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['pending-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Approve leads mutation
  const approveMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'approved' })
        .in('id', leadIds);
      
      if (error) throw error;
      return leadIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['pending-leads'] });
      onLeadsProcessed(count);
      toast({
        title: "Leads Approved",
        description: `${count} leads have been approved and are ready for outreach`,
      });
      setSelectedLeads([]);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject leads mutation  
  const rejectMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      const { error } = await supabase
        .from('leads')
        .update({ status: 'rejected' })
        .in('id', leadIds);
      
      if (error) throw error;
      return leadIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['pending-leads'] });
      toast({
        title: "Leads Rejected",
        description: `${count} leads have been rejected`,
      });
      setSelectedLeads([]);
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleApprove = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to approve",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate(selectedLeads);
  };

  const handleReject = () => {
    if (selectedLeads.length === 0) return;
    rejectMutation.mutate(selectedLeads);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading pending leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
        <p className="text-muted-foreground">
          All mined leads have been processed. New leads will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold">{leads.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-muted-foreground">Selected</div>
                <div className="text-2xl font-bold">{selectedLeads.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-muted-foreground">Avg Score</div>
                <div className="text-2xl font-bold">
                  {leads.length > 0 ? Math.round(leads.reduce((acc, lead) => acc + lead.ai_score, 0) / leads.length) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-muted-foreground">Industries</div>
                <div className="text-2xl font-bold">{new Set(leads.map(l => l.industry)).size}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedLeads.length === leads.length}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All ({leads.length})
          </label>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={selectedLeads.length === 0 || rejectMutation.isPending}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Reject ({selectedLeads.length})
          </Button>
          
          <Button
            onClick={handleApprove}
            disabled={selectedLeads.length === 0 || approveMutation.isPending}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Approve ({selectedLeads.length})
          </Button>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedLeads.includes(lead.id)}
                  onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{lead.company_name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.contact_name} • {lead.job_title}</p>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(lead.ai_score)}>
                        {lead.ai_score}% Match
                      </Badge>
                      <Badge variant="outline">{lead.source}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.industry} • {lead.company_size} employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.website}</span>
                    </div>
                  </div>

                  {lead.enrichment_data && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Enrichment Data:</span>{' '}
                      {JSON.stringify(lead.enrichment_data).length > 100 
                        ? 'Available' 
                        : Object.keys(lead.enrichment_data).join(', ')
                      }
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};