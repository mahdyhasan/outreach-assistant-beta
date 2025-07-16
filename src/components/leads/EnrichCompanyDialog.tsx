import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLead } from "@/hooks/use-supabase-leads";
import { useSupabaseLeads } from "@/hooks/use-supabase-leads";
import { Loader2, Zap, TrendingUp, Users, Newspaper, Building } from "lucide-react";

interface EnrichCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CompanyLead | null;
  onSuccess: () => void;
}

const enrichmentOptions = [
  {
    id: 'tech_stack',
    title: 'Technology Stack',
    description: 'Discover the technologies and tools used by the company',
    icon: Building,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'funding',
    title: 'Funding Information',
    description: 'Get latest funding rounds, investors, and financial data',
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400'
  },
  {
    id: 'job_postings',
    title: 'Job Postings',
    description: 'See current job openings and hiring trends',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: 'news',
    title: 'Company News',
    description: 'Latest news articles and press releases',
    icon: Newspaper,
    color: 'text-orange-600 dark:text-orange-400'
  }
];

export function EnrichCompanyDialog({ open, onOpenChange, lead, onSuccess }: EnrichCompanyDialogProps) {
  const { enrichCompany } = useSupabaseLeads();
  const [loading, setLoading] = useState<string | null>(null);

  const handleEnrich = async (enrichmentType: string) => {
    if (!lead) return;

    setLoading(enrichmentType);
    try {
      await enrichCompany(lead.id, enrichmentType);
      onSuccess();
    } catch (error) {
      console.error('Error enriching company:', error);
    } finally {
      setLoading(null);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enrich Company Data
          </DialogTitle>
          <DialogDescription>
            Select the type of enrichment data to gather for {lead.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrichmentOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = loading === option.id;
            
            return (
              <Card key={option.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${option.color}`} />
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleEnrich(option.id)}
                    disabled={!!loading}
                    className="w-full"
                    variant="outline"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Enriching...' : 'Enrich'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}