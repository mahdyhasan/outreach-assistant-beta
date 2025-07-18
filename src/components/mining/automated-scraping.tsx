
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot, Play, AlertCircle, CheckCircle, Search, Brain, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { RealTimeProgress } from './real-time-progress';

interface AutomatedScrapingProps {
  dailyScraped: number;
  dailyLimit: number;
  onLeadsFound: (count: number) => void;
}

export const AutomatedScraping = ({ dailyScraped, dailyLimit, onLeadsFound }: AutomatedScrapingProps) => {
  const { toast } = useToast();
  const { rateLimits } = useSettings();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [sessionId, setSessionId] = useState('');
  
  const [criteria, setCriteria] = useState({
    industry: '',
    geography: 'United Kingdom',
    limit: Math.min(10, dailyLimit - dailyScraped)
  });

  const industries = [
    'SaaS', 'Fintech', 'Healthtech', 'Edtech', 'E-commerce', 'AI/ML',
    'Cybersecurity', 'Logistics', 'PropTech', 'MarTech', 'HR Tech',
    'Climate Tech', 'Gaming', 'Food Tech', 'Travel Tech'
  ];

  const geographies = [
    'United Kingdom', 'Australia', 'Singapore', 'Canada', 'United States',
    'Germany', 'France', 'Netherlands', 'Ireland', 'New Zealand'
  ];

  const handleStartMining = async () => {
    if (!criteria.industry) {
      toast({
        title: "Missing Industry",
        description: "Please select an industry to search for companies",
        variant: "destructive",
      });
      return;
    }

    if (dailyScraped >= dailyLimit) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily scraping limit",
        variant: "destructive",
      });
      return;
    }

    // Generate unique session ID
    const newSessionId = `mining_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Starting mining with session ID:', newSessionId);
    
    setSessionId(newSessionId);
    setIsRunning(true);
    setResults(null);
    setShowProgress(true);

    try {
      console.log('Invoking enhanced-lead-mining function...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-lead-mining', {
        body: {
          industry: criteria.industry,
          geography: criteria.geography,
          limit: criteria.limit,
          rateLimits: rateLimits,
          sessionId: newSessionId
        }
      });

      if (error) {
        console.error('Enhanced mining error:', error);
        throw new Error(error.message || 'Failed to start mining process');
      }

      console.log('Mining function response:', data);
      setResults(data);
      
    } catch (error: any) {
      console.error('Mining error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Mining Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsRunning(false);
      setShowProgress(false);
    }
  };

  const handleProgressComplete = (results: any) => {
    console.log('Progress completed with results:', results);
    setIsRunning(false);
    setShowProgress(false);
    
    onLeadsFound(results.totalResults || 0);
    
    toast({
      title: "Mining Completed",
      description: `Successfully found ${results.totalResults || 0} new leads`,
    });
  };

  const handleProgressClose = (open: boolean) => {
    if (!open && !isRunning) {
      setShowProgress(false);
    } else if (!open && isRunning) {
      toast({
        title: "Mining in Progress",
        description: "Please wait for the mining process to complete",
        variant: "destructive",
      });
    }
  };

  const remainingLimit = dailyLimit - dailyScraped;
  const canMine = remainingLimit > 0 && !isRunning;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Enhanced Multi-Source Lead Mining
          </CardTitle>
          <CardDescription>
            Intelligent lead discovery using Serper, OpenAI, and Apollo APIs in sequence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mining Strategy Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">4-Step Mining Process:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                <span><strong>Step 1:</strong> Serper finds company websites & LinkedIn profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-green-500" />
                <span><strong>Step 2:</strong> Enhanced LinkedIn discovery with OpenAI fallback</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span><strong>Step 3:</strong> OpenAI fills missing company data gaps</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span><strong>Step 4:</strong> Apollo discovers key decision makers</span>
              </div>
            </div>
          </div>

          {/* Search Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={criteria.industry} onValueChange={(value) => setCriteria(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geography">Geography</Label>
              <Select value={criteria.geography} onValueChange={(value) => setCriteria(prev => ({ ...prev, geography: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {geographies.map(geo => (
                    <SelectItem key={geo} value={geo}>{geo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Lead Limit</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max={remainingLimit}
                value={criteria.limit}
                onChange={(e) => setCriteria(prev => ({ ...prev, limit: parseInt(e.target.value) || 1 }))}
                disabled={remainingLimit <= 0}
              />
            </div>
          </div>

          {/* API Rate Limits Display */}
          {rateLimits && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Current API Limits:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Serper:</span> {rateLimits.serper.dailyRequests} requests/day
                </div>
                <div>
                  <span className="text-blue-700">OpenAI:</span> {rateLimits.openai.dailyRequests} requests/day
                </div>
                <div>
                  <span className="text-blue-700">Apollo:</span> {rateLimits.apollo.maxKDMsPerCompany} KDMs/company
                </div>
              </div>
            </div>
          )}

          {/* Daily Limit Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <span className="text-sm font-medium">Daily Progress</span>
              <p className="text-xs text-muted-foreground">
                {dailyScraped} of {dailyLimit} leads scraped today
              </p>
            </div>
            <Badge variant={remainingLimit > 0 ? "default" : "secondary"}>
              {remainingLimit} remaining
            </Badge>
          </div>

          {/* Start Mining Button */}
          <Button 
            onClick={handleStartMining} 
            disabled={!canMine}
            className="w-full" 
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Mining in Progress...' : 'Start Enhanced Mining'}
          </Button>

          {/* Results Display */}
          {results && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Mining Completed Successfully!</strong></p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Leads Found: <strong>{results.count}</strong></div>
                    <div>Sources Used: 
                      <div className="flex gap-1 mt-1">
                        {results.sources_used?.serper && <Badge variant="outline" className="text-xs">Serper</Badge>}
                        {results.sources_used?.openai && <Badge variant="outline" className="text-xs">OpenAI</Badge>}
                        {results.sources_used?.apollo && <Badge variant="outline" className="text-xs">Apollo</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for no remaining limit */}
          {remainingLimit <= 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached your daily scraping limit of {dailyLimit} leads. 
                Upgrade your plan or wait until tomorrow to continue mining.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Real-time Progress Dialog */}
      <RealTimeProgress
        open={showProgress}
        onOpenChange={handleProgressClose}
        sessionId={sessionId}
        onComplete={handleProgressComplete}
      />
    </div>
  );
};
