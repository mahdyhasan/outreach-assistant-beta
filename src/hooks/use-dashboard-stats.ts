import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalLeads: number;
  highQualityLeads: number;
  activeCampaigns: number;
  responseRate: string;
  leadChanges: {
    totalLeads: string;
    highQualityLeads: string;
    activeCampaigns: string;
    responseRate: string;
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Get total leads
      const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      // Get high quality leads (score >= 70)
      const { count: highQualityLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .gte("final_score", 70);

      // Get active campaigns
      const { count: activeCampaigns } = await supabase
        .from("email_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Calculate response rate from outreach activities
      const { data: outreachData } = await supabase
        .from("outreach_activities")
        .select("response_at")
        .not("response_at", "is", null);

      const { count: totalOutreach } = await supabase
        .from("outreach_activities")
        .select("*", { count: "exact", head: true });

      const responseRate = totalOutreach && outreachData
        ? ((outreachData.length / totalOutreach) * 100).toFixed(1)
        : "0.0";

      const highQualityPercentage = totalLeads && highQualityLeads
        ? ((highQualityLeads / totalLeads) * 100).toFixed(0)
        : "0";

      return {
        totalLeads: totalLeads || 0,
        highQualityLeads: highQualityLeads || 0,
        activeCampaigns: activeCampaigns || 0,
        responseRate: `${responseRate}%`,
        leadChanges: {
          totalLeads: "+180 from last month",
          highQualityLeads: `${highQualityPercentage}% of total leads`,
          activeCampaigns: "Email campaigns",
          responseRate: "+2.1% from last week",
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}