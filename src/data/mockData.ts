// Mock data for the prototype
import { Company, DecisionMaker, CompanyWithDecisionMakers, Signal, OutreachActivity, DashboardStats } from '../types/prototype';

export const mockCompanies: Company[] = [
  {
    id: '1',
    company_name: 'TechCorp Innovation',
    website: 'https://techcorp.com',
    industry: 'Software Development',
    employee_size: '50-200',
    founded: '2020',
    description: 'AI-powered software solutions for enterprises',
    public_email: 'info@techcorp.com',
    linkedin_profile: 'https://linkedin.com/company/techcorp',
    ai_score: 85,
    status: 'approved',
    source: 'apollo',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    company_name: 'StartupFlow',
    website: 'https://startupflow.io',
    industry: 'Fintech',
    employee_size: '10-50',
    founded: '2023',
    description: 'Financial workflow automation for startups',
    public_email: 'hello@startupflow.io',
    linkedin_profile: 'https://linkedin.com/company/startupflow',
    ai_score: 78,
    status: 'pending_review',
    source: 'manual',
    created_at: '2024-01-16T14:30:00Z'
  },
  {
    id: '3',
    company_name: 'DataInsights Pro',
    website: 'https://datainsights.pro',
    industry: 'Data Analytics',
    employee_size: '200-500',
    founded: '2019',
    description: 'Advanced analytics and business intelligence platform',
    public_email: 'contact@datainsights.pro',
    linkedin_profile: 'https://linkedin.com/company/datainsights',
    ai_score: 92,
    status: 'enriched',
    source: 'scraping',
    created_at: '2024-01-17T09:15:00Z'
  }
];

export const mockDecisionMakers: DecisionMaker[] = [
  {
    id: '1',
    company_id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    full_name: 'Sarah Johnson',
    job_title: 'Chief Technology Officer',
    email: 'sarah.johnson@techcorp.com',
    linkedin_profile: 'https://linkedin.com/in/sarahjohnson',
    contact_type: 'cto',
    confidence_score: 95,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    company_id: '1',
    first_name: 'Michael',
    last_name: 'Chen',
    full_name: 'Michael Chen',
    job_title: 'CEO & Founder',
    email: 'michael@techcorp.com',
    linkedin_profile: 'https://linkedin.com/in/michaelchen',
    contact_type: 'ceo',
    confidence_score: 98,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    company_id: '2',
    first_name: 'Emma',
    last_name: 'Williams',
    full_name: 'Emma Williams',
    job_title: 'Founder & CEO',
    email: 'emma@startupflow.io',
    linkedin_profile: 'https://linkedin.com/in/emmawilliams',
    contact_type: 'founder',
    confidence_score: 97,
    created_at: '2024-01-16T15:00:00Z'
  },
  {
    id: '4',
    company_id: '3',
    first_name: 'David',
    last_name: 'Rodriguez',
    full_name: 'David Rodriguez',
    job_title: 'VP of Engineering',
    email: 'david.rodriguez@datainsights.pro',
    linkedin_profile: 'https://linkedin.com/in/davidrodriguez',
    contact_type: 'vp',
    confidence_score: 89,
    created_at: '2024-01-17T09:45:00Z'
  }
];

export const mockSignals: Signal[] = [
  {
    id: '1',
    company_id: '1',
    signal_type: 'funding',
    signal_title: 'TechCorp raises $5M Series A',
    signal_description: 'TechCorp Innovation has successfully raised $5M in Series A funding led by Venture Capital Partners.',
    detected_at: '2024-01-18T08:00:00Z',
    priority: 'high',
    signal_url: 'https://techcrunch.com/techcorp-funding'
  },
  {
    id: '2',
    company_id: '2',
    signal_type: 'hiring',
    signal_title: 'StartupFlow hiring 10+ engineers',
    signal_description: 'StartupFlow is rapidly expanding their engineering team with 10+ open positions.',
    detected_at: '2024-01-17T16:00:00Z',
    priority: 'medium',
    signal_url: 'https://startupflow.io/careers'
  },
  {
    id: '3',
    company_id: '3',
    signal_type: 'product_launch',
    signal_title: 'DataInsights launches AI Analytics Suite',
    signal_description: 'DataInsights Pro announces the launch of their new AI-powered analytics suite.',
    detected_at: '2024-01-16T12:00:00Z',
    priority: 'high',
    signal_url: 'https://datainsights.pro/blog/ai-suite-launch'
  }
];

export const mockOutreachActivities: OutreachActivity[] = [
  {
    id: '1',
    decision_maker_id: '1',
    type: 'email',
    status: 'sent',
    subject: 'Partnership Opportunity with TechCorp',
    message: 'Hi Sarah, I saw TechCorp\'s recent Series A announcement. Congratulations! I\'d love to discuss how our solutions could help...',
    sent_at: '2024-01-18T10:00:00Z'
  },
  {
    id: '2',
    decision_maker_id: '2',
    type: 'linkedin_connection',
    status: 'delivered',
    message: 'Hi Michael, Congratulations on the recent funding! I\'d love to connect and explore potential synergies.',
    sent_at: '2024-01-18T11:00:00Z'
  },
  {
    id: '3',
    decision_maker_id: '3',
    type: 'email',
    status: 'opened',
    subject: 'Scaling Solutions for StartupFlow',
    message: 'Hi Emma, I noticed StartupFlow is hiring aggressively. Our platform could help streamline your growth...',
    sent_at: '2024-01-17T14:00:00Z'
  }
];

export const mockDashboardStats: DashboardStats = {
  total_companies: 156,
  pending_review: 23,
  approved_companies: 89,
  decision_makers_found: 267,
  signals_detected: 45,
  outreach_sent: 123,
  response_rate: 18.7
};

export const mockCompaniesWithDecisionMakers: CompanyWithDecisionMakers[] = mockCompanies.map(company => ({
  ...company,
  decision_makers: mockDecisionMakers.filter(dm => dm.company_id === company.id)
}));