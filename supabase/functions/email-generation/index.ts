import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      leadId, 
      contactData, 
      companyData, 
      emailPrompt, 
      signature, 
      openaiApiKey 
    } = await req.json();

    console.log('Generating email for lead:', leadId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare the prompt with placeholders replaced
    const personalizedPrompt = emailPrompt
      .replace(/{contactName}/g, contactData.contact_name)
      .replace(/{companyName}/g, companyData.company_name)
      .replace(/{companyData}/g, JSON.stringify(companyData, null, 2))
      .replace(/{contactData}/g, JSON.stringify(contactData, null, 2));

    // Call OpenAI to generate the email
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cold email writer. Write professional, personalized cold emails that focus on value proposition. Keep them concise and engaging. Do not include a signature - it will be added separately.'
          },
          {
            role: 'user',
            content: personalizedPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedEmail = openaiData.choices[0].message.content;

    // Extract first name from contact name
    const firstName = contactData.contact_name.split(' ')[0];
    
    // Prepare the final email with signature
    const finalEmail = generatedEmail + '\n\n' + signature;

    // Generate a subject line
    const subjectResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Generate a compelling, professional email subject line for a cold outreach email. Keep it under 50 characters and make it intriguing but not spammy.'
          },
          {
            role: 'user',
            content: `Company: ${companyData.company_name}\nContact: ${firstName}\nEmail content: ${generatedEmail}`
          }
        ],
        max_tokens: 20,
        temperature: 0.8,
      }),
    });

    const subjectData = await subjectResponse.json();
    const subject = subjectData.choices[0].message.content.replace(/['"]/g, '');

    // Create email queue entry
    const { data: queueEntry, error: queueError } = await supabase
      .from('email_queue')
      .insert({
        lead_id: leadId,
        subject: subject,
        content: finalEmail,
        status: 'pending_review',
        recipient_email: contactData.email,
        recipient_name: contactData.contact_name,
        company_name: companyData.company_name,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error creating queue entry:', queueError);
      throw queueError;
    }

    console.log('Email generated and queued successfully:', queueEntry.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: queueEntry.id,
        subject,
        content: finalEmail,
        message: 'Email generated and added to queue for review'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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