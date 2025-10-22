// Web Speech API implementation for audio transcription
// Current audio processing flow:
// 1. audioExtraction.ts - Extracts audio from video
// 2. transcription.ts (this file) - Transcribes audio using Web Speech API
// 3. anthropic.ts - Sends transcript to Claude for MVP analysis
//
// See: src/hooks/useVideoUpload.ts for the complete implementation flow
//
// Note: Claude 4.5 Haiku does not support native audio transcription,
// so we use the browser's Web Speech API for transcription.

export class TranscriptionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

/**
 * Check if Web Speech API is supported in the browser
 */
export function isWebSpeechSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Extract audio from video blob and transcribe using Web Speech API
 */
export async function transcribeVideo(videoBlob: Blob): Promise<string> {
  console.log('🎤 Starting transcription...');
  console.log('Video blob size:', videoBlob.size, 'type:', videoBlob.type);
  
  if (!isWebSpeechSupported()) {
    console.error('❌ Web Speech API not supported');
    throw new TranscriptionError(
      'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
      'UNSUPPORTED_BROWSER'
    );
  }

  try {
    console.log('Creating audio context...');
    // Create audio context to extract audio from video
    const audioContext = new AudioContext();
    const arrayBuffer = await videoBlob.arrayBuffer();
    console.log('Decoding audio data...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('Audio decoded successfully, duration:', audioBuffer.duration);
    
    // Create a media stream from the audio buffer
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(mediaStreamDestination);
    
    // Initialize speech recognition
    interface SpeechRecognitionType {
      new(): SpeechRecognition;
    }

    const SpeechRecognitionClass = (window as unknown as { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }).SpeechRecognition ||
                                   (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      throw new TranscriptionError('Speech recognition not available', 'UNSUPPORTED_BROWSER');
    }

    const recognition = new SpeechRecognitionClass();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    return new Promise((resolve, reject) => {
      let transcript = '';
      let timeoutId: NodeJS.Timeout;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Clear timeout on each result
        clearTimeout(timeoutId);

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            transcript += result[0].transcript + ' ';
          }
        }

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
          reject(new TranscriptionError('No speech detected in the video', 'NO_SPEECH'));
        } else if (error.error === 'not-allowed') {
          reject(new TranscriptionError('Microphone permission denied', 'PERMISSION_DENIED'));
        } else {
          reject(new TranscriptionError(`Speech recognition error: ${error.error}`, error.error));
        }
      };

      recognition.onend = () => {
        clearTimeout(timeoutId);
        if (transcript.trim()) {
          resolve(transcript.trim());
        } else {
          reject(new TranscriptionError('No speech detected in the video', 'NO_SPEECH'));
        }
      };

      // Start playback and recognition
      source.start(0);
      recognition.start();

      // Safety timeout - stop after video duration + 5 seconds
      const maxDuration = (audioBuffer.duration + 5) * 1000;
      setTimeout(() => {
        recognition.stop();
        source.stop();
      }, maxDuration);
    });
  } catch (error) {
    if (error instanceof TranscriptionError) {
      throw error;
    }
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Failed to transcribe video',
      'TRANSCRIPTION_FAILED'
    );
  }
}

/**
 * Transcribe video with progress updates
 */
export async function transcribeVideoWithProgress(
  videoBlob: Blob,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.('Checking browser support...');
  
  if (!isWebSpeechSupported()) {
    throw new TranscriptionError(
      'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
      'UNSUPPORTED_BROWSER'
    );
  }

  onProgress?.('Extracting audio from video...');
  
  try {
    const transcript = await transcribeVideo(videoBlob);
    onProgress?.('Transcription complete!');
    return transcript;
  } catch (error) {
    if (error instanceof TranscriptionError) {
      throw error;
    }
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Failed to transcribe video',
      'TRANSCRIPTION_FAILED'
    );
  }
}

/**
 * Future: OpenAI Whisper API transcription
 * Uncomment and implement when ready to add Whisper support
 */
/*
export async function transcribeWithWhisper(videoBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', videoBlob, 'video.mp4');
  formData.append('model', 'whisper-1');

  const response = await fetch('/.netlify/functions/transcribe-whisper', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new TranscriptionError(error.error || 'Whisper transcription failed');
  }

  const data = await response.json();
  return data.text;
}
*/
