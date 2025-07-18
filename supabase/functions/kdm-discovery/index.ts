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
  maxCredits?: number; // Maximum credits user wants to spend
}

interface ApolloUsageResponse {
  current_period_usage: {
    contact_info_requests: number;
    people_searches: number;
  };
  plan_limits: {
    contact_info_requests: number;
    people_searches: number;
  };
}

// Track Apollo API usage
async function trackApolloUsage(supabase: any, userId: string, apiName: string, creditsUsed: number = 1) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await supabase
      .from('api_usage_tracking')
      .upsert({
        user_id: userId,
        api_name: apiName,
        date: today,
        daily_count: creditsUsed,
        last_operation: 'kdm_discovery',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,api_name,date',
        ignoreDuplicates: false
      });
  } catch (error) {
    console.error('Error tracking Apollo usage:', error);
  }
}

// Get verified contact info from Apollo
async function getVerifiedContactInfo(personId: string, apolloApiKey: string): Promise<any> {
  try {
    const response = await fetch(`https://api.apollo.io/v1/people/${personId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloApiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.person;
    } else {
      console.error('Failed to get verified contact info:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error getting verified contact info:', error);
    return null;
  }
}

// Check Apollo usage
async function checkApolloUsage(apolloApiKey: string): Promise<ApolloUsageResponse | null> {
  try {
    const response = await fetch('https://api.apollo.io/v1/usage', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apolloApiKey
      }
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to check Apollo usage:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error checking Apollo usage:', error);
    return null;
  }
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
    const { companyId, maxCredits = 10 } = await req.json() as KDMRequest;
    
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

    // Check Apollo usage first
    const apolloUsage = await checkApolloUsage(apolloApiKey);
    let remainingCredits = 0;
    
    if (apolloUsage) {
      remainingCredits = apolloUsage.plan_limits.contact_info_requests - apolloUsage.current_period_usage.contact_info_requests;
      console.log(`Apollo credits remaining: ${remainingCredits}`);
      
      if (remainingCredits < maxCredits) {
        return new Response(JSON.stringify({
          success: false,
          error: `Insufficient Apollo credits. Remaining: ${remainingCredits}, Required: ${maxCredits}`,
          credits_remaining: remainingCredits,
          credits_required: maxCredits
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    }

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*, user_id')
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
    const skippedDueToUnverifiedEmail: string[] = [];
    let creditsUsed = 0;

    // Get existing KDMs for this company to check for duplicates
    const { data: existingKDMs } = await supabase
      .from('decision_makers')
      .select('email, linkedin_profile')
      .eq('company_id', companyId);

    const existingEmails = new Set(existingKDMs?.map(kdm => kdm.email).filter(Boolean) || []);
    const existingLinkedins = new Set(existingKDMs?.map(kdm => kdm.linkedin_profile).filter(Boolean) || []);

    // Loop through each title in prioritized order
    for (const title of KDM_TITLES) {
      if (selectedKDMs.length >= 2 || creditsUsed >= maxCredits) {
        break; // Stop once we have 2 KDMs or reached credit limit
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
              // Stop if we've reached credit limit
              if (creditsUsed >= maxCredits) {
                console.log('Reached maximum credit limit');
                break;
              }

              // Check for duplicates
              const isDuplicateEmail = person.email && existingEmails.has(person.email);
              const isDuplicateLinkedin = person.linkedin_url && existingLinkedins.has(person.linkedin_url);
              
              if (isDuplicateEmail || isDuplicateLinkedin) {
                skippedDueToDuplication.push(`${person.first_name} ${person.last_name} (${title})`);
                continue;
              }

              // Skip if no person ID for contact reveal
              if (!person.id) {
                console.log(`Skipping ${person.first_name} ${person.last_name} - no person ID`);
                continue;
              }

              // Get verified contact info (costs 1 credit)
              console.log(`Getting verified contact info for ${person.first_name} ${person.last_name} (${person.id})`);
              const verifiedPerson = await getVerifiedContactInfo(person.id, apolloApiKey);
              creditsUsed++;

              if (verifiedPerson && verifiedPerson.email && verifiedPerson.email_status === 'verified') {
                // Check for duplicates with verified email
                if (existingEmails.has(verifiedPerson.email)) {
                  skippedDueToDuplication.push(`${verifiedPerson.first_name} ${verifiedPerson.last_name} (${title}) - Duplicate verified email`);
                  continue;
                }

                // Add valid KDM with verified email
                const kdm = {
                  company_id: companyId,
                  first_name: verifiedPerson.first_name || '',
                  last_name: verifiedPerson.last_name || '',
                  designation: verifiedPerson.title || title,
                  email: verifiedPerson.email,
                  phone: verifiedPerson.phone_number,
                  linkedin_profile: verifiedPerson.linkedin_url,
                  facebook_profile: verifiedPerson.facebook_url,
                  contact_type: 'kdm',
                  confidence_score: 90,
                  email_status: 'verified'
                };

                selectedKDMs.push(kdm);
                
                // Add to existing sets to prevent duplicates in same search
                existingEmails.add(verifiedPerson.email);
                if (verifiedPerson.linkedin_url) existingLinkedins.add(verifiedPerson.linkedin_url);
                
                console.log(`Added verified KDM: ${verifiedPerson.first_name} ${verifiedPerson.last_name} (${title}) - ${verifiedPerson.email}`);
                break; // Stop checking this title once a valid KDM is added
              } else {
                skippedDueToUnverifiedEmail.push(`${person.first_name} ${person.last_name} (${title}) - No verified email`);
                console.log(`Skipped ${person.first_name} ${person.last_name} - no verified email`);
              }

              // Small delay between contact reveals
              await new Promise(resolve => setTimeout(resolve, 200));
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

    // Track Apollo usage
    if (creditsUsed > 0 && company.user_id) {
      await trackApolloUsage(supabase, company.user_id, 'apollo_contact_reveals', creditsUsed);
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
          title: kdm.designation,
          email: kdm.email
        })) || [],
        titles_searched: titlesSearched,
        skipped_due_to_duplication: skippedDueToDuplication,
        skipped_due_to_unverified_email: skippedDueToUnverifiedEmail,
        credits_used: creditsUsed,
        credits_remaining: remainingCredits - creditsUsed,
        company_name: company.company_name,
        message: `Found and saved ${insertedKDMs?.length || 0} key decision makers using ${creditsUsed} Apollo credits`
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
      skipped_due_to_unverified_email: skippedDueToUnverifiedEmail,
      credits_used: creditsUsed,
      credits_remaining: remainingCredits - creditsUsed,
      company_name: company.company_name,
      message: creditsUsed > 0 ? 
        `No new verified KDMs found after using ${creditsUsed} Apollo credits` :
        'No KDMs found using search API only'
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