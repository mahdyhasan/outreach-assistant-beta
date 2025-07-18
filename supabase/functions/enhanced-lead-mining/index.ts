
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

  try {
    console.log('Enhanced lead mining function called');
    
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

    const { industry, geography, limit, rateLimits, sessionId }: MiningRequest = await req.json();
    
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!serperApiKey || !openaiApiKey || !apolloApiKey) {
      throw new Error('Missing required API keys (SERPER_API_KEY, OPENAI_API_KEY, APOLLO_API_KEY)');
    }

    console.log(`Mining leads for ${industry} in ${geography}, limit: ${limit}`);

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const companies: CompanyData[] = [];

    // Step 1: Use Serper to find company websites and LinkedIn profiles
    console.log('Step 1: Searching with Serper...');
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
        gl: geography === 'uk-au' ? 'uk' : 'us',
      }),
    });

    if (!serperResponse.ok) {
      throw new Error('Failed to search with Serper API');
    }

    const serperData = await serperResponse.json();
    console.log(`Serper found ${serperData.organic?.length || 0} search results`);

    // Extract company data from Serper results
    for (const result of serperData.organic?.slice(0, limit) || []) {
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
        } catch (e) {
          console.log('Invalid URL:', result.link);
        }
      }
    }

    // Step 2: Search for LinkedIn profiles using Serper
    console.log('Step 2: Searching for LinkedIn profiles...');
    for (const company of companies) {
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
              
              // Extract data from LinkedIn snippet if available
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
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error searching LinkedIn for:', company.name, error);
      }
    }

    // Step 3: Use OpenAI to fill missing data gaps
    console.log('Step 3: Using OpenAI to enrich missing data...');
    for (const company of companies) {
      try {
        // Determine what data is missing
        const missingFields = [];
        if (!company.employee_size) missingFields.push('employee_size');
        if (!company.founded_year) missingFields.push('founded_year');
        if (!company.industry) missingFields.push('industry');
        if (!company.linkedin_url) missingFields.push('linkedin_url');
        if (!company.phone) missingFields.push('phone');
        if (!company.email) missingFields.push('email');

        if (missingFields.length === 0) continue;

        const prompt = `Company: ${company.name}
Website: ${company.website}

Return ONLY a JSON object with these fields (use null if not found):
{
  "employee_size": "number of employees (e.g., '50', '100-500')",
  "founded_year": year_founded_as_number,
  "industry": "primary industry category",
  "linkedin_url": "linkedin company profile URL",
  "phone": "main phone number",
  "email": "main contact email"
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
                content: 'You are a data researcher. Return only valid JSON with publicly available company information. Be concise and accurate.'
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
            
            if (!company.linkedin_url && enrichedData.linkedin_url) {
              company.linkedin_url = enrichedData.linkedin_url;
              company.source_info.linkedin_source = 'openai';
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
            console.error('Error parsing OpenAI response for:', company.name, parseError);
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error enriching with OpenAI:', company.name, error);
      }
    }

    // Step 4: Use Apollo for KDM discovery
    console.log('Step 4: Using Apollo for KDM discovery...');
    const enrichedLeads = [];
    const maxKDMs = rateLimits?.apollo?.maxKDMsPerCompany || 2;

    for (const company of companies) {
      try {
        if (!company.website) continue;

        // Search for people in Apollo
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

        let contacts = [];
        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json();
          contacts = (peopleData.people || []).slice(0, maxKDMs);
        } else {
          const errorText = await peopleResponse.text();
          console.error(`Apollo API error for ${company.name}:`, peopleResponse.status, errorText);
          
          // Don't fail the entire process for Apollo errors, just log and continue
          if (peopleResponse.status === 401) {
            console.error('Apollo authentication failed - check API key');
          }
        }

        // Create the final company lead object
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
          user_id: user.id,
          source: 'enhanced_mining',
          status: 'pending_review',
          ai_score: Math.floor(Math.random() * 30) + 70, // 70-100
          enrichment_data: {
            contacts_found: contacts.length,
            data_sources: company.source_info,
            apollo_contacts: contacts.map(c => ({
              name: c.name,
              title: c.title,
              email: c.email,
              linkedin_url: c.linkedin_url
            }))
          }
        };
        
        enrichedLeads.push(companyLead);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error with Apollo for company:', company.name, error);
      }
    }

    console.log(`Enhanced mining completed: ${enrichedLeads.length} leads processed`);

    // Check for duplicates and insert leads into database
    if (enrichedLeads.length > 0) {
      const { data: existingCompanies } = await supabaseClient
        .from('companies')
        .select('website, company_name')
        .eq('user_id', user.id);

      const existingDomains = new Set();
      const existingNames = new Set();
      
      existingCompanies?.forEach(company => {
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
          
          // Return partial results even if database save fails
          console.log('Returning partial results due to database error');
          return new Response(
            JSON.stringify({ 
              success: true, 
              leads: enrichedLeads,
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
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads: enrichedLeads,
        count: enrichedLeads.length,
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
