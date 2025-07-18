import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ApolloUsage {
  contact_reveals_used: number;
  contact_reveals_limit: number;
  people_searches_used: number;
  people_searches_limit: number;
  percentage_used: number;
  credits_remaining: number;
}

export function useApolloUsage() {
  const [usage, setUsage] = useState<ApolloUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUsage = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('apollo-usage-check', {
        body: {},
      });

      if (error) {
        throw error;
      }

      setUsage(data);
      
      // Show warning if usage is high
      if (data.percentage_used > 80) {
        toast({
          title: "Apollo Credits Running Low",
          description: `You've used ${data.percentage_used}% of your Apollo credits this month (${data.credits_remaining} remaining)`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching Apollo usage:', error);
      toast({
        title: "Usage Check Failed",
        description: "Could not fetch Apollo API usage data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  return {
    usage,
    loading,
    refetch: fetchUsage,
  };
}