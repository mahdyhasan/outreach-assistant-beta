import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailCampaign } from '@/hooks/use-email-campaigns';

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: EmailCampaign | null;
  onSave: (campaign: Omit<EmailCampaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  loading?: boolean;
}

export const CampaignDialog = ({
  open,
  onOpenChange,
  campaign,
  onSave,
  loading = false
}: CampaignDialogProps) => {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    status: campaign?.status || 'draft' as const,
    schedule_time: campaign?.schedule_time || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onOpenChange(false);
    setFormData({ name: '', description: '', status: 'draft', schedule_time: null });
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setFormData({ name: '', description: '', status: 'draft', schedule_time: null });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Edit Campaign' : 'Create Email Campaign'}
          </DialogTitle>
          <DialogDescription>
            Set up a new email campaign for your leads
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Q1 Outreach Campaign"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and goals of this campaign"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'active' | 'paused' | 'completed') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
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

          <div className="space-y-2">
            <Label htmlFor="schedule_time">Schedule Time (Optional)</Label>
            <Input
              id="schedule_time"
              type="datetime-local"
              value={formData.schedule_time ? new Date(formData.schedule_time).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                schedule_time: e.target.value ? new Date(e.target.value).toISOString() : null 
              }))}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (campaign ? 'Update Campaign' : 'Create Campaign')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};