import { useState, useEffect } from 'react';
import { Lead, LeadFilters } from '@/types/lead';

// Mock data for prototype
const mockLeads: Lead[] = [
  {
    id: '1',
    companyName: 'TechCorp Solutions',
    contactName: 'John Smith',
    email: 'j.smith@techcorp.com',
    linkedinUrl: 'https://linkedin.com/in/johnsmith',
    phone: '+1-555-0123',
    jobTitle: 'VP of Sales',
    companySize: '50-200',
    industry: 'Software',
    location: 'San Francisco, CA',
    website: 'https://techcorp.com',
    aiScore: 85,
    finalScore: 85,
    scoreReason: ['High growth company', 'Recent funding round', 'Active hiring'],
    status: 'new',
    priority: 'immediate',
    enrichmentData: {
      fundingRounds: ['Series B - $15M'],
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      recentNews: ['Announced new product line', 'Expanded to European market'],
      companyGrowthRate: '150% YoY',
      jobPostings: 12
    },
    outreachHistory: [],
    followupCount: 0,
    source: 'linkedin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    companyName: 'StartupXYZ',
    contactName: 'Sarah Johnson',
    email: 's.johnson@startupxyz.com',
    jobTitle: 'Head of Marketing',
    companySize: '10-50',
    industry: 'Marketing',
    location: 'Austin, TX',
    aiScore: 92,
    humanScore: 65,
    finalScore: 65,
    scoreReason: ['Early stage startup', 'Limited budget', 'High potential'],
    status: 'in_progress',
    priority: 'queue',
    enrichmentData: {
      fundingRounds: ['Seed - $2M'],
      recentNews: ['Featured in TechCrunch'],
      companyGrowthRate: '200% YoY',
      jobPostings: 3
    },
    outreachHistory: [
      {
        id: 'out1',
        type: 'email',
        status: 'sent',
        subject: 'Partnership Opportunity',
        message: 'Hi Sarah, I noticed your company...',
        sentAt: new Date('2024-01-10')
      }
    ],
    followupCount: 1,
    lastContactDate: new Date('2024-01-10'),
    nextFollowupDate: new Date('2024-01-17'),
    humanFeedback: {
      originalScore: 92,
      correctedScore: 65,
      reason: 'Company too early stage, limited budget despite growth',
      correctedBy: 'Sales Manager',
      correctedAt: new Date('2024-01-12')
    },
    source: 'clay',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-12')
  },
  {
    id: '3',
    companyName: 'Enterprise Corp',
    contactName: 'Michael Brown',
    email: 'm.brown@enterprise.com',
    jobTitle: 'CTO',
    companySize: '1000+',
    industry: 'Finance',
    location: 'New York, NY',
    aiScore: 45,
    finalScore: 45,
    scoreReason: ['Large company', 'Slow decision making', 'Conservative approach'],
    status: 'nurture',
    priority: 'nurture',
    enrichmentData: {
      techStack: ['Java', '.NET', 'Oracle'],
      recentNews: ['Quarterly earnings beat expectations'],
      companyGrowthRate: '5% YoY',
      jobPostings: 25
    },
    outreachHistory: [],
    followupCount: 0,
    source: 'apollo',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  }
];

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({});

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