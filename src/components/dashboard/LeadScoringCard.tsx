import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function LeadScoringCard() {
  const { data: recentScores, isLoading } = useQuery({
    queryKey: ["recent-scores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("company_name, employee_size, ai_score, status")
        .order("created_at", { ascending: false })
        .limit(5);
      
      return data?.map(company => ({
        company: company.company_name,
        size: company.employee_size,
        score: company.ai_score,
        category: company.ai_score >= 70 ? "hot" : 
                 company.ai_score >= 40 ? "queue" : 
                 company.employee_size?.includes("5000+") ? "enterprise" : "nurture"
      })) || [];
    },
    refetchInterval: 30000,
  });

  const scoringFactors = [
    { label: "Company Size (11-200)", weight: 30, status: "optimal" },
    { label: "Tech Stack Match", weight: 25, status: "good" },
    { label: "Recent Funding", weight: 25, status: "detected" },
    { label: "Job Postings", weight: 20, status: "active" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Company Scoring Engine
        </CardTitle>
        <CardDescription>
          AI-powered scoring based on company size, tech stack, funding, and job postings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scoring Factors */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Scoring Criteria</h4>
          <div className="space-y-3">
            {scoringFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-card-foreground">{factor.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {factor.weight}%
                  </Badge>
                </div>
                <Badge 
                  variant={factor.status === 'optimal' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {factor.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scored Companies */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Recently Scored Companies</h4>
          <div className="space-y-2">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-md">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))
            ) : (
              recentScores?.map((lead, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-md">
                  <div>
                    <p className="font-medium text-sm text-card-foreground">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.size} employees</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-card-foreground">{lead.score}%</p>
                      <Badge 
                        variant={
                          lead.category === 'hot' ? 'default' : 
                          lead.category === 'queue' ? 'secondary' : 
                          'outline'
                        }
                        className="text-xs"
                      >
                        {lead.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Button className="w-full" variant="outline">
          View All Scored Companies
        </Button>
      </CardContent>
    </Card>
  );
}