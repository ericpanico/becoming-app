import { JournalEntry, IdentitySummary, Story, Settings } from '@shared/schema';
import { encryptData, decryptData, generateSecureId } from './encryption';

const STORAGE_KEYS = {
  API_KEY: 'becoming_api_key',
  ENTRIES: 'becoming_entries',
  IDENTITY: 'becoming_identity',
  STORIES: 'becoming_stories',
  SETTINGS: 'becoming_settings',
  DRAFT: 'becoming_draft'
};

export class LocalStorage {
  // API Key management
  setApiKey(apiKey: string): void {
    try {
      const encrypted = encryptData(apiKey);
      localStorage.setItem(STORAGE_KEYS.API_KEY, encrypted);
    } catch (error) {
      throw new Error('Failed to store API key securely');
    }
  }

  getApiKey(): string | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (!encrypted) return null;
      return decryptData(encrypted);
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return null;
    }
  }

  removeApiKey(): void {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }

  // Journal entries
  saveEntry(entry: Omit<JournalEntry, 'id'>): JournalEntry {
    const newEntry: JournalEntry = {
      ...entry,
      id: generateSecureId()
    };

    const entries = this.getEntries();
    entries.unshift(newEntry);

    try {
      const encrypted = encryptData(JSON.stringify(entries));
      localStorage.setItem(STORAGE_KEYS.ENTRIES, encrypted);
      return newEntry;
    } catch (error) {
      throw new Error('Failed to save journal entry');
    }
  }

  getEntries(): JournalEntry[] {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (!encrypted) return [];
      
      const decrypted = decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      return [];
    }
  }

  deleteEntry(id: string): void {
    const entries = this.getEntries().filter(entry => entry.id !== id);
    try {
      const encrypted = encryptData(JSON.stringify(entries));
      localStorage.setItem(STORAGE_KEYS.ENTRIES, encrypted);
    } catch (error) {
      throw new Error('Failed to delete journal entry');
    }
  }

  // Identity summary
  saveIdentitySummary(summary: Omit<IdentitySummary, 'id'>): IdentitySummary {
    const identitySummary: IdentitySummary = {
      ...summary,
      id: generateSecureId(),
      lastUpdated: Date.now()
    };

    try {
      const encrypted = encryptData(JSON.stringify(identitySummary));
      localStorage.setItem(STORAGE_KEYS.IDENTITY, encrypted);
      return identitySummary;
    } catch (error) {
      throw new Error('Failed to save identity summary');
    }
  }

  getIdentitySummary(): IdentitySummary | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.IDENTITY);
      if (!encrypted) return null;
      
      const decrypted = decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load identity summary:', error);
      return null;
    }
  }

  // Stories
  saveStory(story: Omit<Story, 'id'>): Story {
    const newStory: Story = {
      ...story,
      id: generateSecureId()
    };

    const stories = this.getStories();
    stories.unshift(newStory);

    try {
      const encrypted = encryptData(JSON.stringify(stories));
      localStorage.setItem(STORAGE_KEYS.STORIES, encrypted);
      return newStory;
    } catch (error) {
      throw new Error('Failed to save story');
    }
  }

  getStories(): Story[] {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.STORIES);
      if (!encrypted) return [];
      
      const decrypted = decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load stories:', error);
      return [];
    }
  }

  // Settings
  saveSettings(settings: Settings): void {
    try {
      const encrypted = encryptData(JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, encrypted);
    } catch (error) {
      throw new Error('Failed to save settings');
    }
  }

  getSettings(): Settings {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!encrypted) return { developerMode: false, notificationsEnabled: true, voicePreference: true, exportFormat: 'json' };
      
      const decrypted = decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { developerMode: false, notificationsEnabled: true, voicePreference: true, exportFormat: 'json' };
    }
  }

  // Draft management
  saveDraft(content: string): void {
    localStorage.setItem(STORAGE_KEYS.DRAFT, content);
  }

  getDraft(): string {
    return localStorage.getItem(STORAGE_KEYS.DRAFT) || '';
  }

  clearDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }

  // Export/Import
  exportData(): string {
    const data = {
      entries: this.getEntries(),
      identity: this.getIdentitySummary(),
      stories: this.getStories(),
      settings: this.getSettings(),
      exportedAt: Date.now()
    };

    return encryptData(JSON.stringify(data));
  }

  importData(encryptedData: string): void {
    try {
      const decrypted = decryptData(encryptedData);
      const data = JSON.parse(decrypted);

      if (data.entries) {
        const encrypted = encryptData(JSON.stringify(data.entries));
        localStorage.setItem(STORAGE_KEYS.ENTRIES, encrypted);
      }

      if (data.identity) {
        const encrypted = encryptData(JSON.stringify(data.identity));
        localStorage.setItem(STORAGE_KEYS.IDENTITY, encrypted);
      }

      if (data.stories) {
        const encrypted = encryptData(JSON.stringify(data.stories));
        localStorage.setItem(STORAGE_KEYS.STORIES, encrypted);
      }

      if (data.settings) {
        const encrypted = encryptData(JSON.stringify(data.settings));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, encrypted);
      }
    } catch (error) {
      throw new Error('Failed to import data - invalid file or encryption');
    }
  }

  // Clear all data
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const storage = new LocalStorage();
