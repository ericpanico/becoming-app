import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Compass, Lightbulb, Calendar } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { OpenAIService } from '@/lib/openai';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useIdentitySummary } from '@/hooks/useIdentitySummary';

interface JourneyDashboardProps {
  apiKey: string;
  onGenerateStory: () => void;
}

export function JourneyDashboard({ apiKey, onGenerateStory }: JourneyDashboardProps) {
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [textEntry, setTextEntry] = useState('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  
  const { entries, saveEntry, draft, saveDraft, isLoading: isSavingEntry, error: entryError } = useJournalEntries(apiKey);
  const { identitySummary } = useIdentitySummary();

  // Generate initial therapeutic prompt
  useEffect(() => {
    if (apiKey && !currentPrompt) {
      generateNewPrompt();
    }
  }, [apiKey, currentPrompt]);

  // Load draft on mount
  useEffect(() => {
    setTextEntry(draft);
  }, [draft]);

  const generateNewPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const openai = new OpenAIService(apiKey);
      const recentEntries = entries.slice(0, 3);
      const prompt = await openai.generateTherapeuticPrompt(identitySummary || undefined, recentEntries);
      setCurrentPrompt(prompt);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setCurrentPrompt("When you think about the person you're becoming, what feels different about you today compared to a year ago?");
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleVoiceTranscription = (transcription: string) => {
    setTextEntry(prev => prev ? `${prev}\n\n${transcription}` : transcription);
    saveDraft(textEntry + (textEntry ? '\n\n' : '') + transcription);
  };

  const handleTextChange = (value: string) => {
    setTextEntry(value);
    saveDraft(value);
  };

  const handleSubmitReflection = async () => {
    if (!textEntry.trim()) return;
    
    await saveEntry(textEntry.trim());
    setTextEntry('');
    
    // Generate new prompt after successful submission
    generateNewPrompt();
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(timestamp));
  };

  return (
    <div className="space-y-6">
      {/* Current Reflection Prompt */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-neutral-900">Today's Reflection</h3>
              <span className="text-xs text-neutral-500">
                {formatDate(Date.now())}
              </span>
            </div>
            
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4">
              <p className="text-neutral-700 leading-relaxed italic">
                {isLoadingPrompt ? 'Crafting your reflection prompt...' : `"${currentPrompt}"`}
              </p>
            </div>

            <VoiceRecorder 
              apiKey={apiKey}
              onTranscription={handleVoiceTranscription}
            />

            <Textarea
              placeholder="Or type your reflection here..."
              value={textEntry}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={4}
              className="resize-none"
            />

            {entryError && (
              <Alert variant="destructive">
                <AlertDescription>{entryError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSubmitReflection}
              disabled={!textEntry.trim() || isSavingEntry}
              className="w-full bg-primary text-white hover:bg-primary/90"
            >
              {isSavingEntry ? 'Processing...' : 'Share This Reflection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Identity Evolution Summary */}
      {identitySummary && (
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                  <Compass className="w-4 h-4 text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">Your Evolving Self</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Entries</div>
                  <div className="text-2xl font-semibold text-neutral-900">
                    {identitySummary.entryCount}
                  </div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Days Active</div>
                  <div className="text-2xl font-semibold text-neutral-900">
                    {identitySummary.daysActive}
                  </div>
                </div>
              </div>

              {identitySummary.themes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-neutral-700">Current Themes</div>
                  <div className="flex flex-wrap gap-2">
                    {identitySummary.themes.map((theme, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${
                          index % 3 === 0 ? 'bg-primary/10 text-primary' :
                          index % 3 === 1 ? 'bg-secondary/10 text-secondary' :
                          'bg-accent/10 text-accent'
                        }`}
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent AI Insights */}
      {entries.length > 0 && entries[0].aiInsight && (
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900">AI Insights</h3>
              </div>
              
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg p-4">
                <p className="text-neutral-700 leading-relaxed">
                  {entries[0].aiInsight}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Generation */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900">Your Story</h3>
            </div>
            
            <p className="text-neutral-600">
              Ready to see your journey reflected back as a meaningful story?
            </p>
            
            <Button
              onClick={onGenerateStory}
              disabled={!identitySummary || entries.length === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:opacity-90"
            >
              {!identitySummary || entries.length === 0 
                ? 'Complete a reflection first'
                : 'Tell Me My Story'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
