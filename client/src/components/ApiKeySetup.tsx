import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, ExternalLink } from 'lucide-react';
import { useApiKey } from '@/hooks/useApiKey';

export function ApiKeySetup() {
  const [keyInput, setKeyInput] = useState('');
  const { saveApiKey, isLoading, error } = useApiKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveApiKey(keyInput);
    if (success) {
      setKeyInput('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Card */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto flex items-center justify-center">
              <div className="text-white text-2xl">🌱</div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Welcome to Your Journey</h2>
              <p className="text-neutral-600 leading-relaxed">
                Becoming is your companion for self-reflection and growth. Let's start by setting up your personal AI coach.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Setup */}
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <Key className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900">Secure API Setup</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="apiKey" className="text-sm font-medium text-neutral-700">
                  OpenAI API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5" />
                  <div className="text-sm text-neutral-600">
                    <p className="font-medium mb-1">Your privacy is protected</p>
                    <p>
                      This key stays on your device, encrypted and secure. It's only used for AI conversations and voice transcription.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-500">
                <p>
                  Don't have an API key?{' '}
                  <a
                    href="https://platform.openai.com/account/api-keys"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get one from OpenAI
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
                disabled={isLoading || !keyInput.trim()}
              >
                {isLoading ? 'Validating...' : 'Begin My Journey'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
