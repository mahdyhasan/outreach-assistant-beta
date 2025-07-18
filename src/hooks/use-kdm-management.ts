import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface KDM {
  id: string;
  first_name: string;
  last_name: string;
  designation: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_profile?: string;
  contact_type: string;
  confidence_score?: number;
  email_status?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  companies?: {
    company_name: string;
    website?: string;
    industry?: string;
    location?: string;
  };
}

export function useKDMManagement() {
  const [kdms, setKDMs] = useState<KDM[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchKDMs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("decision_makers")
        .select(`
          *,
          companies (
            company_name,
            website,
            industry,
            location
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setKDMs(data || []);
    } catch (error: any) {
      console.error("Error fetching KDMs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch KDMs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKDMs();
  }, []);

  const refetch = () => {
    fetchKDMs();
  };

  return {
    kdms,
    loading,
    refetch,
  };
}