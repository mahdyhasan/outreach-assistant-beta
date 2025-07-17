import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  api_name: 'apollo' | 'serper' | 'openai';
  user_id: string;
  operation: string;
}

interface RateLimitConfig {
  apollo: { daily: 1000, hourly: 100, per_minute: 10 };
  serper: { daily: 500, hourly: 50, per_minute: 5 };
  openai: { daily: 2000, hourly: 200, per_minute: 20 };
}

const RATE_LIMITS: RateLimitConfig = {
  apollo: { daily: 1000, hourly: 100, per_minute: 10 },
  serper: { daily: 500, hourly: 50, per_minute: 5 },
  openai: { daily: 2000, hourly: 200, per_minute: 20 }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_name, user_id, operation } = await req.json() as RateLimitRequest;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisHour = now.toISOString().substr(0, 13) + ':00:00.000Z';
    const thisMinute = now.toISOString().substr(0, 16) + ':00.000Z';

    // Check existing usage
    const { data: usage } = await supabase
      .from('api_usage_tracking')
      .select('*')
      .eq('user_id', user_id)
      .eq('api_name', api_name)
      .eq('date', today)
      .single();

    const currentUsage = usage || {
      daily_count: 0,
      hourly_counts: {},
      minute_counts: {}
    };

    // Check rate limits
    const limits = RATE_LIMITS[api_name];
    const hourlyCount = currentUsage.hourly_counts?.[thisHour] || 0;
    const minuteCount = currentUsage.minute_counts?.[thisMinute] || 0;

    if (currentUsage.daily_count >= limits.daily) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'Daily limit exceeded',
        limits: limits,
        current_usage: currentUsage.daily_count,
        reset_time: new Date(now.setHours(24, 0, 0, 0)).toISOString()
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (hourlyCount >= limits.hourly) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'Hourly limit exceeded',
        limits: limits,
        current_usage: hourlyCount,
        reset_time: new Date(now.setMinutes(60, 0, 0)).toISOString()
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (minuteCount >= limits.per_minute) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'Per-minute limit exceeded',
        limits: limits,
        current_usage: minuteCount,
        reset_time: new Date(now.setSeconds(60, 0)).toISOString()
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update usage counters
    const newHourlyCounts = { ...currentUsage.hourly_counts };
    const newMinuteCounts = { ...currentUsage.minute_counts };
    
    newHourlyCounts[thisHour] = (newHourlyCounts[thisHour] || 0) + 1;
    newMinuteCounts[thisMinute] = (newMinuteCounts[thisMinute] || 0) + 1;

    await supabase
      .from('api_usage_tracking')
      .upsert({
        user_id,
        api_name,
        date: today,
        daily_count: currentUsage.daily_count + 1,
        hourly_counts: newHourlyCounts,
        minute_counts: newMinuteCounts,
        last_operation: operation,
        updated_at: now.toISOString()
      });

    return new Response(JSON.stringify({
      allowed: true,
      remaining: {
        daily: limits.daily - (currentUsage.daily_count + 1),
        hourly: limits.hourly - (hourlyCount + 1),
        per_minute: limits.per_minute - (minuteCount + 1)
      },
      limits: limits
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in rate-limiter function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      allowed: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});