import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))", 
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
];

const chartConfig = {
  companies: {
    label: "Companies",
  },
};

export function IndustryBreakdownChart() {
  const { data: industryData, isLoading } = useQuery({
    queryKey: ["industry-breakdown"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("companies")
        .select("industry")
        .not("industry", "is", null);

      if (error) throw error;

      // Count companies by industry
      const industryCount: Record<string, number> = {};
      companies?.forEach((company) => {
        const industry = company.industry || "Unknown";
        industryCount[industry] = (industryCount[industry] || 0) + 1;
      });

      // Sort by count and take top 6
      const sortedIndustries = Object.entries(industryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([industry, count], index) => ({
          industry,
          companies: count,
          fill: COLORS[index % COLORS.length],
        }));

      return sortedIndustries;
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
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Industry Breakdown</CardTitle>
        <CardDescription>
          Top industries represented in your company database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={industryData}
                dataKey="companies"
                nameKey="industry"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ industry, companies }) => `${industry}: ${companies}`}
                labelLine={false}
              >
                {industryData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}