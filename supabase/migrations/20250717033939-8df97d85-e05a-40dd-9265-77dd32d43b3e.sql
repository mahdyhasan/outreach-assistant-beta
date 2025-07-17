-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS public.signals CASCADE;
DROP TABLE IF EXISTS public.decision_makers CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.mining_settings CASCADE;

-- Create Users table for basic user management (no auth for now)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Main Entities
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  employee_size TEXT,
  employee_size_numeric INTEGER, -- For better filtering/sorting
  founded TEXT,
  founded_year INTEGER, -- For better filtering/sorting
  description TEXT,
  public_email TEXT,
  public_phone TEXT,
  linkedin_profile TEXT,
  location TEXT,
  country TEXT,
  enrichment_data JSONB DEFAULT '{}',
  ai_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'enriched')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'apollo', 'linkedin', 'scraping', 'imported')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_profile TEXT,
  facebook_profile TEXT,
  instagram_profile TEXT,
  contact_type TEXT DEFAULT 'kdm' CHECK (contact_type IN ('kdm', 'influencer', 'decision_maker')),
  confidence_score INTEGER DEFAULT 0,
  email_status TEXT DEFAULT 'not_contacted' CHECK (email_status IN ('not_contacted', 'queued', 'sent', 'opened', 'replied', 'bounced')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lead Mining Module
CREATE TABLE public.mining_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  companies_found INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.mining_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES mining_sessions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  matched_criteria JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Module
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')),
  schedule_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.email_campaign_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  step_order INTEGER,
  template_id UUID REFERENCES email_templates(id),
  delay_days INTEGER DEFAULT 1,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'linkedin', 'call')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_maker_id UUID NOT NULL REFERENCES decision_makers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES email_templates(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'opened', 'replied')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_time TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  last_opened TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Export Module
CREATE TABLE public.exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'json', 'xlsx')),
  filters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.export_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_id UUID NOT NULL REFERENCES exports(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  decision_maker_id UUID REFERENCES decision_makers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Settings Module - Centralized user settings
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- API Keys (replacing localStorage)
  api_keys JSONB DEFAULT '{}',
  -- Email Settings
  email_signature TEXT,
  email_prompt TEXT,
  daily_send_limit INTEGER DEFAULT 500,
  tracking_duration INTEGER DEFAULT 30,
  reply_monitoring BOOLEAN DEFAULT true,
  -- Mining Settings
  mining_preferences JSONB DEFAULT '{}',
  auto_approval_threshold INTEGER DEFAULT 70,
  daily_limit INTEGER DEFAULT 100,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  -- Scoring Settings
  scoring_weights JSONB DEFAULT '{}',
  target_countries JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Signals Module
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  signal_url TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enrichment History
CREATE TABLE public.enrichment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  enrichment_type TEXT NOT NULL CHECK (enrichment_type IN ('tech_stack', 'funding', 'job_postings', 'news', 'social')),
  data JSONB DEFAULT '{}',
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity Logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT,
  entity_type TEXT, -- 'company', 'lead', etc
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lead Score History
CREATE TABLE public.lead_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  breakdown JSONB,
  total_score INTEGER,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_ai_score ON companies(ai_score);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_decision_makers_company ON decision_makers(company_id);
CREATE INDEX idx_decision_makers_email_status ON decision_makers(email_status);
CREATE INDEX idx_signals_company ON signals(company_id);
CREATE INDEX idx_signals_processed ON signals(processed);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - can be restricted later with auth)
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow all operations on decision_makers" ON public.decision_makers FOR ALL USING (true);
CREATE POLICY "Allow all operations on mining_sessions" ON public.mining_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on mining_results" ON public.mining_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_campaigns" ON public.email_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_templates" ON public.email_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_campaign_steps" ON public.email_campaign_steps FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_queue" ON public.email_queue FOR ALL USING (true);
CREATE POLICY "Allow all operations on exports" ON public.exports FOR ALL USING (true);
CREATE POLICY "Allow all operations on export_items" ON public.export_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_settings" ON public.user_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations on signals" ON public.signals FOR ALL USING (true);
CREATE POLICY "Allow all operations on enrichment_history" ON public.enrichment_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on activity_logs" ON public.activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on lead_score_history" ON public.lead_score_history FOR ALL USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_makers_updated_at
BEFORE UPDATE ON public.decision_makers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signals_updated_at
BEFORE UPDATE ON public.signals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default user (since no auth system yet)
INSERT INTO public.users (id, email, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Default User');

-- Insert default user settings (migrating from localStorage structure)
INSERT INTO public.user_settings (
  user_id,
  api_keys,
  email_signature,
  email_prompt,
  scoring_weights,
  target_countries,
  auto_approval_threshold,
  daily_limit,
  frequency
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '{
    "apollo": {"id": "apollo", "name": "Apollo.io API", "key": "", "description": "For lead enrichment and company data", "isActive": true},
    "openai": {"id": "openai", "name": "OpenAI API", "key": "", "description": "For AI-powered lead scoring and analysis", "isActive": true},
    "perplexity": {"id": "perplexity", "name": "Perplexity API", "key": "", "description": "For real-time company intelligence and signals", "isActive": false},
    "google-search": {"id": "google-search", "name": "Google Search API", "key": "", "description": "For lead discovery and company research", "isActive": false},
    "zoho-email": {"id": "zoho-email", "name": "Zoho Email", "key": "", "description": "For email sending and management", "isActive": false, "emailHost": "", "emailUsername": "", "emailPassword": "", "imapHost": "", "imapUsername": "", "imapPassword": ""}
  }',
  'Best regards,\n[Your Name]\n[Your Company]\n[Your Contact Information]',
  'Write a professional cold email to {contactName} at {companyName}. \nUse the following company data: {companyData}\nUse the following contact data: {contactData}\nKeep it concise, personalized, and focused on value proposition.\nAlways use the contact''s first name in greeting.',
  '{"companySize": 30, "techStack": 25, "funding": 25, "jobPostings": 20, "geographic": 15}',
  '{"selectedCountries": ["United Kingdom", "Australia"], "availableCountries": ["United Kingdom", "Australia", "Singapore", "Malaysia", "Qatar", "Canada", "United States", "Germany", "France", "Netherlands", "Switzerland", "Ireland", "New Zealand", "UAE", "India"]}',
  70,
  100,
  'daily'
);

-- Insert default email templates
INSERT INTO public.email_templates (user_id, name, subject, content, is_default) VALUES
('00000000-0000-0000-0000-000000000001', 'Cold Outreach Template', 'Quick question about {companyName}', 
'Hi {firstName},

I noticed {companyName} is growing rapidly in the {industry} space. 

{personalizedLine}

I''d love to share how we''ve helped similar companies scale their operations. Would you be interested in a brief 15-minute conversation this week?

Best regards,
{senderName}', true),
('00000000-0000-0000-0000-000000000001', 'Follow-up Template', 'Following up on {companyName}', 
'Hi {firstName},

I wanted to follow up on my previous email about helping {companyName} with {specificNeed}.

{additionalContext}

Would you have 10 minutes to chat this week?

Best regards,
{senderName}', false);