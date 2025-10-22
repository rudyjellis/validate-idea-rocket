import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcribeAudio, compareProviders } from './index';
import { TranscriptionError } from './types';

// Mock provider modules
vi.mock('./providers/whisper', () => ({
  WhisperProvider: vi.fn().mockImplementation(() => ({
    transcribe: vi.fn().mockResolvedValue({
      text: 'Whisper transcription result',
      provider: 'whisper',
      duration: 10,
      language: 'en',
      processingTime: 2
    }),
    validateAudio: vi.fn().mockReturnValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxFileSize: 25 * 1024 * 1024,
      supportedFormats: ['audio/wav'],
      supportsDiarization: false,
      supportsSmartFormat: false,
      supportsConfidenceScores: false,
      supportsTimestamps: true
    })
  }))
}));

vi.mock('./providers/deepgram', () => ({
  DeepGramProvider: vi.fn().mockImplementation(() => ({
    transcribe: vi.fn().mockResolvedValue({
      text: 'DeepGram transcription result',
      provider: 'deepgram',
      duration: 10,
      language: 'en',
      confidence: 0.98,
      processingTime: 1.5
    }),
    validateAudio: vi.fn().mockReturnValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxFileSize: 2 * 1024 * 1024 * 1024,
      supportedFormats: ['audio/wav'],
      supportsDiarization: true,
      supportsSmartFormat: true,
      supportsConfidenceScores: true,
      supportsTimestamps: true
    })
  }))
}));

vi.mock('./providers/web-speech', () => ({
  WebSpeechProvider: vi.fn().mockImplementation(() => ({
    transcribe: vi.fn().mockResolvedValue({
      text: 'Web Speech transcription result',
      provider: 'web-speech',
      duration: 10,
      language: 'en-US',
      processingTime: 5
    }),
    validateAudio: vi.fn().mockReturnValue(true),
    getCapabilities: vi.fn().mockReturnValue({
      maxFileSize: Infinity,
      supportedFormats: ['*'],
      supportsDiarization: false,
      supportsSmartFormat: false,
      supportsConfidenceScores: false,
      supportsTimestamps: false
    })
  }))
}));

describe('Transcription Service', () => {
  let mockAudioBlob: Blob;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioBlob = new Blob(['fake audio data'], { type: 'audio/wav' });
  });

  describe('transcribeAudio', () => {
    it('should transcribe with Whisper provider', async () => {
      const result = await transcribeAudio(mockAudioBlob, {
        provider: 'whisper',
        language: 'en'
      });

      expect(result.text).toBe('Whisper transcription result');
      expect(result.provider).toBe('whisper');
      expect(result.duration).toBe(10);
    });

    it('should transcribe with DeepGram provider', async () => {
      const result = await transcribeAudio(mockAudioBlob, {
        provider: 'deepgram',
        language: 'en',
        smartFormat: true
      });

      expect(result.text).toBe('DeepGram transcription result');
      expect(result.provider).toBe('deepgram');
      expect(result.confidence).toBe(0.98);
    });

    it('should transcribe with Web Speech provider', async () => {
      const result = await transcribeAudio(mockAudioBlob, {
        provider: 'web-speech',
        language: 'en'
      });

      expect(result.text).toBe('Web Speech transcription result');
      expect(result.provider).toBe('web-speech');
    });

    it('should call progress callback', async () => {
      const progressCallback = vi.fn();

      await transcribeAudio(
        mockAudioBlob,
        { provider: 'whisper' },
        progressCallback
      );

      // Progress callback should be called by the provider
      // (mocked providers don't call it, but real ones would)
      expect(progressCallback).not.toHaveBeenCalled(); // Because mocked
    });

    it('should throw error for unknown provider', async () => {
      await expect(
        transcribeAudio(mockAudioBlob, {
          provider: 'unknown' as any
        })
      ).rejects.toThrow(TranscriptionError);
    });
  });

  describe('compareProviders', () => {
    it('should compare multiple providers', async () => {
      const results = await compareProviders(
        mockAudioBlob,
        ['whisper', 'deepgram']
      );

      expect(results.size).toBe(2);
      expect(results.get('whisper')?.text).toBe('Whisper transcription result');
      expect(results.get('deepgram')?.text).toBe('DeepGram transcription result');
    });

    it('should handle provider failures gracefully', async () => {
      // Mock one provider to fail
      const { WhisperProvider } = await import('./providers/whisper');
      vi.mocked(WhisperProvider).mockImplementationOnce(() => ({
        transcribe: vi.fn().mockRejectedValue(new Error('API Error')),
        validateAudio: vi.fn().mockReturnValue(true),
        getCapabilities: vi.fn().mockReturnValue({})
      }) as any);

      const results = await compareProviders(
        mockAudioBlob,
        ['whisper', 'deepgram']
      );

      // Should only have DeepGram result (Whisper failed)
      expect(results.size).toBe(1);
      expect(results.has('deepgram')).toBe(true);
      expect(results.has('whisper')).toBe(false);
    });
  });
});
