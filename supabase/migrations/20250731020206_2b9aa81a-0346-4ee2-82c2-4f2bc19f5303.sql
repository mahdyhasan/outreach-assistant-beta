-- Add unique constraint for mining_progress to fix upsert issues
ALTER TABLE public.mining_progress ADD CONSTRAINT mining_progress_session_user_unique UNIQUE (session_id, user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mining_progress_user_status ON public.mining_progress (user_id, status);
CREATE INDEX IF NOT EXISTS idx_mining_progress_session_status ON public.mining_progress (session_id, status);
CREATE INDEX IF NOT EXISTS idx_mining_progress_updated_at ON public.mining_progress (updated_at);

-- Add index for companies table for better mining performance
CREATE INDEX IF NOT EXISTS idx_companies_user_status ON public.companies (user_id, status);
CREATE INDEX IF NOT EXISTS idx_companies_source ON public.companies (source);

-- Add index for api_usage_tracking for rate limiting
CREATE INDEX IF NOT EXISTS idx_api_usage_user_api_date ON public.api_usage_tracking (user_id, api_name, date);

-- Create function to cleanup old mining sessions automatically
CREATE OR REPLACE FUNCTION public.cleanup_old_mining_sessions()
RETURNS void AS $$
BEGIN
  -- Delete sessions older than 24 hours that are not completed
  DELETE FROM public.mining_progress 
  WHERE started_at < (now() - interval '24 hours')
  AND status NOT IN ('completed', 'cancelled');
  
  -- Update stuck sessions (running for more than 30 minutes) to failed
  UPDATE public.mining_progress 
  SET status = 'failed', 
      error_message = 'Session timed out - exceeded maximum duration',
      updated_at = now()
  WHERE status = 'running' 
  AND started_at < (now() - interval '30 minutes');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for session recovery
CREATE OR REPLACE FUNCTION public.recover_mining_session(p_session_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Mark session as cancelled for recovery
  UPDATE public.mining_progress 
  SET status = 'cancelled',
      error_message = 'Session recovered by user',
      updated_at = now()
  WHERE session_id = p_session_id 
  AND user_id = p_user_id
  AND status = 'running';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;