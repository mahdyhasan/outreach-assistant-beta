import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailGenerationRequest {
  leadId: string;
  template?: string;
  customPrompt?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, template, customPrompt }: EmailGenerationRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting email generation for lead:', leadId);

    // Get lead data with enrichment
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    // Get email settings from settings
    const { data: settings } = await supabaseClient
      .from('mining_settings')
      .select('*')
      .limit(1)
      .single();

    // Prepare lead context for email generation
    const leadContext = {
      first_name: lead.contact_name.split(' ')[0],
      full_name: lead.contact_name,
      job_title: lead.job_title,
      company_name: lead.company_name,
      industry: lead.industry,
      company_size: lead.company_size,
      location: lead.location,
      website: lead.website,
      score: lead.final_score || lead.ai_score,
      enrichment_data: lead.enrichment_data || {},
    };

    // Create email generation prompt
    const emailPrompt = customPrompt || `
You are an expert sales email writer. Generate a personalized cold outreach email for this lead.

Lead Information:
- Name: ${leadContext.first_name} ${leadContext.full_name}
- Title: ${leadContext.job_title}
- Company: ${leadContext.company_name}
- Industry: ${leadContext.industry}
- Company Size: ${leadContext.company_size}
- Location: ${leadContext.location}
- Website: ${leadContext.website}
- Lead Score: ${leadContext.score}/100

Additional Context: ${JSON.stringify(leadContext.enrichment_data, null, 2)}

Email Requirements:
- Use "${leadContext.first_name}" for personalization
- Keep it professional but conversational
- Length: 150-200 words maximum
- Include a clear call-to-action
- Reference something specific about their company/role
- No generic sales language
- Subject line should be compelling and personal

Respond ONLY with valid JSON in this format:
{
  "subject": "Email subject line",
  "content": "Email body content including greeting, body, and signature placeholder"
}

Note: The signature will be added automatically, so end with a professional closing like "Best regards," without adding an actual signature.`;

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

    console.log('Email generated successfully');

    // Get email signature from settings (default if not set)
    const emailSignature = settings?.email_signature || `
Best regards,
[Your Name]
[Your Title]
[Your Company]
[Your Phone]
[Your Email]`;

    // Combine email content with signature
    const finalEmailContent = `${emailResult.content}\n\n${emailSignature}`;

    // Save email to queue
    const { data: emailQueue, error: queueError } = await supabaseClient
      .from('email_queue')
      .insert({
        lead_id: leadId,
        recipient_email: lead.email,
        subject: emailResult.subject,
        content: finalEmailContent,
        status: 'pending',
      })
      .select()
      .single();

    if (queueError) {
      throw queueError;
    }

    console.log('Email added to queue:', emailQueue.id);

    return new Response(
      JSON.stringify({
        success: true,
        email: emailQueue,
        generated_content: emailResult,
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