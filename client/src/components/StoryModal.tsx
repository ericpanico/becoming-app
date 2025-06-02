import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, BookOpen, Download } from 'lucide-react';
import { OpenAIService } from '@/lib/openai';
import { useIdentitySummary } from '@/hooks/useIdentitySummary';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { storage } from '@/lib/storage';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

const STORY_LENSES = [
  { value: 'hero', label: "Hero's Journey", description: 'Your path as an epic adventure' },
  { value: 'nature', label: 'Nature Spirit', description: 'Your growth like a tree or river' },
  { value: 'astronaut', label: 'Lost Astronaut', description: 'Finding your way through unknown space' },
  { value: 'artist', label: 'Creative Soul', description: 'Your life as a work of art' },
  { value: 'wanderer', label: 'Ancient Wanderer', description: 'A timeless journey of discovery' },
  { value: 'alchemist', label: 'Alchemist', description: 'Transforming experiences into wisdom' }
];

export function StoryModal({ isOpen, onClose, apiKey }: StoryModalProps) {
  const [selectedLens, setSelectedLens] = useState<string>('');
  const [generatedStory, setGeneratedStory] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { identitySummary } = useIdentitySummary();
  const { entries } = useJournalEntries(apiKey);

  const generateStory = async () => {
    if (!selectedLens || !identitySummary || entries.length === 0) {
      setError('Please select a lens and ensure you have journal entries');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const openai = new OpenAIService(apiKey);
      const story = await openai.generateStory(selectedLens, identitySummary, entries.slice(0, 10));
      setGeneratedStory(story);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate story';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStory = () => {
    if (!generatedStory || !selectedLens) return;

    try {
      const lensLabel = STORY_LENSES.find(l => l.value === selectedLens)?.label || selectedLens;
      
      storage.saveStory({
        title: `My ${lensLabel} Story`,
        content: generatedStory,
        lens: selectedLens,
        createdAt: Date.now(),
        basedOnEntries: entries.slice(0, 10).map(e => e.id)
      });

      // Reset modal state
      setGeneratedStory('');
      setSelectedLens('');
      onClose();
    } catch (err) {
      setError('Failed to save story');
    }
  };

  const exportStory = () => {
    if (!generatedStory) return;

    const lensLabel = STORY_LENSES.find(l => l.value === selectedLens)?.label || selectedLens;
    const content = `My ${lensLabel} Story\n\nGenerated on ${new Date().toLocaleDateString()}\n\n${generatedStory}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-${selectedLens}-story.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setGeneratedStory('');
    setSelectedLens('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Your Story</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!generatedStory ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Choose a lens</label>
                <Select value={selectedLens} onValueChange={setSelectedLens}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a perspective..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STORY_LENSES.map((lens) => (
                      <SelectItem key={lens.value} value={lens.value}>
                        <div>
                          <div className="font-medium">{lens.label}</div>
                          <div className="text-xs text-neutral-500">{lens.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={generateStory}
                disabled={!selectedLens || isGenerating || !identitySummary || entries.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:opacity-90"
              >
                {isGenerating ? 'Weaving your story...' : 'Generate My Story'}
              </Button>
            </>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <div className="prose prose-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {generatedStory}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveStory}
                  className="flex-1 bg-primary text-white hover:bg-primary/90"
                >
                  Save This Story
                </Button>
                <Button
                  onClick={exportStory}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
