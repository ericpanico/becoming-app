import { z } from "zod";

// Journal Entry Schema
export const journalEntrySchema = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.number(),
  isVoiceEntry: z.boolean().default(false),
  transcription: z.string().optional(),
  themes: z.array(z.string()).default([]),
  emotionalTone: z.string().optional(),
  aiInsight: z.string().optional()
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

// Identity Summary Schema
export const identitySummarySchema = z.object({
  id: z.string(),
  summary: z.string(),
  themes: z.array(z.string()),
  emotionalPatterns: z.array(z.string()),
  growthAreas: z.array(z.string()),
  lastUpdated: z.number(),
  entryCount: z.number(),
  daysActive: z.number()
});

export type IdentitySummary = z.infer<typeof identitySummarySchema>;

// Story Schema
export const storySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  lens: z.string(),
  createdAt: z.number(),
  basedOnEntries: z.array(z.string())
});

export type Story = z.infer<typeof storySchema>;

// Settings Schema
export const settingsSchema = z.object({
  developerMode: z.boolean().default(false),
  notificationsEnabled: z.boolean().default(true),
  voicePreference: z.boolean().default(true),
  exportFormat: z.enum(['json', 'txt']).default('json')
});

export type Settings = z.infer<typeof settingsSchema>;

// API Key validation
export const apiKeySchema = z.object({
  key: z.string().min(1, "API key is required").startsWith("sk-", "Must be a valid OpenAI API key")
});

export type ApiKey = z.infer<typeof apiKeySchema>;

// User Schema (for server storage)
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string()
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
