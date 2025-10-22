import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadAudioToClaude, generateMVPDocument, AnthropicAPIError } from './anthropic';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

// Mock FileReader
class MockFileReader {
  result: string = 'data:audio/wav;base64,dGVzdGF1ZGlvZGF0YQ==';
  onloadend: (() => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;

  readAsDataURL(blob: Blob) {
    // Immediately trigger onloadend
    Promise.resolve().then(() => {
      if (this.onloadend) {
        this.onloadend();
      }
    });
  }
}

global.FileReader = MockFileReader as unknown as typeof FileReader;

describe('anthropic service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uploadAudioToClaude', () => {
    it('should throw error for empty blob', async () => {
      const emptyBlob = new Blob([], { type: 'audio/wav' });

      await expect(uploadAudioToClaude(emptyBlob)).rejects.toThrow(AnthropicAPIError);
      await expect(uploadAudioToClaude(emptyBlob)).rejects.toThrow('Audio blob cannot be empty');
    });

    it('should throw error for null blob', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(uploadAudioToClaude(null as any)).rejects.toThrow();
    });
  });

  describe('generateMVPDocument', () => {
    it('should throw error when neither transcript nor fileId nor audioData provided', async () => {
      await expect(generateMVPDocument()).rejects.toThrow(AnthropicAPIError);
      await expect(generateMVPDocument()).rejects.toThrow('Either transcript, fileId, or audioData must be provided');
    });

    it('should throw error when all are empty', async () => {
      await expect(generateMVPDocument('', '', '', '')).rejects.toThrow(AnthropicAPIError);
    });
  });

  describe('AnthropicAPIError', () => {
    it('should create error with message and status', () => {
      const error = new AnthropicAPIError('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AnthropicAPIError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.name).toBe('AnthropicAPIError');
    });

    it('should create error without status', () => {
      const error = new AnthropicAPIError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.status).toBeUndefined();
    });
  });
});
