import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KDMRequest {
  companyId: string;
}

const KDM_TITLES = [
  'CEO', 'Chief Executive Officer',
  'COO', 'Chief Operating Officer', 'Director of Operations', 'Head of Operations',
  'HRO', 'CHRO', 'Chief Human Resources Officer', 'Director of Human Resources', 'Head of Human Resources', 'VP of Human Resources'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json() as KDMRequest;
    
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    
    if (!apolloApiKey) {
      throw new Error('Apollo API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    // Only search for KDMs if company score is above 40%
    if (company.ai_score < 40) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Company score below threshold (40%), skipping KDM discovery',
        kdms_found: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Discovering KDMs for company:', company.company_name, 'Score:', company.ai_score);

    const foundKDMs: any[] = [];

    // Search for each KDM title type
    for (const title of KDM_TITLES) {
      try {
        const searchBody = {
          api_key: apolloApiKey,
          q_person_title: title,
          organization_ids: company.enrichment_data?.apollo_id ? [company.enrichment_data.apollo_id] : undefined,
          q_organization_domain: company.website ? company.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : undefined,
          page: 1,
          per_page: 3 // Limit to avoid hitting rate limits
        };

        // Remove undefined fields
        Object.keys(searchBody).forEach(key => 
          searchBody[key as keyof typeof searchBody] === undefined && delete searchBody[key as keyof typeof searchBody]
        );

        console.log('Apollo people search for', title, ':', searchBody);

        const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(searchBody)
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          
          if (apolloData.people && apolloData.people.length > 0) {
            for (const person of apolloData.people.slice(0, 2)) { // Max 2 per title
              const contactType = title.includes('CEO') ? 'ceo' :
                                title.includes('COO') || title.includes('Operations') ? 'coo' :
                                title.includes('HR') ? 'hro' : 'kdm';

              const kdm = {
                company_id: companyId,
                name: `${person.first_name} ${person.last_name}`,
                designation: person.title || title,
                email: person.email,
                phone: person.phone_numbers?.[0]?.sanitized_number,
                linkedin_profile: person.linkedin_url,
                facebook_profile: person.facebook_url,
                instagram_profile: '', // Apollo doesn't provide Instagram
                contact_type: contactType
              };

              foundKDMs.push(kdm);
            }
          }
        } else {
          console.error('Apollo people search failed for', title, ':', await apolloResponse.text());
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`KDM search failed for title ${title}:`, error);
      }
    }

    // Insert found KDMs
    if (foundKDMs.length > 0) {
      const { data: insertedKDMs, error: insertError } = await supabase
        .from('decision_makers')
        .insert(foundKDMs.map(kdm => ({
          company_id: kdm.company_id,
          first_name: kdm.name.split(' ')[0],
          last_name: kdm.name.split(' ').slice(1).join(' '),
          designation: kdm.designation,
          email: kdm.email,
          phone: kdm.phone,
          linkedin_profile: kdm.linkedin_profile,
          facebook_profile: kdm.facebook_profile,
          instagram_profile: kdm.instagram_profile,
          contact_type: kdm.contact_type,
          confidence_score: 85
        })))
        .select();

      if (insertError) {
        console.error('Error inserting KDMs:', insertError);
        throw insertError;
      }

      console.log('Successfully found and stored', insertedKDMs?.length || 0, 'KDMs for', company.company_name);

      return new Response(JSON.stringify({
        success: true,
        kdms: insertedKDMs,
        kdms_found: insertedKDMs?.length || 0,
        company_name: company.company_name,
        message: `Found ${insertedKDMs?.length || 0} key decision makers`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      kdms: [],
      kdms_found: 0,
      company_name: company.company_name,
      message: 'No KDMs found for this company'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in kdm-discovery function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});