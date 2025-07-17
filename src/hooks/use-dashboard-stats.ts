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

      // Calculate qualification rate from companies (outreach_activities doesn't exist)
      const { count: qualifiedCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .gte("ai_score", 70);

      const totalOutreach = totalCompanies || 0;

      const responseRate = totalOutreach && qualifiedCompanies
        ? ((qualifiedCompanies / totalOutreach) * 100).toFixed(1)
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
          totalCompanies: `${totalCompanies || 0} total companies`,
          highQualityCompanies: `${highQualityPercentage}% of total companies`,
          activeSignals: `${activeSignals || 0} unprocessed signals`,
          responseRate: `${responseRate}% qualification rate`,
        },
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}