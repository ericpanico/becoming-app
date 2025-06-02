import { JournalEntry, IdentitySummary } from '@shared/schema';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = 'gpt-4o';
const WHISPER_MODEL = 'whisper-1';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateTherapeuticPrompt(identitySummary?: IdentitySummary, recentEntries?: JournalEntry[]): Promise<string> {
    const systemPrompt = `You are a compassionate therapeutic AI coach for the "Becoming" app. Generate a single, gentle, open-ended question that encourages self-reflection and emotional exploration. 

    ${identitySummary ? `User's current identity summary: ${identitySummary.summary}` : ''}
    ${identitySummary?.themes.length ? `Current themes: ${identitySummary.themes.join(', ')}` : ''}
    ${recentEntries?.length ? `Recent reflection patterns: ${recentEntries.slice(0, 3).map(e => e.content.substring(0, 100)).join('; ')}` : ''}

    The question should:
    - Be personally relevant and emotionally safe
    - Encourage deeper self-understanding
    - Feel like it comes from a caring friend
    - Not be pushy or demanding
    - Open doors for meaningful reflection
    
    Respond with just the question, no additional text.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'system', content: systemPrompt }],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Failed to generate therapeutic prompt:', error);
      throw new Error('Failed to generate reflection prompt');
    }
  }

  async processJournalEntry(content: string, identitySummary?: IdentitySummary): Promise<{
    themes: string[];
    emotionalTone: string;
    aiInsight: string;
    updatedSummary: string;
  }> {
    const systemPrompt = `You are analyzing a journal entry for therapeutic insights. Provide a JSON response with:
    - themes: array of 2-3 key emotional/life themes present
    - emotionalTone: single word describing the overall emotional tone
    - aiInsight: a gentle, supportive insight (1-2 sentences) about the entry
    - updatedSummary: an updated identity summary incorporating this new reflection

    ${identitySummary ? `Current identity summary: ${identitySummary.summary}` : 'No previous summary exists.'}
    
    Journal entry: "${content}"
    
    Respond only with valid JSON.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: "json_object" },
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Failed to process journal entry:', error);
      throw new Error('Failed to process journal entry');
    }
  }

  async generateStory(lens: string, identitySummary: IdentitySummary, recentEntries: JournalEntry[]): Promise<string> {
    const systemPrompt = `You are a skilled storyteller creating a personalized narrative for someone's growth journey. 

    Story lens: ${lens}
    Identity summary: ${identitySummary.summary}
    Key themes: ${identitySummary.themes.join(', ')}
    Recent reflections: ${recentEntries.slice(0, 5).map(e => e.content.substring(0, 200)).join('\n\n')}

    Create a beautiful, meaningful story (3-4 paragraphs) that:
    - Uses the "${lens}" perspective/metaphor
    - Reflects their actual growth themes and patterns
    - Feels personally meaningful and emotionally resonant
    - Tells the story of their becoming, not just their current state
    - Is written in second person ("you")
    - Feels like a gentle mirror of their inner journey

    The story should feel like a gift - something that helps them see themselves with compassion and clarity.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [{ role: 'system', content: systemPrompt }],
          max_tokens: 800,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Failed to generate story:', error);
      throw new Error('Failed to generate your story');
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', WHISPER_MODEL);

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async getPromptForDebug(type: 'reflection' | 'processing' | 'story', params: any): Promise<string> {
    // This method returns the actual prompt that would be sent to OpenAI for transparency
    switch (type) {
      case 'reflection':
        return `Generate therapeutic reflection prompt with identity: ${params.identitySummary?.summary || 'none'}`;
      case 'processing':
        return `Process journal entry: "${params.content}" with existing summary: ${params.identitySummary?.summary || 'none'}`;
      case 'story':
        return `Generate ${params.lens} story for identity: ${params.identitySummary?.summary}`;
      default:
        return 'Unknown prompt type';
    }
  }
}
