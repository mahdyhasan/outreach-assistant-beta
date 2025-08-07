import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExportCompany {
  id: string;
  company_name: string;
  decision_maker_name: string;
  decision_maker_email: string;
  job_title: string;
  company_size: string;
  industry: string;
  website: string;
  ai_score: number;
  status: string;
  source: string;
  created_at: string;
}

const ExportLeads = () => {
  const { user } = useAuth();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [exportData, setExportData] = useState<ExportCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExportData();
    }
  }, [user]);

  const fetchExportData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          decision_makers (*)
        `);

      if (error) throw error;

      // Transform database data into export format
      const transformedData: ExportCompany[] = companies?.flatMap(company => 
        company.decision_makers?.map(dm => ({
          id: `${company.id}-${dm.id}`,
          company_name: company.company_name,
          decision_maker_name: `${dm.first_name} ${dm.last_name}`,
          decision_maker_email: dm.email || 'N/A',
          job_title: dm.designation,
          company_size: company.employee_size || 'Unknown',
          industry: company.industry || 'Unknown',
          website: company.website || 'N/A',
          ai_score: company.ai_score || 0,
          status: company.status || 'pending_review',
          source: company.source || 'manual',
          created_at: company.created_at
        })) || []
      ) || [];

      setExportData(transformedData);
    } catch (error) {
      console.error('Error fetching export data:', error);
      toast.error('Failed to load export data');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredData = exportData.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterIndustry !== 'all' && item.industry !== filterIndustry) return false;
    if (filterSource !== 'all' && item.source !== filterSource) return false;
    return true;
  });

  // Get unique values for filters
  const industries = [...new Set(exportData.map(item => item.industry))];
  const sources = [...new Set(exportData.map(item => item.source))];
  const statuses = [...new Set(exportData.map(item => item.status))];

  const handleSelectCompany = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(filteredData.map(item => item.id));
    } else {
      setSelectedCompanies([]);
    }
  };

  const handleExport = () => {
    if (selectedCompanies.length === 0) {
      toast.error('Please select companies to export');
      return;
    }

    const dataToExport = filteredData.filter(item => selectedCompanies.includes(item.id));
    
    try {
      if (exportFormat === 'csv') {
        exportToCSV(dataToExport);
      } else if (exportFormat === 'json') {
        exportToJSON(dataToExport);
      }
      
      toast.success(`${dataToExport.length} companies exported successfully`);
    } catch (error: any) {
      toast.error('Export failed: ' + error.message);
    }
  };

  const exportToCSV = (data: ExportCompany[]) => {
    const headers = [
      'Company Name',
      'Decision Maker',
      'Email',
      'Job Title',
      'Company Size',
      'Industry',
      'Website',
      'AI Score',
      'Status',
      'Source',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.company_name}"`,
        `"${item.decision_maker_name}"`,
        `"${item.decision_maker_email}"`,
        `"${item.job_title}"`,
        `"${item.company_size}"`,
        `"${item.industry}"`,
        `"${item.website}"`,
        item.ai_score,
        `"${item.status}"`,
        `"${item.source}"`,
        `"${item.created_at}"`
      ].join(','))
    ].join('\n');

    downloadFile(csvContent, 'companies-export.csv', 'text/csv');
  };

  const exportToJSON = (data: ExportCompany[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, 'companies-export.json', 'application/json');
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
      case 'pending_review': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Export Companies</h1>
                <p className="text-muted-foreground mt-2">
                  Select and export companies with decision makers to CSV or JSON format
                </p>
              </div>

              {/* Export Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Total Companies</div>
                        <div className="text-2xl font-bold">{filteredData.length}</div>
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
                        <div className="text-2xl font-bold">{selectedCompanies.length}</div>
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
                    Filter companies and configure export settings
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
                          {statuses.map(status => (
                            <SelectItem key={status} value={status}>
                              {status.replace('_', ' ')}
                            </SelectItem>
                          ))}
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
                        checked={selectedCompanies.length === filteredData.length && filteredData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Select All ({filteredData.length})
                      </label>
                    </div>
                    
                    <Button 
                      onClick={handleExport}
                      disabled={selectedCompanies.length === 0}
                      className="flex items-center gap-2 ml-auto"
                    >
                      <Download className="h-4 w-4" />
                      Export {selectedCompanies.length} Companies
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Companies List */}
              <div className="space-y-4">
                {filteredData.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No companies found matching your filters</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredData.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedCompanies.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectCompany(item.id, checked as boolean)}
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{item.company_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.decision_maker_name} • {item.job_title}
                                </p>
                                <p className="text-xs text-muted-foreground">{item.decision_maker_email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="text-xs">
                                  {item.ai_score}% Score
                                </Badge>
                                <Badge variant={getStatusColor(item.status) as any} className="text-xs">
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                              <span>{item.industry}</span>
                              <span>{item.website}</span>
                              <span>{item.company_size} employees</span>
                              <span>{item.source.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
      </div>
    </div>
  );
};

export default ExportLeads;