// Whisper transcription provider implementation
// Uses OpenAI Whisper API via Netlify serverless function

import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgressCallback,
  TranscriptionProvider
} from '../types';
import { TranscriptionError } from '../types';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API limit)

/**
 * Whisper provider implementation
 */
export class WhisperProvider implements TranscriptionProvider {
  
  async transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions,
    onProgress?: TranscriptionProgressCallback
  ): Promise<TranscriptionResult> {
    console.log('🎤 Starting Whisper transcription...');
    console.log('Audio size:', (audioBlob.size / 1024).toFixed(2), 'KB');
    console.log('Audio type:', audioBlob.type);
    console.log('Language:', options.language || 'auto-detect');

    if (!this.validateAudio(audioBlob)) {
      throw new TranscriptionError(
        'Audio file is too large or empty',
        'whisper',
        'INVALID_AUDIO'
      );
    }

    try {
      onProgress?.('Converting audio to base64...', 10);

      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1] || base64;
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(audioBlob);
      });

      console.log('Base64 encoding complete, uploading to Whisper...');
      onProgress?.('Uploading audio to Whisper API...', 30);

      const startTime = Date.now();

      // Send to Netlify function
      const response = await fetch('/.netlify/functions/transcribe-whisper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type || 'audio/wav',
          language: options.language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new TranscriptionError(
          errorData.error || `Transcription failed with status ${response.status}`,
          'whisper',
          'API_ERROR',
          response.status
        );
      }

      const data = await response.json();
      const processingTime = (Date.now() - startTime) / 1000;

      console.log('✅ Whisper transcription successful');
      console.log('Text length:', data.text.length, 'characters');
      console.log('Duration:', data.duration, 'seconds');
      console.log('Language:', data.language);
      console.log('Processing time:', processingTime, 'seconds');

      onProgress?.('Transcription complete!', 100);

      return {
        text: data.text,
        provider: 'whisper',
        duration: data.duration,
        language: data.language,
        processingTime: data.processingTime || processingTime,
        metadata: {}
      };
    } catch (error) {
      console.error('❌ Whisper transcription failed:', error);
      if (error instanceof TranscriptionError) {
        throw error;
      }
      throw new TranscriptionError(
        error instanceof Error ? error.message : 'Failed to transcribe audio',
        'whisper',
        'TRANSCRIPTION_FAILED'
      );
    }
  }

  validateAudio(audioBlob: Blob): boolean {
    if (!audioBlob || audioBlob.size === 0) {
      return false;
    }

    if (audioBlob.size > MAX_FILE_SIZE) {
      return false;
    }

    // Check if it's an audio type
    const validTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/webm',
      'audio/mp4',
      'audio/m4a',
      'audio/ogg',
      'audio/flac'
    ];

    return validTypes.some(type => audioBlob.type.includes(type));
  }

  getCapabilities() {
    return {
      maxFileSize: MAX_FILE_SIZE,
      supportedFormats: [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/webm',
        'audio/mp4',
        'audio/m4a',
        'audio/ogg',
        'audio/flac'
      ],
      supportsDiarization: false,
      supportsSmartFormat: false,
      supportsConfidenceScores: false,
      supportsTimestamps: true
    };
  }
}
