-- First, insert the user into the users table
INSERT INTO users (id, email, name) 
VALUES ('396771dd-092d-42b1-a8a4-5e1250e788b9', 'mahdyhasan@gmail.com', 'Mahdy Hasan')
ON CONFLICT (id) DO NOTHING;

-- Update the existing user_settings record to point to the correct admin user
UPDATE user_settings 
SET user_id = '396771dd-092d-42b1-a8a4-5e1250e788b9'
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Update the admin user's profile with proper details
UPDATE profiles 
SET 
  company_name = 'Augmex',
  job_title = 'Administrator'
WHERE user_id = '396771dd-092d-42b1-a8a4-5e1250e788b9';