import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelRequest {
  sessionId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Cancel mining session function called');
    
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

    const { sessionId }: CancelRequest = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log(`Cancelling mining session: ${sessionId}`);

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Update the mining progress to cancelled status
    const { data, error } = await supabaseClient
      .from('mining_progress')
      .update({
        status: 'cancelled',
        error_message: 'Mining session cancelled by user',
        current_step: 'Mining cancelled by user',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error cancelling mining session:', error);
      throw new Error(`Failed to cancel mining session: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Mining session not found or already completed');
    }

    console.log(`Successfully cancelled mining session: ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mining session cancelled successfully',
        sessionId: sessionId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cancel-mining-session function:', error);
    
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