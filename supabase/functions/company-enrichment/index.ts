import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  company_id: string;  // Match frontend parameter name
  enrichment_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, enrichment_type } = await req.json() as EnrichmentRequest;
    
    if (!company_id) {
      throw new Error('Company ID is required');
    }

    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    console.log('Enriching company:', company.company_name);

    let enrichmentData = { ...company.enrichment_data };
    let aiScore = company.ai_score;

    // 1. Serper Intelligence Gathering
    if (serperApiKey) {
      const queries = [
        `${company.company_name} funding investment news`,
        `${company.company_name} growth expansion hiring`,
        `${company.company_name} technology stack products`
      ];

      for (const query of queries) {
        try {
          const serperResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: query, num: 5 })
          });

          if (serperResponse.ok) {
            const data = await serperResponse.json();
            const key = query.includes('funding') ? 'funding_signals' :
                       query.includes('growth') ? 'growth_signals' : 'tech_signals';
            
            enrichmentData[key] = data.organic?.slice(0, 3).map((result: any) => ({
              title: result.title,
              snippet: result.snippet,
              url: result.link,
              date: result.date
            })) || [];
          }
        } catch (error) {
          console.error(`Serper search failed for query: ${query}`, error);
        }
      }
    }

    // 2. Apollo Company Enrichment
    if (apolloApiKey && company.website) {
      try {
        const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/enrich', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            api_key: apolloApiKey,
            domain: company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
          })
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          if (apolloData.organization) {
            const org = apolloData.organization;
            enrichmentData.apollo_details = {
              employee_count: org.estimated_num_employees,
              annual_revenue: org.estimated_annual_revenue,
              technologies: org.technologies || [],
              keywords: org.keywords || [],
              industry_tag_id: org.industry_tag_id,
              founded_year: org.founded_year,
              logo_url: org.logo_url
            };
          }
        }
      } catch (error) {
        console.error('Apollo enrichment failed:', error);
      }
    }

    // 3. ChatGPT Scoring and Analysis
    if (openaiApiKey) {
      try {
        const scoringPrompt = `
Analyze this company and provide a lead score (0-100) based on business potential:

Company: ${company.company_name}
Industry: ${company.industry}
Website: ${company.website}
Employee Size: ${company.employee_size}
Description: ${company.description}

Enrichment Data: ${JSON.stringify(enrichmentData, null, 2)}

Consider:
- Growth indicators (funding, hiring, expansion)
- Technology adoption
- Market position
- Company size and revenue potential
- Recent activities and news

Respond with a JSON object: {"score": 0-100, "reasoning": "explanation", "signals": ["key", "indicators"]}
`;

        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a B2B lead qualification expert. Analyze companies and provide accurate scoring based on business potential.' },
              { role: 'user', content: scoringPrompt }
            ],
            temperature: 0.2
          }),
        });

        if (gptResponse.ok) {
          const gptData = await gptResponse.json();
          let content = gptData.choices[0].message.content;
          
          // Clean up the response to extract JSON only
          if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
          } else if (content.includes('```')) {
            content = content.split('```')[1];
          }
          
          try {
            const analysis = JSON.parse(content.trim());
            aiScore = analysis.score;
            enrichmentData.ai_analysis = {
              score: analysis.score,
              reasoning: analysis.reasoning,
              signals: analysis.signals,
              analyzed_at: new Date().toISOString()
            };

            // Create signals from AI analysis
            if (analysis.signals && analysis.signals.length > 0) {
              for (const signal of analysis.signals) {
                await supabase.from('signals').insert({
                  company_id: company_id,
                  signal_type: 'growth',
                  signal_title: `AI Detected: ${signal}`,
                  signal_description: `AI analysis identified this as a key growth indicator for ${company.company_name}`,
                  priority: analysis.score >= 80 ? 'high' : analysis.score >= 60 ? 'medium' : 'low',
                  processed: false
                });
              }
            }
          } catch (parseError) {
            console.error('Failed to parse ChatGPT response:', parseError, 'Raw content:', content);
          }
        }
      } catch (error) {
        console.error('ChatGPT analysis failed:', error);
      }
    }

    // Update company with enrichment data
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        enrichment_data: enrichmentData,
        ai_score: aiScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', company_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log('Company enriched successfully:', company.company_name, 'Score:', aiScore);

    return new Response(JSON.stringify({
      success: true,
      company: updatedCompany,
      enrichment_summary: {
        signals_found: Object.keys(enrichmentData).length,
        ai_score: aiScore,
        enriched_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in company-enrichment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});