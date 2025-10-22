// Web Speech API provider implementation
// Browser-based transcription (fallback option, less reliable)

import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgressCallback,
  TranscriptionProvider
} from '../types';
import { TranscriptionError } from '../types';

/**
 * Check if Web Speech API is supported in the browser
 */
function isWebSpeechSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Web Speech API provider implementation
 * Note: This is less reliable than cloud-based providers and only works in Chrome/Edge
 */
export class WebSpeechProvider implements TranscriptionProvider {
  
  async transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions,
    onProgress?: TranscriptionProgressCallback
  ): Promise<TranscriptionResult> {
    console.log('🎤 Starting Web Speech API transcription...');
    console.log('Audio size:', (audioBlob.size / 1024).toFixed(2), 'KB');
    console.log('Audio type:', audioBlob.type);

    if (!isWebSpeechSupported()) {
      throw new TranscriptionError(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
        'web-speech',
        'UNSUPPORTED_BROWSER'
      );
    }

    if (!this.validateAudio(audioBlob)) {
      throw new TranscriptionError(
        'Invalid audio file',
        'web-speech',
        'INVALID_AUDIO'
      );
    }

    try {
      onProgress?.('Creating audio context...', 10);

      // Create audio context to extract audio from video
      const audioContext = new AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      onProgress?.('Decoding audio data...', 30);
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio decoded successfully, duration:', audioBuffer.duration);
      
      // Create a media stream from the audio buffer
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(mediaStreamDestination);
      
      onProgress?.('Initializing speech recognition...', 50);

      // Initialize speech recognition
      interface SpeechRecognitionType {
        new(): SpeechRecognition;
      }

      const SpeechRecognitionClass = (window as unknown as { 
        SpeechRecognition?: SpeechRecognitionType; 
        webkitSpeechRecognition?: SpeechRecognitionType 
      }).SpeechRecognition || (window as unknown as { 
        webkitSpeechRecognition?: SpeechRecognitionType 
      }).webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        throw new TranscriptionError(
          'Speech recognition not available',
          'web-speech',
          'UNSUPPORTED_BROWSER'
        );
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = options.language || 'en-US';
      recognition.maxAlternatives = 1;

      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        let transcript = '';
        let timeoutId: NodeJS.Timeout;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          clearTimeout(timeoutId);

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              transcript += result[0].transcript + ' ';
            }
          }

          // Update progress
          const progress = Math.min(90, 50 + (transcript.length / 10));
          onProgress?.('Transcribing...', progress);

          // Set timeout to end recognition if no speech for 2 seconds
          timeoutId = setTimeout(() => {
            recognition.stop();
          }, 2000);
        };

        recognition.onerror = (event: Event) => {
          const error = event as SpeechRecognitionErrorEvent;
          clearTimeout(timeoutId);
          recognition.stop();

          if (error.error === 'no-speech') {
            reject(new TranscriptionError(
              'No speech detected in the audio',
              'web-speech',
              'NO_SPEECH'
            ));
          } else if (error.error === 'not-allowed') {
            reject(new TranscriptionError(
              'Microphone permission denied',
              'web-speech',
              'PERMISSION_DENIED'
            ));
          } else {
            reject(new TranscriptionError(
              `Speech recognition error: ${error.error}`,
              'web-speech',
              error.error
            ));
          }
        };

        recognition.onend = () => {
          clearTimeout(timeoutId);
          const processingTime = (Date.now() - startTime) / 1000;

          if (transcript.trim()) {
            onProgress?.('Transcription complete!', 100);
            resolve({
              text: transcript.trim(),
              provider: 'web-speech',
              duration: audioBuffer.duration,
              language: options.language || 'en-US',
              processingTime,
              metadata: {}
            });
          } else {
            reject(new TranscriptionError(
              'No speech detected in the audio',
              'web-speech',
              'NO_SPEECH'
            ));
          }
        };

        // Start playback and recognition
        source.start(0);
        recognition.start();

        // Safety timeout - stop after audio duration + 5 seconds
        const maxDuration = (audioBuffer.duration + 5) * 1000;
        setTimeout(() => {
          recognition.stop();
          source.stop();
        }, maxDuration);
      });
    } catch (error) {
      console.error('❌ Web Speech API transcription failed:', error);
      if (error instanceof TranscriptionError) {
        throw error;
      }
      throw new TranscriptionError(
        error instanceof Error ? error.message : 'Failed to transcribe audio',
        'web-speech',
        'TRANSCRIPTION_FAILED'
      );
    }
  }

  validateAudio(audioBlob: Blob): boolean {
    if (!audioBlob || audioBlob.size === 0) {
      return false;
    }

    // Web Speech API works with most audio formats
    return true;
  }

  getCapabilities() {
    return {
      maxFileSize: Infinity, // No specific limit (browser-based)
      supportedFormats: ['*'], // Supports most formats
      supportsDiarization: false,
      supportsSmartFormat: false,
      supportsConfidenceScores: false,
      supportsTimestamps: false
    };
  }
}
