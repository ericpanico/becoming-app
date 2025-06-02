import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Square } from 'lucide-react';
import { OpenAIService } from '@/lib/openai';

interface VoiceRecorderProps {
  apiKey: string;
  onTranscription: (text: string) => void;
  className?: string;
}

export function VoiceRecorder({ apiKey, onTranscription, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      const openai = new OpenAIService(apiKey);
      const transcription = await openai.transcribeAudio(audioBlob);
      onTranscription(transcription);
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error('Transcription error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [apiKey, onTranscription]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-center py-4">
        <Button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full shadow-lg transition-all hover:scale-105 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'
          }`}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : isRecording ? (
            <Square className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-neutral-500">
        {isProcessing ? (
          <p>Processing your voice...</p>
        ) : isRecording ? (
          <p>Recording... Tap to stop</p>
        ) : (
          <p>Tap to speak your thoughts</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Recording Overlay Component
interface RecordingOverlayProps {
  isVisible: boolean;
  onStop: () => void;
}

export function RecordingOverlay({ isVisible, onStop }: RecordingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-32 h-32 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto flex items-center justify-center animate-pulse">
          <Mic className="text-white text-4xl w-12 h-12" />
        </div>
        <div className="text-white space-y-2">
          <p className="text-xl font-medium">Listening...</p>
          <p className="text-sm text-white/80">Speak your thoughts freely</p>
        </div>
        <Button 
          onClick={onStop}
          className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-colors"
        >
          <MicOff className="w-4 h-4 mr-2" />
          Stop Recording
        </Button>
      </div>
    </div>
  );
}
