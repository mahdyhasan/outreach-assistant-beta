import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface APIUsage {
  apiName: 'apollo' | 'serper' | 'openai';
  dailyCount: number;
  hourlyCount: number;
  minuteCount: number;
  lastCall: Date;
}

interface RateLimitConfig {
  daily: number;
  hourly: number;
  perMinute: number;
}

const API_LIMITS: Record<string, RateLimitConfig> = {
  apollo: { daily: 1000, hourly: 100, perMinute: 10 },
  serper: { daily: 2500, hourly: 250, perMinute: 25 },
  openai: { daily: 10000, hourly: 1000, perMinute: 60 }
};

export const useAPIRateLimiter = () => {
  const [apiUsage, setApiUsage] = useState<Record<string, APIUsage>>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkRateLimit = useCallback(async (apiName: 'apollo' | 'serper' | 'openai', operation: string) => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: { api_name: apiName, operation }
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return { allowed: false, reason: 'Rate limit check failed' };
      }

      // Update local usage tracking
      if (data.usage) {
        setApiUsage(prev => ({
          ...prev,
          [apiName]: {
            apiName,
            dailyCount: data.usage.daily_count || 0,
            hourlyCount: data.usage.hourly_count || 0,
            minuteCount: data.usage.minute_count || 0,
            lastCall: new Date()
          }
        }));
      }

      return {
        allowed: data.allowed,
        reason: data.reason,
        remaining: data.remaining
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      return { allowed: false, reason: 'Rate limiter service unavailable' };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const getAPIHealth = useCallback((apiName: string) => {
    const usage = apiUsage[apiName];
    if (!usage) return 'unknown';

    const limits = API_LIMITS[apiName];
    if (!limits) return 'unknown';

    const dailyPercent = (usage.dailyCount / limits.daily) * 100;
    const hourlyPercent = (usage.hourlyCount / limits.hourly) * 100;
    const minutePercent = (usage.minuteCount / limits.perMinute) * 100;

    if (minutePercent >= 90 || hourlyPercent >= 90 || dailyPercent >= 90) {
      return 'critical';
    } else if (minutePercent >= 70 || hourlyPercent >= 70 || dailyPercent >= 70) {
      return 'warning';
    } else {
      return 'good';
    }
  }, [apiUsage]);

  const predictOptimalBatchSize = useCallback((apiName: string) => {
    const usage = apiUsage[apiName];
    const limits = API_LIMITS[apiName];
    
    if (!usage || !limits) return 5; // Default batch size

    const minuteRemaining = limits.perMinute - usage.minuteCount;
    const hourlyRemaining = limits.hourly - usage.hourlyCount;
    
    // Conservative batching based on remaining quota
    return Math.min(
      Math.max(1, Math.floor(minuteRemaining / 2)),
      Math.max(1, Math.floor(hourlyRemaining / 10)),
      10 // Max batch size
    );
  }, [apiUsage]);

  const waitForRateLimit = useCallback(async (apiName: string) => {
    const usage = apiUsage[apiName];
    const limits = API_LIMITS[apiName];
    
    if (!usage || !limits) return;

    // If we've hit the per-minute limit, wait until next minute
    if (usage.minuteCount >= limits.perMinute) {
      const timeSinceLastCall = Date.now() - usage.lastCall.getTime();
      const waitTime = Math.max(0, 60000 - timeSinceLastCall); // Wait until next minute
      
      if (waitTime > 0) {
        console.log(`Rate limit reached for ${apiName}, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }, [apiUsage]);

  return {
    checkRateLimit,
    getAPIHealth,
    predictOptimalBatchSize,
    waitForRateLimit,
    apiUsage,
    isChecking
  };
};