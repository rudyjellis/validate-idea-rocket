// Unified transcription service
// Provides a single interface for multiple transcription providers

import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgressCallback,
  TranscriptionProvider as TranscriptionProviderType
} from './types';
import { TranscriptionError } from './types';

// Provider implementations (lazy loaded)
let whisperProvider: any = null;
let deepgramProvider: any = null;
let webSpeechProvider: any = null;

/**
 * Get provider instance (lazy loading)
 */
async function getProvider(providerName: TranscriptionProviderType): Promise<any> {
  switch (providerName) {
    case 'whisper':
      if (!whisperProvider) {
        const module = await import('./providers/whisper');
        whisperProvider = new module.WhisperProvider();
      }
      return whisperProvider;
    
    case 'deepgram':
      if (!deepgramProvider) {
        const module = await import('./providers/deepgram');
        deepgramProvider = new module.DeepGramProvider();
      }
      return deepgramProvider;
    
    case 'web-speech':
      if (!webSpeechProvider) {
        const module = await import('./providers/web-speech');
        webSpeechProvider = new module.WebSpeechProvider();
      }
      return webSpeechProvider;
    
    default:
      throw new TranscriptionError(
        `Unknown provider: ${providerName}`,
        providerName as any,
        'UNKNOWN_PROVIDER'
      );
  }
}

/**
 * Transcribe audio using specified provider
 * 
 * @param audioBlob - The audio file to transcribe
 * @param options - Transcription options including provider selection
 * @param onProgress - Optional progress callback
 * @returns Promise with transcription result
 * 
 * @example
 * ```typescript
 * const result = await transcribeAudio(audioBlob, {
 *   provider: 'whisper',
 *   language: 'en',
 *   smartFormat: true
 * });
 * console.log(result.text);
 * ```
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions,
  onProgress?: TranscriptionProgressCallback
): Promise<TranscriptionResult> {
  const { provider: providerName } = options;
  
  console.log(`🎤 Transcribing with ${providerName}...`);
  
  try {
    // Get provider instance
    const provider = await getProvider(providerName);
    
    // Validate audio
    if (!provider.validateAudio(audioBlob)) {
      throw new TranscriptionError(
        'Invalid audio file for this provider',
        providerName,
        'INVALID_AUDIO'
      );
    }
    
    // Transcribe
    const result = await provider.transcribe(audioBlob, options, onProgress);
    
    console.log(`✅ Transcription complete with ${providerName}`);
    console.log(`   Text length: ${result.text.length} characters`);
    console.log(`   Duration: ${result.duration}s`);
    console.log(`   Processing time: ${result.processingTime}s`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Transcription failed with ${providerName}:`, error);
    
    if (error instanceof TranscriptionError) {
      throw error;
    }
    
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Transcription failed',
      providerName,
      'TRANSCRIPTION_FAILED'
    );
  }
}

/**
 * Get capabilities of a specific provider
 * 
 * @param providerName - The provider to query
 * @returns Provider capabilities
 */
export async function getProviderCapabilities(providerName: TranscriptionProviderType) {
  const provider = await getProvider(providerName);
  return provider.getCapabilities();
}

/**
 * Validate if audio is acceptable for a provider
 * 
 * @param audioBlob - The audio file to validate
 * @param providerName - The provider to validate against
 * @returns true if valid, false otherwise
 */
export async function validateAudioForProvider(
  audioBlob: Blob,
  providerName: TranscriptionProviderType
): Promise<boolean> {
  try {
    const provider = await getProvider(providerName);
    return provider.validateAudio(audioBlob);
  } catch {
    return false;
  }
}

/**
 * Compare transcription results from multiple providers
 * Useful for A/B testing and quality comparison
 * 
 * @param audioBlob - The audio file to transcribe
 * @param providers - Array of provider names to compare
 * @param baseOptions - Base options to use for all providers
 * @returns Map of provider name to transcription result
 */
export async function compareProviders(
  audioBlob: Blob,
  providers: TranscriptionProviderType[],
  baseOptions: Omit<TranscriptionOptions, 'provider'> = {}
): Promise<Map<TranscriptionProviderType, TranscriptionResult>> {
  const results = new Map<TranscriptionProviderType, TranscriptionResult>();
  
  // Transcribe with each provider in parallel
  const promises = providers.map(async (providerName) => {
    try {
      const result = await transcribeAudio(audioBlob, {
        ...baseOptions,
        provider: providerName
      });
      results.set(providerName, result);
    } catch (error) {
      console.error(`Failed to transcribe with ${providerName}:`, error);
      // Don't throw, just skip this provider
    }
  });
  
  await Promise.all(promises);
  
  return results;
}

// Re-export types for convenience
export type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgressCallback,
  TranscriptionProvider as TranscriptionProviderType,
  TranscriptionWord,
  TranscriptionParagraph,
  TranscriptionSpeaker,
  TranscriptionMetadata
} from './types';

export { TranscriptionError } from './types';
