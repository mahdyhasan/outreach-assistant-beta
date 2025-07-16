export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  linkedinUrl?: string;
  phone?: string;
  jobTitle: string;
  companySize: string;
  industry: string;
  location: string;
  website?: string;
  
  // Scoring
  aiScore: number; // 0-100
  humanScore?: number; // Human-corrected score
  finalScore: number; // Score used for decisions (human score if available, else AI score)
  scoreReason: string[];
  
  // Status & Classification  
  status: 'new' | 'in_progress' | 'qualified' | 'nurture' | 'cold' | 'converted';
  priority: 'immediate' | 'queue' | 'nurture'; // Based on final score
  responseTag?: 'positive' | 'negative' | 'neutral' | 'no_response';
  
  // Enrichment data
  enrichmentData: {
    fundingRounds?: string[];
    techStack?: string[];
    recentNews?: string[];
    socialSignals?: string[];
    companyGrowthRate?: string;
    jobPostings?: number;
  };
  
  // Outreach tracking
  outreachHistory: OutreachActivity[];
  followupCount: number;
  lastContactDate?: Date;
  nextFollowupDate?: Date;
  
  // Learning data
  humanFeedback?: {
    originalScore: number;
    correctedScore: number;
    reason: string;
    correctedBy: string;
    correctedAt: Date;
  };
  
  // Metadata
  source: 'google' | 'linkedin' | 'clay' | 'apollo' | 'manual';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
}

export interface OutreachActivity {
  id: string;
  type: 'email' | 'linkedin_connection' | 'linkedin_message' | 'phone_call';
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'failed';
  subject?: string;
  message: string;
  sentAt: Date;
  responseAt?: Date;
  responseContent?: string;
}

export interface LeadFilters {
  search?: string;
  status?: Lead['status'][];
  priority?: Lead['priority'][];
  scoreRange?: [number, number];
  source?: Lead['source'][];
  dateRange?: {
    from: Date;
    to: Date;
  };
}