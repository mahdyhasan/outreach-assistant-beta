import { useState } from "react";
import { KDMTable } from "./KDMTable";
import { KDMFilters } from "./KDMFilters";
import { KDMDetailsDialog } from "./KDMDetailsDialog";
import { EditKDMDialog } from "./EditKDMDialog";
import { AddDecisionMakerDialog } from "../leads/AddDecisionMakerDialog";
import { ApolloUsageCard } from "../analytics/ApolloUsageCard";
import { useKDMManagement } from "@/hooks/use-kdm-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

export function KDMManagementContent() {
  const { kdms, loading, refetch } = useKDMManagement();
  const [selectedKDM, setSelectedKDM] = useState<any>(null);
  const [dialogType, setDialogType] = useState<'details' | 'edit' | 'add' | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    contactType: [],
    companySearch: '',
  });

  const filteredKDMs = kdms.filter(kdm => {
    if (filters.search && !`${kdm.first_name} ${kdm.last_name}`.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.contactType.length > 0 && !filters.contactType.includes(kdm.contact_type)) {
      return false;
    }
    if (filters.companySearch && !kdm.companies?.company_name?.toLowerCase().includes(filters.companySearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  const openDialog = (type: 'details' | 'edit', kdm: any) => {
    setSelectedKDM(kdm);
    setDialogType(type);
  };

  const openAddDialog = () => {
    setDialogType('add');
  };

  const closeDialog = () => {
    setSelectedKDM(null);
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
          <h1 className="text-3xl font-bold tracking-tight">KDM Management</h1>
          <p className="text-muted-foreground">
            Manage all your key decision makers - view, edit, and organize your contacts
          </p>
        </div>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add KDM
        </Button>
      </div>

      <KDMFilters filters={filters} onFiltersChange={setFilters} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ApolloUsageCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Decision Makers ({filteredKDMs.length})</CardTitle>
          <CardDescription>All your mined key decision makers from various sources</CardDescription>
        </CardHeader>
        <CardContent>
          <KDMTable 
            kdms={filteredKDMs} 
            onAction={openDialog} 
            onRefresh={refetch}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <KDMDetailsDialog
        open={dialogType === 'details'}
        onOpenChange={closeDialog}
        kdm={selectedKDM}
        onRefresh={refetch}
      />
      
      <EditKDMDialog 
        open={dialogType === 'edit'} 
        onOpenChange={closeDialog}
        kdm={selectedKDM}
        onSuccess={() => {
          refetch();
          closeDialog();
        }}
      />

      <AddDecisionMakerDialog 
        open={dialogType === 'add'} 
        onOpenChange={closeDialog}
        companyId=""
        onSuccess={() => {
          refetch();
          closeDialog();
        }}
      />
    </div>
  );
}