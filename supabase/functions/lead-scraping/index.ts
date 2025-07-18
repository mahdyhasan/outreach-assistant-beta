import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Domain utility function for consistent domain extraction
function extractMainDomain(url: string): string {
  if (!url) return '';
  
  try {
    // Remove protocol if present
    let domain = url.replace(/^https?:\/\//, '');
    
    // Remove www. prefix
    domain = domain.replace(/^www\./, '');
    
    // Remove trailing slash and path
    domain = domain.split('/')[0];
    
    // Remove port if present
    domain = domain.split(':')[0];
    
    return domain.toLowerCase();
  } catch (error) {
    console.error('Error extracting domain:', error);
    return '';
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapingRequest {
  industry: string;
  geography: string;
  limit: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Lead scraping function called');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { industry, geography, limit }: ScrapingRequest = await req.json();
    
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!serperApiKey || !apolloApiKey) {
      throw new Error('Missing required API keys (SERPER_API_KEY, APOLLO_API_KEY)');
    }

    console.log(`Scraping leads for ${industry} in ${geography}, limit: ${limit}`);

    // Step 1: Use Serper to search for companies
    const searchQuery = `"${industry}" companies ${geography} startup scaleup`;
    
    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: searchQuery,
        num: limit,
        gl: geography === 'uk-au' ? 'uk' : 'us',
      }),
    });

    if (!serperResponse.ok) {
      throw new Error('Failed to search with Serper API');
    }

    const serperData = await serperResponse.json();
    console.log(`Found ${serperData.organic?.length || 0} search results`);

    const companies = [];
    
    // Extract company websites from search results
    for (const result of serperData.organic?.slice(0, limit) || []) {
      if (result.link && result.title) {
        try {
          const domain = new URL(result.link).hostname.replace('www.', '');
          companies.push({
            name: result.title.split(' - ')[0].split(' | ')[0],
            website: `https://${domain}`,
            description: result.snippet || '',
          });
        } catch (e) {
          console.log('Invalid URL:', result.link);
        }
      }
    }

    console.log(`Extracted ${companies.length} companies`);

    // Step 2: Use Apollo to enrich company data
    const enrichedLeads = [];
    
    for (const company of companies) {
      try {
        // Search for the company in Apollo
        const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/search', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'X-Api-Key': apolloApiKey,
          },
          body: JSON.stringify({
            q_organization_domains: extractMainDomain(company.website),
            page: 1,
            per_page: 1,
          }),
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          const orgData = apolloData.organizations?.[0];
          
          if (orgData) {
            // Get people from this organization
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
                per_page: 3,
                person_titles: ['CEO', 'CTO', 'Founder', 'Director', 'VP', 'Manager'],
              }),
            });

            let contacts = [];
            if (peopleResponse.ok) {
              const peopleData = await peopleResponse.json();
              contacts = peopleData.people || [];
            }

            // Create lead entries for each contact
            for (const contact of contacts.slice(0, 2)) { // Limit to 2 contacts per company
              if (contact.email) {
                const lead = {
                  company_name: orgData.name || company.name,
                  contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
                  email: contact.email,
                  job_title: contact.title || 'Unknown',
                  company_size: orgData.estimated_num_employees ? 
                    `${orgData.estimated_num_employees}` : 'Unknown',
                  industry: orgData.industry || industry,
                  location: `${orgData.city || ''}, ${orgData.country || ''}`.trim(),
                  website: company.website,
                  linkedin_url: contact.linkedin_url || null,
                  phone: contact.phone || null,
                  source: 'automated_scraping',
                  status: 'pending_review',
                  priority: 'medium',
                  ai_score: Math.floor(Math.random() * 30) + 70, // 70-100
                  final_score: Math.floor(Math.random() * 30) + 70,
                  enrichment_data: {
                    company_data: orgData,
                    contact_data: contact,
                    search_source: 'serper_apollo'
                  }
                };
                
                enrichedLeads.push(lead);
              }
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error enriching company:', company.name, error);
      }
    }

    console.log(`Enriched ${enrichedLeads.length} leads`);

    // Step 3: Check for duplicates and insert leads into database
    if (enrichedLeads.length > 0) {
      // Get user from auth
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Check existing companies to avoid duplicates
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
        
        // Add to sets to prevent duplicates within this batch
        if (leadDomain) existingDomains.add(leadDomain);
        existingNames.add(leadName);
        
        return true;
      });

      if (uniqueLeads.length === 0) {
        console.log('All leads were duplicates, skipping insert');
      } else {
        // Convert leads to companies format
        const companiesData = uniqueLeads.map(lead => ({
          company_name: lead.company_name,
          website: lead.website,
          industry: lead.industry,
          employee_size: lead.company_size,
          location: lead.location,
          public_email: lead.email?.includes('@') ? lead.email : null,
          public_phone: lead.phone,
          linkedin_profile: lead.linkedin_url,
          description: `Contact: ${lead.contact_name} (${lead.job_title})`,
          user_id: user.id,
          source: 'automated_scraping',
          status: 'pending_review',
          ai_score: lead.ai_score,
          enrichment_data: lead.enrichment_data
        }));

        const { data, error } = await supabaseClient
          .from('companies')
          .insert(companiesData)
          .select();

        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }

        console.log(`Successfully inserted ${data.length} unique companies into database`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads: enrichedLeads,
        count: enrichedLeads.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in lead-scraping function:', error);
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