import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringRequest {
  leadId: string;
  customCriteria?: any;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, customCriteria }: ScoringRequest = await req.json();

    console.log(`Scoring lead ${leadId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get company data with enrichment
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', leadId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    // Get scoring settings
    const { data: settings } = await supabase
      .from('mining_settings')
      .select('*')
      .limit(1)
      .single();

    // Prepare data for ChatGPT analysis
    const companyContext = {
      company_name: company.company_name,
      industry: company.industry,
      employee_size: company.employee_size,
      location: company.location,
      website: company.website,
      description: company.description,
      enrichment_data: company.enrichment_data || {},
      current_score: company.ai_score,
    };

    // Create scoring prompt
    const scoringPrompt = `
You are a B2B lead scoring AI. Analyze this company and provide a score from 0-100 based on their potential value.

Company Information:
- Company: ${companyContext.company_name}
- Industry: ${companyContext.industry}
- Employee Size: ${companyContext.employee_size}
- Location: ${companyContext.location}
- Website: ${companyContext.website}
- Description: ${companyContext.description}

Enrichment Data: ${JSON.stringify(companyContext.enrichment_data, null, 2)}

Scoring Criteria (prioritize these):
${JSON.stringify(customCriteria || settings?.icp_criteria || {}, null, 2)}

Please analyze and provide:
1. Overall Score (0-100)
2. Key Reasons (array of strings explaining the score)
3. Priority Level (high/medium/low)
4. Recommended Actions (array of suggested next steps)

Respond ONLY with valid JSON in this format:
{
  "score": 85,
  "reasons": ["Strong job title match", "High-growth company", "Active on LinkedIn"],
  "priority": "high",
  "recommended_actions": ["Schedule demo", "Send case study"],
  "analysis": "Brief explanation of the scoring rationale"
}`;

    // Call ChatGPT for scoring
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    let scoringResult: any = {
      score: 50,
      reasons: ['Basic lead data available'],
      priority: 'medium',
      recommended_actions: ['Review lead details'],
      analysis: 'Standard lead evaluation completed'
    };

    if (openaiApiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert B2B lead scoring analyst. Always respond with valid JSON only.'
              },
              {
                role: 'user',
                content: scoringPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          scoringResult = JSON.parse(openaiData.choices[0].message.content);
          console.log('AI scoring completed:', scoringResult);
        } else {
          console.error('OpenAI API error:', openaiResponse.status);
        }
      } catch (error) {
        console.error('Error calling OpenAI:', error);
      }
    }

    // Update company with AI score
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        ai_score: scoringResult.score,
        status: scoringResult.priority === 'high' ? 'approved' : 'pending_review',
        enrichment_data: {
          ...company.enrichment_data,
          ai_analysis: {
            score: scoringResult.score,
            reasons: scoringResult.reasons,
            priority: scoringResult.priority,
            recommended_actions: scoringResult.recommended_actions,
            analysis: scoringResult.analysis,
            scored_at: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating company score:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log(`Successfully scored lead ${leadId}: ${scoringResult.score} points`);

    return new Response(
      JSON.stringify({
        success: true,
        company: updatedCompany,
        scoring_result: scoringResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lead-scoring function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});