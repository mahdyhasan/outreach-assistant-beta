-- Update all companies that don't have a user_id assigned to the current user
UPDATE companies 
SET user_id = '396771dd-092d-42b1-a8a4-5e1250e788b9' 
WHERE user_id IS NULL;