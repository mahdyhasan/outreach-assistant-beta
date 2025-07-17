import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanySearchRequest {
  query?: string;           // Add the main search query
  industry?: string;
  location?: string;
  size?: string;           // Change from employee_size to size to match frontend
  limit?: number;
  linkedin_query?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    
    if (!apolloApiKey) {
      throw new Error('Apollo API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header and verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;

    const { query, industry, location, size, limit = 20, linkedin_query } = await req.json() as CompanySearchRequest;

    console.log('Searching companies with criteria:', { query, industry, location, size, limit, linkedin_query });

    let companies: any[] = [];

    // Primary search using Apollo
    if (query || industry || location || size) {
      const apolloSearchBody = {
        q_organization_domain_exists: true,
        q_organization_name: query || undefined,
        organization_locations: location ? [location] : undefined,
        organization_industry_tag_ids: industry ? [industry] : undefined,
        organization_num_employees_ranges: size ? [size] : undefined,
        page: 1,
        per_page: Math.min(limit, 100)
      };

      console.log('Apollo search request:', apolloSearchBody);

      const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloApiKey,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(apolloSearchBody)
      });

      if (apolloResponse.ok) {
        const apolloData = await apolloResponse.json();
        console.log('Apollo response received:', apolloData.organizations?.length || 0, 'companies');
        
        if (apolloData.organizations) {
          companies = apolloData.organizations.map((org: any) => ({
            company_name: org.name,
            website: org.website_url,
            industry: org.industry,
            employee_size: org.estimated_num_employees ? `${org.estimated_num_employees}` : '',
            founded: org.founded_year ? `${org.founded_year}` : '',
            description: org.short_description || '',
            public_email: '',
            public_phone: org.phone,
            linkedin_profile: org.linkedin_url,
            user_id: userId,
            enrichment_data: {
              apollo_id: org.id,
              logo_url: org.logo_url,
              location: org.primary_location,
              technologies: org.technologies || []
            },
            ai_score: 0,
            source: 'apollo',
            status: 'pending_review'
          }));
        }
      } else {
        console.error('Apollo search failed:', await apolloResponse.text());
      }
    }

    // LinkedIn search enhancement using Serper (if query provided)
    const searchQuery = linkedin_query || query;
    if (searchQuery && serperApiKey && companies.length < limit) {
      const linkedinSearchQuery = `site:linkedin.com/company ${searchQuery} ${industry || ''} ${location || ''}`.trim();
      
      const serperResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: linkedinSearchQuery,
          num: Math.min(10, limit - companies.length)
        })
      });

      if (serperResponse.ok) {
        const serperData = await serperResponse.json();
        console.log('LinkedIn search via Serper:', serperData.organic?.length || 0, 'results');
        
        if (serperData.organic) {
          const linkedinCompanies = serperData.organic
            .filter((result: any) => result.link.includes('linkedin.com/company'))
            .map((result: any) => {
              const companyName = result.title.replace(' | LinkedIn', '').replace(' - LinkedIn', '');
              return {
                company_name: companyName,
                website: '',
                industry: industry || '',
                employee_size: '',
                founded: '',
                description: result.snippet || '',
                public_email: '',
                public_phone: '',
                linkedin_profile: result.link,
                user_id: userId,
                enrichment_data: {
                  found_via: 'linkedin_search',
                  search_snippet: result.snippet
                },
                ai_score: 0,
                source: 'linkedin',
                status: 'pending_review'
              };
            });
          
          companies = [...companies, ...linkedinCompanies];
        }
      }
    }

    // Store companies in database
    if (companies.length > 0) {
      const { data: insertedCompanies, error: insertError } = await supabase
        .from('companies')
        .insert(companies)
        .select();

      if (insertError) {
        console.error('Error inserting companies:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted', insertedCompanies?.length || 0, 'companies');

      return new Response(JSON.stringify({
        success: true,
        companies: insertedCompanies,
        total_found: companies.length,
        decision_makers_found: 0, // Will be updated when decision makers are found
        message: `Found and stored ${insertedCompanies?.length || 0} companies`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      companies: [],
      count: 0,
      message: 'No companies found matching criteria'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in apollo-company-search function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});