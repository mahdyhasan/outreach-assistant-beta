import { useState, useEffect } from "react";

interface APIKey {
  id: string;
  name: string;
  key: string;
  description: string;
  isActive: boolean;
}

interface ScoringWeights {
  companySize: number;
  techStack: number;
  funding: number;
  jobPostings: number;
  geographic: number;
}

interface GeographicScoring {
  uk: number;
  australia: number;
  singapore: number;
  malaysia: number;
  qatar: number;
  westernEurope: number;
  other: number;
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
  const [geographicScoring, setGeographicScoring] = useState<GeographicScoring>({
    uk: 40,
    australia: 40,
    singapore: 30,
    malaysia: 30,
    qatar: 30,
    westernEurope: 25,
    other: 10
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
    const savedGeographicScoring = localStorage.getItem('geographicScoring');
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
        }
      ]);
    }

    if (savedScoringWeights) {
      setScoringWeights(JSON.parse(savedScoringWeights));
    }

    if (savedGeographicScoring) {
      setGeographicScoring(JSON.parse(savedGeographicScoring));
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
    localStorage.setItem('geographicScoring', JSON.stringify(geographicScoring));
    localStorage.setItem('miningSettings', JSON.stringify(miningSettings));
  };

  return {
    // State
    apiKeys,
    scoringWeights,
    geographicScoring,
    miningSettings,
    
    // Setters
    setApiKeys,
    setScoringWeights,
    setGeographicScoring,
    setMiningSettings,
    
    // Utilities
    getApiKey,
    isApiActive,
    saveSettings
  };
}