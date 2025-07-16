import { useState } from 'react';
import { Lead } from '@/types/lead';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Brain, User, AlertTriangle } from 'lucide-react';

interface LeadScoreDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScoreUpdate: (leadId: string, humanScore: number, reason: string) => void;
}

export function LeadScoreDialog({ lead, open, onOpenChange, onScoreUpdate }: LeadScoreDialogProps) {
  const [humanScore, setHumanScore] = useState<number[]>([lead?.finalScore || 50]);
  const [reason, setReason] = useState('');

  if (!lead) return null;

  const handleSubmit = () => {
    if (reason.trim()) {
      onScoreUpdate(lead.id, humanScore[0], reason.trim());
      onOpenChange(false);
      setReason('');
    }
  };

  const getPriorityFromScore = (score: number) => {
    if (score >= 70) return { label: 'Immediate Outreach', color: 'bg-red-500' };
    if (score >= 40) return { label: 'Queue for Later', color: 'bg-yellow-500' };
    return { label: 'Nurture Campaign', color: 'bg-blue-500' };
  };

  const currentPriority = getPriorityFromScore(humanScore[0]);
  const hasChanged = humanScore[0] !== lead.finalScore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Adjust Lead Score: {lead.companyName}
          </DialogTitle>
          <DialogDescription>
            Correct the AI score to help the system learn better lead qualification patterns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Score
              </Label>
              <div className="text-2xl font-bold text-muted-foreground">
                {lead.aiScore}%
              </div>
              <div className="text-sm text-muted-foreground">
                System generated
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {lead.humanScore ? 'Your Score' : 'New Score'}
              </Label>
              <div className="text-2xl font-bold">
                {humanScore[0]}%
              </div>
              <Badge className={currentPriority.color}>
                {currentPriority.label}
              </Badge>
            </div>
          </div>

          {/* Previous Human Feedback */}
          {lead.humanFeedback && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Previous Correction</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Original:</strong> {lead.humanFeedback.originalScore}% → <strong>Corrected:</strong> {lead.humanFeedback.correctedScore}%</p>
                <p><strong>Reason:</strong> {lead.humanFeedback.reason}</p>
                <p><strong>By:</strong> {lead.humanFeedback.correctedBy} on {lead.humanFeedback.correctedAt.toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* AI Scoring Reasons */}
          <div className="space-y-2">
            <Label>AI Scoring Factors</Label>
            <div className="flex flex-wrap gap-2">
              {lead.scoreReason.map((reason, index) => (
                <Badge key={index} variant="outline">
                  {reason}
                </Badge>
              ))}
            </div>
          </div>

          {/* Human Score Adjustment */}
          <div className="space-y-4">
            <Label>Adjust Score (0-100)</Label>
            <div className="px-4">
              <Slider
                value={humanScore}
                onValueChange={setHumanScore}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0% (Poor fit)</span>
              <span>50% (Average)</span>
              <span>100% (Perfect fit)</span>
            </div>
          </div>

          {/* Reason for Change */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you're adjusting the score (this helps the AI learn)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
          </div>

          {/* Company Context */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Company:</strong> {lead.companyName}<br />
              <strong>Contact:</strong> {lead.contactName} - {lead.jobTitle}<br />
              <strong>Size:</strong> {lead.companySize}<br />
              <strong>Industry:</strong> {lead.industry}
            </div>
            <div>
              <strong>Location:</strong> {lead.location}<br />
              <strong>Source:</strong> {lead.source}<br />
              <strong>Growth:</strong> {lead.enrichmentData.companyGrowthRate || 'N/A'}<br />
              <strong>Job Postings:</strong> {lead.enrichmentData.jobPostings || 0}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || !hasChanged}
            >
              Save Correction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}