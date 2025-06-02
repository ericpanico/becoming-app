import { useState } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Home from '@/pages/home';
import Stories from '@/pages/stories';
import Insights from '@/pages/insights';
import Settings from '@/pages/settings';
import NotFound from '@/pages/not-found';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

function Router() {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  return (
    <>
      <Switch>
        <Route path="/" component={() => <Home onSettingsClick={handleSettingsClick} />} />
        <Route path="/stories" component={() => <Stories onSettingsClick={handleSettingsClick} />} />
        <Route path="/insights" component={() => <Insights onSettingsClick={handleSettingsClick} />} />
        <Route component={NotFound} />
      </Switch>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md w-full max-h-[90vh] overflow-hidden p-0 sm:rounded-xl" aria-describedby="settings-description">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <div id="settings-description" className="sr-only">Manage your app settings, API key, and data</div>
          <div className="h-full overflow-y-auto">
            <Settings />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
