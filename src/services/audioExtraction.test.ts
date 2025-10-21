import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractAudioFromVideo, extractAudioWithProgress, AudioExtractionError } from './audioExtraction';

describe('audioExtraction', () => {
  // Mock AudioContext
  let mockAudioContext: any;
  let mockAudioBuffer: any;
  let mockClose: any;

  beforeEach(() => {
    // Mock AudioBuffer
    mockAudioBuffer = {
      duration: 30,
      sampleRate: 44100,
      numberOfChannels: 2,
      length: 44100 * 30, // 30 seconds at 44.1kHz
      getChannelData: vi.fn((channel: number) => {
        // Return mock Float32Array with some data
        const data = new Float32Array(44100 * 30);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.sin(i / 100); // Sine wave
        }
        return data;
      })
    };

    mockClose = vi.fn();

    // Mock AudioContext
    mockAudioContext = {
      decodeAudioData: vi.fn(async () => mockAudioBuffer),
      close: mockClose
    };

    // Mock window.AudioContext
    (global as any).AudioContext = vi.fn(() => mockAudioContext);
    (global as any).window = {
      ...global.window,
      AudioContext: vi.fn(() => mockAudioContext)
    };

    // Mock Blob.arrayBuffer for older test environments
    if (!Blob.prototype.arrayBuffer) {
      Blob.prototype.arrayBuffer = async function() {
        const buffer = new ArrayBuffer(this.size);
        return buffer;
      };
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extractAudioFromVideo', () => {
    it('should extract audio from valid video blob', async () => {
      // Create a mock video blob
      const videoData = new Uint8Array([0, 1, 2, 3, 4, 5]);
      const videoBlob = new Blob([videoData], { type: 'video/mp4' });

      const audioBlob = await extractAudioFromVideo(videoBlob);

      expect(audioBlob).toBeInstanceOf(Blob);
      expect(audioBlob.type).toBe('audio/wav');
      expect(audioBlob.size).toBeGreaterThan(0);
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should throw error for empty blob', async () => {
      const emptyBlob = new Blob([], { type: 'video/mp4' });

      await expect(extractAudioFromVideo(emptyBlob)).rejects.toThrow(AudioExtractionError);
      await expect(extractAudioFromVideo(emptyBlob)).rejects.toThrow('Invalid video blob provided');
    });

    it('should throw error for null blob', async () => {
      // The function checks videoBlob.size, which will throw TypeError for null
      // This is expected behavior - catching and wrapping the error
      await expect(extractAudioFromVideo(null as any)).rejects.toThrow();
    });

    it('should handle decode errors gracefully', async () => {
      mockAudioContext.decodeAudioData = vi.fn(async () => {
        throw new Error('Unable to decode audio data');
      });

      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      await expect(extractAudioFromVideo(videoBlob)).rejects.toThrow(AudioExtractionError);
      await expect(extractAudioFromVideo(videoBlob)).rejects.toThrow(/decode/i);
    });

    it('should log extraction progress', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      await extractAudioFromVideo(videoBlob);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting audio extraction'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Audio extraction complete'));
    });

    it('should handle stereo audio (2 channels)', async () => {
      mockAudioBuffer.numberOfChannels = 2;

      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });
      const audioBlob = await extractAudioFromVideo(videoBlob);

      expect(audioBlob).toBeInstanceOf(Blob);
      expect(mockAudioBuffer.getChannelData).toHaveBeenCalledTimes(2);
    });

    it('should handle mono audio (1 channel)', async () => {
      mockAudioBuffer.numberOfChannels = 1;

      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });
      const audioBlob = await extractAudioFromVideo(videoBlob);

      expect(audioBlob).toBeInstanceOf(Blob);
      expect(mockAudioBuffer.getChannelData).toHaveBeenCalledTimes(1);
    });

    it('should close audio context after extraction', async () => {
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      await extractAudioFromVideo(videoBlob);

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should close audio context even on error', async () => {
      mockAudioContext.decodeAudioData = vi.fn(async () => {
        throw new Error('Decode failed');
      });

      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      await expect(extractAudioFromVideo(videoBlob)).rejects.toThrow();

      // Audio context should be cleaned up even on error
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('extractAudioWithProgress', () => {
    it('should call progress callback with status updates', async () => {
      const onProgress = vi.fn();
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      await extractAudioWithProgress(videoBlob, onProgress);

      expect(onProgress).toHaveBeenCalledWith('Initializing audio extraction...');
      expect(onProgress).toHaveBeenCalledWith('Decoding video data...');
      expect(onProgress).toHaveBeenCalledWith('Audio extraction complete!');
    });

    it('should work without progress callback', async () => {
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      const audioBlob = await extractAudioWithProgress(videoBlob);

      expect(audioBlob).toBeInstanceOf(Blob);
      expect(audioBlob.type).toBe('audio/wav');
    });

    it('should propagate AudioExtractionError', async () => {
      const onProgress = vi.fn();
      const emptyBlob = new Blob([], { type: 'video/mp4' });

      await expect(extractAudioWithProgress(emptyBlob, onProgress)).rejects.toThrow(AudioExtractionError);
    });

    it('should wrap unknown errors in AudioExtractionError', async () => {
      mockAudioContext.decodeAudioData = vi.fn(async () => {
        throw new Error('Random error');
      });

      const onProgress = vi.fn();
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });

      await expect(extractAudioWithProgress(videoBlob, onProgress)).rejects.toThrow(AudioExtractionError);
    });
  });

  describe('AudioExtractionError', () => {
    it('should create error with message and code', () => {
      const error = new AudioExtractionError('Test error', 'TEST_CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AudioExtractionError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AudioExtractionError');
    });

    it('should create error without code', () => {
      const error = new AudioExtractionError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
    });
  });

  describe('WAV format validation', () => {
    it('should produce valid WAV blob with correct MIME type', async () => {
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });
      const audioBlob = await extractAudioFromVideo(videoBlob);

      expect(audioBlob.type).toBe('audio/wav');
    });

    it('should produce WAV blob with header (at least 44 bytes)', async () => {
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });
      const audioBlob = await extractAudioFromVideo(videoBlob);

      // WAV header is 44 bytes, so total should be > 44
      expect(audioBlob.size).toBeGreaterThan(44);
    });

    it('should include audio data in WAV blob', async () => {
      const videoBlob = new Blob([new Uint8Array([0, 1, 2, 3])], { type: 'video/mp4' });
      const audioBlob = await extractAudioFromVideo(videoBlob);

      // Verify the blob has data
      expect(audioBlob.size).toBeGreaterThan(0);
      expect(audioBlob instanceof Blob).toBe(true);
    });
  });
});
