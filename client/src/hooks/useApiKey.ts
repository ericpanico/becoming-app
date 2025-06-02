import { useState, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { apiKeySchema } from '@shared/schema';

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(() => storage.getApiKey());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveApiKey = useCallback(async (key: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate API key format
      apiKeySchema.parse({ key });
      
      // Test the API key with a simple request
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      });

      if (!testResponse.ok) {
        throw new Error('Invalid API key - please check your OpenAI API key');
      }

      storage.setApiKey(key);
      setApiKey(key);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save API key';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeApiKey = useCallback(() => {
    storage.removeApiKey();
    setApiKey(null);
    setError(null);
  }, []);

  return {
    apiKey,
    saveApiKey,
    removeApiKey,
    isLoading,
    error,
    hasApiKey: !!apiKey
  };
}
