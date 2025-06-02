import { useState, useCallback, useEffect } from 'react';
import { IdentitySummary } from '@shared/schema';
import { storage } from '@/lib/storage';

export function useIdentitySummary() {
  const [identitySummary, setIdentitySummary] = useState<IdentitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load identity summary on mount
  useEffect(() => {
    const summary = storage.getIdentitySummary();
    setIdentitySummary(summary);
  }, []);

  const updateIdentitySummary = useCallback(async (updates: Omit<IdentitySummary, 'id' | 'lastUpdated'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const summary = storage.saveIdentitySummary(updates);
      setIdentitySummary(summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update identity summary';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    identitySummary,
    updateIdentitySummary,
    isLoading,
    error
  };
}
