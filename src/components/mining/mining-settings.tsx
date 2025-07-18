import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, AlertTriangle, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MiningSettings as MiningSettingsType } from '@/hooks/use-mining-settings';
import { RateLimitSettings } from './rate-limit-settings';

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

interface MiningSettingsProps {
  settings: MiningSettingsType | null;
  onSettingsUpdate: (settings: Partial<MiningSettingsType>) => Promise<void>;
  rateLimits?: RateLimits;
  onRateLimitsChange?: (rateLimits: RateLimits) => void;
}

export const MiningSettings = ({ settings, onSettingsUpdate, rateLimits, onRateLimitsChange }: MiningSettingsProps) => {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState({
    daily_limit: 100,
    time_zone: 'UTC',
    start_time: '09:00',
    enable_weekends: false,
    deduplication_strength: 'high',
    enrichment_depth: 'standard',
    quality_threshold: 70,
    auto_approve_high_score: false,
    high_score_threshold: 90,
    daily_report_enabled: true,
    error_alerts_enabled: true,
    quota_warnings_enabled: true,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        daily_limit: settings.daily_limit,
        time_zone: settings.time_zone,
        start_time: settings.start_time,
        enable_weekends: settings.enable_weekends,
        deduplication_strength: settings.deduplication_strength,
        enrichment_depth: settings.enrichment_depth,
        quality_threshold: settings.quality_threshold,
        auto_approve_high_score: settings.auto_approve_high_score,
        high_score_threshold: settings.high_score_threshold,
        daily_report_enabled: settings.daily_report_enabled,
        error_alerts_enabled: settings.error_alerts_enabled,
        quota_warnings_enabled: settings.quota_warnings_enabled,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await onSettingsUpdate(localSettings);
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general">General Settings</TabsTrigger>
        <TabsTrigger value="rate-limits">API Rate Limits</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        {/* Daily Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Daily Mining Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily Lead Limit</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  value={localSettings.daily_limit}
                  onChange={(e) => updateSetting('daily_limit', parseInt(e.target.value) || 0)}
                  min="0"
                  max="1000"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum leads to scrape per day
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={localSettings.start_time}
                  onChange={(e) => updateSetting('start_time', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  When to start daily scraping
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Select value={localSettings.time_zone} onValueChange={(value) => updateSetting('time_zone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="GMT">GMT (London)</SelectItem>
                  <SelectItem value="AEST">AEST (Sydney)</SelectItem>
                  <SelectItem value="CST">CST (Singapore)</SelectItem>
                  <SelectItem value="CET">CET (Europe)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekends">Include Weekends</Label>
                <p className="text-sm text-muted-foreground">
                  Run scraping on weekends
                </p>
              </div>
              <Switch
                id="weekends"
                checked={localSettings.enable_weekends}
                onCheckedChange={(checked) => updateSetting('enable_weekends', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quality Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Minimum Quality Score: {localSettings.quality_threshold}%</Label>
              <Slider
                value={[localSettings.quality_threshold]}
                onValueChange={(value) => updateSetting('quality_threshold', value[0])}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Only leads above this score will be included
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dedup">Deduplication Strength</Label>
              <Select 
                value={localSettings.deduplication_strength} 
                onValueChange={(value) => updateSetting('deduplication_strength', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict - Exact matches only</SelectItem>
                  <SelectItem value="high">High - Very similar companies</SelectItem>
                  <SelectItem value="medium">Medium - Moderately similar</SelectItem>
                  <SelectItem value="low">Low - Allow more variations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrichment">Data Collection Strategy</Label>
              <Select 
                value={localSettings.enrichment_depth} 
                onValueChange={(value) => updateSetting('enrichment_depth', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - Serper only</SelectItem>
                  <SelectItem value="standard">Standard - Serper + OpenAI for gaps</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive - All sources + Apollo KDMs</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Higher levels use more API credits but provide richer data
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auto-Approval */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-Approval Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-approve">Auto-approve High Scoring Leads</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve leads above threshold
                </p>
              </div>
              <Switch
                id="auto-approve"
                checked={localSettings.auto_approve_high_score}
                onCheckedChange={(checked) => updateSetting('auto_approve_high_score', checked)}
              />
            </div>

            {localSettings.auto_approve_high_score && (
              <div className="space-y-2">
                <Label htmlFor="auto-threshold">Auto-approval Threshold</Label>
                <Input
                  id="auto-threshold"
                  type="number"
                  value={localSettings.high_score_threshold}
                  onChange={(e) => updateSetting('high_score_threshold', parseInt(e.target.value) || 90)}
                  min="70"
                  max="100"
                />
                <p className="text-sm text-muted-foreground">
                  Leads with scores above this will be auto-approved
                </p>
              </div>
            )}

            {localSettings.auto_approve_high_score && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">
                    Auto-approved leads will bypass review queue
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Daily Reports</Label>
                <p className="text-sm text-muted-foreground">Get daily mining summaries</p>
              </div>
              <Switch
                checked={localSettings.daily_report_enabled}
                onCheckedChange={(checked) => updateSetting('daily_report_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Error Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when scraping fails</p>
              </div>
              <Switch
                checked={localSettings.error_alerts_enabled}
                onCheckedChange={(checked) => updateSetting('error_alerts_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Quota Warnings</Label>
                <p className="text-sm text-muted-foreground">Alert when approaching daily limit</p>
              </div>
              <Switch
                checked={localSettings.quota_warnings_enabled}
                onCheckedChange={(checked) => updateSetting('quota_warnings_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rate-limits" className="space-y-6">
        {rateLimits && onRateLimitsChange && (
          <RateLimitSettings 
            rateLimits={rateLimits} 
            onRateLimitsChange={onRateLimitsChange}
          />
        )}
      </TabsContent>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full flex items-center gap-2" size="lg">
        <Save className="h-4 w-4" />
        Save Mining Settings
      </Button>
    </Tabs>
  );
};
