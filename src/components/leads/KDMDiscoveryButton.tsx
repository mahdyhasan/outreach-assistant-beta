import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompanyLead } from "@/hooks/use-supabase-leads";

interface KDMDiscoveryButtonProps {
  lead: CompanyLead;
  onSuccess?: () => void;
}

export function KDMDiscoveryButton({ lead, onSuccess }: KDMDiscoveryButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDiscoverKDMs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('kdm-discovery', {
        body: {
          companyId: lead.id,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "KDM Discovery Complete",
        description: data.message || `Found ${data.kdms_found || 0} key decision makers`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error discovering KDMs:', error);
      toast({
        title: "KDM Discovery Failed",
        description: error.message || "Failed to discover key decision makers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDiscoverKDMs}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <Users className="mr-2 h-4 w-4" />
      {loading ? 'Discovering...' : 'Find KDMs'}
    </Button>
  );
}