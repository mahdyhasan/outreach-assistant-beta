import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompanyLead } from "@/hooks/use-supabase-leads";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KDMDiscoveryButtonProps {
  lead: CompanyLead;
  onSuccess?: () => void;
}

export function KDMDiscoveryButton({ lead, onSuccess }: KDMDiscoveryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [maxCredits, setMaxCredits] = useState(5);
  const { toast } = useToast();

  const handleDiscoverKDMs = async (creditsToUse: number = maxCredits) => {
    setLoading(true);
    setShowCreditDialog(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('kdm-discovery', {
        body: {
          companyId: lead.id,
          maxCredits: creditsToUse,
        },
      });

      if (error) {
        throw error;
      }

      const creditsUsed = data.credits_used || 0;
      const creditsRemaining = data.credits_remaining || 0;
      
      toast({
        title: "KDM Discovery Complete",
        description: `${data.message || `Found ${data.kdms_saved || 0} verified KDMs`}. Used ${creditsUsed} Apollo credits, ${creditsRemaining} remaining this month.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error discovering KDMs:', error);
      
      // Handle insufficient credits error
      if (error.message?.includes('Insufficient Apollo credits')) {
        toast({
          title: "Insufficient Apollo Credits",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "KDM Discovery Failed",
          description: error.message || "Failed to discover key decision makers",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreditDialog = () => {
    setShowCreditDialog(true);
  };

  const confirmDiscovery = () => {
    handleDiscoverKDMs(maxCredits);
  };

  return (
    <>
      <Button
        onClick={openCreditDialog}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Users className="mr-2 h-4 w-4" />
        {loading ? 'Discovering...' : 'Find KDMs'}
      </Button>

      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Apollo Credit Usage
            </DialogTitle>
            <DialogDescription>
              KDM discovery with verified emails requires Apollo credits. Each verified contact costs 1 credit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxCredits">Maximum Credits to Use</Label>
              <Input
                id="maxCredits"
                type="number"
                min="1"
                max="20"
                value={maxCredits}
                onChange={(e) => setMaxCredits(parseInt(e.target.value) || 5)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Recommended: 5-10 credits per company for best results
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDiscovery} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Use {maxCredits} Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}