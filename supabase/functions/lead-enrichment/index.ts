import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  leadId: string;
  companyName: string;
  website?: string;
  apolloApiKey: string;
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
    const { leadId, companyName, website, apolloApiKey }: EnrichmentRequest = await req.json();

    if (!apolloApiKey) {
      throw new Error('Apollo API key is required');
    }

    console.log(`Enriching lead ${leadId} for company: ${companyName}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call Apollo.io API for company enrichment
    const apolloResponse = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': apolloApiKey,
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        q_organization_domains: website ? [website] : undefined,
        page: 1,
        per_page: 1,
      }),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('Apollo API error:', errorText);
      throw new Error(`Apollo API error: ${apolloResponse.status}`);
    }

    const apolloData = await apolloResponse.json() as ApolloResponse;
    const organization = apolloData.organization;

    if (!organization) {
      console.log('No organization data found from Apollo');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Company not found in Apollo database' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare enrichment data
    const enrichmentData = {
      apollo_data: {
        industry: organization.industry,
        employees: organization.estimated_num_employees,
        funding: organization.total_funding,
        technologies: organization.technologies || [],
        founded_year: organization.founded_year,
        linkedin_url: organization.linkedin_url,
        location: organization.location,
        recent_funding: organization.recent_funding,
        enriched_at: new Date().toISOString(),
      },
    };

    // Update the lead with enrichment data
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        enrichment_data: enrichmentData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    // Check if we should create signals based on enrichment data
    const signals = [];

    // Funding signal
    if (organization.recent_funding && organization.recent_funding.amount > 1000000) {
      signals.push({
        company_name: companyName,
        signal_type: 'funding',
        signal_title: `${organization.recent_funding.type} funding of $${(organization.recent_funding.amount / 1000000).toFixed(1)}M`,
        signal_description: `Recently raised ${organization.recent_funding.type} funding of $${organization.recent_funding.amount.toLocaleString()}`,
        priority: organization.recent_funding.amount > 10000000 ? 'high' : 'medium',
        lead_id: leadId,
      });
    }

    // Technology signal
    if (organization.technologies && organization.technologies.length > 0) {
      const relevantTech = organization.technologies.filter(tech => 
        ['salesforce', 'hubspot', 'microsoft', 'aws', 'google'].some(keyword => 
          tech.toLowerCase().includes(keyword)
        )
      );
      
      if (relevantTech.length > 0) {
        signals.push({
          company_name: companyName,
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