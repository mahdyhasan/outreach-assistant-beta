import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Cleanup mining sessions function called');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Delete mining progress records older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log(`Cleaning up mining sessions older than: ${sevenDaysAgo.toISOString()}`);

    const { data, error } = await supabaseClient
      .from('mining_progress')
      .delete()
      .eq('user_id', user.id)
      .lt('started_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up mining sessions:', error);
      throw new Error(`Failed to cleanup mining sessions: ${error.message}`);
    }

    const deletedCount = data?.length || 0;
    console.log(`Successfully cleaned up ${deletedCount} old mining sessions`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Cleaned up ${deletedCount} old mining sessions`,
        deletedCount: deletedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cleanup-mining-sessions function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});