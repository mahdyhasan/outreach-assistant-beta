import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, eachDayOfInterval } from "date-fns";

const chartConfig = {
  sent: {
    label: "Emails Sent",
    color: "hsl(var(--primary))",
  },
  opened: {
    label: "Emails Opened",
    color: "hsl(var(--secondary))",
  },
};

export function EmailPerformanceChart() {
  const { data: emailStats, isLoading } = useQuery({
    queryKey: ["email-performance"],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      // Get email queue data for the last 30 days
      const { data: emailQueue, error } = await supabase
        .from("email_queue")
        .select("scheduled_time, status, open_count")
        .gte("scheduled_time", startDate.toISOString())
        .lte("scheduled_time", endDate.toISOString());

      if (error) throw error;

      // Generate all dates in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      const dailyStats = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayEmails = emailQueue?.filter(email => 
          format(new Date(email.scheduled_time), "yyyy-MM-dd") === dateStr
        ) || [];

        const sent = dayEmails.length;
        const opened = dayEmails.filter(email => (email.open_count || 0) > 0).length;

        return {
          date: format(date, "MMM dd"),
          sent,
          opened,
          openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        };
      });

      return dailyStats;
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
        <CardTitle>Email Performance (30 Days)</CardTitle>
        <CardDescription>
          Daily email send and open rates for your campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={emailStats}>
              <XAxis 
                dataKey="date" 
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
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="var(--color-sent)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="opened" 
                stroke="var(--color-opened)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}