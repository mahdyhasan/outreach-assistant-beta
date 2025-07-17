-- Insert sample companies for testing
INSERT INTO public.companies (company_name, website, industry, employee_size, employee_size_numeric, founded, founded_year, description, location, country, ai_score, status, source) VALUES
('TechCorp Solutions', 'https://techcorp.com', 'Software Development', '50-100', 75, '2018', 2018, 'Leading provider of enterprise software solutions', 'London', 'United Kingdom', 85, 'approved', 'apollo'),
('DataFlow Analytics', 'https://dataflow.ai', 'Data Analytics', '100-500', 250, '2016', 2016, 'Advanced data analytics and machine learning platform', 'Sydney', 'Australia', 92, 'approved', 'linkedin'),
('GreenTech Innovations', 'https://greentech.com', 'Clean Technology', '20-50', 35, '2020', 2020, 'Sustainable technology solutions for businesses', 'Manchester', 'United Kingdom', 78, 'pending_review', 'scraping'),
('CloudScale Systems', 'https://cloudscale.io', 'Cloud Computing', '200-500', 350, '2015', 2015, 'Scalable cloud infrastructure and services', 'Melbourne', 'Australia', 88, 'approved', 'apollo'),
('NextGen Robotics', 'https://nextgen-robotics.com', 'Robotics', '10-20', 15, '2021', 2021, 'Advanced robotics solutions for manufacturing', 'Birmingham', 'United Kingdom', 72, 'enriched', 'manual');

-- Insert sample decision makers
INSERT INTO public.decision_makers (company_id, first_name, last_name, designation, email, phone, linkedin_profile, contact_type, confidence_score, email_status) VALUES
((SELECT id FROM companies WHERE company_name = 'TechCorp Solutions'), 'Sarah', 'Johnson', 'CTO', 'sarah.johnson@techcorp.com', '+44 20 7123 4567', 'https://linkedin.com/in/sarah-johnson-cto', 'kdm', 85, 'not_contacted'),
((SELECT id FROM companies WHERE company_name = 'TechCorp Solutions'), 'Michael', 'Chen', 'Head of Engineering', 'michael.chen@techcorp.com', '+44 20 7123 4568', 'https://linkedin.com/in/michael-chen-eng', 'decision_maker', 78, 'not_contacted'),
((SELECT id FROM companies WHERE company_name = 'DataFlow Analytics'), 'Emma', 'Williams', 'CEO', 'emma.williams@dataflow.ai', '+61 2 9876 5432', 'https://linkedin.com/in/emma-williams-ceo', 'kdm', 92, 'not_contacted'),
((SELECT id FROM companies WHERE company_name = 'GreenTech Innovations'), 'James', 'Brown', 'Founder & CEO', 'james.brown@greentech.com', '+44 161 234 5678', 'https://linkedin.com/in/james-brown-greentech', 'kdm', 88, 'not_contacted'),
((SELECT id FROM companies WHERE company_name = 'CloudScale Systems'), 'Lisa', 'Anderson', 'VP of Product', 'lisa.anderson@cloudscale.io', '+61 3 8765 4321', 'https://linkedin.com/in/lisa-anderson-vp', 'decision_maker', 82, 'not_contacted'),
((SELECT id FROM companies WHERE company_name = 'NextGen Robotics'), 'David', 'Taylor', 'CTO', 'david.taylor@nextgen-robotics.com', '+44 121 345 6789', 'https://linkedin.com/in/david-taylor-robotics', 'kdm', 75, 'not_contacted');

-- Insert sample signals
INSERT INTO public.signals (company_id, signal_type, signal_title, signal_description, priority, signal_url, processed) VALUES
((SELECT id FROM companies WHERE company_name = 'TechCorp Solutions'), 'funding', 'Series B Funding Round', 'TechCorp Solutions raised $15M in Series B funding to expand their enterprise software platform', 'high', 'https://techcrunch.com/techcorp-15m-series-b', false),
((SELECT id FROM companies WHERE company_name = 'DataFlow Analytics'), 'hiring', 'Rapid Team Expansion', 'DataFlow Analytics is hiring 20+ engineers across multiple departments', 'medium', 'https://careers.dataflow.ai/openings', false),
((SELECT id FROM companies WHERE company_name = 'GreenTech Innovations'), 'product_launch', 'New Sustainability Platform', 'Launched comprehensive sustainability tracking platform for enterprises', 'medium', 'https://greentech.com/news/platform-launch', false),
((SELECT id FROM companies WHERE company_name = 'CloudScale Systems'), 'expansion', 'European Market Entry', 'CloudScale Systems announced expansion into European markets with new data centers', 'high', 'https://cloudscale.io/blog/europe-expansion', false);