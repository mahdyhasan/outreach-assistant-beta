export interface Company {
  id: string;
  company_name: string;
  website?: string;
  industry?: string;
  employee_size?: string;
  founded?: string;
  description?: string;
  public_email?: string;
  public_phone?: string;
  linkedin_profile?: string;
  enrichment_data?: Record<string, any>;
  ai_score: number;
  created_at: string;
  updated_at: string;
  source: string;
  status: string;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  designation: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_profile?: string;
  contact_type: 'kdm' | 'ceo' | 'coo' | 'hro';
  created_at: string;
  updated_at: string;
}

export interface CompanyWithContacts extends Company {
  contacts?: Contact[];
}