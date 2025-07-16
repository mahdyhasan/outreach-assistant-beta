import { useState } from 'react';
import { useLeads } from '@/hooks/use-leads';
import { Lead } from '@/types/lead';
import { LeadCard } from '@/components/leads/lead-card';
import { LeadFiltersComponent } from '@/components/leads/lead-filters';
import { LeadScoreDialog } from '@/components/leads/lead-score-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Brain, Users, TrendingUp, Target } from 'lucide-react';

const Index = () => {
  const { leads, allLeads, filters, setFilters, updateLeadScore, updateLeadStatus } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);

  const handleScoreAdjust = (lead: Lead) => {
    setSelectedLead(lead);
    setScoreDialogOpen(true);
  };

  const handleScoreUpdate = (leadId: string, humanScore: number, reason: string) => {
    updateLeadScore(leadId, humanScore, reason);
  };

  // Statistics
  const stats = {
    total: allLeads.length,
    immediate: allLeads.filter(l => l.priority === 'immediate').length,
    queue: allLeads.filter(l => l.priority === 'queue').length,
    nurture: allLeads.filter(l => l.priority === 'nurture').length,
    humanCorrected: allLeads.filter(l => l.humanScore !== undefined).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                Lead Management System
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-powered lead scoring with human feedback learning
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total Leads</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.total}</div>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Immediate</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600">{stats.immediate}</div>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">Queue</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.queue}</div>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Nurture</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-600">{stats.nurture}</div>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Human Trained</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">{stats.humanCorrected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <LeadFiltersComponent 
            filters={filters} 
            onFiltersChange={setFilters}
          />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              Leads ({leads.length})
            </h2>
            {leads.length !== allLeads.length && (
              <Badge variant="outline">
                Filtered from {allLeads.length} total
              </Badge>
            )}
          </div>
        </div>

        {/* Leads Grid */}
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-muted-foreground">
              {allLeads.length === 0 
                ? "Start by adding your first lead to the system."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onScoreAdjust={handleScoreAdjust}
                onStatusChange={updateLeadStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Score Adjustment Dialog */}
      <LeadScoreDialog
        lead={selectedLead}
        open={scoreDialogOpen}
        onOpenChange={setScoreDialogOpen}
        onScoreUpdate={handleScoreUpdate}
      />
    </div>
  );
};

export default Index;
