import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailCampaignCard() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      
      return data?.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        type: "email",
        leads: campaign.leads_count,
        sent: campaign.emails_sent,
        responses: campaign.responses_count,
        status: campaign.status,
        nextAction: campaign.status === "active" ? "Email sequence continuing" : "Campaign completed"
      })) || [];
    },
    refetchInterval: 30000,
  });

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
          Email Outreach
        </CardTitle>
        <CardDescription>
          Automated email campaigns with intelligent follow-ups
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

        {/* Active Campaigns */}
        <div>
          <h4 className="font-medium mb-3 text-card-foreground">Recent Campaigns</h4>
          <div className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border border-border rounded-md">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-1 w-full" />
                  </div>
                </div>
              ))
            ) : (
              campaigns?.map((campaign) => (
                <div key={campaign.id} className="p-3 border border-border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm text-card-foreground">{campaign.name}</h5>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{campaign.leads} leads • {campaign.sent} sent • {campaign.responses} responses</span>
                    <Badge variant="outline" className="text-xs">
                      {campaign.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {campaign.nextAction}
                  </div>
                  <Progress value={(campaign.sent / campaign.leads) * 100} className="mt-2 h-1" />
                </div>
              ))
            )}
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Manage Campaigns
        </Button>
      </CardContent>
    </Card>
  );
}