// DeepGram transcription provider implementation
// Uses DeepGram Speech-to-Text API via Netlify serverless function

import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgressCallback,
  TranscriptionProvider,
  TranscriptionWord,
  TranscriptionParagraph,
  TranscriptionSpeaker
} from '../types';
import { TranscriptionError } from '../types';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB (DeepGram limit)

/**
 * DeepGram provider implementation
 */
export class DeepGramProvider implements TranscriptionProvider {
  
  async transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions,
    onProgress?: TranscriptionProgressCallback
  ): Promise<TranscriptionResult> {
    console.log('🎤 Starting DeepGram transcription...');
    console.log('Audio size:', (audioBlob.size / 1024).toFixed(2), 'KB');
    console.log('Audio type:', audioBlob.type);
    console.log('Language:', options.language || 'auto-detect');
    console.log('Model:', options.model || 'nova-3');

    if (!this.validateAudio(audioBlob)) {
      throw new TranscriptionError(
        'Audio file is too large or empty',
        'deepgram',
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

      console.log('Base64 encoding complete, uploading to DeepGram...');
      onProgress?.('Uploading audio to DeepGram API...', 30);

      const startTime = Date.now();

      // Send to Netlify function
      const response = await fetch('/.netlify/functions/transcribe-deepgram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType: audioBlob.type || 'audio/wav',
          language: options.language,
          options: {
            model: options.model || 'nova-3',
            smart_format: options.smartFormat !== false, // default true
            diarize: options.diarize || false,
            punctuate: true,
            utterances: false,
            profanity_filter: options.profanityFilter || false,
            keywords: options.keywords
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new TranscriptionError(
          errorData.error || `Transcription failed with status ${response.status}`,
          'deepgram',
          'API_ERROR',
          response.status
        );
      }

      const data = await response.json();
      const processingTime = (Date.now() - startTime) / 1000;

      console.log('✅ DeepGram transcription successful');
      console.log('Text length:', data.text.length, 'characters');
      console.log('Duration:', data.duration, 'seconds');
      console.log('Language:', data.language);
      console.log('Confidence:', data.confidence);
      console.log('Processing time:', processingTime, 'seconds');

      onProgress?.('Transcription complete!', 100);

      // Parse metadata
      const metadata: {
        words?: TranscriptionWord[];
        paragraphs?: TranscriptionParagraph[];
        speakers?: TranscriptionSpeaker[];
      } = {};

      if (data.words) {
        metadata.words = data.words;
      }

      if (data.paragraphs) {
        metadata.paragraphs = data.paragraphs;
      }

      if (data.speakers) {
        metadata.speakers = data.speakers;
      }

      return {
        text: data.text,
        provider: 'deepgram',
        duration: data.duration,
        language: data.language,
        confidence: data.confidence,
        processingTime: data.processingTime || processingTime,
        metadata
      };
    } catch (error) {
      console.error('❌ DeepGram transcription failed:', error);
      if (error instanceof TranscriptionError) {
        throw error;
      }
      throw new TranscriptionError(
        error instanceof Error ? error.message : 'Failed to transcribe audio',
        'deepgram',
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

    // DeepGram supports 40+ audio formats
    const validTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/webm',
      'audio/mp4',
      'audio/m4a',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'audio/opus',
      'audio/amr'
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
        'audio/flac',
        'audio/aac',
        'audio/opus',
        'audio/amr'
      ],
      supportsDiarization: true,
      supportsSmartFormat: true,
      supportsConfidenceScores: true,
      supportsTimestamps: true
    };
  }
}
