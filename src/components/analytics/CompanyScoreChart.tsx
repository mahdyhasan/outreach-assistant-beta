import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  companies: {
    label: "Companies",
    color: "hsl(var(--primary))",
  },
};

export function CompanyScoreChart() {
  const { data: scoreDistribution, isLoading } = useQuery({
    queryKey: ["company-score-distribution"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("companies")
        .select("ai_score")
        .not("ai_score", "is", null);

      if (error) throw error;

      // Group companies by score ranges
      const ranges = [
        { range: "0-20", min: 0, max: 20, count: 0 },
        { range: "21-40", min: 21, max: 40, count: 0 },
        { range: "41-60", min: 41, max: 60, count: 0 },
        { range: "61-80", min: 61, max: 80, count: 0 },
        { range: "81-100", min: 81, max: 100, count: 0 },
      ];

      companies?.forEach((company) => {
        const score = company.ai_score || 0;
        ranges.forEach((range) => {
          if (score >= range.min && score <= range.max) {
            range.count++;
          }
        });
      });

      return ranges.map(range => ({
        scoreRange: range.range,
        companies: range.count,
      }));
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Score Distribution</CardTitle>
        <CardDescription>
          Distribution of AI scores across all companies in your pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution}>
              <XAxis 
                dataKey="scoreRange" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="companies" 
                fill="var(--color-companies)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}