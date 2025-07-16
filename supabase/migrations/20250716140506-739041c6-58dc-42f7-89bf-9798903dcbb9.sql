-- Create signals table for tracking company signals
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('funding', 'job_posting', 'product_launch', 'news')),
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  signal_url TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email sequences table for campaign management
CREATE TABLE public.email_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL,
  subject_line TEXT NOT NULL,
  email_content TEXT NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  leads_count INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  responses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign enrollments table (many-to-many between campaigns and leads)
CREATE TABLE public.campaign_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  current_sequence_step INTEGER NOT NULL DEFAULT 1,
  next_email_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(campaign_id, lead_id)
);

-- Create CRM sync tracking table
CREATE TABLE public.crm_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('export', 'import', 'update')),
  leads_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_details JSONB,
  crm_system TEXT NOT NULL DEFAULT 'laravel',
  sync_filters JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_signals_company_name ON public.signals(company_name);
CREATE INDEX idx_signals_type_priority ON public.signals(signal_type, priority);
CREATE INDEX idx_signals_detected_at ON public.signals(detected_at DESC);
CREATE INDEX idx_email_sequences_order ON public.email_sequences(sequence_order);
CREATE INDEX idx_campaign_enrollments_campaign ON public.campaign_enrollments(campaign_id);
CREATE INDEX idx_campaign_enrollments_lead ON public.campaign_enrollments(lead_id);
CREATE INDEX idx_campaign_enrollments_next_email ON public.campaign_enrollments(next_email_date);
CREATE INDEX idx_crm_sync_status ON public.crm_sync_history(status);

-- Enable RLS on all tables
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now since no auth is implemented)
CREATE POLICY "Allow all operations on signals" ON public.signals FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_sequences" ON public.email_sequences FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_campaigns" ON public.email_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaign_enrollments" ON public.campaign_enrollments FOR ALL USING (true);
CREATE POLICY "Allow all operations on crm_sync_history" ON public.crm_sync_history FOR ALL USING (true);

-- Insert sample email sequence data
INSERT INTO public.email_sequences (name, sequence_order, subject_line, email_content, delay_days) VALUES
('Introduction', 1, 'Quick question about {{company_name}}', 'Hi {{contact_name}}, I noticed {{company_name}} is {{company_signal}}. Would love to explore how we could help...', 0),
('Follow-up 1', 2, 'Following up on {{company_name}}', 'Hi {{contact_name}}, Just wanted to follow up on my previous email about {{company_name}}...', 3),
('Follow-up 2', 3, 'One more try - {{company_name}}', 'Hi {{contact_name}}, I promise this is my last email about this. Given {{company_name}}''s recent {{signal_type}}...', 3),
('Value Proposition', 4, 'How {{our_company}} helped similar companies', 'Hi {{contact_name}}, I wanted to share how we''ve helped companies similar to {{company_name}}...', 5),
('Social Proof', 5, 'Case study relevant to {{company_name}}', 'Hi {{contact_name}}, Thought you might find this case study interesting given {{company_name}}''s situation...', 5),
('Final Attempt', 6, 'Should I close your file?', 'Hi {{contact_name}}, I haven''t heard back from you. Should I assume this isn''t a priority right now?', 5),
('Break-up Email', 7, 'Last email from me', 'Hi {{contact_name}}, This will be my last email. If things change, feel free to reach out...', 5);

-- Insert sample campaign data
INSERT INTO public.email_campaigns (name, description, status, leads_count, emails_sent, responses_count) VALUES
('Q4 Enterprise Outreach', 'Targeting enterprise companies with recent funding signals', 'active', 156, 89, 16),
('Startup Series A', 'Focused on Series A startups in tech sector', 'completed', 67, 67, 8),
('Tech Stack Match', 'Companies using our target tech stack', 'active', 45, 23, 4);

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();