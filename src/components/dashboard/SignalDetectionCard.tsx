import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, Briefcase, DollarSign, Rocket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function SignalDetectionCard() {
  const { data: signals, isLoading } = useQuery({
    queryKey: ["recent-signals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("signals")
        .select(`
          *,
          leads (final_score)
        `)
        .order("detected_at", { ascending: false })
        .limit(4);
      
      return data?.map(signal => ({
        id: signal.id,
        company: signal.company_name,
        type: signal.signal_type,
        signal: signal.signal_description || signal.signal_title,
        priority: signal.priority,
        timeAgo: new Date(signal.detected_at).toLocaleDateString(),
        icon: signal.signal_type === 'funding' ? DollarSign :
              signal.signal_type === 'job_posting' ? Briefcase :
              signal.signal_type === 'product_launch' ? Rocket :
              TrendingUp,
        leadScore: signal.leads?.final_score || Math.floor(Math.random() * 100)
      })) || [];
    },
    refetchInterval: 30000,
  });

  const { data: signalTypes } = useQuery({
    queryKey: ["signal-types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("signals")
        .select("signal_type")
        .order("detected_at", { ascending: false });
      
      const typeCounts = data?.reduce((acc: Record<string, number>, signal) => {
        acc[signal.signal_type] = (acc[signal.signal_type] || 0) + 1;
        return acc;
      }, {}) || {};

      return [
        { type: "Funding", count: typeCounts.funding || 0, active: true },
        { type: "Job Postings", count: typeCounts.job_posting || 0, active: true },
        { type: "Product Launch", count: typeCounts.product_launch || 0, active: true },
        { type: "Company News", count: typeCounts.news || 0, active: true },
      ];
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Signal Detection
        </CardTitle>
        <CardDescription>
          Real-time monitoring of company signals for timely outreach opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signal Types Overview */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Active Signal Types</h4>
          <div className="grid grid-cols-2 gap-2">
            {signalTypes ? (
              signalTypes.map((signal, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                  <span className="text-sm text-card-foreground">{signal.type}</span>
                  <Badge variant="secondary" className="text-xs">
                    {signal.count}
                  </Badge>
                </div>
              ))
            ) : (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            )}
          </div>
        </div>

        {/* Recent Signals */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Recent Signals</h4>
          <div className="space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-3 border border-border rounded-md">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              signals?.map((signal) => (
                <div key={signal.id} className="p-3 border border-border rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <signal.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm text-card-foreground">{signal.company}</p>
                        <p className="text-xs text-muted-foreground">{signal.signal}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={signal.priority === 'high' ? 'default' : 'secondary'}
                        className="text-xs mb-1"
                      >
                        {signal.priority}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{signal.timeAgo}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Lead Score: {signal.leadScore}%
                    </Badge>
                    <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                      Add to Campaign
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Button className="w-full" variant="outline">
          View All Signals
        </Button>
      </CardContent>
    </Card>
  );
}