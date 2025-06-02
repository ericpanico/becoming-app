import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Key, 
  Trash2, 
  Eye, 
  EyeOff,
  Shield,
  ExternalLink 
} from 'lucide-react';
import { storage } from '@/lib/storage';
import { useApiKey } from '@/hooks/useApiKey';

export default function Settings() {
  const [settings, setSettings] = useState(() => storage.getSettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showUpdateKey, setShowUpdateKey] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { apiKey, saveApiKey, removeApiKey, isLoading, error } = useApiKey();

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleExportData = () => {
    try {
      const exportedData = storage.exportData();
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `becoming-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      storage.importData(text);
      setImportError(null);
      
      // Refresh the page to load imported data
      window.location.reload();
    } catch (error) {
      setImportError('Failed to import data. Please check the file format.');
      console.error('Import failed:', error);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleUpdateApiKey = async () => {
    if (!newApiKey.trim()) return;
    
    const success = await saveApiKey(newApiKey);
    if (success) {
      setNewApiKey('');
      setShowUpdateKey(false);
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
      storage.clearAllData();
      window.location.reload();
    }
  };

  const maskedApiKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'Not set';

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* Developer Mode */}
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900">App Preferences</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Developer Mode</Label>
                  <p className="text-sm text-neutral-600">
                    View AI prompts and debug information
                  </p>
                </div>
                <Switch
                  checked={settings.developerMode}
                  onCheckedChange={(checked) => updateSetting('developerMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Voice Preference</Label>
                  <p className="text-sm text-neutral-600">
                    Show voice recording option by default
                  </p>
                </div>
                <Switch
                  checked={settings.voicePreference}
                  onCheckedChange={(checked) => updateSetting('voicePreference', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900">API Configuration</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">OpenAI API Key</Label>
                    <p className="text-sm text-neutral-600">
                      {showApiKey ? apiKey || 'Not set' : maskedApiKey}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Dialog open={showUpdateKey} onOpenChange={setShowUpdateKey}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Key className="w-4 h-4 mr-2" />
                        Update Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update API Key</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newApiKey">New OpenAI API Key</Label>
                          <Input
                            id="newApiKey"
                            type="password"
                            placeholder="sk-..."
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateApiKey}
                            disabled={!newApiKey.trim() || isLoading}
                            className="flex-1"
                          >
                            {isLoading ? 'Validating...' : 'Update'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowUpdateKey(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline"
                    onClick={removeApiKey}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-xs text-neutral-500 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Your API key is encrypted and stored only on this device
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900">Data Management</h3>
              
              <div className="space-y-3">
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Export My Journey</div>
                    <div className="text-sm text-neutral-600">Download encrypted backup</div>
                  </div>
                </Button>

                <Button
                  onClick={handleImportData}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Upload className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Import Journey</div>
                    <div className="text-sm text-neutral-600">Restore from backup file</div>
                  </div>
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {exportSuccess && (
                  <Alert>
                    <AlertDescription>
                      Your data has been exported successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {importError && (
                  <Alert variant="destructive">
                    <AlertDescription>{importError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white shadow-sm border-red-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
              
              <Button
                onClick={handleClearAllData}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
              
              <p className="text-sm text-neutral-600">
                This will permanently delete all your journal entries, stories, and settings. 
                Make sure to export your data first.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-neutral-900">About</h3>
              
              <div className="space-y-2">
                <p className="text-sm text-neutral-700">
                  <strong>Becoming</strong> v1.0.0
                </p>
                <p className="text-sm text-neutral-600">
                  A self-coaching companion that tells your story.
                </p>
                <p className="text-xs text-neutral-500">
                  Your data is encrypted and stored only on your device. 
                  No information is sent to servers except for AI processing.
                </p>
                
                <div className="pt-2">
                  <a
                    href="https://platform.openai.com/account/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                  >
                    Manage OpenAI API Keys
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
