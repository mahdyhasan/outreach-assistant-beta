import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  conversionRate?: number;
}

export function ConversionFunnelChart() {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ["conversion-funnel"],
    queryFn: async (): Promise<FunnelStage[]> => {
      // Get total companies
      const { count: totalCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      // Get enriched companies
      const { count: enrichedCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .not("enrichment_data", "is", null);

      // Get companies with decision makers
      const { count: companiesWithKDM } = await supabase
        .from("decision_makers")
        .select("company_id", { count: "exact", head: true });

      // Get companies in email queue (contacted)
      const { data: emailedCompanies } = await supabase
        .from("email_queue")
        .select("decision_maker_id")
        .not("sent_time", "is", null);

      const uniqueEmailedCompanies = new Set(emailedCompanies?.map(e => e.decision_maker_id)).size;

      // Get companies with responses (opened emails)
      const { count: respondedCompanies } = await supabase
        .from("email_queue")
        .select("*", { count: "exact", head: true })
        .gt("open_count", 0);

      // Get qualified companies (high score)
      const { count: qualifiedCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .gte("ai_score", 70);

      const total = totalCompanies || 1;
      
      const stages: FunnelStage[] = [
        {
          stage: "Total Companies",
          count: totalCompanies || 0,
          percentage: 100,
        },
        {
          stage: "Enriched",
          count: enrichedCompanies || 0,
          percentage: Math.round(((enrichedCompanies || 0) / total) * 100),
          conversionRate: Math.round(((enrichedCompanies || 0) / (totalCompanies || 1)) * 100),
        },
        {
          stage: "KDM Found",
          count: companiesWithKDM || 0,
          percentage: Math.round(((companiesWithKDM || 0) / total) * 100),
          conversionRate: Math.round(((companiesWithKDM || 0) / (enrichedCompanies || 1)) * 100),
        },
        {
          stage: "Contacted",
          count: uniqueEmailedCompanies || 0,
          percentage: Math.round(((uniqueEmailedCompanies || 0) / total) * 100),
          conversionRate: Math.round(((uniqueEmailedCompanies || 0) / (companiesWithKDM || 1)) * 100),
        },
        {
          stage: "Responded",
          count: respondedCompanies || 0,
          percentage: Math.round(((respondedCompanies || 0) / total) * 100),
          conversionRate: Math.round(((respondedCompanies || 0) / (uniqueEmailedCompanies || 1)) * 100),
        },
        {
          stage: "Qualified",
          count: qualifiedCompanies || 0,
          percentage: Math.round(((qualifiedCompanies || 0) / total) * 100),
          conversionRate: Math.round(((qualifiedCompanies || 0) / (respondedCompanies || 1)) * 100),
        },
      ];

      return stages;
    },
    refetchInterval: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Track how companies progress through your lead qualification pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {funnelData?.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-card-foreground">{stage.stage}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-card-foreground">
                    {stage.count.toLocaleString()}
                  </span>
                  {stage.conversionRate && (
                    <span className="text-xs text-muted-foreground">
                      ({stage.conversionRate}%)
                    </span>
                  )}
                </div>
              </div>
              <Progress 
                value={stage.percentage} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stage.percentage}% of total</span>
                {index > 0 && stage.conversionRate && (
                  <span>{stage.conversionRate}% conversion from previous stage</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}