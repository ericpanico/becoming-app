import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ApiKeySetup } from '@/components/ApiKeySetup';
import { JourneyDashboard } from '@/components/JourneyDashboard';
import { StoryModal } from '@/components/StoryModal';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useApiKey } from '@/hooks/useApiKey';

interface HomeProps {
  onSettingsClick: () => void;
}

export default function Home({ onSettingsClick }: HomeProps) {
  const { apiKey, hasApiKey } = useApiKey();
  const [showStoryModal, setShowStoryModal] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🌱</span>
              </div>
              <h1 className="text-xl font-semibold text-neutral-900">Becoming</h1>
            </div>
            <Button
              onClick={onSettingsClick}
              variant="ghost"
              size="sm"
              className="p-2 rounded-full hover:bg-neutral-100"
            >
              <Settings className="w-5 h-5 text-neutral-500" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-20">
        {!hasApiKey ? (
          <ApiKeySetup />
        ) : (
          <JourneyDashboard 
            apiKey={apiKey!}
            onGenerateStory={() => setShowStoryModal(true)}
          />
        )}
      </main>

      {/* Story Modal */}
      {hasApiKey && (
        <StoryModal
          isOpen={showStoryModal}
          onClose={() => setShowStoryModal(false)}
          apiKey={apiKey!}
        />
      )}

      {/* Bottom Navigation */}
      {hasApiKey && (
        <BottomNavigation onSettingsClick={onSettingsClick} />
      )}
    </div>
  );
}
