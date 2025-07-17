import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailGenerationRequest {
  company_id: string;
  decision_maker_id?: string;
  template_id?: string;
  custom_prompt?: string;
  email_type?: 'outreach' | 'follow_up' | 'demo_request' | 'case_study';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      company_id, 
      decision_maker_id, 
      template_id, 
      custom_prompt,
      email_type = 'outreach' 
    } = await req.json() as EmailGenerationRequest;

    if (!company_id) {
      throw new Error('Company ID is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting email generation for company:', company_id);

    // Get company data
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found or access denied');
    }

    // Get decision maker data if provided
    let decisionMaker = null;
    if (decision_maker_id) {
      const { data: dm } = await supabaseClient
        .from('decision_makers')
        .select('*')
        .eq('id', decision_maker_id)
        .eq('company_id', company_id)
        .single();
      decisionMaker = dm;
    }

    // Get user settings
    const { data: userSettings } = await supabaseClient
      .from('user_settings')
      .select('email_signature, email_prompt')
      .eq('user_id', user.id)
      .single();

    // Prepare context for email generation
    const emailPrompt = custom_prompt || userSettings?.email_prompt || `
You are an expert B2B sales email writer. Create a personalized, compelling email based on the following information:

COMPANY INFORMATION:
- Company: ${company.company_name}
- Industry: ${company.industry || 'Unknown'}
- Size: ${company.employee_size || 'Unknown'} employees
- Website: ${company.website || 'Not provided'}
- Description: ${company.description || 'No description available'}
- Location: ${company.location || 'Unknown'}

DECISION MAKER:
${decisionMaker ? `
- Name: ${decisionMaker.first_name} ${decisionMaker.last_name}
- Title: ${decisionMaker.designation}
- LinkedIn: ${decisionMaker.linkedin_profile || 'Not available'}
` : 'No specific decision maker identified - use generic addressing like "Hello there" or "Hi team"'}

ENRICHMENT DATA:
${JSON.stringify(company.enrichment_data || {}, null, 2)}

EMAIL TYPE: ${email_type}

REQUIREMENTS:
1. Subject line should be compelling and specific to the company
2. Email should be personalized using company/person data
3. Keep it concise (under 150 words)
4. Include a clear call-to-action
5. Professional but conversational tone
6. Reference specific company details or recent developments if available
7. If no decision maker name, use professional generic greeting

Respond ONLY with valid JSON in this format:
{
  "subject": "Email subject line",
  "content": "Email body content with greeting, body, and professional closing"
}
`;

    // Call ChatGPT for email generation
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured in Supabase secrets');
    }

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
            content: 'You are an expert sales email writer specializing in personalized B2B outreach. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: emailPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const emailResult = JSON.parse(openaiData.choices[0].message.content);

    console.log('Email generated successfully for:', company.company_name);

    // Get email signature
    const emailSignature = userSettings?.email_signature || `
Best regards,
[Your Name]
[Your Title] 
[Your Company]
[Your Contact Info]`;

    // Combine email content with signature
    const finalEmailContent = `${emailResult.content}\n\n${emailSignature}`;

    // Save email to queue (optional)
    const { data: emailQueue } = await supabaseClient
      .from('email_queue')
      .insert({
        decision_maker_id: decision_maker_id,
        template_id: template_id,
        scheduled_time: new Date().toISOString(),
        status: 'draft'
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        email: {
          subject: emailResult.subject,
          content: finalEmailContent
        },
        company: {
          id: company.id,
          name: company.company_name,
          industry: company.industry
        },
        decision_maker: decisionMaker ? {
          id: decisionMaker.id,
          name: `${decisionMaker.first_name} ${decisionMaker.last_name}`,
          title: decisionMaker.designation
        } : null,
        email_queue_id: emailQueue?.id,
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in email-generation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});