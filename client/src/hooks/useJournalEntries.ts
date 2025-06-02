import { useState, useCallback, useEffect } from 'react';
import { JournalEntry } from '@shared/schema';
import { storage } from '@/lib/storage';
import { OpenAIService } from '@/lib/openai';
import { useIdentitySummary } from './useIdentitySummary';

export function useJournalEntries(apiKey: string | null) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const { identitySummary, updateIdentitySummary } = useIdentitySummary();

  // Load entries on mount
  useEffect(() => {
    const loadedEntries = storage.getEntries();
    setEntries(loadedEntries);
    
    const savedDraft = storage.getDraft();
    setDraft(savedDraft);
  }, []);

  const saveEntry = useCallback(async (content: string, isVoiceEntry = false, transcription?: string) => {
    if (!apiKey) {
      setError('API key required to process entries');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const openai = new OpenAIService(apiKey);
      
      // Process the entry with AI
      const analysis = await openai.processJournalEntry(content, identitySummary);
      
      // Create the journal entry
      const entry = storage.saveEntry({
        content,
        timestamp: Date.now(),
        isVoiceEntry,
        transcription,
        themes: analysis.themes,
        emotionalTone: analysis.emotionalTone,
        aiInsight: analysis.aiInsight
      });

      // Update identity summary
      const currentEntries = storage.getEntries();
      const daysActive = new Set(currentEntries.map(e => 
        new Date(e.timestamp).toDateString()
      )).size;

      await updateIdentitySummary({
        summary: analysis.updatedSummary,
        themes: analysis.themes,
        emotionalPatterns: [analysis.emotionalTone],
        growthAreas: [], // Could be enhanced with AI analysis
        entryCount: currentEntries.length,
        daysActive
      });

      // Update local state
      setEntries(currentEntries);
      
      // Clear draft
      storage.clearDraft();
      setDraft('');

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save entry';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, identitySummary, updateIdentitySummary]);

  const saveDraft = useCallback((content: string) => {
    setDraft(content);
    storage.saveDraft(content);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    try {
      storage.deleteEntry(id);
      const updatedEntries = storage.getEntries();
      setEntries(updatedEntries);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete entry';
      setError(message);
    }
  }, []);

  return {
    entries,
    saveEntry,
    deleteEntry,
    draft,
    saveDraft,
    isLoading,
    error
  };
}
