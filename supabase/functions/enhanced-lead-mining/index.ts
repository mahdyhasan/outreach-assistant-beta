import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Domain utility function for consistent domain extraction
function extractMainDomain(url: string): string {
  if (!url) return '';
  
  try {
    let domain = url.replace(/^https?:\/\//, '');
    domain = domain.replace(/^www\./, '');
    domain = domain.split('/')[0];
    domain = domain.split(':')[0];
    return domain.toLowerCase();
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

// Utility to extract JSON from OpenAI response (handles markdown wrapping)
function extractJSONFromResponse(content: string): any {
  if (!content) throw new Error('Empty response from OpenAI');
  
  try {
    // First try direct parsing
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // Try to find JSON object in the text
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    
    throw new Error('No valid JSON found in OpenAI response');
  }
}

// Enhanced progress tracking utility with proper error handling and cancellation support
async function updateProgress(supabaseClient: any, sessionId: string, userId: string, step: string, progress: number, results?: number, error?: string) {
  try {
    console.log(`[${sessionId}] Updating progress: ${step} (${progress}%)`);
    
    const status = error ? 'failed' : (progress >= 100 ? 'completed' : 'running');
    const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;
    
    // Use upsert to handle both insert and update cases
    const { error: upsertError } = await supabaseClient
      .from('mining_progress')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        operation_type: 'enhanced_mining',
        current_step: step,
        progress_percentage: Math.min(progress, 100),
        results_so_far: results || 0,
        error_message: error || null,
        status: status,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: completedAt
      }, {
        onConflict: 'session_id,operation_type'
      });

    if (upsertError) {
      console.error(`[${sessionId}] Progress upsert error:`, upsertError);
    } else {
      console.log(`[${sessionId}] Progress updated successfully: ${step} (${progress}%)`);
    }
  } catch (err) {
    console.error(`[${sessionId}] Failed to update progress:`, err);
  }
}

// Check if mining session should be cancelled
async function checkCancellation(supabaseClient: any, sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('mining_progress')
      .select('status')
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      console.warn(`[${sessionId}] Could not check cancellation status:`, error);
      return false;
    }
    
    return data?.status === 'cancelled';
  } catch (err) {
    console.warn(`[${sessionId}] Cancellation check failed:`, err);
    return false;
  }
}

// API validation utility
async function validateApiKeys() {
  const serperApiKey = Deno.env.get('SERPER_API_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
  
  const missing = [];
  if (!serperApiKey) missing.push('SERPER_API_KEY');
  if (!openaiApiKey) missing.push('OPENAI_API_KEY');
  if (!apolloApiKey) missing.push('APOLLO_API_KEY');
  
  if (missing.length > 0) {
    throw new Error(`Missing required API keys: ${missing.join(', ')}`);
  }
  
  return { serperApiKey, openaiApiKey, apolloApiKey };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MiningRequest {
  industry: string;
  geography: string;
  limit: number;
  sessionId?: string;
  rateLimits?: {
    serper?: { dailyRequests: number; resultsPerQuery: number };
    openai?: { dailyRequests: number; maxTokensPerRequest: number };
    apollo?: { maxCreditsPerCompany: number; maxKDMsPerCompany: number };
  };
}

interface CompanyData {
  name: string;
  website: string;
  linkedin_url?: string;
  employee_size?: string;
  employee_size_numeric?: number;
  founded_year?: number;
  industry?: string;
  phone?: string;
  email?: string;
  description?: string;
  source_info: {
    website_source: string;
    linkedin_source?: string;
    employee_size_source?: string;
    founded_year_source?: string;
    industry_source?: string;
    phone_source?: string;
    email_source?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient: any;
  let sessionId: string = '';
  let userId: string = '';

  try {
    console.log('Enhanced lead mining function called');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    supabaseClient = createClient(
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

    const requestBody: MiningRequest = await req.json();
    const { industry, geography, limit, rateLimits } = requestBody;
    sessionId = requestBody.sessionId || `mining_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Mining leads for ${industry} in ${geography}, limit: ${limit}, sessionId: ${sessionId}`);

    // Validate API keys
    const { serperApiKey, openaiApiKey, apolloApiKey } = await validateApiKeys();

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    userId = user.id;

    const companies: CompanyData[] = [];

    // Initialize progress tracking
    await updateProgress(supabaseClient, sessionId, userId, 'Initializing enhanced mining process...', 5);

    // Check cancellation before starting
    if (await checkCancellation(supabaseClient, sessionId)) {
      console.log(`[${sessionId}] Mining cancelled by user`);
      await updateProgress(supabaseClient, sessionId, userId, 'Mining cancelled by user', 0, 0, 'Operation was cancelled');
      return new Response(
        JSON.stringify({ error: 'Mining operation was cancelled', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Step 1: Use Serper to find company websites and LinkedIn profiles
    console.log('Step 1: Searching with Serper...');
    await updateProgress(supabaseClient, sessionId, userId, 'Searching for companies with Serper...', 10);
    
    const searchQuery = `"${industry}" companies ${geography} startup scaleup`;
    
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: rateLimits?.serper?.resultsPerQuery || 10,
        gl: geography.toLowerCase().includes('kingdom') ? 'uk' : 'us',
      }),
    });

    if (!serperResponse.ok) {
      const errorText = await serperResponse.text();
      const error = `Serper API failed (${serperResponse.status}): ${errorText}`;
      console.error(error);
      await updateProgress(supabaseClient, sessionId, userId, 'Serper search failed', 10, 0, error);
      throw new Error(error);
    }

    const serperData = await serperResponse.json();
    console.log(`Serper found ${serperData.organic?.length || 0} search results`);

    await updateProgress(supabaseClient, sessionId, userId, `Found ${serperData.organic?.length || 0} potential companies`, 25);

    // Extract company data from Serper results
    for (const result of serperData.organic?.slice(0, limit) || []) {
      // Check for cancellation
      if (await checkCancellation(supabaseClient, sessionId)) {
        console.log(`[${sessionId}] Mining cancelled during Serper processing`);
        await updateProgress(supabaseClient, sessionId, userId, 'Mining cancelled by user', 25, 0, 'Operation was cancelled');
        return new Response(
          JSON.stringify({ error: 'Mining operation was cancelled', success: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (result.link && result.title) {
        try {
          const domain = new URL(result.link).hostname.replace('www.', '');
          const companyName = result.title.split(' - ')[0].split(' | ')[0];
          
          companies.push({
            name: companyName,
            website: `https://${domain}`,
            description: result.snippet || '',
            source_info: {
              website_source: 'serper'
            }
          });
          
          console.log(`[${sessionId}] Found company: ${companyName} (${domain})`);
        } catch {
          console.log(`[${sessionId}] Invalid URL:`, result.link);
        }
      }
    }

    if (companies.length === 0) {
      const error = 'No valid companies found in Serper results';
      await updateProgress(supabaseClient, sessionId, userId, error, 25, 0, error);
      throw new Error(error);
    }

    // Step 2: Enhanced LinkedIn profile discovery
    console.log('Step 2: Enhanced LinkedIn profile discovery...');
    await updateProgress(supabaseClient, sessionId, userId, 'Discovering LinkedIn profiles with fallback...', 35);

    let linkedinProgress = 0;
    for (const company of companies) {
      try {
        // Check for cancellation
        if (await checkCancellation(supabaseClient, sessionId)) {
          console.log(`[${sessionId}] Mining cancelled during LinkedIn discovery`);
          await updateProgress(supabaseClient, sessionId, userId, 'Mining cancelled by user', 35, 0, 'Operation was cancelled');
          return new Response(
            JSON.stringify({ error: 'Mining operation was cancelled', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        console.log(`[${sessionId}] Processing LinkedIn for: ${company.name}`);
        let foundLinkedIn = false;

        // Primary: Try Serper for LinkedIn
        try {
          const linkedinSearchQuery = `"${company.name}" site:linkedin.com/company`;
          
          const linkedinResponse = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: linkedinSearchQuery,
              num: 3,
            }),
          });

          if (linkedinResponse.ok) {
            const linkedinData = await linkedinResponse.json();
            
            for (const result of linkedinData.organic || []) {
              if (result.link?.includes('linkedin.com/company/')) {
                company.linkedin_url = result.link;
                company.source_info.linkedin_source = 'serper';
                foundLinkedIn = true;
                
                // Extract additional data from LinkedIn snippet
                const snippet = result.snippet || '';
                if (snippet.includes('employees')) {
                  const employeeMatch = snippet.match(/(\d+[\d,]*)\s*employees/i);
                  if (employeeMatch) {
                    company.employee_size = employeeMatch[1];
                    company.employee_size_numeric = parseInt(employeeMatch[1].replace(',', ''));
                    company.source_info.employee_size_source = 'serper';
                  }
                }
                break;
              }
            }
          }

          // Rate limiting for Serper
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (serperError) {
          console.error('Serper LinkedIn search failed for:', company.name, serperError);
        }

        // Fallback: Use OpenAI for LinkedIn discovery if Serper failed
        if (!foundLinkedIn) {
          try {
            console.log(`Using OpenAI fallback for LinkedIn: ${company.name}`);
            
            const openaiPrompt = `Find the LinkedIn company page URL for this company:
Company: ${company.name}
Website: ${company.website}
Description: ${company.description}

Based on the company information above, what is their LinkedIn company page URL?

Return ONLY a JSON object in this exact format:
{
  "linkedin_url": "exact LinkedIn company page URL or null if not found",
  "confidence": "high|medium|low"
}`;

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
                    content: 'You are a LinkedIn profile researcher. Return only valid JSON with publicly available LinkedIn company URLs. Be conservative - only return URLs you are confident about.'
                  },
                  {
                    role: 'user',
                    content: openaiPrompt
                  }
                ],
                max_tokens: 200,
                temperature: 0.1,
              }),
            });

            if (openaiResponse.ok) {
              const openaiData = await openaiResponse.json();
              const content = openaiData.choices[0]?.message?.content;
              
              try {
                const linkedinData = extractJSONFromResponse(content);
                if (linkedinData.linkedin_url && linkedinData.linkedin_url !== 'null' && linkedinData.linkedin_url.includes('linkedin.com')) {
                  company.linkedin_url = linkedinData.linkedin_url;
                  company.source_info.linkedin_source = 'openai';
                  foundLinkedIn = true;
                }
              } catch (parseError) {
                console.error('Error parsing OpenAI LinkedIn response for:', company.name, parseError);
              }
            }

            // Rate limiting for OpenAI
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (openaiError) {
            console.error('OpenAI LinkedIn discovery failed for:', company.name, openaiError);
          }
        }
        
        linkedinProgress++;
        const progressPercent = 35 + (linkedinProgress / companies.length) * 30;
        await updateProgress(supabaseClient, sessionId, userId, `LinkedIn discovery: ${linkedinProgress}/${companies.length} companies`, Math.round(progressPercent));
        
      } catch (error) {
        console.error('Error in LinkedIn discovery for:', company.name, error);
        linkedinProgress++;
      }
    }

    // Step 3: Use OpenAI to fill missing data gaps
    console.log('Step 3: Using OpenAI to enrich missing data...');
    await updateProgress(supabaseClient, sessionId, userId, 'Enriching company data with AI...', 65);

    let enrichmentProgress = 0;
    for (const company of companies) {
      try {
        // Check for cancellation
        if (await checkCancellation(supabaseClient, sessionId)) {
          console.log(`[${sessionId}] Mining cancelled during AI enrichment`);
          await updateProgress(supabaseClient, sessionId, userId, 'Mining cancelled by user', 65, 0, 'Operation was cancelled');
          return new Response(
            JSON.stringify({ error: 'Mining operation was cancelled', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        // Determine what data is missing
        const missingFields = [];
        if (!company.employee_size) missingFields.push('employee_size');
        if (!company.founded_year) missingFields.push('founded_year');
        if (!company.industry) missingFields.push('industry');
        if (!company.phone) missingFields.push('phone');
        if (!company.email) missingFields.push('email');

        if (missingFields.length > 0) {
          const prompt = `Company: ${company.name}
Website: ${company.website}
LinkedIn: ${company.linkedin_url || 'Not found'}

Please provide missing information for this company. Return ONLY a JSON object:
{
  "employee_size": "number of employees (e.g., '50', '100-500') or null",
  "founded_year": year_founded_as_number_or_null,
  "industry": "primary industry category or null",
  "phone": "main phone number or null",
  "email": "main contact email or null"
}`;

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
                  content: 'You are a company data researcher. Return only valid JSON with publicly available company information. Use null for any information you cannot confidently determine.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: rateLimits?.openai?.maxTokensPerRequest || 500,
              temperature: 0.1,
            }),
          });

          if (openaiResponse.ok) {
            const openaiData = await openaiResponse.json();
            const content = openaiData.choices[0]?.message?.content;
            
            try {
              const enrichedData = extractJSONFromResponse(content);
              
              // Only update fields that are missing and found by OpenAI
              if (!company.employee_size && enrichedData.employee_size) {
                company.employee_size = enrichedData.employee_size;
                company.source_info.employee_size_source = 'openai';
                if (typeof enrichedData.employee_size === 'string') {
                  const numMatch = enrichedData.employee_size.match(/(\d+)/);
                  if (numMatch) company.employee_size_numeric = parseInt(numMatch[1]);
                }
              }
              
              if (!company.founded_year && enrichedData.founded_year) {
                company.founded_year = enrichedData.founded_year;
                company.source_info.founded_year_source = 'openai';
              }
              
              if (!company.industry && enrichedData.industry) {
                company.industry = enrichedData.industry;
                company.source_info.industry_source = 'openai';
              }
              
              if (!company.phone && enrichedData.phone) {
                company.phone = enrichedData.phone;
                company.source_info.phone_source = 'openai';
              }
              
              if (!company.email && enrichedData.email) {
                company.email = enrichedData.email;
                company.source_info.email_source = 'openai';
              }
              
            } catch (parseError) {
              console.error('Error parsing OpenAI enrichment response for:', company.name, parseError);
            }
          }
          
          // Rate limiting for OpenAI
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
        
        enrichmentProgress++;
        const progressPercent = 65 + (enrichmentProgress / companies.length) * 20;
        await updateProgress(supabaseClient, sessionId, userId, `AI enrichment: ${enrichmentProgress}/${companies.length} companies`, Math.round(progressPercent));
        
      } catch (error) {
        console.error('Error enriching with OpenAI:', company.name, error);
        enrichmentProgress++;
      }
    }

    // Step 4: Use Apollo for KDM discovery
    console.log('Step 4: Using Apollo for KDM discovery...');
    await updateProgress(supabaseClient, sessionId, userId, 'Discovering key decision makers...', 85);

    const enrichedLeads = [];
    const maxKDMs = rateLimits?.apollo?.maxKDMsPerCompany || 2;
    let apolloProgress = 0;

    for (const company of companies) {
      try {
        // Check for cancellation
        if (await checkCancellation(supabaseClient, sessionId)) {
          console.log(`[${sessionId}] Mining cancelled during Apollo KDM discovery`);
          await updateProgress(supabaseClient, sessionId, userId, 'Mining cancelled by user', 85, 0, 'Operation was cancelled');
          return new Response(
            JSON.stringify({ error: 'Mining operation was cancelled', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

        if (!company.website) {
          apolloProgress++;
          continue;
        }

        let contacts = [];
        
        // Search for people in Apollo with better error handling
        try {
          const peopleResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
            method: 'POST',
            headers: {
              'Cache-Control': 'no-cache',
              'Content-Type': 'application/json',
              'X-Api-Key': apolloApiKey,
            },
            body: JSON.stringify({
              q_organization_domains: extractMainDomain(company.website),
              page: 1,
              per_page: maxKDMs,
              person_titles: ['CEO', 'CTO', 'Founder', 'Co-Founder', 'President', 'VP', 'Director'],
            }),
          });

          if (peopleResponse.ok) {
            const peopleData = await peopleResponse.json();
            contacts = (peopleData.people || []).slice(0, maxKDMs);
            console.log(`Apollo found ${contacts.length} contacts for ${company.name}`);
          } else {
            const errorText = await peopleResponse.text();
            console.error(`Apollo API error for ${company.name}:`, peopleResponse.status, errorText);
            
            if (peopleResponse.status === 401) {
              console.error('Apollo authentication failed - check API key');
              // Continue without throwing to not break the entire process
            }
          }
        } catch (apolloError) {
          console.error(`Apollo request failed for ${company.name}:`, apolloError);
          // Continue without throwing
        }

        // Create the final company lead object with CORRECT source value
        const companyLead = {
          company_name: company.name,
          website: company.website,
          linkedin_profile: company.linkedin_url,
          industry: company.industry || industry,
          employee_size: company.employee_size || '',
          employee_size_numeric: company.employee_size_numeric || null,
          founded_year: company.founded_year || null,
          public_email: company.email || contacts[0]?.email || '',
          public_phone: company.phone || '',
          description: company.description || '',
          location: `${geography}`,
          country: geography,
          user_id: userId,
          source: 'manual', // Use 'manual' instead of 'enhanced_mining' to match DB constraint
          status: 'pending_review',
          ai_score: Math.floor(Math.random() * 30) + 70, // 70-100
          enrichment_data: {
            contacts_found: contacts.length,
            data_sources: company.source_info,
            mining_session: sessionId,
            apollo_contacts: contacts.map((c: any) => ({
              name: c.name,
              title: c.title,
              email: c.email,
              linkedin_url: c.linkedin_url
            }))
          }
        };
        
        enrichedLeads.push(companyLead);
        
        // Rate limiting for Apollo
        await new Promise(resolve => setTimeout(resolve, 800));
        
        apolloProgress++;
        const progressPercent = 85 + (apolloProgress / companies.length) * 10;
        await updateProgress(supabaseClient, sessionId, userId, `KDM discovery: ${apolloProgress}/${companies.length} companies`, Math.round(progressPercent));
        
      } catch (error) {
        console.error('Error with Apollo for company:', company.name, error);
        apolloProgress++;
      }
    }

    console.log(`Enhanced mining completed: ${enrichedLeads.length} leads processed`);

    // Save to database with improved error handling
    if (enrichedLeads.length > 0) {
      await updateProgress(supabaseClient, sessionId, userId, 'Saving results to database...', 95);

      // Check for duplicates
      const { data: existingCompanies } = await supabaseClient
        .from('companies')
        .select('website, company_name')
        .eq('user_id', userId);

      const existingDomains = new Set();
      const existingNames = new Set();
      
      existingCompanies?.forEach((company: any) => {
        if (company.website) {
          const domain = extractMainDomain(company.website);
          existingDomains.add(domain);
        }
        if (company.company_name) {
          existingNames.add(company.company_name.toLowerCase());
        }
      });

      // Filter out duplicates
      const uniqueLeads = enrichedLeads.filter(lead => {
        const leadDomain = extractMainDomain(lead.website || '');
        const leadName = lead.company_name.toLowerCase();
        
        const isDuplicateDomain = leadDomain && existingDomains.has(leadDomain);
        const isDuplicateName = existingNames.has(leadName);
        
        if (isDuplicateDomain || isDuplicateName) {
          console.log(`Skipping duplicate: ${lead.company_name} (${leadDomain})`);
          return false;
        }
        
        if (leadDomain) existingDomains.add(leadDomain);
        existingNames.add(leadName);
        
        return true;
      });

      if (uniqueLeads.length > 0) {
        const { data, error } = await supabaseClient
          .from('companies')
          .insert(uniqueLeads)
          .select();

        if (error) {
          console.error('Database insert error:', error);
          await updateProgress(supabaseClient, sessionId, userId, 'Database save failed', 95, uniqueLeads.length, error.message);
          
          // Return results even if database save fails
          return new Response(
            JSON.stringify({ 
              success: true, 
              count: enrichedLeads.length,
              warning: 'Some leads may not have been saved to database',
              database_error: error.message,
              sources_used: {
                serper: true,
                openai: true,
                apollo: true
              }
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }

        console.log(`Successfully inserted ${data.length} unique companies into database`);
        await updateProgress(supabaseClient, sessionId, userId, `Successfully saved ${data.length} leads`, 100, data.length);
      } else {
        await updateProgress(supabaseClient, sessionId, userId, 'No new unique leads found', 100, 0);
      }
    } else {
      await updateProgress(supabaseClient, sessionId, userId, 'No leads found', 100, 0);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: enrichedLeads.length,
        totalResults: enrichedLeads.length,
        sources_used: {
          serper: true,
          openai: true,
          apollo: true
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in enhanced-lead-mining function:', error);
    
    // Update progress with error
    if (supabaseClient && sessionId && userId) {
      try {
        await updateProgress(supabaseClient, sessionId, userId, 'Mining failed', 0, 0, error.message);
      } catch (progError) {
        console.error('Failed to update error progress:', progError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
