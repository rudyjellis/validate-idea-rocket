// Audio extraction service for processing video recordings
// Extracts audio track from video and converts to WAV format for Claude processing

export class AudioExtractionError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AudioExtractionError';
  }
}

/**
 * Convert an AudioBuffer to WAV format blob
 * WAV is a lossless format that Claude can process directly
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = [];
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    data.push(audioBuffer.getChannelData(i));
  }

  const interleaved = interleave(data);
  const dataLength = interleaved.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  floatTo16BitPCM(view, 44, interleaved);

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Interleave multiple audio channels
 */
function interleave(channels: Float32Array[]): Float32Array {
  const length = channels[0].length;
  const numberOfChannels = channels.length;
  const result = new Float32Array(length * numberOfChannels);

  let offset = 0;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      result[offset++] = channels[channel][i];
    }
  }

  return result;
}

/**
 * Write string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Convert float audio samples to 16-bit PCM
 */
function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

/**
 * Extract audio track from video blob and convert to WAV format
 * This is the main function used by the upload hook
 *
 * @param videoBlob - The recorded video blob
 * @returns Promise<Blob> - WAV audio blob ready for upload
 */
export async function extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
  console.log('🎵 Starting audio extraction...');
  console.log('Video blob size:', videoBlob.size, 'type:', videoBlob.type);

  if (!videoBlob || videoBlob.size === 0) {
    throw new AudioExtractionError('Invalid video blob provided', 'INVALID_BLOB');
  }

  let audioContext: AudioContext | null = null;

  try {
    // Create audio context
    console.log('Creating audio context...');
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Convert blob to array buffer
    console.log('Converting video to array buffer...');
    const arrayBuffer = await videoBlob.arrayBuffer();

    // Decode audio data from video
    console.log('Decoding audio data...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('Audio decoded successfully:');
    console.log('  - Duration:', audioBuffer.duration.toFixed(2), 'seconds');
    console.log('  - Sample rate:', audioBuffer.sampleRate, 'Hz');
    console.log('  - Channels:', audioBuffer.numberOfChannels);

    // Convert to WAV format
    console.log('Converting to WAV format...');
    const wavBlob = audioBufferToWav(audioBuffer);
    console.log('WAV blob created:');
    console.log('  - Size:', (wavBlob.size / 1024).toFixed(2), 'KB');
    console.log('  - Type:', wavBlob.type);

    console.log('✅ Audio extraction complete');

    return wavBlob;
  } catch (error) {
    console.error('❌ Audio extraction failed:', error);

    if (error instanceof AudioExtractionError) {
      throw error;
    }

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unable to decode')) {
        throw new AudioExtractionError(
          'Failed to decode audio from video. The video format may be unsupported.',
          'DECODE_FAILED'
        );
      }

      throw new AudioExtractionError(
        `Audio extraction failed: ${error.message}`,
        'EXTRACTION_FAILED'
      );
    }

    throw new AudioExtractionError(
      'Unknown error occurred during audio extraction',
      'UNKNOWN_ERROR'
    );
  } finally {
    // Always clean up audio context to prevent memory leaks
    if (audioContext) {
      await audioContext.close();
    }
  }
}

/**
 * Extract audio from video with progress updates
 *
 * @param videoBlob - The recorded video blob
 * @param onProgress - Optional callback for progress updates
 * @returns Promise<Blob> - WAV audio blob ready for upload
 */
export async function extractAudioWithProgress(
  videoBlob: Blob,
  onProgress?: (status: string) => void
): Promise<Blob> {
  onProgress?.('Initializing audio extraction...');

  try {
    onProgress?.('Decoding video data...');
    const audioBlob = await extractAudioFromVideo(videoBlob);

    onProgress?.('Audio extraction complete!');
    return audioBlob;
  } catch (error) {
    if (error instanceof AudioExtractionError) {
      throw error;
    }
    throw new AudioExtractionError(
      error instanceof Error ? error.message : 'Failed to extract audio',
      'EXTRACTION_FAILED'
    );
  }
}
