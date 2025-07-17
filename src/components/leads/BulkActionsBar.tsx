import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, Zap, X } from "lucide-react";
import { CompanyLead } from "@/hooks/use-supabase-leads";
import { useCompanyEnrichment } from "@/hooks/use-company-enrichment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsBarProps {
  selectedLeads: CompanyLead[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

interface BulkProgress {
  total: number;
  completed: number;
  current: string;
  results: {
    enriched: number;
    kdmsFound: number;
    errors: string[];
  };
}

export function BulkActionsBar({ selectedLeads, onClearSelection, onRefresh }: BulkActionsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const { enrichCompany } = useCompanyEnrichment();
  const { toast } = useToast();

  const handleBulkEnrichment = async () => {
    setIsProcessing(true);
    const initialProgress: BulkProgress = {
      total: selectedLeads.length,
      completed: 0,
      current: '',
      results: { enriched: 0, kdmsFound: 0, errors: [] }
    };
    setProgress(initialProgress);

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      
      setProgress(prev => prev ? {
        ...prev,
        current: lead.company_name,
        completed: i
      } : null);

      try {
        await enrichCompany(lead.id, 'detailed');
        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, enriched: prev.results.enriched + 1 }
        } : null);
      } catch (error: any) {
        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, errors: [...prev.results.errors, `${lead.company_name}: ${error.message}`] }
        } : null);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setProgress(prev => prev ? { ...prev, completed: selectedLeads.length, current: '' } : null);
    setIsProcessing(false);
    onRefresh();
    
    toast({
      title: "Bulk Enrichment Complete",
      description: `Enriched ${progress?.results.enriched || 0} companies`,
    });
  };

  const handleBulkKDMDiscovery = async () => {
    setIsProcessing(true);
    const initialProgress: BulkProgress = {
      total: selectedLeads.length,
      completed: 0,
      current: '',
      results: { enriched: 0, kdmsFound: 0, errors: [] }
    };
    setProgress(initialProgress);

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      
      setProgress(prev => prev ? {
        ...prev,
        current: lead.company_name,
        completed: i
      } : null);

      try {
        const { data, error } = await supabase.functions.invoke('kdm-discovery', {
          body: { companyId: lead.id },
        });

        if (error) throw error;

        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, kdmsFound: prev.results.kdmsFound + (data.kdms_saved || 0) }
        } : null);
      } catch (error: any) {
        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, errors: [...prev.results.errors, `${lead.company_name}: ${error.message}`] }
        } : null);
      }

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setProgress(prev => prev ? { ...prev, completed: selectedLeads.length, current: '' } : null);
    setIsProcessing(false);
    onRefresh();
    
    toast({
      title: "Bulk KDM Discovery Complete",
      description: `Found ${progress?.results.kdmsFound || 0} KDMs across all companies`,
    });
  };

  const handleBulkEnrichAndKDM = async () => {
    setIsProcessing(true);
    const initialProgress: BulkProgress = {
      total: selectedLeads.length * 2, // Both operations
      completed: 0,
      current: '',
      results: { enriched: 0, kdmsFound: 0, errors: [] }
    };
    setProgress(initialProgress);

    for (let i = 0; i < selectedLeads.length; i++) {
      const lead = selectedLeads[i];
      
      // Step 1: Enrich
      setProgress(prev => prev ? {
        ...prev,
        current: `Enriching ${lead.company_name}`,
        completed: i * 2
      } : null);

      try {
        await enrichCompany(lead.id, 'detailed');
        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, enriched: prev.results.enriched + 1 }
        } : null);
      } catch (error: any) {
        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, errors: [...prev.results.errors, `Enrich ${lead.company_name}: ${error.message}`] }
        } : null);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Find KDMs
      setProgress(prev => prev ? {
        ...prev,
        current: `Finding KDMs for ${lead.company_name}`,
        completed: i * 2 + 1
      } : null);

      try {
        const { data, error } = await supabase.functions.invoke('kdm-discovery', {
          body: { companyId: lead.id },
        });

        if (error) throw error;

        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, kdmsFound: prev.results.kdmsFound + (data.kdms_saved || 0) }
        } : null);
      } catch (error: any) {
        setProgress(prev => prev ? {
          ...prev,
          results: { ...prev.results, errors: [...prev.results.errors, `KDM ${lead.company_name}: ${error.message}`] }
        } : null);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setProgress(prev => prev ? { ...prev, completed: selectedLeads.length * 2, current: '' } : null);
    setIsProcessing(false);
    onRefresh();
    
    toast({
      title: "Bulk Operations Complete",
      description: `Enriched ${progress?.results.enriched || 0} companies and found ${progress?.results.kdmsFound || 0} KDMs`,
    });
  };

  if (selectedLeads.length === 0) return null;

  return (
    <Card className="p-4 mb-6 border-primary/20 bg-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="font-semibold">
            {selectedLeads.length} leads selected
          </Badge>
          
          {!isProcessing ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkEnrichment}
                disabled={isProcessing}
              >
                <Zap className="h-4 w-4 mr-2" />
                Bulk Enrich
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkKDMDiscovery}
                disabled={isProcessing}
              >
                <Users className="h-4 w-4 mr-2" />
                Bulk Find KDMs
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={handleBulkEnrichAndKDM}
                disabled={isProcessing}
              >
                <Zap className="h-4 w-4 mr-2" />
                Enrich + Find KDMs
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">
                  {progress?.current || 'Processing...'}
                </div>
                <Progress 
                  value={progress ? (progress.completed / progress.total) * 100 : 0} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {progress?.completed} / {progress?.total} completed
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClearSelection}
          disabled={isProcessing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {progress && progress.completed === progress.total && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-600">Enriched:</span> {progress.results.enriched}
            </div>
            <div>
              <span className="font-medium text-blue-600">KDMs Found:</span> {progress.results.kdmsFound}
            </div>
            <div>
              <span className="font-medium text-red-600">Errors:</span> {progress.results.errors.length}
            </div>
          </div>
          
          {progress.results.errors.length > 0 && (
            <div className="mt-2">
              <details className="text-xs">
                <summary className="cursor-pointer text-red-600 font-medium">
                  View Errors ({progress.results.errors.length})
                </summary>
                <div className="mt-2 space-y-1 pl-4">
                  {progress.results.errors.map((error, index) => (
                    <div key={index} className="text-red-600">{error}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}