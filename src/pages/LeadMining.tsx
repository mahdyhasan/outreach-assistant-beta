import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ManualImport } from '@/components/mining/manual-import';
import { AutomatedScraping } from '@/components/mining/automated-scraping';
import { HybridMining } from '@/components/mining/hybrid-mining';
import { PendingReview } from '@/components/mining/pending-review';
import { MiningSettings } from '@/components/mining/mining-settings';
import { Upload, Bot, GitMerge, Settings, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMiningSettings } from '@/hooks/use-mining-settings';
import { Loader2 } from 'lucide-react';

const LeadMining = () => {
  const { settings, dailyStats, loading, updateSettings, updateDailyStats } = useMiningSettings();

  
  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading mining settings...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const dailyScrapedToday = dailyStats?.companies_scraped || 0;
  const dailyLimit = settings?.daily_limit || 100;
  const pendingCount = 0; // Will be calculated from actual pending companies

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            {/* Header */}
            <div className="border-b bg-card mb-6">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                      <Bot className="h-8 w-8 text-primary" />
                      Lead Mining Hub
                    </h1>
                    <p className="text-muted-foreground mt-2">
                      Import, scrape, and enrich leads automatically
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Today's Progress</div>
                      <div className="font-semibold">
                        {dailyScrapedToday} / {dailyLimit} leads
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6">
              <Tabs defaultValue="manual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Manual Import
            </TabsTrigger>
            <TabsTrigger value="automated" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Auto Scraping
            </TabsTrigger>
            <TabsTrigger value="hybrid" className="flex items-center gap-2">
              <GitMerge className="h-4 w-4" />
              Hybrid Mining
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Review Queue
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manual Lead Import</CardTitle>
                <CardDescription>
                  Upload CSV files or manually add company lists for enrichment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ManualImport onLeadsAdded={(count) => updateDailyStats({ companies_scraped: dailyScrapedToday + count })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automated" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Lead Scraping</CardTitle>
                <CardDescription>
                  Set up automated daily scraping based on your ICP criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
            <AutomatedScraping 
              dailyScraped={dailyScrapedToday}
              dailyLimit={dailyLimit}
              onLeadsFound={(count) => updateDailyStats({ companies_scraped: dailyScrapedToday + count })}
            />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hybrid" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hybrid Lead Mining</CardTitle>
                <CardDescription>
                  Provide seed companies and let AI find similar prospects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HybridMining onLeadsFound={(count) => updateDailyStats({ companies_scraped: dailyScrapedToday + count })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Review</CardTitle>
                <CardDescription>
                  Review and approve mined leads before adding to your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingReview 
                  pendingCount={pendingCount}
                  onLeadsProcessed={(approved) => updateDailyStats({ companies_approved: (dailyStats?.companies_approved || 0) + approved })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mining Settings</CardTitle>
                <CardDescription>
                  Configure scraping limits, frequency, and ICP criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MiningSettings 
                  settings={settings}
                  onSettingsUpdate={updateSettings}
                />
              </CardContent>
            </Card>
          </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LeadMining;