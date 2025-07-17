import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle,
  Mail,
  Users
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";

const Settings = () => {
  const { toast } = useToast();
  const {
    apiKeys,
    setApiKeys,
    scoringWeights,
    setScoringWeights,
    targetCountries,
    setTargetCountries,
    emailSettings,
    setEmailSettings,
    miningSettings,
    setMiningSettings,
    saveSettings
  } = useSettings();
  
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const updateApiKey = (keyId: string, field: string, value: string) => {
    setApiKeys(prev => prev.map(api => 
      api.id === keyId ? { ...api, [field]: value } : api
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
    const newKey = {
      id: `custom-${Date.now()}`,
      name: "Custom API",
      key: "",
      description: "Custom API integration",
      isActive: false,
      customName: ""
    };
    setApiKeys(prev => [...prev, newKey]);
  };

  const handleSave = async () => {
    const success = await saveSettings();
    if (success) {
      toast({
        title: "Settings Saved",
        description: "All your settings have been saved successfully.",
      });
    }
  };

  const toggleCountrySelection = (country: string) => {
    const isSelected = targetCountries.selectedCountries.includes(country);
    setTargetCountries(prev => ({
      ...prev,
      selectedCountries: isSelected
        ? prev.selectedCountries.filter(c => c !== country)
        : [...prev.selectedCountries, country]
    }));
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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                  <TabsTrigger value="scoring">Scoring</TabsTrigger>
                  <TabsTrigger value="countries">Countries</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
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
                                {api.customName || api.name}
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
                          
                          {/* Custom API name field */}
                          {api.id.startsWith('custom-') && (
                            <div className="space-y-2">
                              <Label htmlFor={`name-${api.id}`}>Custom API Name</Label>
                              <Input
                                id={`name-${api.id}`}
                                value={api.customName || ""}
                                onChange={(e) => updateApiKey(api.id, 'customName', e.target.value)}
                                placeholder="Enter API name"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor={`api-${api.id}`}>API Key</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`api-${api.id}`}
                                type={showKeys[api.id] ? "text" : "password"}
                                value={api.key}
                                onChange={(e) => updateApiKey(api.id, 'key', e.target.value)}
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

                          {/* Zoho Email specific fields */}
                          {api.id === 'zoho-email' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`email-host-${api.id}`}>SMTP Host</Label>
                                <Input
                                  id={`email-host-${api.id}`}
                                  value={api.emailHost || ""}
                                  onChange={(e) => updateApiKey(api.id, 'emailHost', e.target.value)}
                                  placeholder="smtp.zoho.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`email-username-${api.id}`}>Email Username</Label>
                                <Input
                                  id={`email-username-${api.id}`}
                                  value={api.emailUsername || ""}
                                  onChange={(e) => updateApiKey(api.id, 'emailUsername', e.target.value)}
                                  placeholder="your@domain.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`email-password-${api.id}`}>Email Password</Label>
                                <Input
                                  id={`email-password-${api.id}`}
                                  type="password"
                                  value={api.emailPassword || ""}
                                  onChange={(e) => updateApiKey(api.id, 'emailPassword', e.target.value)}
                                  placeholder="Email password"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`imap-host-${api.id}`}>IMAP Host</Label>
                                <Input
                                  id={`imap-host-${api.id}`}
                                  value={api.imapHost || ""}
                                  onChange={(e) => updateApiKey(api.id, 'imapHost', e.target.value)}
                                  placeholder="imap.zoho.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`imap-username-${api.id}`}>IMAP Username</Label>
                                <Input
                                  id={`imap-username-${api.id}`}
                                  value={api.imapUsername || ""}
                                  onChange={(e) => updateApiKey(api.id, 'imapUsername', e.target.value)}
                                  placeholder="your@domain.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`imap-password-${api.id}`}>IMAP Password</Label>
                                <Input
                                  id={`imap-password-${api.id}`}
                                  type="password"
                                  value={api.imapPassword || ""}
                                  onChange={(e) => updateApiKey(api.id, 'imapPassword', e.target.value)}
                                  placeholder="IMAP password"
                                />
                              </div>
                            </div>
                          )}
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

                {/* Target Countries Tab */}
                <TabsContent value="countries" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Target Countries
                      </CardTitle>
                      <CardDescription>
                        Select which countries to focus lead mining efforts on
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {targetCountries.availableCountries.map((country) => (
                          <div key={country} className="flex items-center space-x-2">
                            <Checkbox
                              id={country}
                              checked={targetCountries.selectedCountries.includes(country)}
                              onCheckedChange={() => toggleCountrySelection(country)}
                            />
                            <Label htmlFor={country} className="text-sm font-medium">
                              {country}
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Selected Countries</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {targetCountries.selectedCountries.map((country) => (
                            <Badge key={country} variant="secondary">
                              {country}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Email Settings Tab */}
                <TabsContent value="email" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Generation Settings
                      </CardTitle>
                      <CardDescription>
                        Configure email templates and signature for outreach campaigns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email-prompt">ChatGPT Email Prompt</Label>
                        <Textarea
                          id="email-prompt"
                          rows={6}
                          value={emailSettings.emailPrompt}
                          onChange={(e) => setEmailSettings(prev => ({
                            ...prev,
                            emailPrompt: e.target.value
                          }))}
                          placeholder="Enter the prompt for ChatGPT to generate emails..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Use placeholders: {"{contactName}"}, {"{companyName}"}, {"{companyData}"}, {"{contactData}"}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label htmlFor="email-signature">Email Signature</Label>
                        <Textarea
                          id="email-signature"
                          rows={4}
                          value={emailSettings.signature}
                          onChange={(e) => setEmailSettings(prev => ({
                            ...prev,
                            signature: e.target.value
                          }))}
                          placeholder="Enter your email signature..."
                        />
                        <p className="text-xs text-muted-foreground">
                          This signature will be automatically added to all generated emails
                        </p>
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
                           <Label htmlFor="frequency">Mining Frequency</Label>
                           <Select 
                             value={miningSettings.frequency} 
                             onValueChange={(value) => setMiningSettings(prev => ({
                               ...prev,
                               frequency: value
                             }))}
                           >
                             <SelectTrigger>
                               <SelectValue placeholder="Select frequency" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="hourly">Hourly</SelectItem>
                               <SelectItem value="daily">Daily</SelectItem>
                               <SelectItem value="weekly">Weekly</SelectItem>
                               <SelectItem value="monthly">Monthly</SelectItem>
                             </SelectContent>
                           </Select>
                            <p className="text-xs text-muted-foreground">
                              How often to run automated mining
                            </p>
                          </div>
                        </div>
                     </CardContent>
                   </Card>
                 </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button onClick={handleSave} className="flex items-center gap-2">
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