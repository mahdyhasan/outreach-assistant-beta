-- Create mining_settings table to store all mining configuration
CREATE TABLE public.mining_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Daily limits and scheduling
  daily_limit INTEGER DEFAULT 100,
  start_time TIME DEFAULT '09:00',
  time_zone TEXT DEFAULT 'UTC',
  enable_weekends BOOLEAN DEFAULT false,
  
  -- Quality controls
  quality_threshold INTEGER DEFAULT 70,
  deduplication_strength TEXT DEFAULT 'high',
  enrichment_depth TEXT DEFAULT 'standard',
  
  -- Auto-approval settings
  auto_approve_high_score BOOLEAN DEFAULT false,
  high_score_threshold INTEGER DEFAULT 90,
  
  -- Notification preferences
  daily_report_enabled BOOLEAN DEFAULT true,
  error_alerts_enabled BOOLEAN DEFAULT true,
  quota_warnings_enabled BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mining_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own mining settings"
  ON public.mining_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mining settings"
  ON public.mining_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mining settings"
  ON public.mining_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_mining_settings_updated_at
  BEFORE UPDATE ON public.mining_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for daily mining statistics
CREATE TABLE public.daily_mining_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Counts
  companies_scraped INTEGER DEFAULT 0,
  companies_approved INTEGER DEFAULT 0,
  companies_rejected INTEGER DEFAULT 0,
  decision_makers_found INTEGER DEFAULT 0,
  
  -- Metadata
  sources_used TEXT[] DEFAULT '{}',
  avg_quality_score NUMERIC(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, date)
);

-- Enable RLS for daily_mining_stats
ALTER TABLE public.daily_mining_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_mining_stats
CREATE POLICY "Users can view their own mining stats"
  ON public.daily_mining_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mining stats"
  ON public.daily_mining_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mining stats"
  ON public.daily_mining_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_mining_stats_updated_at
  BEFORE UPDATE ON public.daily_mining_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();