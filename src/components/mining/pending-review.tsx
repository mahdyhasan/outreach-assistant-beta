import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, Building, Globe, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingReviewProps {
  pendingCount: number;
  onLeadsProcessed: (approved: number) => void;
}

// Mock pending leads data
const mockPendingLeads = [
  {
    id: '1',
    companyName: 'DevForce Solutions',
    website: 'https://devforce.com',
    industry: 'Software Development',
    location: 'London, UK',
    companySize: '25-50',
    techStack: ['React', 'Node.js', 'AWS'],
    recentFunding: 'Series A - $5M',
    source: 'Automated Scraping',
    matchScore: 92,
    enrichmentData: {
      jobPostings: 8,
      recentNews: ['Launched new AI product', 'Hired 5 developers'],
      fundingStage: 'Series A'
    }
  },
  {
    id: '2',
    companyName: 'ScaleUp Tech',
    website: 'https://scaleuptech.au',
    industry: 'SaaS',
    location: 'Sydney, Australia',
    companySize: '100-200',
    techStack: ['Python', 'Django', 'PostgreSQL'],
    recentFunding: 'Series B - $15M',
    source: 'Hybrid Mining',
    matchScore: 88,
    enrichmentData: {
      jobPostings: 12,
      recentNews: ['Expanded to Asian markets'],
      fundingStage: 'Series B'
    }
  },
  {
    id: '3',
    companyName: 'EcomGrowth',
    website: 'https://ecomgrowth.com',
    industry: 'E-commerce',
    location: 'Manchester, UK',
    companySize: '75-100',
    techStack: ['Shopify', 'React', 'Node.js'],
    recentFunding: 'Seed - $3M',
    source: 'Manual Import',
    matchScore: 85,
    enrichmentData: {
      jobPostings: 6,
      recentNews: ['Q3 revenue up 200%'],
      fundingStage: 'Seed'
    }
  }
];

export const PendingReview = ({ pendingCount, onLeadsProcessed }: PendingReviewProps) => {
  const { toast } = useToast();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  
  const leads = mockPendingLeads.slice(0, Math.min(pendingCount, 10));

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

    onLeadsProcessed(selectedLeads.length);
    toast({
      title: "Leads Approved",
      description: `${selectedLeads.length} leads have been added to your database and are ready for outreach`,
    });
    setSelectedLeads([]);
  };

  const handleReject = () => {
    if (selectedLeads.length === 0) return;

    toast({
      title: "Leads Rejected",
      description: `${selectedLeads.length} leads have been rejected and removed from the queue`,
    });
    setSelectedLeads([]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (pendingCount === 0) {
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
                <div className="text-2xl font-bold">{pendingCount}</div>
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
                  {Math.round(leads.reduce((acc, lead) => acc + lead.matchScore, 0) / leads.length)}%
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
                <div className="text-sm text-muted-foreground">Sources</div>
                <div className="text-2xl font-bold">3</div>
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
            disabled={selectedLeads.length === 0}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Reject ({selectedLeads.length})
          </Button>
          
          <Button
            onClick={handleApprove}
            disabled={selectedLeads.length === 0}
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
                      <h3 className="text-lg font-semibold">{lead.companyName}</h3>
                      <p className="text-sm text-muted-foreground">{lead.website}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(lead.matchScore)}>
                        {lead.matchScore}% Match
                      </Badge>
                      <Badge variant="outline">{lead.source}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.industry} • {lead.companySize} employees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.recentFunding}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {lead.techStack.map((tech, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Recent Activity:</span>{' '}
                    {lead.enrichmentData.jobPostings} job postings, {lead.enrichmentData.recentNews.join(', ')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};