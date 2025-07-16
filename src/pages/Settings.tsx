import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Key, 
  Globe, 
  Brain, 
  Zap, 
  Save, 
  Eye, 
  EyeOff, 
  Trash2,
  Plus,
  AlertCircle
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";

interface APIKey {
  id: string;
  name: string;
  key: string;
  description: string;
  isActive: boolean;
}

interface ScoringWeights {
  companySize: number;
  techStack: number;
  funding: number;
  jobPostings: number;
  geographic: number;
}

interface GeographicScoring {
  uk: number;
  australia: number;
  singapore: number;
  malaysia: number;
  qatar: number;
  westernEurope: number;
  other: number;
}

const Settings = () => {
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "apollo",
      name: "Apollo.io API",
      key: "",
      description: "For lead enrichment and company data",
      isActive: true
    },
    {
      id: "openai",
      name: "OpenAI API",
      key: "",
      description: "For AI-powered lead scoring and analysis",
      isActive: true
    },
    {
      id: "perplexity",
      name: "Perplexity API",
      key: "",
      description: "For real-time company intelligence and signals",
      isActive: false
    }
  ]);

  // Scoring Weights State
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>({
    companySize: 30,
    techStack: 25,
    funding: 25,
    jobPostings: 20,
    geographic: 15
  });

  // Geographic Scoring State
  const [geographicScoring, setGeographicScoring] = useState<GeographicScoring>({
    uk: 40,
    australia: 40,
    singapore: 30,
    malaysia: 30,
    qatar: 30,
    westernEurope: 25,
    other: 10
  });

  // Mining Settings State
  const [miningSettings, setMiningSettings] = useState({
    dailyLimit: 100,
    autoApprovalThreshold: 70,
    frequencyHours: 24,
    enableSignalDetection: true,
    enableAutoEnrichment: true
  });

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const updateApiKey = (keyId: string, newKey: string) => {
    setApiKeys(prev => prev.map(api => 
      api.id === keyId ? { ...api, key: newKey } : api
    ));
  };

  const toggleApiActive = (keyId: string) => {
    setApiKeys(prev => prev.map(api => 
      api.id === keyId ? { ...api, isActive: !api.isActive } : api
    ));
  };

  const deleteApiKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(api => api.id !== keyId));
    toast({
      title: "API Key Deleted",
      description: "The API key has been removed from your settings.",
    });
  };

  const addNewApiKey = () => {
    const newKey: APIKey = {
      id: `custom-${Date.now()}`,
      name: "Custom API",
      key: "",
      description: "Custom API integration",
      isActive: false
    };
    setApiKeys(prev => [...prev, newKey]);
  };

  const saveSettings = () => {
    // Save to localStorage for now
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    localStorage.setItem('scoringWeights', JSON.stringify(scoringWeights));
    localStorage.setItem('geographicScoring', JSON.stringify(geographicScoring));
    localStorage.setItem('miningSettings', JSON.stringify(miningSettings));
    
    toast({
      title: "Settings Saved",
      description: "All your settings have been saved successfully.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-card-foreground">Settings</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your API integrations, scoring weights, and automation preferences
                </p>
              </div>

              <Tabs defaultValue="api-keys" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                  <TabsTrigger value="scoring">Scoring Engine</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                  <TabsTrigger value="mining">Mining</TabsTrigger>
                </TabsList>

                {/* API Keys Tab */}
                <TabsContent value="api-keys" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Key Management
                      </CardTitle>
                      <CardDescription>
                        Configure your third-party API integrations for lead enrichment and scoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {apiKeys.map((api) => (
                        <div key={api.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium flex items-center gap-2">
                                {api.name}
                                <Badge variant={api.isActive ? "default" : "secondary"}>
                                  {api.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </h3>
                              <p className="text-sm text-muted-foreground">{api.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={api.isActive}
                                onCheckedChange={() => toggleApiActive(api.id)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteApiKey(api.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`api-${api.id}`}>API Key</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`api-${api.id}`}
                                type={showKeys[api.id] ? "text" : "password"}
                                value={api.key}
                                onChange={(e) => updateApiKey(api.id, e.target.value)}
                                placeholder="Enter your API key"
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleKeyVisibility(api.id)}
                              >
                                {showKeys[api.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={addNewApiKey}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Custom API Key
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Scoring Engine Tab */}
                <TabsContent value="scoring" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Scoring Engine Weights
                      </CardTitle>
                      <CardDescription>
                        Adjust the importance of different factors in lead scoring
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(scoringWeights).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id={key}
                                type="number"
                                min="0"
                                max="100"
                                value={value}
                                onChange={(e) => setScoringWeights(prev => ({
                                  ...prev,
                                  [key]: parseInt(e.target.value) || 0
                                }))}
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                              <div className="flex-1 bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${Math.min(value, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Total Weight</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current total: {Object.values(scoringWeights).reduce((a, b) => a + b, 0)}%
                          {Object.values(scoringWeights).reduce((a, b) => a + b, 0) !== 100 && 
                            " (Weights should ideally sum to 100%)"
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Geographic Scoring Tab */}
                <TabsContent value="geographic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Geographic Scoring Preferences
                      </CardTitle>
                      <CardDescription>
                        Set location-based scoring bonuses for different regions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(geographicScoring).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={`geo-${key}`} className="capitalize">
                              {key === 'uk' ? 'United Kingdom' :
                               key === 'westernEurope' ? 'Western Europe' :
                               key.charAt(0).toUpperCase() + key.slice(1)}
                            </Label>
                            <div className="flex items-center gap-4">
                              <Input
                                id={`geo-${key}`}
                                type="number"
                                min="0"
                                max="50"
                                value={value}
                                onChange={(e) => setGeographicScoring(prev => ({
                                  ...prev,
                                  [key]: parseInt(e.target.value) || 0
                                }))}
                                className="w-20"
                              />
                              <span className="text-sm text-muted-foreground">bonus points</span>
                              <div className="flex-1 bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${(value / 50) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Mining Settings Tab */}
                <TabsContent value="mining" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Mining & Automation Settings
                      </CardTitle>
                      <CardDescription>
                        Configure automated lead mining and enrichment preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="dailyLimit">Daily Mining Limit</Label>
                          <Input
                            id="dailyLimit"
                            type="number"
                            min="1"
                            max="1000"
                            value={miningSettings.dailyLimit}
                            onChange={(e) => setMiningSettings(prev => ({
                              ...prev,
                              dailyLimit: parseInt(e.target.value) || 100
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum leads to process per day
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="autoApprovalThreshold">Auto-Approval Threshold</Label>
                          <Input
                            id="autoApprovalThreshold"
                            type="number"
                            min="0"
                            max="100"
                            value={miningSettings.autoApprovalThreshold}
                            onChange={(e) => setMiningSettings(prev => ({
                              ...prev,
                              autoApprovalThreshold: parseInt(e.target.value) || 70
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum score for automatic approval
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="frequencyHours">Mining Frequency (hours)</Label>
                          <Input
                            id="frequencyHours"
                            type="number"
                            min="1"
                            max="168"
                            value={miningSettings.frequencyHours}
                            onChange={(e) => setMiningSettings(prev => ({
                              ...prev,
                              frequencyHours: parseInt(e.target.value) || 24
                            }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            How often to run automated mining
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Signal Detection</Label>
                              <p className="text-xs text-muted-foreground">
                                Monitor company signals for opportunities
                              </p>
                            </div>
                            <Switch
                              checked={miningSettings.enableSignalDetection}
                              onCheckedChange={(checked) => setMiningSettings(prev => ({
                                ...prev,
                                enableSignalDetection: checked
                              }))}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label>Auto-Enrichment</Label>
                              <p className="text-xs text-muted-foreground">
                                Automatically enrich leads with additional data
                              </p>
                            </div>
                            <Switch
                              checked={miningSettings.enableAutoEnrichment}
                              onCheckedChange={(checked) => setMiningSettings(prev => ({
                                ...prev,
                                enableAutoEnrichment: checked
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button onClick={saveSettings} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save All Settings
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;