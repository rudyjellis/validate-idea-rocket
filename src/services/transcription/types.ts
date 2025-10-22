// Transcription service types and interfaces
// Provides a unified abstraction layer for multiple transcription providers

/**
 * Supported transcription providers
 */
export type TranscriptionProvider = 'whisper' | 'deepgram' | 'web-speech';

/**
 * Configuration options for transcription
 */
export interface TranscriptionOptions {
  /** The transcription provider to use */
  provider: TranscriptionProvider;
  
  /** Language code (e.g., 'en', 'es', 'fr'). If not provided, auto-detect. */
  language?: string;
  
  /** Model to use (provider-specific) */
  model?: string;
  
  /** Enable smart formatting (punctuation, capitalization) */
  smartFormat?: boolean;
  
  /** Enable speaker diarization (identify different speakers) */
  diarize?: boolean;
  
  /** Enable profanity filtering */
  profanityFilter?: boolean;
  
  /** Keywords to boost accuracy for (company names, technical terms) */
  keywords?: string[];
}

/**
 * Word-level transcription data with timestamps
 */
export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuatedWord?: string;
  speaker?: number;
}

/**
 * Paragraph structure in transcription
 */
export interface TranscriptionParagraph {
  text: string;
  start: number;
  end: number;
  sentences?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

/**
 * Speaker information (for diarization)
 */
export interface TranscriptionSpeaker {
  speaker: number;
  text: string;
  start?: number;
  end?: number;
}

/**
 * Metadata returned with transcription
 */
export interface TranscriptionMetadata {
  /** Word-level timestamps and confidence */
  words?: TranscriptionWord[];
  
  /** Paragraph structure */
  paragraphs?: TranscriptionParagraph[];
  
  /** Speaker information (if diarization enabled) */
  speakers?: TranscriptionSpeaker[];
  
  /** Additional provider-specific metadata */
  [key: string]: any;
}

/**
 * Result from transcription service
 */
export interface TranscriptionResult {
  /** The transcribed text */
  text: string;
  
  /** Provider that performed the transcription */
  provider: TranscriptionProvider;
  
  /** Audio duration in seconds */
  duration?: number;
  
  /** Detected or specified language */
  language?: string;
  
  /** Overall confidence score (0-1) */
  confidence?: number;
  
  /** Processing time in seconds */
  processingTime?: number;
  
  /** Additional metadata (words, paragraphs, speakers, etc.) */
  metadata?: TranscriptionMetadata;
}

/**
 * Error from transcription service
 */
export class TranscriptionError extends Error {
  constructor(
    message: string,
    public provider: TranscriptionProvider,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

/**
 * Progress callback for transcription updates
 */
export type TranscriptionProgressCallback = (status: string, percentage?: number) => void;

/**
 * Interface that all transcription providers must implement
 */
export interface TranscriptionProvider {
  /**
   * Transcribe audio blob
   * @param audioBlob - The audio file to transcribe
   * @param options - Transcription options
   * @param onProgress - Optional progress callback
   * @returns Promise with transcription result
   */
  transcribe(
    audioBlob: Blob,
    options: TranscriptionOptions,
    onProgress?: TranscriptionProgressCallback
  ): Promise<TranscriptionResult>;
  
  /**
   * Validate if audio blob is acceptable for this provider
   * @param audioBlob - The audio file to validate
   * @returns true if valid, false otherwise
   */
  validateAudio(audioBlob: Blob): boolean;
  
  /**
   * Get provider-specific capabilities
   */
  getCapabilities(): {
    maxFileSize: number;
    supportedFormats: string[];
    supportsDiarization: boolean;
    supportsSmartFormat: boolean;
    supportsConfidenceScores: boolean;
    supportsTimestamps: boolean;
  };
}
