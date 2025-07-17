import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Users, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmailCampaign } from '@/hooks/use-email-campaigns';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface DecisionMaker {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  designation: string;
  company_id: string;
  companies: {
    company_name: string;
  };
}

interface CampaignStep {
  template_id: string;
  delay_days: number;
  step_order: number;
}

interface CampaignSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: EmailCampaign | null;
  onSave: (campaignData: any) => Promise<void>;
  loading?: boolean;
}

export const CampaignSetupDialog = ({
  open,
  onOpenChange,
  campaign,
  onSave,
  loading = false
}: CampaignSetupDialogProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [decisionMakers, setDecisionMakers] = useState<DecisionMaker[]>([]);
  const [selectedKDMs, setSelectedKDMs] = useState<string[]>([]);
  const [campaignSteps, setCampaignSteps] = useState<CampaignStep[]>([
    { template_id: '', delay_days: 0, step_order: 1 }
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft'
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchDecisionMakers();
    }
  }, [open]);

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        status: campaign.status
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'draft'
      });
      setCampaignSteps([{ template_id: '', delay_days: 0, step_order: 1 }]);
      setSelectedKDMs([]);
    }
  }, [campaign]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    }
  };

  const fetchDecisionMakers = async () => {
    try {
      const { data, error } = await supabase
        .from('decision_makers')
        .select(`
          id,
          first_name,
          last_name,
          email,
          designation,
          company_id,
          companies (
            company_name
          )
        `)
        .not('email', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDecisionMakers(data || []);
    } catch (error) {
      console.error('Error fetching decision makers:', error);
      toast({
        title: "Error",
        description: "Failed to load decision makers",
        variant: "destructive"
      });
    }
  };

  const addCampaignStep = () => {
    setCampaignSteps([
      ...campaignSteps,
      { template_id: '', delay_days: 1, step_order: campaignSteps.length + 1 }
    ]);
  };

  const removeCampaignStep = (index: number) => {
    if (campaignSteps.length > 1) {
      setCampaignSteps(campaignSteps.filter((_, i) => i !== index));
    }
  };

  const updateCampaignStep = (index: number, field: keyof CampaignStep, value: any) => {
    const updated = [...campaignSteps];
    updated[index] = { ...updated[index], [field]: value };
    setCampaignSteps(updated);
  };

  const handleKDMSelection = (kdmId: string, checked: boolean) => {
    if (checked) {
      setSelectedKDMs([...selectedKDMs, kdmId]);
    } else {
      setSelectedKDMs(selectedKDMs.filter(id => id !== kdmId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedKDMs.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive"
      });
      return;
    }

    if (campaignSteps.some(step => !step.template_id)) {
      toast({
        title: "Error",
        description: "Please select templates for all campaign steps",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSave({
        ...formData,
        steps: campaignSteps,
        recipients: selectedKDMs
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Campaign Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter campaign description"
              rows={3}
            />
          </div>

          {/* Campaign Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Sequence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignSteps.map((step, index) => (
                <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Email Template</Label>
                    <Select
                      value={step.template_id}
                      onValueChange={(value) => updateCampaignStep(index, 'template_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} - {template.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Delay (days)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={step.delay_days}
                      onChange={(e) => updateCampaignStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCampaignStep(index)}
                    disabled={campaignSteps.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCampaignStep}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Email Step
              </Button>
            </CardContent>
          </Card>

          {/* Recipients Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients ({selectedKDMs.length} selected)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {decisionMakers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No decision makers found. Please discover KDMs from your leads first.
                  </p>
                ) : (
                  decisionMakers.map((kdm) => (
                    <div key={kdm.id} className="flex items-center space-x-3 p-2 border rounded">
                      <Checkbox
                        checked={selectedKDMs.includes(kdm.id)}
                        onCheckedChange={(checked) => handleKDMSelection(kdm.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {kdm.first_name} {kdm.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {kdm.email} • {kdm.designation} • {kdm.companies?.company_name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};