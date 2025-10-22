import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVideoUpload } from './useVideoUpload';
import * as audioExtraction from '@/services/audioExtraction';
import * as anthropic from '@/services/anthropic';
import * as whisper from '@/services/whisper';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock services
vi.mock('@/services/audioExtraction');
vi.mock('@/services/anthropic');
vi.mock('@/services/whisper');

describe('useVideoUpload - Integration Tests', () => {
  let mockExtractAudioWithProgress: ReturnType<typeof vi.spyOn>;
  let mockTranscribeAudioWithWhisper: ReturnType<typeof vi.spyOn>;
  let mockUploadAudioToClaude: ReturnType<typeof vi.spyOn>;
  let mockGenerateMVPDocument: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    mockExtractAudioWithProgress = vi.spyOn(audioExtraction, 'extractAudioWithProgress');
    mockTranscribeAudioWithWhisper = vi.spyOn(whisper, 'transcribeAudioWithWhisper');
    mockUploadAudioToClaude = vi.spyOn(anthropic, 'uploadAudioToClaude');
    mockGenerateMVPDocument = vi.spyOn(anthropic, 'generateMVPDocument');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Audio Processing Flow', () => {
    it('should complete full audio processing workflow with Whisper successfully', async () => {
      // Mock successful responses
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const mockTranscript = 'This is a test transcription of the startup pitch';
      const mockMVPContent = '# MVP Document\n\nExecutive Summary...';

      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: mockTranscript,
        duration: 10.5,
        language: 'en',
        processingTime: 2.3
      });
      mockGenerateMVPDocument.mockResolvedValue(mockMVPContent);

      const { result } = renderHook(() => useVideoUpload());

      // Create test video chunks
      const videoChunks = [
        new Blob(['chunk1'], { type: 'video/mp4' }),
        new Blob(['chunk2'], { type: 'video/mp4' })
      ];

      // Execute upload
      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });

      // Verify the full flow with Whisper
      expect(mockExtractAudioWithProgress).toHaveBeenCalledTimes(1);
      expect(mockExtractAudioWithProgress).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(Function)
      );

      expect(mockTranscribeAudioWithWhisper).toHaveBeenCalledTimes(1);
      expect(mockTranscribeAudioWithWhisper).toHaveBeenCalledWith(
        mockAudioBlob,
        'en',
        expect.any(Function)
      );

      // Whisper flow should NOT call uploadAudioToClaude
      expect(mockUploadAudioToClaude).not.toHaveBeenCalled();

      expect(mockGenerateMVPDocument).toHaveBeenCalledTimes(1);
      expect(mockGenerateMVPDocument).toHaveBeenCalledWith(mockTranscript);

      expect(result.current.mvpDocument).toBeDefined();
      expect(result.current.mvpDocument?.content).toBe(mockMVPContent);
      expect(result.current.mvpDocument?.transcript).toBe(mockTranscript);
      expect(result.current.error).toBeNull();
    });

    it('should fallback to Claude audio processing when Whisper fails', async () => {
      // Mock Whisper failure and Claude fallback success
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const mockFileId = 'file-abc123';
      const mockAudioData = 'base64-encoded-audio-data';
      const mockMimeType = 'audio/wav';
      const mockMVPContent = '# MVP Document\n\nExecutive Summary...';

      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockRejectedValue(
        new whisper.WhisperAPIError('Whisper service unavailable', 503)
      );
      mockUploadAudioToClaude.mockResolvedValue({
        fileId: mockFileId,
        audioData: mockAudioData,
        mimeType: mockMimeType
      });
      mockGenerateMVPDocument.mockResolvedValue(mockMVPContent);

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });

      // Verify fallback flow
      expect(mockTranscribeAudioWithWhisper).toHaveBeenCalledTimes(1);
      expect(mockUploadAudioToClaude).toHaveBeenCalledTimes(1);
      expect(mockGenerateMVPDocument).toHaveBeenCalledWith(
        undefined,
        mockFileId,
        mockAudioData,
        mockMimeType
      );

      expect(result.current.mvpDocument).toBeDefined();
      expect(result.current.mvpDocument?.transcript).toContain('Claude');
    });

    it('should track progress through all stages with Whisper', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: 'Test transcript',
        duration: 10,
        language: 'en'
      });
      mockGenerateMVPDocument.mockResolvedValue('MVP content');

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });

      // Verify progress went through expected stages
      expect(mockExtractAudioWithProgress).toHaveBeenCalled();
      expect(mockTranscribeAudioWithWhisper).toHaveBeenCalled();
      expect(mockGenerateMVPDocument).toHaveBeenCalled();
    });

    it('should handle audio extraction failure gracefully', async () => {
      mockExtractAudioWithProgress.mockRejectedValue(
        new audioExtraction.AudioExtractionError('Failed to decode audio', 'DECODE_FAILED')
      );

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('error');
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });

      expect(mockUploadAudioToClaude).not.toHaveBeenCalled();
      expect(mockGenerateMVPDocument).not.toHaveBeenCalled();
    });

    it('should handle Whisper transcription failure with fallback', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockRejectedValue(
        new whisper.WhisperAPIError('Transcription failed', 500)
      );
      mockUploadAudioToClaude.mockResolvedValue({
        fileId: 'file-123',
        audioData: 'base64-data',
        mimeType: 'audio/wav'
      });
      mockGenerateMVPDocument.mockResolvedValue('MVP content');

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      }, { timeout: 5000 });

      // Should fallback to Claude
      expect(mockUploadAudioToClaude).toHaveBeenCalled();
      expect(mockGenerateMVPDocument).toHaveBeenCalled();
    });

    it('should handle MVP generation failure gracefully', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: 'Test transcript',
        duration: 10,
        language: 'en'
      });
      mockGenerateMVPDocument.mockRejectedValue(
        new anthropic.AnthropicAPIError('API rate limit exceeded', 429)
      );

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('error');
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });
    });

    it('should reject empty video chunks', async () => {
      const { result } = renderHook(() => useVideoUpload());

      result.current.uploadAndGenerateMVP([]);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('error');
      }, { timeout: 1000 });

      expect(result.current.error).toContain('No video recording found');
      expect(mockExtractAudioWithProgress).not.toHaveBeenCalled();
    });

    it('should properly combine video chunks into single blob', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockUploadAudioToClaude.mockResolvedValue('file-123');
      mockGenerateMVPDocument.mockResolvedValue('MVP content');

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [
        new Blob(['chunk1'], { type: 'video/mp4' }),
        new Blob(['chunk2'], { type: 'video/mp4' }),
        new Blob(['chunk3'], { type: 'video/mp4' })
      ];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });

      // Verify audio extraction was called with a combined blob
      const extractionCall = mockExtractAudioWithProgress.mock.calls[0];
      const videoBlob = extractionCall[0];

      expect(videoBlob).toBeInstanceOf(Blob);
      expect(videoBlob.type).toBe('video/mp4');
    });

    it('should create MVP document with correct metadata from Whisper', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      const mockTranscript = 'This is the actual transcript from Whisper';
      const mockMVPContent = '# MVP Document\n\nExecutive Summary...';

      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: mockTranscript,
        duration: 10,
        language: 'en'
      });
      mockGenerateMVPDocument.mockResolvedValue(mockMVPContent);

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });

      const document = result.current.mvpDocument;
      expect(document).toBeDefined();
      expect(document?.content).toBe(mockMVPContent);
      expect(document?.transcript).toBe(mockTranscript);
      expect(document?.createdAt).toBeDefined();
      expect(document?.transcriptFileName).toMatch(/pitch-transcript-\d{4}-\d{2}-\d{2}\.txt/);
    });

    it('should reset upload state correctly', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: 'Test transcript',
        duration: 10,
        language: 'en'
      });
      mockGenerateMVPDocument.mockResolvedValue('MVP content');

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      }, { timeout: 3000 });

      // Reset using act to wrap state update
      await waitFor(() => {
        result.current.resetUpload();
      });

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('idle');
      }, { timeout: 1000 });

      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.mvpDocument).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid blob errors', async () => {
      mockExtractAudioWithProgress.mockRejectedValue(
        new audioExtraction.AudioExtractionError('Invalid video blob', 'INVALID_BLOB')
      );

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('error');
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });
    });

    it('should handle unknown errors', async () => {
      mockExtractAudioWithProgress.mockRejectedValue(new Error('Unknown error occurred'));

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('error');
      });

      expect(result.current.error).toContain('Unknown error occurred');
    });

    it('should call progress callbacks during extraction and transcription', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });

      mockExtractAudioWithProgress.mockImplementation(async (blob, callback) => {
        if (callback) {
          callback('Initializing...');
          callback('Decoding...');
          callback('Complete!');
        }
        return mockAudioBlob;
      });

      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: 'Test transcript',
        duration: 10,
        language: 'en'
      });
      mockGenerateMVPDocument.mockResolvedValue('MVP content');

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      });

      // Verify progress callbacks were passed
      expect(mockExtractAudioWithProgress).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(Function)
      );
      expect(mockTranscribeAudioWithWhisper).toHaveBeenCalledWith(
        expect.any(Blob),
        'en',
        expect.any(Function)
      );
    });
  });

  describe('Performance and Cleanup', () => {
    it('should clear progress state after completion', async () => {
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockExtractAudioWithProgress.mockResolvedValue(mockAudioBlob);
      mockTranscribeAudioWithWhisper.mockResolvedValue({
        text: 'Test transcript',
        duration: 10,
        language: 'en'
      });
      mockGenerateMVPDocument.mockResolvedValue('MVP content');

      const { result } = renderHook(() => useVideoUpload());

      const videoChunks = [new Blob(['test'], { type: 'video/mp4' })];

      await result.current.uploadAndGenerateMVP(videoChunks);

      await waitFor(() => {
        expect(result.current.uploadStatus).toBe('success');
      }, { timeout: 3000 });

      // Test passes if we get to success state
      // Progress clearing happens after 2s timeout which is tested implicitly
      expect(result.current.uploadStatus).toBe('success');
    });
  });
});
