import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bot, Play, Pause, Settings, Clock, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AutomatedScrapingProps {
  dailyScraped: number;
  dailyLimit: number;
  onLeadsFound: (count: number) => void;
}

export const AutomatedScraping = ({ 
  dailyScraped, 
  dailyLimit, 
  onLeadsFound 
}: AutomatedScrapingProps) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [targetIndustry, setTargetIndustry] = useState('tech-startups');
  const [geography, setGeography] = useState('uk-au');
  const [isRunning, setIsRunning] = useState(false);

  const progressPercentage = (dailyScraped / dailyLimit) * 100;

  const handleToggleAutomation = () => {
    setIsActive(!isActive);
    toast({
      title: isActive ? "Automation Disabled" : "Automation Enabled",
      description: isActive 
        ? "Automated scraping has been turned off" 
        : "Automated scraping will start based on your schedule",
    });
  };

  const handleManualRun = async () => {
    if (dailyScraped >= dailyLimit) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily scraping limit. Try again tomorrow.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    
    try {
      // Call our lead scraping edge function with real API integration
      const { data, error } = await supabase.functions.invoke('lead-scraping', {
        body: {
          industry: targetIndustry,
          geography: geography,
          limit: Math.min(50, dailyLimit - dailyScraped)
        }
      });

      if (error) throw error;

      const newLeads = data?.leads?.length || 0;
      onLeadsFound(newLeads);
      
      toast({
        title: "Scraping Complete",
        description: `Found ${newLeads} new leads matching your criteria`,
      });
    } catch (error: any) {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape leads",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-semibold">{isActive ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Daily Progress</div>
                <div className="font-semibold">{dailyScraped} / {dailyLimit}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Next Run</div>
                <div className="font-semibold">
                  {isActive ? 'Tomorrow 9:00 AM' : 'Not scheduled'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Scraping Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{dailyScraped} of {dailyLimit} leads</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            {progressPercentage >= 100 && (
              <Badge variant="secondary" className="mt-2">
                Daily limit reached
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Scraping Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Target Industry</Label>
              <Select value={targetIndustry} onValueChange={setTargetIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech-startups">Tech Startups</SelectItem>
                  <SelectItem value="saas">SaaS Companies</SelectItem>
                  <SelectItem value="ecommerce">Ecommerce</SelectItem>
                  <SelectItem value="agencies">Digital Agencies</SelectItem>
                  <SelectItem value="funded-scaleups">Funded Scaleups</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geography">Geography Focus</Label>
              <Select value={geography} onValueChange={setGeography}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk-au">UK + Australia (80%)</SelectItem>
                  <SelectItem value="singapore-malaysia">Singapore + Malaysia (10%)</SelectItem>
                  <SelectItem value="western-europe">Western Europe (10%)</SelectItem>
                  <SelectItem value="all-regions">All Target Regions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="automation-toggle">Enable Automation</Label>
                <p className="text-sm text-muted-foreground">
                  Run scraping automatically based on frequency
                </p>
              </div>
              <Switch 
                id="automation-toggle"
                checked={isActive}
                onCheckedChange={handleToggleAutomation}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleManualRun}
              disabled={isRunning || dailyScraped >= dailyLimit}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Now
                </>
              )}
            </Button>
            
            {dailyScraped >= dailyLimit && (
              <Badge variant="outline">
                Daily limit reached
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Run Status */}
      {isRunning && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-blue-600 animate-pulse" />
              <div>
                <div className="font-semibold text-blue-800">Scraping in Progress</div>
                <div className="text-sm text-blue-600">
                  Searching for {targetIndustry} companies in {geography} region...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};