// Prototype types for the company discovery system
export interface Company {
  id: string;
  company_name: string;
  website?: string;
  industry?: string;
  employee_size?: string;
  founded?: string;
  description?: string;
  public_email?: string;
  public_phone?: string;
  linkedin_profile?: string;
  ai_score: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'enriched';
  source: 'apollo' | 'manual' | 'scraping';
  created_at: string;
}

export interface DecisionMaker {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  full_name: string; // computed field
  job_title: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  contact_type: 'ceo' | 'cto' | 'founder' | 'vp' | 'director' | 'manager';
  confidence_score: number;
  created_at: string;
}

export interface CompanyWithDecisionMakers extends Company {
  decision_makers: DecisionMaker[];
}

export interface Signal {
  id: string;
  company_id: string;
  signal_type: 'funding' | 'hiring' | 'expansion' | 'product_launch' | 'leadership_change';
  signal_title: string;
  signal_description: string;
  detected_at: string;
  priority: 'high' | 'medium' | 'low';
  signal_url?: string;
}

export interface OutreachActivity {
  id: string;
  decision_maker_id: string;
  type: 'email' | 'linkedin_connection' | 'linkedin_message' | 'phone_call';
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  subject?: string;
  message: string;
  sent_at: string;
  response_at?: string;
  response_content?: string;
}

export interface DashboardStats {
  total_companies: number;
  pending_review: number;
  approved_companies: number;
  decision_makers_found: number;
  signals_detected: number;
  outreach_sent: number;
  response_rate: number;
}