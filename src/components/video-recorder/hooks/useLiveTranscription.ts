import { useState, useRef, useCallback, useEffect } from 'react';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useLiveTranscription');

// Extend Window interface for speech recognition
interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

// Check browser support
const getSpeechRecognition = (): typeof SpeechRecognition | null => {
  if (typeof window === 'undefined') return null;

  const w = window as unknown as WindowWithSpeechRecognition;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export interface LiveTranscriptionState {
  transcript: string;
  isTranscribing: boolean;
  isSupported: boolean;
  error: string | null;
  interimTranscript: string;
}

export const useLiveTranscription = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isTranscribingRef = useRef<boolean>(false);

  const SpeechRecognition = getSpeechRecognition();
  const isSupported = SpeechRecognition !== null;

  // Initialize speech recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      log.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          final += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        setTranscript(prev => (prev + final).trim());
        log.log('Final transcript chunk:', final);
      }

      if (interim) {
        setInterimTranscript(interim);
      } else {
        setInterimTranscript('');
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Don't treat 'no-speech' as an error during recording - user might pause
      if (event.error === 'no-speech') {
        log.log('No speech detected (normal during pauses)');
        return;
      }

      // Don't log aborted errors when we're intentionally stopping
      if (event.error === 'aborted' && isStoppingRef.current) {
        log.log('Speech recognition stopped (intentional)');
        return;
      }

      log.error('Speech recognition error:', event.error);

      const errorMessages: Record<string, string> = {
        'network': 'Network error. Please check your internet connection.',
        'not-allowed': 'Microphone permission denied.',
        'service-not-allowed': 'Speech recognition service not available.',
        'bad-grammar': 'Speech recognition configuration error.',
        'language-not-supported': 'Language not supported.',
      };

      setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
      setIsTranscribing(false);
    };

    // Handle end
    recognition.onend = () => {
      log.log('Speech recognition ended');
      if (!isStoppingRef.current && isTranscribingRef.current) {
        // Restart if it ended unexpectedly while we're still recording
        log.log('Restarting speech recognition (unexpected end)');
        try {
          recognition.start();
        } catch (e) {
          log.error('Failed to restart recognition:', e);
        }
      } else {
        setIsTranscribing(false);
        isTranscribingRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [SpeechRecognition]);

  const startTranscription = useCallback(() => {
    if (!recognitionRef.current) {
      log.error('Speech recognition not initialized');
      setError('Speech recognition not available in this browser');
      return false;
    }

    if (isTranscribing) {
      log.warn('Transcription already in progress');
      return true;
    }

    try {
      log.log('Starting live transcription');
      isStoppingRef.current = false;
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsTranscribing(true);
      isTranscribingRef.current = true;
      return true;
    } catch (error) {
      log.error('Failed to start transcription:', error);
      setError('Failed to start speech recognition');
      return false;
    }
  }, [isTranscribing]);

  const stopTranscription = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      log.log('Stopping live transcription');
      isStoppingRef.current = true;
      recognitionRef.current.stop();
      setIsTranscribing(false);
      isTranscribingRef.current = false;
      setInterimTranscript('');
      log.log('Final transcript:', transcript);
    } catch (error) {
      log.error('Failed to stop transcription:', error);
    }
  }, [transcript]);

  const resetTranscription = useCallback(() => {
    log.log('Resetting transcription');
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsTranscribing(false);
    isTranscribingRef.current = false;
  }, []);

  return {
    // State
    transcript,
    interimTranscript,
    isTranscribing,
    isSupported,
    error,

    // Actions
    startTranscription,
    stopTranscription,
    resetTranscription,

    // Combined transcript for display (final + interim)
    fullTranscript: transcript + (interimTranscript ? ' ' + interimTranscript : ''),
  };
};
