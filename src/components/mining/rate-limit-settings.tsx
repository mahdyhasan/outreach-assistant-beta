
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Zap, Brain, Search } from 'lucide-react';

interface RateLimits {
  serper: {
    dailyRequests: number;
    resultsPerQuery: number;
  };
  openai: {
    dailyRequests: number;
    maxTokensPerRequest: number;
  };
  apollo: {
    maxCreditsPerCompany: number;
    maxKDMsPerCompany: number;
    enableCreditWarnings: boolean;
    creditThreshold: number;
    autoStopOnLowCredits: boolean;
  };
}

interface RateLimitSettingsProps {
  rateLimits: RateLimits;
  onRateLimitsChange: (rateLimits: RateLimits) => void;
}

export const RateLimitSettings = ({ rateLimits, onRateLimitsChange }: RateLimitSettingsProps) => {
  const updateRateLimit = (category: keyof RateLimits, field: string, value: any) => {
    onRateLimitsChange({
      ...rateLimits,
      [category]: {
        ...rateLimits[category],
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Serper Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Serper API Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serper-daily">Daily Requests</Label>
              <Input
                id="serper-daily"
                type="number"
                value={rateLimits.serper.dailyRequests}
                onChange={(e) => updateRateLimit('serper', 'dailyRequests', parseInt(e.target.value) || 0)}
                min="1"
                max="1000"
              />
              <p className="text-sm text-muted-foreground">
                Maximum Serper API calls per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serper-results">Results Per Query</Label>
              <Input
                id="serper-results"
                type="number"
                value={rateLimits.serper.resultsPerQuery}
                onChange={(e) => updateRateLimit('serper', 'resultsPerQuery', parseInt(e.target.value) || 0)}
                min="1"
                max="50"
              />
              <p className="text-sm text-muted-foreground">
                Number of results to fetch per search
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            OpenAI API Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openai-daily">Daily Requests</Label>
              <Input
                id="openai-daily"
                type="number"
                value={rateLimits.openai.dailyRequests}
                onChange={(e) => updateRateLimit('openai', 'dailyRequests', parseInt(e.target.value) || 0)}
                min="1"
                max="500"
              />
              <p className="text-sm text-muted-foreground">
                Maximum OpenAI API calls per day
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai-tokens">Max Tokens Per Request</Label>
              <Input
                id="openai-tokens"
                type="number"
                value={rateLimits.openai.maxTokensPerRequest}
                onChange={(e) => updateRateLimit('openai', 'maxTokensPerRequest', parseInt(e.target.value) || 0)}
                min="100"
                max="2000"
              />
              <p className="text-sm text-muted-foreground">
                Token limit for each enrichment request
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                OpenAI is used only for missing data enrichment to minimize costs
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apollo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Apollo API Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apollo-credits">Max Credits Per Company</Label>
              <Input
                id="apollo-credits"
                type="number"
                value={rateLimits.apollo.maxCreditsPerCompany}
                onChange={(e) => updateRateLimit('apollo', 'maxCreditsPerCompany', parseInt(e.target.value) || 0)}
                min="1"
                max="20"
              />
              <p className="text-sm text-muted-foreground">
                Apollo credits to spend per company
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apollo-kdms">Max KDMs Per Company</Label>
              <Input
                id="apollo-kdms"
                type="number"
                value={rateLimits.apollo.maxKDMsPerCompany}
                onChange={(e) => updateRateLimit('apollo', 'maxKDMsPerCompany', parseInt(e.target.value) || 0)}
                min="1"
                max="10"
              />
              <p className="text-sm text-muted-foreground">
                Maximum key decision makers to find
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Credit Warnings</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when credits are running low
                </p>
              </div>
              <Switch
                checked={rateLimits.apollo.enableCreditWarnings}
                onCheckedChange={(checked) => updateRateLimit('apollo', 'enableCreditWarnings', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apollo-threshold">Credit Warning Threshold</Label>
              <Input
                id="apollo-threshold"
                type="number"
                value={rateLimits.apollo.creditThreshold}
                onChange={(e) => updateRateLimit('apollo', 'creditThreshold', parseInt(e.target.value) || 0)}
                min="5"
                max="100"
              />
              <p className="text-sm text-muted-foreground">
                Show warning when credits fall below this number
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-stop on Low Credits</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically stop mining when credits are low
                </p>
              </div>
              <Switch
                checked={rateLimits.apollo.autoStopOnLowCredits}
                onCheckedChange={(checked) => updateRateLimit('apollo', 'autoStopOnLowCredits', checked)}
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">
                Apollo is used primarily for KDM discovery to maximize credit value
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
