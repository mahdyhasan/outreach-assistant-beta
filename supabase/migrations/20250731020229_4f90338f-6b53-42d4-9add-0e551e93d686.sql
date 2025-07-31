-- Fix security issues in database functions
CREATE OR REPLACE FUNCTION public.cleanup_old_mining_sessions()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.mining_progress 
  WHERE started_at < NOW() - INTERVAL '24 hours'
    AND status IN ('running', 'pending');
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.recover_mining_session(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.mining_progress 
  SET status = 'failed',
      error_message = 'Session recovered due to timeout',
      updated_at = NOW()
  WHERE session_id = p_session_id 
    AND user_id = p_user_id 
    AND status = 'running'
    AND started_at < NOW() - INTERVAL '10 minutes';
    
  RETURN FOUND;
END;
$$;