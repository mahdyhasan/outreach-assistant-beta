import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  leadId: string;
  email?: string;
  companyName?: string;
  domain?: string;
}

interface ApolloResponse {
  organization?: {
    name: string;
    website_url: string;
    industry: string;
    estimated_num_employees: number;
    total_funding: number;
    technologies: string[];
    founded_year: number;
    linkedin_url: string;
    location: {
      country: string;
      region: string;
      city: string;
    };
    recent_funding?: {
      amount: number;
      type: string;
      date: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, email, companyName, domain }: EnrichmentRequest = await req.json();

    console.log(`Enriching lead ${leadId} for company: ${companyName}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get lead data first
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    let enrichmentData: any = {};

    // Try Apollo.io enrichment if API key is available
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    if (apolloApiKey && (email || domain || companyName || lead.company_name)) {
      console.log('Attempting Apollo.io enrichment...');
      
      try {
        // Call Apollo.io API for person/company enrichment
        const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            'X-Api-Key': apolloApiKey,
          },
          body: JSON.stringify({
            q_person_emails: email || lead.email ? [email || lead.email] : undefined,
            q_organization_domains: domain || lead.website ? [domain || lead.website] : undefined,
            q_organization_name: companyName || lead.company_name || undefined,
            page: 1,
            per_page: 1,
          }),
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          console.log('Apollo.io response received');
          
          if (apolloData.people && apolloData.people.length > 0) {
            const person = apolloData.people[0];
            enrichmentData.apollo_data = {
              person: {
                name: person.name,
                title: person.title,
                linkedin_url: person.linkedin_url,
                phone_numbers: person.phone_numbers,
              },
              organization: person.organization ? {
                name: person.organization.name,
                website_url: person.organization.website_url,
                linkedin_url: person.organization.linkedin_url,
                industry: person.organization.industry,
                employees: person.organization.estimated_num_employees,
                location: person.organization.primary_location?.city,
                description: person.organization.short_description,
                technologies: person.organization.technologies || [],
                funding: person.organization.total_funding || 0,
                founded_year: person.organization.founded_year,
              } : null
            };
          }
        } else {
          console.log('Apollo.io API error:', apolloResponse.status);
        }
      } catch (apolloError) {
        console.error('Apollo.io enrichment failed:', apolloError);
      }
    }

    // Try Serper Google Search for additional company information
    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    if (serperApiKey && (companyName || lead.company_name)) {
      console.log('Attempting Google Search enrichment...');
      
      try {
        const searchQuery = `"${companyName || lead.company_name}" company information contact`;
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 5,
          }),
        });

        if (serperResponse.ok) {
          const searchData = await serperResponse.json();
          console.log('Google Search completed');
          
          enrichmentData.search_results = {
            organic: searchData.organic?.slice(0, 3) || [],
            knowledge_graph: searchData.knowledgeGraph || null,
          };
        }
      } catch (searchError) {
        console.error('Google Search enrichment failed:', searchError);
      }
    }

    // Prepare enrichment data
    if (Object.keys(enrichmentData).length === 0) {
      console.log('No enrichment data found from any source');
      enrichmentData = {
        enriched_at: new Date().toISOString(),
        message: 'No enrichment data available from configured sources'
      };
    } else {
      enrichmentData.enriched_at = new Date().toISOString();
    }

    // Update the lead with enrichment data
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        enrichment_data: {
          ...lead.enrichment_data,
          ...enrichmentData,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lead:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    // Check if we should create signals based on enrichment data
    const signals = [];

    // Funding signal
    if (enrichmentData.apollo_data?.organization?.funding && enrichmentData.apollo_data.organization.funding > 1000000) {
      signals.push({
        company_name: companyName || lead.company_name,
        signal_type: 'funding',
        signal_title: `Company has significant funding of $${(enrichmentData.apollo_data.organization.funding / 1000000).toFixed(1)}M`,
        signal_description: `Total funding: $${enrichmentData.apollo_data.organization.funding.toLocaleString()}`,
        priority: enrichmentData.apollo_data.organization.funding > 10000000 ? 'high' : 'medium',
        lead_id: leadId,
      });
    }

    // Technology signal
    if (enrichmentData.apollo_data?.organization?.technologies && enrichmentData.apollo_data.organization.technologies.length > 0) {
      const relevantTech = enrichmentData.apollo_data.organization.technologies.filter((tech: string) => 
        ['salesforce', 'hubspot', 'microsoft', 'aws', 'google'].some(keyword => 
          tech.toLowerCase().includes(keyword)
        )
      );
      
      if (relevantTech.length > 0) {
        signals.push({
          company_name: companyName || lead.company_name,
          signal_type: 'news',
          signal_title: 'Uses relevant technology stack',
          signal_description: `Company uses: ${relevantTech.join(', ')}`,
          priority: 'medium',
          lead_id: leadId,
        });
      }
    }

    // Insert signals if any
    if (signals.length > 0) {
      const { error: signalsError } = await supabase
        .from('signals')
        .insert(signals);

      if (signalsError) {
        console.error('Error inserting signals:', signalsError);
      }
    }

    console.log(`Successfully enriched lead ${leadId}`);

    return new Response(
      JSON.stringify({
        success: true,
        lead: updatedLead,
        enrichment_data: enrichmentData,
        signals_created: signals.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lead-enrichment function:', error);
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