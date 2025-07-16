import { useState, useEffect } from "react";

interface APIKey {
  id: string;
  name: string;
  key: string;
  description: string;
  isActive: boolean;
  customName?: string; // For custom APIs
  // Zoho Email specific fields
  emailHost?: string;
  emailUsername?: string;
  emailPassword?: string;
  imapHost?: string;
  imapUsername?: string;
  imapPassword?: string;
}

interface ScoringWeights {
  companySize: number;
  techStack: number;
  funding: number;
  jobPostings: number;
  geographic: number;
}

interface TargetCountries {
  selectedCountries: string[];
  availableCountries: string[];
}

interface EmailSettings {
  signature: string;
  emailPrompt: string;
}

interface MiningSettings {
  dailyLimit: number;
  autoApprovalThreshold: number;
  frequencyHours: number;
  enableSignalDetection: boolean;
  enableAutoEnrichment: boolean;
}

export function useSettings() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>({
    companySize: 30,
    techStack: 25,
    funding: 25,
    jobPostings: 20,
    geographic: 15
  });
  const [targetCountries, setTargetCountries] = useState<TargetCountries>({
    selectedCountries: ['United Kingdom', 'Australia'],
    availableCountries: [
      'United Kingdom', 'Australia', 'Singapore', 'Malaysia', 'Qatar',
      'Canada', 'United States', 'Germany', 'France', 'Netherlands',
      'Switzerland', 'Ireland', 'New Zealand', 'UAE', 'India'
    ]
  });
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    signature: `Best regards,\n[Your Name]\n[Your Company]\n[Your Contact Information]`,
    emailPrompt: `Write a professional cold email to {contactName} at {companyName}. 
Use the following company data: {companyData}
Use the following contact data: {contactData}
Keep it concise, personalized, and focused on value proposition.
Always use the contact's first name in greeting.`
  });
  const [miningSettings, setMiningSettings] = useState<MiningSettings>({
    dailyLimit: 100,
    autoApprovalThreshold: 70,
    frequencyHours: 24,
    enableSignalDetection: true,
    enableAutoEnrichment: true
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedApiKeys = localStorage.getItem('apiKeys');
    const savedScoringWeights = localStorage.getItem('scoringWeights');
    const savedTargetCountries = localStorage.getItem('targetCountries');
    const savedEmailSettings = localStorage.getItem('emailSettings');
    const savedMiningSettings = localStorage.getItem('miningSettings');

    if (savedApiKeys) {
      setApiKeys(JSON.parse(savedApiKeys));
    } else {
      // Default API keys
      setApiKeys([
        {
          id: "apollo",
          name: "Apollo.io API",
          key: "",
          description: "For lead enrichment and company data",
          isActive: true
        },
        {
          id: "openai",
          name: "OpenAI API",
          key: "",
          description: "For AI-powered lead scoring and analysis",
          isActive: true
        },
        {
          id: "perplexity",
          name: "Perplexity API",
          key: "",
          description: "For real-time company intelligence and signals",
          isActive: false
        },
        {
          id: "google-search",
          name: "Google Search API",
          key: "",
          description: "For lead discovery and company research",
          isActive: false
        },
        {
          id: "zoho-email",
          name: "Zoho Email",
          key: "",
          description: "For email sending and management",
          isActive: false,
          emailHost: "",
          emailUsername: "",
          emailPassword: "",
          imapHost: "",
          imapUsername: "",
          imapPassword: ""
        }
      ]);
    }

    if (savedScoringWeights) {
      setScoringWeights(JSON.parse(savedScoringWeights));
    }

    if (savedTargetCountries) {
      setTargetCountries(JSON.parse(savedTargetCountries));
    }

    if (savedEmailSettings) {
      setEmailSettings(JSON.parse(savedEmailSettings));
    }

    if (savedMiningSettings) {
      setMiningSettings(JSON.parse(savedMiningSettings));
    }
  }, []);

  const getApiKey = (keyId: string): string => {
    const apiKey = apiKeys.find(key => key.id === keyId && key.isActive);
    return apiKey?.key || "";
  };

  const isApiActive = (keyId: string): boolean => {
    const apiKey = apiKeys.find(key => key.id === keyId);
    return apiKey?.isActive && !!apiKey.key || false;
  };

  const saveSettings = () => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    localStorage.setItem('scoringWeights', JSON.stringify(scoringWeights));
    localStorage.setItem('targetCountries', JSON.stringify(targetCountries));
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
    localStorage.setItem('miningSettings', JSON.stringify(miningSettings));
  };

  return {
    // State
    apiKeys,
    scoringWeights,
    targetCountries,
    emailSettings,
    miningSettings,
    
    // Setters
    setApiKeys,
    setScoringWeights,
    setTargetCountries,
    setEmailSettings,
    setMiningSettings,
    
    // Utilities
    getApiKey,
    isApiActive,
    saveSettings
  };
}