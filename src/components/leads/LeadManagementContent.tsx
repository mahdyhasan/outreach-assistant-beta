import { useState } from "react";
import { LeadTable } from "./LeadTable";
import { LeadFilters } from "./LeadFilters";
import { LeadDetailsDialog } from "./LeadDetailsDialog";
import { EditLeadDialog } from "./EditLeadDialog";
import { EnrichCompanyDialog } from "./EnrichCompanyDialog";
import { ScoreAdjustmentDialog } from "./ScoreAdjustmentDialog";
import { AddLeadDialog } from "./AddLeadDialog";
import { useSupabaseLeads } from "@/hooks/use-supabase-leads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

export function LeadManagementContent() {
  const { leads, loading, refetch } = useSupabaseLeads();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'details' | 'edit' | 'enrich' | 'score' | 'add' | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: [],
    scoreRange: [0, 100] as [number, number],
    source: []
  });

  const filteredLeads = leads.filter(lead => {
    if (filters.search && !lead.company_name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) {
      return false;
    }
    if (lead.ai_score < filters.scoreRange[0] || lead.ai_score > filters.scoreRange[1]) {
      return false;
    }
    if (filters.source.length > 0 && !filters.source.includes(lead.source)) {
      return false;
    }
    return true;
  });

  const openDialog = (type: 'details' | 'edit' | 'enrich' | 'score', lead: any) => {
    setSelectedLead(lead);
    setDialogType(type);
  };

  const openAddDialog = () => {
    setDialogType('add');
  };

  const closeDialog = () => {
    setSelectedLead(null);
    setDialogType(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-muted-foreground">
            Manage all your mined leads - view, edit, enrich, and score your prospects
          </p>
        </div>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search through your leads</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>All your mined leads from various sources</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadTable leads={filteredLeads} onAction={openDialog} onRefresh={refetch} />
        </CardContent>
      </Card>

      {/* Dialogs */}
        <LeadDetailsDialog
          open={dialogType === 'details'}
          onOpenChange={closeDialog}
          lead={selectedLead}
          onRefresh={refetch}
        />
      
      <EditLeadDialog 
        open={dialogType === 'edit'} 
        onOpenChange={closeDialog}
        lead={selectedLead}
        onSuccess={() => {
          refetch();
          closeDialog();
        }}
      />
      
      <EnrichCompanyDialog 
        open={dialogType === 'enrich'} 
        onOpenChange={closeDialog}
        lead={selectedLead}
        onSuccess={() => {
          refetch();
          closeDialog();
        }}
      />
      
      <ScoreAdjustmentDialog 
        open={dialogType === 'score'} 
        onOpenChange={closeDialog}
        lead={selectedLead}
        onSuccess={() => {
          refetch();
          closeDialog();
        }}
      />

      <AddLeadDialog 
        open={dialogType === 'add'} 
        onOpenChange={closeDialog}
        onSuccess={() => {
          refetch();
          closeDialog();
        }}
      />
    </div>
  );
}