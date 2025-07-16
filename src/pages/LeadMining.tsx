import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualImport } from '@/components/mining/manual-import';
import { AutomatedScraping } from '@/components/mining/automated-scraping';
import { HybridMining } from '@/components/mining/hybrid-mining';
import { PendingReview } from '@/components/mining/pending-review';
import { MiningSettings } from '@/components/mining/mining-settings';
import { Upload, Bot, GitMerge, Settings, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LeadMining = () => {
  const [pendingLeads, setPendingLeads] = useState(0);
  const [dailyScrapedToday, setDailyScrapedToday] = useState(42);
  const [dailyLimit, setDailyLimit] = useState(100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
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
              {pendingLeads > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {pendingLeads} pending review
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
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
              {pendingLeads > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingLeads}
                </Badge>
              )}
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
                <ManualImport onLeadsAdded={(count) => setPendingLeads(prev => prev + count)} />
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
                  onLeadsFound={(count) => setPendingLeads(prev => prev + count)}
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
                <HybridMining onLeadsFound={(count) => setPendingLeads(prev => prev + count)} />
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
                  pendingCount={pendingLeads}
                  onLeadsProcessed={(approved) => setPendingLeads(0)}
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
                  dailyLimit={dailyLimit}
                  onDailyLimitChange={setDailyLimit}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LeadMining;