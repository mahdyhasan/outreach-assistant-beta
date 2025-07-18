import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
  dailySendLimit: number;
  trackingDuration: number;
  replyMonitoring: boolean;
}

interface MiningSettings {
  dailyLimit: number;
  autoApprovalThreshold: number;
  frequency: string;
}

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize with default API keys
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    { id: 'apollo', name: 'Apollo', key: '', description: 'Lead discovery and company data', isActive: false },
    { id: 'openai', name: 'OpenAI', key: '', description: 'AI-powered email generation', isActive: false },
    { id: 'serper', name: 'Serper', key: '', description: 'Real-time search and data enrichment', isActive: false },
    { id: 'zoho-email', name: 'Zoho Email', key: '', description: 'Email automation platform', isActive: false }
  ]);
  
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
Always use the contact's first name in greeting.`,
    dailySendLimit: 500,
    trackingDuration: 30,
    replyMonitoring: true
  });
  const [miningSettings, setMiningSettings] = useState<MiningSettings>({
    dailyLimit: 100,
    autoApprovalThreshold: 70,
    frequency: 'daily'
  });
  const [loading, setLoading] = useState(true);

  // Load settings from database on mount
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: userSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
        return;
      }

      if (userSettings) {
        // Parse API keys from JSONB - merge with defaults
        if (userSettings.api_keys) {
          const apiKeysData = userSettings.api_keys as Record<string, any>;
          const savedApiKeys = Object.values(apiKeysData) as APIKey[];
          
          // Merge saved keys with defaults, updating existing ones
          const defaultKeys = [
            { id: 'apollo', name: 'Apollo', key: '', description: 'Lead discovery and company data', isActive: false },
            { id: 'openai', name: 'OpenAI', key: '', description: 'AI-powered email generation', isActive: false },
            { id: 'serper', name: 'Serper', key: '', description: 'Real-time search and data enrichment', isActive: false },
            { id: 'zoho-email', name: 'Zoho Email', key: '', description: 'Email automation platform', isActive: false }
          ];
          
          const mergedKeys = defaultKeys.map(defaultKey => {
            const savedKey = savedApiKeys.find(saved => saved.id === defaultKey.id);
            return savedKey || defaultKey;
          });
          
          // Add any custom keys that aren't in defaults
          const customKeys = savedApiKeys.filter(saved => 
            !defaultKeys.some(def => def.id === saved.id)
          );
          
          setApiKeys([...mergedKeys, ...customKeys]);
        }

        // Parse scoring weights
        if (userSettings.scoring_weights) {
          setScoringWeights(userSettings.scoring_weights as unknown as ScoringWeights);
        }

        // Parse target countries
        if (userSettings.target_countries) {
          setTargetCountries(userSettings.target_countries as unknown as TargetCountries);
        }

        // Set email settings
        setEmailSettings({
          signature: userSettings.email_signature || emailSettings.signature,
          emailPrompt: userSettings.email_prompt || emailSettings.emailPrompt,
          dailySendLimit: userSettings.daily_send_limit || 500,
          trackingDuration: userSettings.tracking_duration || 30,
          replyMonitoring: userSettings.reply_monitoring ?? true
        });

        // Set mining settings
        setMiningSettings({
          dailyLimit: userSettings.daily_limit || 100,
          autoApprovalThreshold: userSettings.auto_approval_threshold || 70,
          frequency: userSettings.frequency || 'daily'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getApiKey = (keyId: string): string => {
    const apiKey = apiKeys.find(key => key.id === keyId && key.isActive);
    return apiKey?.key || "";
  };

  const isApiActive = (keyId: string): boolean => {
    const apiKey = apiKeys.find(key => key.id === keyId);
    return apiKey?.isActive && !!apiKey.key || false;
  };

  const saveSettings = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Convert API keys array to object format for JSONB
      const apiKeysObject = apiKeys.reduce((acc, key) => {
        acc[key.id] = key;
        return acc;
      }, {} as Record<string, APIKey>);

      const settingsData = {
        user_id: user.id,
        api_keys: apiKeysObject as any,
        email_signature: emailSettings.signature,
        email_prompt: emailSettings.emailPrompt,
        daily_send_limit: emailSettings.dailySendLimit,
        tracking_duration: emailSettings.trackingDuration,
        reply_monitoring: emailSettings.replyMonitoring,
        daily_limit: miningSettings.dailyLimit,
        auto_approval_threshold: miningSettings.autoApprovalThreshold,
        frequency: miningSettings.frequency,
        scoring_weights: scoringWeights as any,
        target_countries: targetCountries as any,
        updated_at: new Date().toISOString()
      };

      // Saving settings data

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Settings save error:', error);
        toast({
          title: "Error",
          description: `Failed to save settings: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Success", 
        description: "Settings saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving settings",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    // State
    apiKeys,
    scoringWeights,
    targetCountries,
    emailSettings,
    miningSettings,
    loading,
    
    // Setters
    setApiKeys,
    setScoringWeights,
    setTargetCountries,
    setEmailSettings,
    setMiningSettings,
    
    // Utilities
    getApiKey,
    isApiActive,
    saveSettings,
    loadSettings
  };
}