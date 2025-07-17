import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { CompanyLead } from "@/hooks/use-supabase-leads";
import { useSupabaseLeads } from "@/hooks/use-supabase-leads";
import { Loader2, TrendingUp } from "lucide-react";

interface ScoreAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CompanyLead | null;
  onSuccess: () => void;
}

export function ScoreAdjustmentDialog({ open, onOpenChange, lead, onSuccess }: ScoreAdjustmentDialogProps) {
  const { updateCompany } = useSupabaseLeads();
  const [loading, setLoading] = useState(false);
  const [newScore, setNewScore] = useState(0);
  const [reason, setReason] = useState('');

  // Update score when lead changes
  useEffect(() => {
    if (lead) {
      setNewScore(lead.ai_score || 0);
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      await updateCompany(lead.id, {
        ai_score: newScore,
        // You might want to store the adjustment reason in enrichment_data
        enrichment_data: {
          ...lead.enrichment_data,
          score_adjustment: {
            original_score: lead.ai_score,
            new_score: newScore,
            reason: reason,
            adjusted_at: new Date().toISOString()
          }
        }
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Adjust Lead Score
          </DialogTitle>
          <DialogDescription>
            Manually adjust the AI score for {lead.company_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Current Score</Label>
              <div className={`text-2xl font-bold ${getScoreColor(lead.ai_score)}`}>
                {lead.ai_score}%
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">New Score</Label>
              <div className="px-2">
                <Slider
                  value={[newScore]}
                  onValueChange={(value) => setNewScore(value[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className={`font-semibold ${getScoreColor(newScore)}`}>
                    {newScore}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're adjusting the score..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newScore === lead.ai_score}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Score
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}