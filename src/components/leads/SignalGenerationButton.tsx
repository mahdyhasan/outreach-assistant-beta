import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompanyLead } from "@/hooks/use-supabase-leads";

interface SignalGenerationButtonProps {
  lead: CompanyLead;
  onSuccess?: () => void;
}

export function SignalGenerationButton({ lead, onSuccess }: SignalGenerationButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSignals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('signal-generation', {
        body: {
          company_id: lead.id,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Signal Generation Complete",
        description: data.message || `Generated ${data.signals_found || 0} signals`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error generating signals:', error);
      toast({
        title: "Signal Generation Failed",
        description: error.message || "Failed to generate signals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateSignals}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <TrendingUp className="mr-2 h-4 w-4" />
      {loading ? 'Generating...' : 'Find Signals'}
    </Button>
  );
}