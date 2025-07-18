import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloApiKey) {
      throw new Error('Apollo API key not configured');
    }

    console.log('Checking Apollo API usage...');

    const response = await fetch('https://api.apollo.io/v1/usage', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloApiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apollo usage API error:', errorText);
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
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