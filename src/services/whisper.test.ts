import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  transcribeAudioWithWhisper,
  WhisperAPIError,
  isValidAudioBlob,
  estimateTranscriptionTime
} from './whisper';

// Mock fetch globally
global.fetch = vi.fn();

describe('Whisper Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('transcribeAudioWithWhisper', () => {
    it('should successfully transcribe audio', async () => {
      const mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });
      const mockResponse = {
        text: 'This is a test transcription',
        duration: 10.5,
        language: 'en',
        processingTime: 2.3
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await transcribeAudioWithWhisper(mockAudioBlob);

      expect(result.text).toBe('This is a test transcription');
      expect(result.duration).toBe(10.5);
      expect(result.language).toBe('en');
      expect(result.processingTime).toBe(2.3);
      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/transcribe-whisper',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle progress callbacks', async () => {
      const mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });
      const mockResponse = {
        text: 'Test',
        duration: 5,
        language: 'en'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const progressCallback = vi.fn();
      await transcribeAudioWithWhisper(mockAudioBlob, undefined, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith('Converting audio to base64...');
      expect(progressCallback).toHaveBeenCalledWith('Uploading audio to Whisper API...');
      expect(progressCallback).toHaveBeenCalledWith('Transcription complete!');
    });

    it('should pass language parameter', async () => {
      const mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });
      const mockResponse = {
        text: 'Hola mundo',
        duration: 5,
        language: 'es'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await transcribeAudioWithWhisper(mockAudioBlob, 'es');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.language).toBe('es');
    });

    it('should throw error for empty blob', async () => {
      const emptyBlob = new Blob([], { type: 'audio/wav' });

      await expect(transcribeAudioWithWhisper(emptyBlob)).rejects.toThrow(
        WhisperAPIError
      );
      await expect(transcribeAudioWithWhisper(emptyBlob)).rejects.toThrow(
        'Audio blob cannot be empty'
      );
    });

    it('should throw error for oversized blob', async () => {
      // Create a blob larger than 25MB
      const largeData = new Uint8Array(26 * 1024 * 1024); // 26MB
      const largeBlob = new Blob([largeData], { type: 'audio/wav' });

      await expect(transcribeAudioWithWhisper(largeBlob)).rejects.toThrow(
        WhisperAPIError
      );
      await expect(transcribeAudioWithWhisper(largeBlob)).rejects.toThrow(
        /exceeds maximum allowed size/
      );
    });

    it('should handle API errors', async () => {
      const mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      await expect(transcribeAudioWithWhisper(mockAudioBlob)).rejects.toThrow(
        WhisperAPIError
      );

      // Reset mock for second call
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      await expect(transcribeAudioWithWhisper(mockAudioBlob)).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle network errors', async () => {
      const mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(transcribeAudioWithWhisper(mockAudioBlob)).rejects.toThrow(
        WhisperAPIError
      );
    });
  });

  describe('isValidAudioBlob', () => {
    it('should return true for valid audio blob', () => {
      const validBlob = new Blob(['audio data'], { type: 'audio/wav' });
      expect(isValidAudioBlob(validBlob)).toBe(true);
    });

    it('should return true for various audio formats', () => {
      const formats = [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/webm',
        'audio/mp4',
        'audio/m4a',
        'audio/ogg',
        'audio/flac'
      ];

      formats.forEach(format => {
        const blob = new Blob(['audio data'], { type: format });
        expect(isValidAudioBlob(blob)).toBe(true);
      });
    });

    it('should return false for empty blob', () => {
      const emptyBlob = new Blob([], { type: 'audio/wav' });
      expect(isValidAudioBlob(emptyBlob)).toBe(false);
    });

    it('should return false for oversized blob', () => {
      const largeData = new Uint8Array(26 * 1024 * 1024); // 26MB
      const largeBlob = new Blob([largeData], { type: 'audio/wav' });
      expect(isValidAudioBlob(largeBlob)).toBe(false);
    });

    it('should return false for non-audio blob', () => {
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' });
      expect(isValidAudioBlob(videoBlob)).toBe(false);
    });

    it('should return false for null blob', () => {
      expect(isValidAudioBlob(null as any)).toBe(false);
    });
  });

  describe('estimateTranscriptionTime', () => {
    it('should estimate time for short audio', () => {
      const estimate = estimateTranscriptionTime(10); // 10 seconds
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(10); // Should be faster than real-time
    });

    it('should estimate time for long audio', () => {
      const estimate = estimateTranscriptionTime(120); // 2 minutes
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThan(120); // Should be faster than real-time
    });

    it('should include network overhead', () => {
      const estimate1 = estimateTranscriptionTime(1);
      const estimate2 = estimateTranscriptionTime(2);
      
      // The difference should be less than 1 second due to network overhead
      expect(estimate2 - estimate1).toBeLessThan(1);
    });

    it('should return integer values', () => {
      const estimate = estimateTranscriptionTime(15.7);
      expect(Number.isInteger(estimate)).toBe(true);
    });
  });

  describe('WhisperAPIError', () => {
    it('should create error with message', () => {
      const error = new WhisperAPIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('WhisperAPIError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with status code', () => {
      const error = new WhisperAPIError('Test error', 500);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
    });
  });
});
