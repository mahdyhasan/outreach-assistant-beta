import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalCompanies: number;
  highQualityCompanies: number;
  activeSignals: number;
  responseRate: string;
  companyChanges: {
    totalCompanies: string;
    highQualityCompanies: string;
    activeSignals: string;
    responseRate: string;
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Get total companies
      const { count: totalCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      // Get high quality companies (score >= 70)
      const { count: highQualityCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .gte("ai_score", 70);

      // Get active signals
      const { count: activeSignals } = await supabase
        .from("signals")
        .select("*", { count: "exact", head: true })
        .eq("processed", false);

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

      const highQualityPercentage = totalCompanies && highQualityCompanies
        ? ((highQualityCompanies / totalCompanies) * 100).toFixed(0)
        : "0";

      return {
        totalCompanies: totalCompanies || 0,
        highQualityCompanies: highQualityCompanies || 0,
        activeSignals: activeSignals || 0,
        responseRate: `${responseRate}%`,
        companyChanges: {
          totalCompanies: "+180 from last month",
          highQualityCompanies: `${highQualityPercentage}% of total companies`,
          activeSignals: "Active signals",
          responseRate: "+2.1% from last week",
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}