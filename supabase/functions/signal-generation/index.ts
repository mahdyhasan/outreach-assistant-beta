import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignalGenerationRequest {
  company_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json() as SignalGenerationRequest;
    
    if (!company_id) {
      throw new Error('Company ID is required');
    }

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

    console.log('Generating signals for company:', company.company_name);

    const signals: any[] = [];

    // 1. News and funding signals using Serper
    if (serperApiKey) {
      const newsQueries = [
        `"${company.company_name}" funding raised investment`,
        `"${company.company_name}" expansion hiring new office`,
        `"${company.company_name}" product launch announcement`,
        `"${company.company_name}" partnership acquisition merger`
      ];

      for (const query of newsQueries) {
        try {
          const serperResponse = await fetch('https://google.serper.dev/news', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              q: query, 
              num: 3,
              tbs: 'qdr:m3' // Last 3 months
            })
          });

          if (serperResponse.ok) {
            const data = await serperResponse.json();
            if (data.news && data.news.length > 0) {
              for (const article of data.news) {
                let signalType = 'news';
                let priority = 'medium';
                
                if (article.title.toLowerCase().includes('funding') || 
                    article.title.toLowerCase().includes('investment') ||
                    article.title.toLowerCase().includes('raised')) {
                  signalType = 'funding';
                  priority = 'high';
                } else if (article.title.toLowerCase().includes('hiring') ||
                          article.title.toLowerCase().includes('expansion')) {
                  signalType = 'growth';
                  priority = 'high';
                } else if (article.title.toLowerCase().includes('launch') ||
                          article.title.toLowerCase().includes('product')) {
                  signalType = 'product';
                  priority = 'medium';
                }

                signals.push({
                  company_id: company_id,
                  signal_type: signalType,
                  signal_title: article.title,
                  signal_description: article.snippet,
                  signal_url: article.link,
                  priority: priority,
                  detected_at: article.date || new Date().toISOString(),
                  processed: false
                });
              }
            }
          }
        } catch (error) {
          console.error(`News search failed for query: ${query}`, error);
        }
      }
    }

    // 2. Job posting signals
    if (serperApiKey) {
      try {
        const jobQuery = `"${company.company_name}" site:linkedin.com/jobs OR site:indeed.com OR site:glassdoor.com`;
        const jobResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: jobQuery, num: 5 })
        });

        if (jobResponse.ok) {
          const data = await jobResponse.json();
          if (data.organic && data.organic.length > 0) {
            signals.push({
              company_id: company_id,
              signal_type: 'hiring',
              signal_title: `${company.company_name} is actively hiring`,
              signal_description: `Found ${data.organic.length} recent job postings indicating growth and expansion`,
              priority: 'medium',
              detected_at: new Date().toISOString(),
              processed: false
            });
          }
        }
      } catch (error) {
        console.error('Job search failed:', error);
      }
    }

    // 3. AI-powered signal analysis
    if (openaiApiKey && company.enrichment_data) {
      try {
        const analysisPrompt = `
Analyze this company data and identify key business signals:

Company: ${company.company_name}
Industry: ${company.industry}
Data: ${JSON.stringify(company.enrichment_data, null, 2)}

Identify specific signals that indicate:
- Growth opportunities
- Technology adoption
- Market expansion
- Business readiness for new partnerships

Respond with a JSON array of signals: [{"type": "signal_type", "title": "Signal Title", "description": "Description", "priority": "high|medium|low"}]
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
              { role: 'system', content: 'You are a business intelligence analyst. Extract actionable business signals from company data.' },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.2
          }),
        });

        if (gptResponse.ok) {
          const gptData = await gptResponse.json();
          let content = gptData.choices[0].message.content;
          
          // Clean up the response
          if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0];
          } else if (content.includes('```')) {
            content = content.split('```')[1];
          }
          
          try {
            const aiSignals = JSON.parse(content.trim());
            if (Array.isArray(aiSignals)) {
              for (const signal of aiSignals) {
                signals.push({
                  company_id: company_id,
                  signal_type: signal.type || 'ai_insight',
                  signal_title: signal.title,
                  signal_description: signal.description,
                  priority: signal.priority || 'medium',
                  detected_at: new Date().toISOString(),
                  processed: false
                });
              }
            }
          } catch (parseError) {
            console.error('Failed to parse AI signals:', parseError);
          }
        }
      } catch (error) {
        console.error('AI signal analysis failed:', error);
      }
    }

    // Check for duplicate signals before inserting
    if (signals.length > 0) {
      const { data: existingSignals } = await supabase
        .from('signals')
        .select('signal_title, signal_type, signal_url')
        .eq('company_id', company_id);

      const uniqueSignals = signals.filter(signal => {
        const isDuplicate = existingSignals?.some(existing => 
          existing.signal_type === signal.signal_type && (
            existing.signal_title.toLowerCase() === signal.signal_title.toLowerCase() ||
            (existing.signal_url && signal.signal_url && existing.signal_url === signal.signal_url)
          )
        );
        
        if (isDuplicate) {
          console.log(`Skipping duplicate signal: ${signal.signal_title}`);
          return false;
        }
        
        return true;
      });

      if (uniqueSignals.length === 0) {
        console.log('All signals were duplicates, skipping insert');
        return new Response(JSON.stringify({
          success: true,
          signals: [],
          signals_found: 0,
          company_name: company.company_name,
          message: 'No new signals found (all were duplicates)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: insertedSignals, error: insertError } = await supabase
        .from('signals')
        .insert(uniqueSignals)
        .select();

      if (insertError) {
        console.error('Error inserting signals:', insertError);
        throw insertError;
      }

      console.log('Successfully generated', insertedSignals?.length || 0, 'unique signals for', company.company_name);

      return new Response(JSON.stringify({
        success: true,
        signals: insertedSignals,
        signals_found: insertedSignals?.length || 0,
        company_name: company.company_name,
        message: `Generated ${insertedSignals?.length || 0} new signals`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      signals: [],
      signals_found: 0,
      company_name: company.company_name,
      message: 'No new signals found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in signal-generation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});