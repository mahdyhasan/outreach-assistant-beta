-- Drop existing email campaign related tables
DROP TABLE IF EXISTS public.campaign_enrollments CASCADE;
DROP TABLE IF EXISTS public.email_campaigns CASCADE;
DROP TABLE IF EXISTS public.email_sequences CASCADE;
DROP TABLE IF EXISTS public.email_queue CASCADE;

-- Create new Companies table
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending_review'
);

-- Create new Contacts table for KDMs
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_profile TEXT,
  facebook_profile TEXT,
  instagram_profile TEXT,
  contact_type TEXT DEFAULT 'kdm', -- kdm, ceo, coo, hro
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_companies_industry ON public.companies(industry);
CREATE INDEX idx_companies_employee_size ON public.companies(employee_size);
CREATE INDEX idx_companies_ai_score ON public.companies(ai_score);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_contact_type ON public.contacts(contact_type);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on companies" 
ON public.companies 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on contacts" 
ON public.contacts 
FOR ALL 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing leads data to companies table
INSERT INTO public.companies (
  company_name, website, industry, employee_size, 
  description, public_email, public_phone, linkedin_profile,
  ai_score, created_at, updated_at, source, status
)
SELECT 
  company_name, website, industry, company_size as employee_size,
  '' as description, email as public_email, phone as public_phone, linkedin_url as linkedin_profile,
  COALESCE(final_score, ai_score, 0) as ai_score, 
  COALESCE(created_at, now()) as created_at, 
  COALESCE(updated_at, now()) as updated_at,
  COALESCE(source, 'manual') as source,
  COALESCE(status, 'pending_review') as status
FROM public.leads
WHERE company_name IS NOT NULL AND company_name != '';

-- Create contacts from existing leads where we have contact info
INSERT INTO public.contacts (
  company_id, name, designation, email, linkedin_profile, contact_type
)
SELECT 
  c.id as company_id,
  l.contact_name as name,
  l.job_title as designation,
  l.email,
  l.linkedin_url as linkedin_profile,
  'kdm' as contact_type
FROM public.leads l
JOIN public.companies c ON c.company_name = l.company_name
WHERE l.contact_name IS NOT NULL AND l.contact_name != '';

-- Drop the old leads table after migration
DROP TABLE IF EXISTS public.leads CASCADE;