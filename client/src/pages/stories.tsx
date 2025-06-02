import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Book, Calendar, Download, Eye } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Story } from '@shared/schema';

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showStoryDialog, setShowStoryDialog] = useState(false);

  useEffect(() => {
    const loadedStories = storage.getStories();
    setStories(loadedStories);
  }, []);

  const handleViewStory = (story: Story) => {
    setSelectedStory(story);
    setShowStoryDialog(true);
  };

  const handleExportStory = (story: Story) => {
    const content = `${story.title}\n\nGenerated on ${new Date(story.createdAt).toLocaleDateString()}\n\n${story.content}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(timestamp));
  };

  const getLensColor = (lens: string) => {
    const colors = {
      hero: 'bg-blue-100 text-blue-800',
      nature: 'bg-green-100 text-green-800',
      astronaut: 'bg-purple-100 text-purple-800',
      artist: 'bg-pink-100 text-pink-800',
      wanderer: 'bg-amber-100 text-amber-800',
      alchemist: 'bg-indigo-100 text-indigo-800'
    };
    return colors[lens as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Book className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Your Stories</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {stories.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto flex items-center justify-center">
                  <Book className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No Stories Yet</h3>
                  <p className="text-neutral-600">
                    Complete some journal entries, then generate your first story from the home page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          stories.map((story) => (
            <Card key={story.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900 mb-1">{story.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(story.createdAt)}</span>
                      </div>
                    </div>
                    <Badge className={getLensColor(story.lens)}>
                      {story.lens}
                    </Badge>
                  </div>

                  <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">
                    {story.content.substring(0, 200)}...
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleViewStory(story)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Read
                    </Button>
                    <Button
                      onClick={() => handleExportStory(story)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Story View Dialog */}
      <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
        <DialogContent className="max-w-md w-full max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedStory?.title}</span>
              {selectedStory && (
                <Badge className={getLensColor(selectedStory.lens)}>
                  {selectedStory.lens}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedStory && (
            <div className="space-y-4">
              <div className="text-sm text-neutral-500 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(selectedStory.createdAt)}</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="prose prose-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {selectedStory.content}
                </div>
              </div>

              <Button
                onClick={() => handleExportStory(selectedStory)}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Story
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
