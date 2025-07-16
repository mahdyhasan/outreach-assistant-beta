import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Building,
  Users,
  Briefcase
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

const EmailCampaigns = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-card-foreground">Company Discovery & KDM Finding</h1>
                  <p className="text-muted-foreground mt-2">
                    Find qualified companies and discover key decision makers
                  </p>
                </div>
                <Button className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Start Company Mining
                </Button>
              </div>

              {/* Discovery Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Companies Found</div>
                        <div className="text-2xl font-bold">234</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">KDMs Discovered</div>
                        <div className="text-2xl font-bold">156</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Qualified (&gt;40%)</div>
                        <div className="text-2xl font-bold">89</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ready for Export</div>
                        <div className="text-2xl font-bold">67</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Discovery Process */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Discovery Pipeline
                    </CardTitle>
                    <CardDescription>
                      Automated company discovery and KDM finding process
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">1. Company Discovery</h4>
                          <Badge variant="default">Active</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Use Apollo API and LinkedIn search to find target companies based on ICP criteria
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Apollo Search</Button>
                          <Button size="sm" variant="outline">LinkedIn Query</Button>
                          <Button size="sm" variant="outline">Manual Upload</Button>
                        </div>
                      </div>

                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">2. Company Enrichment</h4>
                          <Badge variant="secondary">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Enrich company data using Serper API and ChatGPT for intelligence scoring
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled>Start Enrichment</Button>
                          <Button size="sm" variant="outline" disabled>View Results</Button>
                        </div>
                      </div>

                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">3. KDM Discovery</h4>
                          <Badge variant="secondary">Awaiting Qualified Companies</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Find CEOs, COOs, and HROs for companies scoring &gt;40%
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled>Find KDMs</Button>
                          <Button size="sm" variant="outline" disabled>Export Data</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="text-center py-12">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active discovery campaigns</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start with company mining to discover new prospects
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EmailCampaigns;