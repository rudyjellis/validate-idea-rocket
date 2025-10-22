import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { generateMVPDocument, AnthropicAPIError } from '@/services/anthropic';
import { extractAudioWithProgress, AudioExtractionError } from '@/services/audioExtraction';
import { 
  transcribeAudio, 
  TranscriptionError,
  type TranscriptionResult,
  type TranscriptionProviderType 
} from '@/services/transcription';

export type UploadStatus = 'idle' | 'transcribing' | 'analyzing' | 'success' | 'error';

export interface UploadProgress {
  stage: 'transcribing' | 'analyzing';
  percentage: number;
  message: string;
}

export interface MVPDocument {
  content: string;
  transcript: string;
  provider?: TranscriptionProviderType;
  transcriptionMetadata?: any;
  createdAt: string;
  transcriptFileName: string;
}

export function useVideoUpload() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mvpDocument, setMvpDocument] = useState<MVPDocument | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<TranscriptionProviderType | null>(null);
  const [transcriptionResults, setTranscriptionResults] = useState<Map<TranscriptionProviderType, TranscriptionResult>>(new Map());
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const resetUpload = useCallback(() => {
    setUploadStatus('idle');
    setProgress(null);
    setError(null);
    setMvpDocument(null);
    setSelectedProvider(null);
    setTranscriptionResults(new Map());
  }, []);

  const uploadAndGenerateMVP = useCallback(async (
    recordedChunks: Blob[],
    provider: TranscriptionProviderType = 'web-speech'
  ) => {
    if (recordedChunks.length === 0) {
      setError('No video recording found. Please record a video first.');
      setUploadStatus('error');
      return;
    }

    setSelectedProvider(provider);
    setUploadStatus('transcribing');
    setError(null);
    setProgress({
      stage: 'transcribing',
      percentage: 0,
      message: 'Preparing video for processing...'
    });

    try {
      // Convert chunks to a single blob (prefer MP4 format)
      const mimeType = 'video/mp4';
      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      console.log('Video blob created:', videoBlob.size, 'bytes');

      setProgress({
        stage: 'transcribing',
        percentage: 15,
        message: 'Extracting audio from video...'
      });

      // Extract audio from video
      const audioBlob = await extractAudioWithProgress(videoBlob, (status) => {
        setProgress({
          stage: 'transcribing',
          percentage: 25,
          message: status
        });
      });

      console.log('Audio extracted:', audioBlob.size, 'bytes');

      setProgress({
        stage: 'transcribing',
        percentage: 40,
        message: `Transcribing with ${provider}...`
      });

      // Transcribe audio using selected provider
      const transcriptionResult = await transcribeAudio(
        audioBlob,
        {
          provider,
          language: 'en',
          smartFormat: true,
          diarize: false
        },
        (status, percentage) => {
          setProgress({
            stage: 'transcribing',
            percentage: percentage || 50,
            message: status
          });
        }
      );

      console.log('Transcription complete:', transcriptionResult.text.length, 'characters');
      console.log('Provider:', transcriptionResult.provider);
      console.log('Duration:', transcriptionResult.duration, 'seconds');
      console.log('Confidence:', transcriptionResult.confidence);

      // Store transcription result
      setTranscriptionResults(prev => new Map(prev).set(provider, transcriptionResult));

      setProgress({
        stage: 'analyzing',
        percentage: 70,
        message: 'Claude is analyzing your pitch...'
      });

      // Generate MVP document using the transcript
      const mvpContent = await generateMVPDocument(transcriptionResult.text);

      setProgress({
        stage: 'analyzing',
        percentage: 100,
        message: 'Analysis complete!'
      });

      const now = new Date();
      const document: MVPDocument = {
        content: mvpContent,
        transcript: transcriptionResult.text,
        provider: transcriptionResult.provider,
        transcriptionMetadata: transcriptionResult.metadata,
        createdAt: now.toISOString(),
        transcriptFileName: `pitch-transcript-${provider}-${now.toISOString().split('T')[0]}.txt`
      };

      setMvpDocument(document);
      setUploadStatus('success');

      // Navigate to results page with the document
      navigate('/mvp-results', {
        state: { mvpDocument: document }
      });

      toast({
        title: "MVP Document Generated!",
        description: `Your startup idea has been analyzed using ${provider} transcription.`,
      });

    } catch (err) {
      console.error('Audio processing and MVP generation failed:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof AudioExtractionError) {
        if (err.code === 'INVALID_BLOB') {
          errorMessage = 'Invalid video recording. Please try recording again.';
        } else if (err.code === 'DECODE_FAILED') {
          errorMessage = 'Failed to process video audio. The video format may be unsupported.';
        } else {
          errorMessage = `Audio extraction failed: ${err.message}`;
        }
      } else if (err instanceof TranscriptionError) {
        errorMessage = `Transcription failed (${err.provider}): ${err.message}`;
      } else if (err instanceof AnthropicAPIError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setUploadStatus('error');

      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: errorMessage,
      });
    } finally {
      // Clear progress after a short delay
      setTimeout(() => {
        setProgress(null);
      }, 2000);
    }
  }, [navigate, toast]);

  return {
    uploadStatus,
    progress,
    error,
    mvpDocument,
    selectedProvider,
    transcriptionResults,
    uploadAndGenerateMVP,
    resetUpload,
  };
}

