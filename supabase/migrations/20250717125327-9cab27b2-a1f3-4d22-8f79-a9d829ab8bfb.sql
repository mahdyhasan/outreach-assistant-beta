-- First, let's see what the current constraint allows
-- Then update it to include 'active' status

-- Drop the existing check constraint
ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_status_check;

-- Add the updated check constraint with 'active' status
ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_status_check 
CHECK (status IN ('draft', 'active', 'paused', 'completed'));