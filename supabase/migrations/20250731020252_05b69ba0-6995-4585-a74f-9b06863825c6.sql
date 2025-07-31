-- Fix security warnings by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix security warning for session recovery function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix security warning for existing function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;