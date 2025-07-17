import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyScoreChart } from "@/components/analytics/CompanyScoreChart";
import { EmailPerformanceChart } from "@/components/analytics/EmailPerformanceChart";
import { IndustryBreakdownChart } from "@/components/analytics/IndustryBreakdownChart";
import { ConversionFunnelChart } from "@/components/analytics/ConversionFunnelChart";
import { ROIMetrics } from "@/components/analytics/ROIMetrics";
import { AnalyticsOverview } from "@/components/dashboard/AnalyticsOverview";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Mail, Users } from "lucide-react";

export default function Analytics() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your lead generation and outreach performance
          </p>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Companies
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {stats?.totalCompanies.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.companyChanges.totalCompanies}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High-Quality Leads
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {stats?.highQualityCompanies}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.companyChanges.highQualityCompanies}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Signals
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {stats?.activeSignals}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.companyChanges.activeSignals}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Qualification Rate
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">
                  {stats?.responseRate}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.companyChanges.responseRate}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabbed Analytics Views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsOverview />
            <ConversionFunnelChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyScoreChart />
            <EmailPerformanceChart />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <ConversionFunnelChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CompanyScoreChart />
              <IndustryBreakdownChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyScoreChart />
            <IndustryBreakdownChart />
          </div>
          <AnalyticsOverview />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <EmailPerformanceChart />
            <AnalyticsOverview />
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <ROIMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConversionFunnelChart />
            <CompanyScoreChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}