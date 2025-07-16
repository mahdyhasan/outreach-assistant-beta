import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailCampaignCard() {
  // Email campaigns removed - focusing on company discovery and KDM finding
  const campaigns = [];

  const { data: outreachStats } = useQuery({
    queryKey: ["outreach-stats"],
    queryFn: async () => {
      const { count: emailSent } = await supabase
        .from("outreach_activities")
        .select("*", { count: "exact", head: true })
        .eq("type", "email");

      const { count: emailResponses } = await supabase
        .from("outreach_activities")
        .select("*", { count: "exact", head: true })
        .eq("type", "email")
        .not("response_at", "is", null);

      const emailRate = emailSent && emailResponses 
        ? ((emailResponses / emailSent) * 100).toFixed(1)
        : "0.0";

      return [
        { channel: "Email", sent: emailSent || 0, responses: emailResponses || 0, rate: `${emailRate}%` }
      ];
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Company Discovery & KDM Finding
        </CardTitle>
        <CardDescription>
          Discover qualified companies and find key decision makers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Performance */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Channel Performance</h4>
          <div className="grid grid-cols-1 gap-4">
            {outreachStats ? (
              outreachStats.map((stat, index) => (
                <div key={index} className="p-3 border border-border rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium text-sm text-card-foreground">{stat.channel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.sent} sent • {stat.responses} responses</p>
                  <p className="text-sm font-medium text-card-foreground">{stat.rate} response rate</p>
                </div>
              ))
            ) : (
              <Skeleton className="h-20 w-full" />
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Quick Actions</h4>
          <div className="space-y-3">
            <div className="p-3 border border-border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm text-card-foreground">Company Discovery</h5>
                <Badge variant="default">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Use Apollo API and LinkedIn search to find target companies
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Ready to start mining
              </div>
            </div>
            
            <div className="p-3 border border-border rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-sm text-card-foreground">KDM Finding</h5>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Find CEOs, COOs, and HROs for qualified companies (&gt;40% score)
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Awaiting qualified companies
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Start Company Mining
        </Button>
      </CardContent>
    </Card>
  );
}