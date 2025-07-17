import { useState, useEffect } from 'react';
import { Lead, LeadFilters } from '@/types/lead';
import { supabase } from '@/integrations/supabase/client';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          decision_makers (*)
        `);

      if (error) throw error;

      // Transform database data to Lead format
      const transformedLeads: Lead[] = companies?.flatMap(company => 
        company.decision_makers?.map(dm => ({
          id: `${company.id}-${dm.id}`,
          companyName: company.company_name,
          contactName: `${dm.first_name} ${dm.last_name}`,
          email: dm.email || '',
          linkedinUrl: dm.linkedin_profile || '',
          phone: dm.phone || '',
          jobTitle: dm.designation,
          companySize: company.employee_size || '',
          industry: company.industry || '',
          website: company.website || '',
          location: company.location || '',
          aiScore: company.ai_score || 0,
          humanScore: 0, // Default value
          finalScore: company.ai_score || 0,
          priority: company.ai_score > 70 ? 'immediate' : company.ai_score > 40 ? 'queue' : 'nurture',
          status: company.status === 'approved' ? 'new' : company.status === 'enriched' ? 'qualified' : 'new',
          scoreReason: [],
          enrichmentData: (company.enrichment_data as Lead['enrichmentData']) || {},
          outreachHistory: [],
          followupCount: 0,
          responseTag: undefined,
          source: (company.source as Lead['source']) || 'manual',
          createdAt: new Date(company.created_at),
          updatedAt: new Date(company.updated_at)
        })) || []
      ) || [];

      setLeads(transformedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (
        !lead.companyName.toLowerCase().includes(searchTerm) &&
        !lead.contactName.toLowerCase().includes(searchTerm) &&
        !lead.email.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }
    }

    // Status filter
    if (filters.status?.length && !filters.status.includes(lead.status)) {
      return false;
    }

    // Priority filter
    if (filters.priority?.length && !filters.priority.includes(lead.priority)) {
      return false;
    }

    // Score range filter
    if (filters.scoreRange) {
      const [min, max] = filters.scoreRange;
      if (lead.finalScore < min || lead.finalScore > max) {
        return false;
      }
    }

    // Source filter
    if (filters.source?.length && !filters.source.includes(lead.source)) {
      return false;
    }

    return true;
  });

  const updateLeadScore = (leadId: string, humanScore: number, reason: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const humanFeedback = {
          originalScore: lead.aiScore,
          correctedScore: humanScore,
          reason,
          correctedBy: 'Current User', // In real app, get from auth
          correctedAt: new Date()
        };

        // Determine new priority based on corrected score
        let priority: Lead['priority'];
        if (humanScore >= 70) priority = 'immediate';
        else if (humanScore >= 40) priority = 'queue';
        else priority = 'nurture';

        return {
          ...lead,
          humanScore,
          finalScore: humanScore,
          priority,
          humanFeedback,
          updatedAt: new Date()
        };
      }
      return lead;
    }));
  };

  const updateLeadStatus = (leadId: string, status: Lead['status'], responseTag?: Lead['responseTag']) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          status,
          responseTag,
          updatedAt: new Date()
        };
      }
      return lead;
    }));
  };

  return {
    leads: filteredLeads,
    allLeads: leads,
    loading,
    filters,
    setFilters,
    updateLeadScore,
    updateLeadStatus
  };
};