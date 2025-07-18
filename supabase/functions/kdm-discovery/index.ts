import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

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

interface KDMRequest {
  companyId: string;
}

// Prioritized list of titles to search in order
const KDM_TITLES = [
  "CEO",
  "COO", 
  "Chief People Officer",
  "Director of Operations",
  "Human Resources Director",
  "Head of Operations",
  "Head of HR",
  "HR Manager",
  "Operations Manager"
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

    const selectedKDMs: any[] = [];
    const titlesSearched: string[] = [];
    const skippedDueToDuplication: string[] = [];

    // Get existing KDMs for this company to check for duplicates
    const { data: existingKDMs } = await supabase
      .from('decision_makers')
      .select('email, linkedin_profile')
      .eq('company_id', companyId);

    const existingEmails = new Set(existingKDMs?.map(kdm => kdm.email).filter(Boolean) || []);
    const existingLinkedins = new Set(existingKDMs?.map(kdm => kdm.linkedin_profile).filter(Boolean) || []);

    // Loop through each title in prioritized order
    for (const title of KDM_TITLES) {
      if (selectedKDMs.length >= 2) {
        break; // Stop once we have 2 KDMs
      }

      titlesSearched.push(title);
      
      try {
        // Use website domain as primary search criteria, fallback to company name
        const searchDomain = extractMainDomain(company.website || '');
        
        const searchBody = searchDomain ? {
          q_organization_domains: [searchDomain],
          person_titles: [title],
          page: 1,
          per_page: 5
        } : {
          q_organization_names: [company.company_name],
          person_titles: [title],
          page: 1,
          per_page: 5
        };

        console.log(`Search method: ${searchDomain ? 'Domain-based' : 'Company name-based'}`, 
                   `Value: ${searchDomain || company.company_name}`);

        console.log('Apollo people search for', title, ':', searchBody);

        const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Api-Key': apolloApiKey
          },
          body: JSON.stringify(searchBody)
        });

        if (apolloResponse.ok) {
          const apolloData = await apolloResponse.json();
          
          if (apolloData.people && apolloData.people.length > 0) {
            // Check each person returned
            for (const person of apolloData.people) {
              // Check for duplicates
              const isDuplicateEmail = person.email && existingEmails.has(person.email);
              const isDuplicateLinkedin = person.linkedin_url && existingLinkedins.has(person.linkedin_url);
              
              if (isDuplicateEmail || isDuplicateLinkedin) {
                skippedDueToDuplication.push(`${person.first_name} ${person.last_name} (${title})`);
                continue;
              }

              // Add valid KDM
              const kdm = {
                company_id: companyId,
                first_name: person.first_name || '',
                last_name: person.last_name || '',
                designation: person.title || title,
                email: person.email,
                linkedin_profile: person.linkedin_url,
                contact_type: 'kdm',
                confidence_score: 85
              };

              selectedKDMs.push(kdm);
              
              // Add to existing sets to prevent duplicates in same search
              if (person.email) existingEmails.add(person.email);
              if (person.linkedin_url) existingLinkedins.add(person.linkedin_url);
              
              console.log(`Added KDM: ${person.first_name} ${person.last_name} (${title})`);
              break; // Stop checking this title once a valid KDM is added
            }
          }
        } else {
          console.error('Apollo people search failed for', title, ':', await apolloResponse.text());
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`KDM search failed for title ${title}:`, error);
      }
    }

    // Insert selected KDMs
    if (selectedKDMs.length > 0) {
      const { data: insertedKDMs, error: insertError } = await supabase
        .from('decision_makers')
        .insert(selectedKDMs)
        .select();

      if (insertError) {
        console.error('Error inserting KDMs:', insertError);
        throw insertError;
      }

      console.log('Successfully found and stored', insertedKDMs?.length || 0, 'KDMs for', company.company_name);

      return new Response(JSON.stringify({
        success: true,
        kdms_saved: insertedKDMs?.length || 0,
        kdms: insertedKDMs?.map(kdm => ({
          name: `${kdm.first_name} ${kdm.last_name}`,
          title: kdm.designation
        })) || [],
        titles_searched: titlesSearched,
        skipped_due_to_duplication: skippedDueToDuplication,
        company_name: company.company_name,
        message: `Found and saved ${insertedKDMs?.length || 0} key decision makers`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      kdms_saved: 0,
      kdms: [],
      titles_searched: titlesSearched,
      skipped_due_to_duplication: skippedDueToDuplication,
      company_name: company.company_name,
      message: 'No new KDMs found for this company'
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