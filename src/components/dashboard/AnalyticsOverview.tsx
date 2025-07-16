import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsOverview() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["analytics-metrics"],
    queryFn: async () => {
      // Get email response rate
      const { count: totalEmails } = await supabase
        .from("outreach_activities")
        .select("*", { count: "exact", head: true })
        .eq("type", "email");

      const { count: emailResponses } = await supabase
        .from("outreach_activities")
        .select("*", { count: "exact", head: true })
        .eq("type", "email")
        .not("response_at", "is", null);

      const emailResponseRate = totalEmails && emailResponses
        ? ((emailResponses / totalEmails) * 100).toFixed(1)
        : "0.0";

      // Get conversion to meeting (simplified as high score leads for now)
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      const { count: highScoreLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("final_score", 80);

      const conversionRate = totalLeads && highScoreLeads
        ? ((highScoreLeads / totalLeads) * 100).toFixed(1)
        : "0.0";

      // Calculate pipeline value (simplified)
      const pipelineValue = (highScoreLeads || 0) * 2500; // $2500 average deal size

      return [
        {
          label: "Email Open Rate",
          value: "32.4%",
          change: "+2.1%",
          trend: "up" as const,
          target: 35
        },
        {
          label: "Email Response Rate",
          value: `${emailResponseRate}%`,
          change: "+0.8%",
          trend: "up" as const,
          target: 20
        },
        {
          label: "Conversion to Meeting",
          value: `${conversionRate}%`,
          change: "-0.3%",
          trend: "down" as const,
          target: 10
        },
        {
          label: "Pipeline Value",
          value: `$${pipelineValue.toLocaleString()}`,
          change: "+15.2%",
          trend: "up" as const,
          target: 150000
        }
      ];
    },
    refetchInterval: 30000,
  });

  const { data: leadDistribution } = useQuery({
    queryKey: ["lead-distribution"],
    queryFn: async () => {
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      const { count: hotLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("final_score", 70);

      const { count: queueLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("final_score", 40)
        .lt("final_score", 70);

      const { count: nurtureLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .lt("final_score", 40);

      const { count: enterpriseLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .ilike("company_size", "%5000+%");

      const total = totalLeads || 1; // Avoid division by zero

      return [
        { 
          category: "Hot Leads (70-100%)", 
          count: hotLeads || 0, 
          percentage: Math.round(((hotLeads || 0) / total) * 100) 
        },
        { 
          category: "Queue (40-69%)", 
          count: queueLeads || 0, 
          percentage: Math.round(((queueLeads || 0) / total) * 100) 
        },
        { 
          category: "Nurture (<40%)", 
          count: nurtureLeads || 0, 
          percentage: Math.round(((nurtureLeads || 0) / total) * 100) 
        },
        { 
          category: "Enterprise (Too Large)", 
          count: enterpriseLeads || 0, 
          percentage: Math.round(((enterpriseLeads || 0) / total) * 100) 
        },
      ];
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Overview
        </CardTitle>
        <CardDescription>
          Performance metrics and lead distribution insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Key Performance Metrics</h4>
          <div className="grid grid-cols-1 gap-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-1 w-full" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              ))
            ) : (
              metrics?.map((metric, index) => (
                <div key={index} className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-card-foreground">{metric.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm text-card-foreground">{metric.value}</span>
                      <Badge 
                        variant={metric.trend === 'up' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {metric.change}
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={
                      metric.label === "Pipeline Value" ? 
                      (parseInt(metric.value.replace(/[$,]/g, '')) / metric.target) * 100 :
                      (parseFloat(metric.value) / metric.target) * 100
                    } 
                    className="h-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {metric.label === "Pipeline Value" ? `$${metric.target.toLocaleString()}` : `${metric.target}%`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Distribution */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Lead Distribution</h4>
          <div className="space-y-2">
            {leadDistribution ? (
              leadDistribution.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                  <div>
                    <p className="text-sm text-card-foreground">{category.category}</p>
                    <p className="text-xs text-muted-foreground">{category.count} leads</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {category.percentage}%
                  </Badge>
                </div>
              ))
            ) : (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            )}
          </div>
        </div>

        <Button className="w-full" variant="outline">
          View Detailed Analytics
        </Button>
      </CardContent>
    </Card>
  );
}