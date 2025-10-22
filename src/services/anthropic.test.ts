import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateMVPDocument, AnthropicAPIError } from './anthropic';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

describe('anthropic service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateMVPDocument', () => {
    it('should throw error when transcript is not provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(generateMVPDocument('' as any)).rejects.toThrow(AnthropicAPIError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(generateMVPDocument('' as any)).rejects.toThrow('Transcript is required and cannot be empty');
    });

    it('should throw error when transcript is empty or whitespace', async () => {
      await expect(generateMVPDocument('')).rejects.toThrow(AnthropicAPIError);
      await expect(generateMVPDocument('   ')).rejects.toThrow('Transcript is required and cannot be empty');
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
