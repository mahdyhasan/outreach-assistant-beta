import { supabase } from "@/integrations/supabase/client";
import { extractMainDomain, areSameDomain, areSimilarCompanyNames } from "./domain-utils";

/**
 * Check for duplicate companies based on website domain and company name
 */
export async function checkCompanyDuplicate(
  companyName: string, 
  website: string, 
  excludeId?: string
): Promise<{ isDuplicate: boolean; duplicates: any[] }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Build query
    let query = supabase
      .from('companies')
      .select('id, company_name, website')
      .eq('user_id', user.id);

    // Exclude current company if updating
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data: existingCompanies, error } = await query;
    
    if (error) throw error;
    
    const duplicates: any[] = [];
    const mainDomain = extractMainDomain(website);
    
    for (const company of existingCompanies || []) {
      // Check domain match (primary check)
      if (website && company.website) {
        const existingDomain = extractMainDomain(company.website);
        if (mainDomain && existingDomain && areSameDomain(mainDomain, existingDomain)) {
          duplicates.push({
            ...company,
            matchType: 'domain',
            reason: `Same domain: ${existingDomain}`
          });
          continue;
        }
      }
      
      // Check company name similarity (secondary check)
      if (areSimilarCompanyNames(companyName, company.company_name)) {
        duplicates.push({
          ...company,
          matchType: 'name',
          reason: `Similar company name: ${company.company_name}`
        });
      }
    }
    
    return {
      isDuplicate: duplicates.length > 0,
      duplicates
    };
  } catch (error) {
    console.error('Error checking company duplicate:', error);
    return { isDuplicate: false, duplicates: [] };
  }
}

/**
 * Check for duplicate KDMs based on email and LinkedIn profile
 */
export async function checkKDMDuplicate(
  email: string,
  linkedinProfile: string,
  companyId?: string
): Promise<{ isDuplicate: boolean; duplicates: any[] }> {
  try {
    let query = supabase
      .from('decision_makers')
      .select('id, first_name, last_name, email, linkedin_profile, company_id');

    // If checking within a specific company
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: existingKDMs, error } = await query;
    
    if (error) throw error;
    
    const duplicates: any[] = [];
    
    for (const kdm of existingKDMs || []) {
      // Check email match (primary)
      if (email && kdm.email && email.toLowerCase() === kdm.email.toLowerCase()) {
        duplicates.push({
          ...kdm,
          matchType: 'email',
          reason: `Same email: ${kdm.email}`
        });
        continue;
      }
      
      // Check LinkedIn profile match (secondary)
      if (linkedinProfile && kdm.linkedin_profile && 
          linkedinProfile.toLowerCase() === kdm.linkedin_profile.toLowerCase()) {
        duplicates.push({
          ...kdm,
          matchType: 'linkedin',
          reason: `Same LinkedIn profile: ${kdm.linkedin_profile}`
        });
      }
    }
    
    return {
      isDuplicate: duplicates.length > 0,
      duplicates
    };
  } catch (error) {
    console.error('Error checking KDM duplicate:', error);
    return { isDuplicate: false, duplicates: [] };
  }
}

/**
 * Check for duplicate signals to avoid re-generating the same signal
 */
export async function checkSignalDuplicate(
  companyId: string,
  signalTitle: string,
  signalType: string,
  signalUrl?: string
): Promise<{ isDuplicate: boolean; duplicates: any[] }> {
  try {
    let query = supabase
      .from('signals')
      .select('id, signal_title, signal_type, signal_url, created_at')
      .eq('company_id', companyId)
      .eq('signal_type', signalType);

    // Check for exact title match or URL match
    const { data: existingSignals, error } = await query;
    
    if (error) throw error;
    
    const duplicates: any[] = [];
    
    for (const signal of existingSignals || []) {
      // Check exact title match
      if (signal.signal_title.toLowerCase() === signalTitle.toLowerCase()) {
        duplicates.push({
          ...signal,
          matchType: 'title',
          reason: `Same signal title: ${signal.signal_title}`
        });
        continue;
      }
      
      // Check URL match if both have URLs
      if (signalUrl && signal.signal_url && 
          signalUrl.toLowerCase() === signal.signal_url.toLowerCase()) {
        duplicates.push({
          ...signal,
          matchType: 'url',
          reason: `Same signal URL: ${signal.signal_url}`
        });
      }
    }
    
    return {
      isDuplicate: duplicates.length > 0,
      duplicates
    };
  } catch (error) {
    console.error('Error checking signal duplicate:', error);
    return { isDuplicate: false, duplicates: [] };
  }
}