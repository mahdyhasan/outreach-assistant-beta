import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface ErrorRecoveryOptions {
  operation: string;
  retryConfig?: Partial<RetryConfig>;
  fallbackApis?: string[];
  timeoutMs?: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

export const useErrorRecovery = () => {
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>({});
  const [isRecovering, setIsRecovering] = useState(false);

  const exponentialBackoff = useCallback((attempt: number, config: RetryConfig) => {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
      config.maxDelay
    );
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: ErrorRecoveryOptions
  ): Promise<T> => {
    const config = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
    const operationKey = options.operation;
    
    setIsRecovering(true);
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      setRetryAttempts(prev => ({ ...prev, [operationKey]: attempt }));
      
      try {
        // Add timeout wrapper
        const timeoutPromise = options.timeoutMs 
          ? Promise.race([
              operation(),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error(`Operation timed out after ${options.timeoutMs}ms`)), options.timeoutMs)
              )
            ])
          : operation();
          
        const result = await timeoutPromise;
        setRetryAttempts(prev => ({ ...prev, [operationKey]: 0 }));
        setIsRecovering(false);
        return result;
      } catch (error) {
        console.error(`Attempt ${attempt} failed for ${operationKey}:`, error);
        
        // If this is the last attempt, throw the error
        if (attempt > config.maxRetries) {
          setIsRecovering(false);
          throw error;
        }
        
        // Wait before retrying
        const delay = exponentialBackoff(attempt, config);
        console.log(`Retrying ${operationKey} in ${delay}ms (attempt ${attempt + 1}/${config.maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setIsRecovering(false);
    throw new Error(`Max retries exceeded for ${operationKey}`);
  }, [exponentialBackoff]);

  const recoverSession = useCallback(async (sessionId: string) => {
    try {
      console.log(`Attempting to recover mining session: ${sessionId}`);
      
      const { error } = await supabase
        .rpc('recover_mining_session', {
          p_session_id: sessionId,
          p_user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw error;
      }

      console.log(`Successfully recovered session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Session recovery failed:', error);
      return false;
    }
  }, []);

  const checkAPIHealth = useCallback(async (apiEndpoint: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      // Simple health check - this would be customized per API
      const response = await fetch(apiEndpoint, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      console.error(`Health check failed for ${apiEndpoint}:`, error);
      return false;
    }
  }, []);

  const selectFallbackAPI = useCallback(async (fallbackApis: string[]) => {
    for (const api of fallbackApis) {
      const isHealthy = await checkAPIHealth(api);
      if (isHealthy) {
        console.log(`Selected fallback API: ${api}`);
        return api;
      }
    }
    
    console.warn('No healthy fallback APIs available');
    return null;
  }, [checkAPIHealth]);

  const cleanupOldSessions = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('cleanup_old_mining_sessions');
      if (error) {
        console.error('Failed to cleanup old sessions:', error);
      } else {
        console.log('Successfully cleaned up old mining sessions');
      }
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }, []);

  return {
    withRetry,
    recoverSession,
    selectFallbackAPI,
    cleanupOldSessions,
    retryAttempts,
    isRecovering
  };
};