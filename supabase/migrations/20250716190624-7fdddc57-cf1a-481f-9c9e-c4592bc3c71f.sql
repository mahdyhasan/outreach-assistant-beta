-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.crm_sync_history CASCADE;
DROP TABLE IF EXISTS public.mining_settings CASCADE;
DROP TABLE IF EXISTS public.outreach_activities CASCADE;
DROP TABLE IF EXISTS public.signals CASCADE;

-- Create Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  employee_size TEXT,
  founded TEXT,
  description TEXT,
  public_email TEXT,
  public_phone TEXT,
  linkedin_profile TEXT,
  enrichment_data JSONB DEFAULT '{}',
  ai_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending_review', -- pending_review, approved, rejected, enriched
  source TEXT DEFAULT 'manual', -- manual, apollo, linkedin, scraping
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Decision Makers table (with separate first_name and last_name as requested)
CREATE TABLE public.decision_makers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_profile TEXT,
  facebook_profile TEXT,
  instagram_profile TEXT,
  contact_type TEXT DEFAULT 'kdm', -- kdm, ceo, coo, cto, hro, founder, vp, director, manager
  confidence_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Signals table
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- funding, hiring, expansion, product_launch, leadership_change
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  priority TEXT DEFAULT 'medium', -- high, medium, low
  signal_url TEXT,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Mining Settings table
CREATE TABLE public.mining_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icp_criteria JSONB DEFAULT '{}',
  auto_approval_threshold INTEGER DEFAULT 70,
  daily_limit INTEGER DEFAULT 100,
  frequency TEXT DEFAULT 'daily',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default mining settings
INSERT INTO public.mining_settings (icp_criteria, auto_approval_threshold, daily_limit, frequency)
VALUES ('{}', 70, 100, 'daily');

-- Create indexes for better performance
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_ai_score ON public.companies(ai_score);
CREATE INDEX idx_companies_industry ON public.companies(industry);
CREATE INDEX idx_companies_employee_size ON public.companies(employee_size);
CREATE INDEX idx_companies_source ON public.companies(source);
CREATE INDEX idx_decision_makers_company_id ON public.decision_makers(company_id);
CREATE INDEX idx_decision_makers_contact_type ON public.decision_makers(contact_type);
CREATE INDEX idx_decision_makers_confidence_score ON public.decision_makers(confidence_score);
CREATE INDEX idx_signals_company_id ON public.signals(company_id);
CREATE INDEX idx_signals_signal_type ON public.signals(signal_type);
CREATE INDEX idx_signals_priority ON public.signals(priority);
CREATE INDEX idx_signals_processed ON public.signals(processed);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - can be restricted later with auth)
CREATE POLICY "Allow all operations on companies" 
ON public.companies 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on decision_makers" 
ON public.decision_makers 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on signals" 
ON public.signals 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on mining_settings" 
ON public.mining_settings 
FOR ALL 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_makers_updated_at
BEFORE UPDATE ON public.decision_makers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signals_updated_at
BEFORE UPDATE ON public.signals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();