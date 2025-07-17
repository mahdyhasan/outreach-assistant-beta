-- Create API usage tracking table for rate limiting
CREATE TABLE public.api_usage_tracking (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    api_name TEXT NOT NULL,
    date DATE NOT NULL,
    daily_count INTEGER DEFAULT 0,
    hourly_counts JSONB DEFAULT '{}',
    minute_counts JSONB DEFAULT '{}',
    last_operation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, api_name, date)
);

-- Enable RLS
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own API usage" 
ON public.api_usage_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API usage" 
ON public.api_usage_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API usage" 
ON public.api_usage_tracking 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create improved progress tracking table
CREATE TABLE public.mining_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    operation_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    progress_percentage INTEGER DEFAULT 0,
    current_step TEXT,
    total_steps INTEGER,
    results_so_far INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mining_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own mining progress" 
ON public.mining_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mining progress" 
ON public.mining_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mining progress" 
ON public.mining_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_api_usage_tracking_updated_at
BEFORE UPDATE ON public.api_usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mining_progress_updated_at
BEFORE UPDATE ON public.mining_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();