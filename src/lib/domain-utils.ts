/**
 * Utility functions for domain extraction and normalization
 */

/**
 * Extracts the main domain from a URL or website string
 * e.g., "https://www.techcloudltd.com/" -> "techcloudltd.com"
 */
export function extractMainDomain(url: string): string {
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

/**
 * Normalizes a company name for comparison
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Checks if two domains are the same (including subdomains)
 */
export function areSameDomain(domain1: string, domain2: string): boolean {
  const normalized1 = extractMainDomain(domain1);
  const normalized2 = extractMainDomain(domain2);
  
  return normalized1 === normalized2;
}

/**
 * Checks if two company names are similar enough to be considered duplicates
 */
export function areSimilarCompanyNames(name1: string, name2: string): boolean {
  const normalized1 = normalizeCompanyName(name1);
  const normalized2 = normalizeCompanyName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one is contained in the other (for cases like "TechCorp" vs "TechCorp Inc")
  if (normalized1.length > 3 && normalized2.length > 3) {
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
  
  return false;
}

/**
 * Extracts email domain for KDM duplicate checking
 */
export function extractEmailDomain(email: string): string {
  if (!email) return '';
  
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}