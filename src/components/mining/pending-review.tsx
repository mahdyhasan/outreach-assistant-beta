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

interface Company {
  id: string;
  company_name: string;
  website: string;
  industry: string;
  employee_size: string;
  founded: string;
  description: string;
  public_email: string;
  public_phone: string;
  linkedin_profile: string;
  ai_score: number;
  status: string;
  source: string;
  enrichment_data: any;
}

export const PendingReview = ({ pendingCount, onLeadsProcessed }: PendingReviewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  
  // Fetch pending companies from database
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['pending-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
  });

  // Approve companies mutation
  const approveMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'approved' })
        .in('id', companyIds);
      
      if (error) throw error;
      return companyIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['pending-companies'] });
      onLeadsProcessed(count);
      toast({
        title: "Companies Approved",
        description: `${count} companies have been approved and are ready for enrichment`,
      });
      setSelectedCompanies([]);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject companies mutation  
  const rejectMutation = useMutation({
    mutationFn: async (companyIds: string[]) => {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'rejected' })
        .in('id', companyIds);
      
      if (error) throw error;
      return companyIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['pending-companies'] });
      toast({
        title: "Companies Rejected",
        description: `${count} companies have been rejected`,
      });
      setSelectedCompanies([]);
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(companies.map(company => company.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleApprove = () => {
    if (selectedCompanies.length === 0) {
      toast({
        title: "No Companies Selected",
        description: "Please select companies to approve",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate(selectedCompanies);
  };

  const handleReject = () => {
    if (selectedCompanies.length === 0) return;
    rejectMutation.mutate(selectedCompanies);
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
        <p className="text-muted-foreground">Loading pending companies...</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Pending Reviews</h3>
        <p className="text-muted-foreground">
          All mined companies have been processed. New companies will appear here for review.
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
                <div className="text-2xl font-bold">{companies.length}</div>
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
                <div className="text-2xl font-bold">{selectedCompanies.length}</div>
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
                  {companies.length > 0 ? Math.round(companies.reduce((acc, company) => acc + company.ai_score, 0) / companies.length) : 0}%
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
                <div className="text-2xl font-bold">{new Set(companies.map(c => c.industry)).size}</div>
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
            checked={selectedCompanies.length === companies.length}
            onCheckedChange={handleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            Select All ({companies.length})
          </label>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={selectedCompanies.length === 0 || rejectMutation.isPending}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Reject ({selectedCompanies.length})
          </Button>
          
          <Button
            onClick={handleApprove}
            disabled={selectedCompanies.length === 0 || approveMutation.isPending}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Approve ({selectedCompanies.length})
          </Button>
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-4">
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedCompanies.includes(company.id)}
                  onCheckedChange={(checked) => handleSelectCompany(company.id, checked as boolean)}
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{company.company_name}</h3>
                      <p className="text-sm text-muted-foreground">{company.description}</p>
                      <p className="text-xs text-muted-foreground">{company.public_email || 'Email not available'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(company.ai_score)}>
                        {company.ai_score}% Match
                      </Badge>
                      <Badge variant="outline">{company.source}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{company.industry} • {company.employee_size} employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>Founded: {company.founded || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{company.website}</span>
                    </div>
                  </div>

                  {company.enrichment_data && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Enrichment Data:</span>{' '}
                      {JSON.stringify(company.enrichment_data).length > 100 
                        ? 'Available' 
                        : Object.keys(company.enrichment_data).join(', ')
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