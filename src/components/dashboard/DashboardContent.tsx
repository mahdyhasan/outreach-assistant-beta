import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadScoringCard } from "@/components/dashboard/LeadScoringCard";
import { EmailCampaignCard } from "@/components/dashboard/EmailCampaignCard";
import { SignalDetectionCard } from "@/components/dashboard/SignalDetectionCard";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsOverview";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardContent() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats?.totalCompanies.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.companyChanges.totalCompanies}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High-Quality Companies (70-100%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats?.highQualityCompanies}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.companyChanges.highQualityCompanies}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats?.activeSignals}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.companyChanges.activeSignals}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats?.responseRate}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.companyChanges.responseRate}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadScoringCard />
        <EmailCampaignCard />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalDetectionCard />
        <AnalyticsOverview />
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardContent className="text-muted-foreground">Latest updates from your automation workflow</CardContent>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "New high-quality company scored", company: "TechCorp Inc", score: 87, time: "2 minutes ago" },
              { action: "Company enrichment completed", company: "InnovateLab", score: 75, time: "5 minutes ago" },
              { action: "KDM discovery initiated", company: "DataFlow Solutions", score: 82, time: "12 minutes ago" },
              { action: "Signal detected: New funding", company: "StartupXYZ", score: 69, time: "1 hour ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-card-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={activity.score >= 70 ? "default" : "secondary"}>
                    {activity.score}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}