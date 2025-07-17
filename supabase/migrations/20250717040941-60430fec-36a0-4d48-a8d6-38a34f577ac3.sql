-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for profiles timestamps
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for existing tables to filter by user_id
-- First add user_id column to tables that don't have it
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.mining_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.exports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing data to have a user_id (for demo purposes, we'll use a placeholder)
-- In production, you'd handle this migration more carefully
UPDATE public.companies SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.email_campaigns SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.email_templates SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.mining_sessions SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.exports SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all operations on decision_makers" ON public.decision_makers;
DROP POLICY IF EXISTS "Allow all operations on signals" ON public.signals;
DROP POLICY IF EXISTS "Allow all operations on email_campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Allow all operations on email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow all operations on user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Allow all operations on mining_sessions" ON public.mining_sessions;
DROP POLICY IF EXISTS "Allow all operations on exports" ON public.exports;

-- Create proper user-scoped RLS policies
-- Companies policies
CREATE POLICY "Users can view their own companies" 
ON public.companies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Decision makers policies (linked to companies)
CREATE POLICY "Users can view decision makers for their companies" 
ON public.decision_makers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = decision_makers.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can insert decision makers for their companies" 
ON public.decision_makers 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = decision_makers.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can update decision makers for their companies" 
ON public.decision_makers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = decision_makers.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can delete decision makers for their companies" 
ON public.decision_makers 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = decision_makers.company_id 
  AND companies.user_id = auth.uid()
));

-- Signals policies (linked to companies)
CREATE POLICY "Users can view signals for their companies" 
ON public.signals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = signals.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can insert signals for their companies" 
ON public.signals 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = signals.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can update signals for their companies" 
ON public.signals 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = signals.company_id 
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can delete signals for their companies" 
ON public.signals 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.companies 
  WHERE companies.id = signals.company_id 
  AND companies.user_id = auth.uid()
));

-- User settings policies
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Email campaigns policies
CREATE POLICY "Users can view their own campaigns" 
ON public.email_campaigns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" 
ON public.email_campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" 
ON public.email_campaigns 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" 
ON public.email_campaigns 
FOR DELETE 
USING (auth.uid() = user_id);

-- Email templates policies
CREATE POLICY "Users can view their own templates" 
ON public.email_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.email_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.email_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();