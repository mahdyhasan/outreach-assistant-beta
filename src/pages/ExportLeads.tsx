import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Filter,
  Users,
  Building,
  Mail,
  CheckCircle
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
}

const ExportLeads = () => {
  const { toast } = useToast();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<string>('csv');

  // Fetch leads with filters
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['export-leads', filterStatus, filterIndustry, filterSource],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterIndustry !== 'all') {
        query = query.eq('industry', filterIndustry);
      }
      if (filterSource !== 'all') {
        query = query.eq('source', filterSource);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Get unique values for filters
  const industries = [...new Set(leads.map(lead => lead.industry))];
  const sources = [...new Set(leads.map(lead => lead.source))];

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

  const handleExport = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select leads to export",
        variant: "destructive",
      });
      return;
    }

    const leadsToExport = leads.filter(lead => selectedLeads.includes(lead.id));
    
    try {
      if (exportFormat === 'csv') {
        exportToCSV(leadsToExport);
      } else if (exportFormat === 'json') {
        exportToJSON(leadsToExport);
      }
      
      // Track export in database
      await supabase.from('crm_sync_history').insert({
        sync_type: 'export',
        crm_system: 'manual_export',
        leads_count: leadsToExport.length,
        success_count: leadsToExport.length,
        status: 'completed',
        completed_at: new Date().toISOString(),
        sync_filters: {
          status: filterStatus,
          industry: filterIndustry,
          source: filterSource,
          format: exportFormat
        }
      });

      toast({
        title: "Export Successful",
        description: `${leadsToExport.length} leads exported successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (leadsData: Lead[]) => {
    const headers = [
      'Company Name',
      'Contact Name',
      'Email',
      'Job Title',
      'Company Size',
      'Industry',
      'Location',
      'Website',
      'AI Score',
      'Final Score',
      'Status',
      'Source',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...leadsData.map(lead => [
        `"${lead.company_name}"`,
        `"${lead.contact_name}"`,
        `"${lead.email}"`,
        `"${lead.job_title}"`,
        `"${lead.company_size}"`,
        `"${lead.industry}"`,
        `"${lead.location}"`,
        `"${lead.website}"`,
        lead.ai_score,
        lead.final_score,
        `"${lead.status}"`,
        `"${lead.source}"`,
        `"${lead.created_at}"`
      ].join(','))
    ].join('\n');

    downloadFile(csvContent, 'leads-export.csv', 'text/csv');
  };

  const exportToJSON = (leadsData: Lead[]) => {
    const jsonContent = JSON.stringify(leadsData, null, 2);
    downloadFile(jsonContent, 'leads-export.json', 'application/json');
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending_review': return 'warning';
      case 'rejected': return 'destructive';
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
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Export Leads</h1>
                <p className="text-muted-foreground mt-2">
                  Select and export leads to CSV or JSON format
                </p>
              </div>

              {/* Export Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Total Leads</div>
                        <div className="text-2xl font-bold">{leads.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
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
                      <Building className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Industries</div>
                        <div className="text-2xl font-bold">{industries.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Sources</div>
                        <div className="text-2xl font-bold">{sources.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Export Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters & Export
                  </CardTitle>
                  <CardDescription>
                    Filter leads and configure export settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending_review">Pending Review</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Industry</label>
                      <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Industries</SelectItem>
                          {industries.map(industry => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Source</label>
                      <Select value={filterSource} onValueChange={setFilterSource}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          {sources.map(source => (
                            <SelectItem key={source} value={source}>
                              {source.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Format</label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Select All ({leads.length})
                      </label>
                    </div>
                    
                    <Button 
                      onClick={handleExport}
                      disabled={selectedLeads.length === 0}
                      className="flex items-center gap-2 ml-auto"
                    >
                      <Download className="h-4 w-4" />
                      Export {selectedLeads.length} Leads
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Leads List */}
              <div className="space-y-4">
                {isLoading ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading leads...</p>
                    </CardContent>
                  </Card>
                ) : leads.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No leads found matching your filters</p>
                    </CardContent>
                  </Card>
                ) : (
                  leads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{lead.company_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {lead.contact_name} • {lead.job_title}
                                </p>
                                <p className="text-xs text-muted-foreground">{lead.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="text-xs">
                                  {lead.ai_score}% Score
                                </Badge>
                                <Badge variant={getStatusColor(lead.status) as any} className="text-xs">
                                  {lead.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                              <span>{lead.industry}</span>
                              <span>{lead.location}</span>
                              <span>{lead.company_size} employees</span>
                              <span>{lead.source.replace('_', ' ')}</span>
                            </div>
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

export default ExportLeads;