// OpenAI Whisper API service for audio transcription
// Uses secure Netlify serverless functions - API key never exposed to browser

export class WhisperAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'WhisperAPIError';
  }
}

export interface WhisperTranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  processingTime?: number;
}

/**
 * Transcribe audio file using OpenAI Whisper API via Netlify function
 * 
 * @param audioBlob - The audio blob to transcribe (typically WAV format)
 * @param language - Optional language code (e.g., 'en', 'es', 'fr'). If not provided, Whisper will auto-detect.
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<WhisperTranscriptionResult> - The transcription result with text and metadata
 */
export async function transcribeAudioWithWhisper(
  audioBlob: Blob,
  language?: string,
  onProgress?: (status: string) => void
): Promise<WhisperTranscriptionResult> {
  console.log('🎤 Starting Whisper transcription...');
  console.log('Audio size:', (audioBlob.size / 1024).toFixed(2), 'KB');
  console.log('Audio type:', audioBlob.type);
  console.log('Language:', language || 'auto-detect');

  if (!audioBlob || audioBlob.size === 0) {
    throw new WhisperAPIError('Audio blob cannot be empty');
  }

  // Check file size (Whisper API limit is 25MB)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
    throw new WhisperAPIError(
      `Audio file size (${(audioBlob.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 25MB.`
    );
  }

  try {
    onProgress?.('Converting audio to base64...');

    // Convert blob to base64
    const reader = new FileReader();
    const base64Audio = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(audioBlob);
    });

    console.log('Base64 encoding complete, uploading to Whisper...');
    onProgress?.('Uploading audio to Whisper API...');

    // Send to Netlify function
    const response = await fetch('/.netlify/functions/transcribe-whisper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: base64Audio,
        mimeType: audioBlob.type || 'audio/wav',
        language: language
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new WhisperAPIError(
        errorData.error || `Transcription failed with status ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    console.log('✅ Transcription successful');
    console.log('Text length:', data.text.length, 'characters');
    console.log('Duration:', data.duration, 'seconds');
    console.log('Language:', data.language);
    console.log('Processing time:', data.processingTime, 'seconds');

    onProgress?.('Transcription complete!');

    return {
      text: data.text,
      duration: data.duration,
      language: data.language,
      processingTime: data.processingTime
    };
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    if (error instanceof WhisperAPIError) {
      throw error;
    }
    throw new WhisperAPIError(
      error instanceof Error ? error.message : 'Failed to transcribe audio'
    );
  }
}

/**
 * Check if audio blob is valid for transcription
 * 
 * @param audioBlob - The audio blob to validate
 * @returns boolean - True if valid, false otherwise
 */
export function isValidAudioBlob(audioBlob: Blob): boolean {
  if (!audioBlob || audioBlob.size === 0) {
    return false;
  }

  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
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

/**
 * Get estimated transcription time based on audio duration
 * Whisper typically processes audio at ~10x real-time speed
 * 
 * @param audioDurationSeconds - Duration of audio in seconds
 * @returns number - Estimated processing time in seconds
 */
export function estimateTranscriptionTime(audioDurationSeconds: number): number {
  // Whisper processes at roughly 10x real-time, plus network overhead
  const processingTime = audioDurationSeconds / 10;
  const networkOverhead = 2; // seconds
  return Math.ceil(processingTime + networkOverhead);
}
