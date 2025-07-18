import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, TrendingUp, Zap, Sparkles, BarChart3, Users, TrendingUp as SignalIcon } from "lucide-react";
import { CompanyLead } from "@/hooks/use-supabase-leads";
import { useCompanyEnrichment } from "@/hooks/use-company-enrichment";
import { useLeadScoring } from "@/hooks/use-lead-scoring";
import { useEmailQueue } from "@/hooks/use-email-queue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadTableProps {
  leads: CompanyLead[];
  onAction: (type: 'details' | 'edit' | 'enrich' | 'score', lead: CompanyLead) => void;
  onRefresh?: () => void;
  selectedLeads: CompanyLead[];
  onSelectionChange: (leads: CompanyLead[]) => void;
}

export function LeadTable({ leads, onAction, onRefresh, selectedLeads, onSelectionChange }: LeadTableProps) {
  const { enrichCompany, loading: enrichmentLoading } = useCompanyEnrichment();
  const { scoreCompany, loading: scoringLoading } = useLeadScoring();
  const [processingLeads, setProcessingLeads] = useState(new Set<string>());
  const { toast } = useToast();

  const handleEnrichLead = async (lead: CompanyLead) => {
    setProcessingLeads(prev => new Set(prev).add(lead.id));
    try {
      await enrichCompany(lead.id, 'detailed');
      onAction('enrich', lead);
    } finally {
      setProcessingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(lead.id);
        return newSet;
      });
    }
  };

  const handleScoreLead = async (lead: CompanyLead) => {
    setProcessingLeads(prev => new Set(prev).add(lead.id));
    try {
      await scoreCompany(lead.id);
      onAction('score', lead);
    } finally {
      setProcessingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(lead.id);
        return newSet;
      });
    }
  };

  const handleDiscoverKDMs = async (lead: CompanyLead) => {
    setProcessingLeads(prev => new Set(prev).add(lead.id));
    try {
      const { data, error } = await supabase.functions.invoke('kdm-discovery', {
        body: { companyId: lead.id },
      });

      if (error) throw error;

      toast({
        title: "KDM Discovery Complete",
        description: data.message || `Found ${data.kdms_found || 0} key decision makers`,
      });

      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast({
        title: "KDM Discovery Failed",
        description: error.message || "Failed to discover key decision makers",
        variant: "destructive",
      });
    } finally {
      setProcessingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(lead.id);
        return newSet;
      });
    }
  };

  const handleGenerateSignals = async (lead: CompanyLead) => {
    setProcessingLeads(prev => new Set(prev).add(lead.id));
    try {
      const { data, error } = await supabase.functions.invoke('signal-generation', {
        body: { company_id: lead.id },
      });

      if (error) throw error;

      toast({
        title: "Signal Generation Complete",
        description: data.message || `Generated ${data.signals_found || 0} signals`,
      });

      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast({
        title: "Signal Generation Failed",
        description: error.message || "Failed to generate signals",
        variant: "destructive",
      });
    } finally {
      setProcessingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(lead.id);
        return newSet;
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'enriched':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'manual':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'apollo':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'linkedin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'scraping':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(leads);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectLead = (lead: CompanyLead, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLeads, lead]);
    } else {
      onSelectionChange(selectedLeads.filter(l => l.id !== lead.id));
    }
  };

  const isSelected = (lead: CompanyLead) => selectedLeads.some(l => l.id === lead.id);
  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const isPartiallySelected = selectedLeads.length > 0 && selectedLeads.length < leads.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                {...(isPartiallySelected && { "data-state": "indeterminate" })}
              />
            </TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Founded</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>KDMs</TableHead>
            <TableHead>Signals</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Checkbox
                  checked={isSelected(lead)}
                  onCheckedChange={(checked) => handleSelectLead(lead, checked as boolean)}
                  aria-label={`Select ${lead.company_name}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="font-semibold">{lead.company_name}</div>
              </TableCell>
              <TableCell>
                {lead.website ? (
                  <a 
                    href={lead.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">No website</span>
                )}
              </TableCell>
              <TableCell>{lead.industry || 'N/A'}</TableCell>
              <TableCell>{lead.employee_size || 'N/A'}</TableCell>
              <TableCell>{lead.founded || 'N/A'}</TableCell>
              <TableCell>
                <span className={`font-semibold ${getScoreColor(lead.ai_score)}`}>
                  {lead.ai_score}%
                </span>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getSourceColor(lead.source)}>
                  {lead.source}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {lead.decision_makers?.length || 0}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {lead.signals?.length || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(lead.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction('details', lead)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onAction('edit', lead)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction('enrich', lead)}>
                        <Zap className="mr-2 h-4 w-4" />
                        Enrich Company
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction('score', lead)}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Adjust Score
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDiscoverKDMs(lead)}
                        disabled={processingLeads.has(lead.id)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Find KDMs
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleGenerateSignals(lead)}
                        disabled={processingLeads.has(lead.id)}
                      >
                        <SignalIcon className="mr-2 h-4 w-4" />
                        Generate Signals
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {leads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No leads found. Start by mining some leads!
        </div>
      )}
    </div>
  );
}