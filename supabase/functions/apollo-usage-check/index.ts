import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApolloUsageResponse {
  current_period_usage: {
    contact_info_requests: number;
    people_searches: number;
  };
  plan_limits: {
    contact_info_requests: number;
    people_searches: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client to fetch per-user API keys when needed
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || ''
          }
        }
      }
    );

    // Prefer env key; fallback to user's stored key in user_settings
    let apolloApiKey = Deno.env.get('APOLLO_API_KEY') || '';

    if (!apolloApiKey) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('api_keys')
          .eq('user_id', user.id)
          .maybeSingle();
        apolloApiKey = settings?.api_keys?.apollo?.key || '';
      }
    }

    if (!apolloApiKey) {
      return new Response(JSON.stringify({
        error: 'Apollo API key missing. Add it in Settings → API Keys.',
        success: false
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Checking Apollo API usage...');

    const response = await fetch('https://api.apollo.io/api/v1/usage_stats/api_usage_stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloApiKey
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apollo usage API error:', errorText);
      const status = response.status === 401 ? 400 : response.status;
      const message = response.status === 401 ? 'Invalid Apollo API key' : `Apollo API error: ${response.status} - ${errorText}`;
      return new Response(JSON.stringify({ error: message, success: false }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usageData: ApolloUsageResponse = await response.json();
    
    const contactRevealUsed = usageData.current_period_usage.contact_info_requests;
    const contactRevealLimit = usageData.plan_limits.contact_info_requests;
    const peopleSearchUsed = usageData.current_period_usage.people_searches;
    const peopleSearchLimit = usageData.plan_limits.people_searches;
    
    const creditsRemaining = contactRevealLimit - contactRevealUsed;
    const percentageUsed = Math.round((contactRevealUsed / contactRevealLimit) * 100);

    console.log(`Apollo usage: ${contactRevealUsed}/${contactRevealLimit} contact reveals (${percentageUsed}%)`);

    return new Response(JSON.stringify({
      contact_reveals_used: contactRevealUsed,
      contact_reveals_limit: contactRevealLimit,
      people_searches_used: peopleSearchUsed,
      people_searches_limit: peopleSearchLimit,
      percentage_used: percentageUsed,
      credits_remaining: creditsRemaining,
      is_high_usage: percentageUsed > 80
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking Apollo usage:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});