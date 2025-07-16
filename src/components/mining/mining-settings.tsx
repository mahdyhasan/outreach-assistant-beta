import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, AlertTriangle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MiningSettingsProps {
  dailyLimit: number;
  onDailyLimitChange: (limit: number) => void;
}

export const MiningSettings = ({ dailyLimit, onDailyLimitChange }: MiningSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    dailyLimit: dailyLimit,
    timeZone: 'UTC',
    startTime: '09:00',
    enableWeekends: false,
    deduplicationStrength: 'high',
    enrichmentDepth: 'standard',
    qualityThreshold: [70],
    autoApproveHighScore: false,
    highScoreThreshold: 90,
    notifications: {
      dailyReport: true,
      errorAlerts: true,
      quotaWarnings: true
    }
  });

  const handleSave = () => {
    onDailyLimitChange(settings.dailyLimit);
    toast({
      title: "Settings Saved",
      description: "Your mining settings have been updated successfully",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotification = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Daily Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Scraping Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily Lead Limit</Label>
              <Input
                id="daily-limit"
                type="number"
                value={settings.dailyLimit}
                onChange={(e) => updateSetting('dailyLimit', parseInt(e.target.value) || 0)}
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
                value={settings.startTime}
                onChange={(e) => updateSetting('startTime', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                When to start daily scraping
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select value={settings.timeZone} onValueChange={(value) => updateSetting('timeZone', value)}>
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
              checked={settings.enableWeekends}
              onCheckedChange={(checked) => updateSetting('enableWeekends', checked)}
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
            <Label>Minimum Quality Score: {settings.qualityThreshold[0]}%</Label>
            <Slider
              value={settings.qualityThreshold}
              onValueChange={(value) => updateSetting('qualityThreshold', value)}
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
              value={settings.deduplicationStrength} 
              onValueChange={(value) => updateSetting('deduplicationStrength', value)}
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
            <Label htmlFor="enrichment">Enrichment Depth</Label>
            <Select 
              value={settings.enrichmentDepth} 
              onValueChange={(value) => updateSetting('enrichmentDepth', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - Company name, website, industry</SelectItem>
                <SelectItem value="standard">Standard - + Contact info, funding, tech stack</SelectItem>
                <SelectItem value="deep">Deep - + News, signals, job postings</SelectItem>
                <SelectItem value="comprehensive">Comprehensive - Everything available</SelectItem>
              </SelectContent>
            </Select>
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
              checked={settings.autoApproveHighScore}
              onCheckedChange={(checked) => updateSetting('autoApproveHighScore', checked)}
            />
          </div>

          {settings.autoApproveHighScore && (
            <div className="space-y-2">
              <Label htmlFor="auto-threshold">Auto-approval Threshold</Label>
              <Input
                id="auto-threshold"
                type="number"
                value={settings.highScoreThreshold}
                onChange={(e) => updateSetting('highScoreThreshold', parseInt(e.target.value) || 90)}
                min="70"
                max="100"
              />
              <p className="text-sm text-muted-foreground">
                Leads with scores above this will be auto-approved
              </p>
            </div>
          )}

          {settings.autoApproveHighScore && (
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
              checked={settings.notifications.dailyReport}
              onCheckedChange={(checked) => updateNotification('dailyReport', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Error Alerts</Label>
              <p className="text-sm text-muted-foreground">Notify when scraping fails</p>
            </div>
            <Switch
              checked={settings.notifications.errorAlerts}
              onCheckedChange={(checked) => updateNotification('errorAlerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Quota Warnings</Label>
              <p className="text-sm text-muted-foreground">Alert when approaching daily limit</p>
            </div>
            <Switch
              checked={settings.notifications.quotaWarnings}
              onCheckedChange={(checked) => updateNotification('quotaWarnings', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full flex items-center gap-2" size="lg">
        <Save className="h-4 w-4" />
        Save Mining Settings
      </Button>
    </div>
  );
};