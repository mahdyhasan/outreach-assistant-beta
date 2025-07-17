import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ROIMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ComponentType<any>;
}

export function ROIMetrics() {
  const { data: roiData, isLoading } = useQuery({
    queryKey: ["roi-metrics"],
    queryFn: async (): Promise<ROIMetric[]> => {
      // Get qualified companies (high score)
      const { count: qualifiedCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .gte("ai_score", 70);

      // Get total companies for cost calculation
      const { count: totalCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      // Calculate estimated metrics
      const avgDealSize = 5000; // Average deal size
      const conversionRate = 0.15; // 15% conversion rate from qualified to closed
      const costPerLead = 25; // Estimated cost per lead
      
      const estimatedRevenue = (qualifiedCompanies || 0) * avgDealSize * conversionRate;
      const totalCost = (totalCompanies || 0) * costPerLead;
      const roi = totalCost > 0 ? ((estimatedRevenue - totalCost) / totalCost) * 100 : 0;
      
      const costPerQualifiedLead = qualifiedCompanies && qualifiedCompanies > 0 
        ? totalCost / qualifiedCompanies 
        : 0;

      return [
        {
          label: "Estimated Revenue",
          value: `$${estimatedRevenue.toLocaleString()}`,
          change: "+23.5%",
          trend: "up",
          icon: DollarSign,
        },
        {
          label: "ROI",
          value: `${roi.toFixed(1)}%`,
          change: "+12.8%",
          trend: "up",
          icon: TrendingUp,
        },
        {
          label: "Cost per Qualified Lead",
          value: `$${costPerQualifiedLead.toFixed(0)}`,
          change: "-8.2%",
          trend: "up", // Lower cost is better
          icon: Target,
        },
        {
          label: "Pipeline Value",
          value: `$${((qualifiedCompanies || 0) * avgDealSize).toLocaleString()}`,
          change: "+31.2%",
          trend: "up",
          icon: TrendingUp,
        },
      ];
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-16" />
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
        <CardTitle>ROI & Financial Metrics</CardTitle>
        <CardDescription>
          Track the financial performance and return on investment of your lead generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roiData?.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-card-foreground mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                     metric.trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                    {metric.change}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}