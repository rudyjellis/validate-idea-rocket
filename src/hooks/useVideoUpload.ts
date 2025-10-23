import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { generateMVPDocument, AnthropicAPIError } from '@/services/anthropic';

export type UploadStatus = 'idle' | 'transcribing' | 'analyzing' | 'success' | 'error';

export interface UploadProgress {
  stage: 'transcribing' | 'analyzing';
  percentage: number;
  message: string;
}

export interface MVPDocument {
  content: string;
  transcript: string;
  createdAt: string;
  transcriptFileName: string;
}

export function useVideoUpload() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mvpDocument, setMvpDocument] = useState<MVPDocument | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const resetUpload = useCallback(() => {
    setUploadStatus('idle');
    setProgress(null);
    setError(null);
    setMvpDocument(null);
  }, []);

  const uploadAndGenerateMVP = useCallback(async (recordedChunks: Blob[], liveTranscript?: string) => {
    if (recordedChunks.length === 0) {
      setError('No video recording found. Please record a video first.');
      setUploadStatus('error');
      return;
    }

    if (!liveTranscript || liveTranscript.trim().length === 0) {
      setError('No transcript available. Please ensure your browser supports speech recognition and try recording again.');
      setUploadStatus('error');
      toast({
        title: "Transcription Error",
        description: "No transcript was captured during recording. Please try again and speak clearly.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting MVP generation with live transcript, length:', liveTranscript.length);

    setUploadStatus('analyzing');
    setError(null);
    setProgress({
      stage: 'analyzing',
      percentage: 0,
      message: 'Preparing your pitch analysis...'
    });

    try {
      // Convert chunks to a single blob (for archival/download purposes)
      const mimeType = 'video/mp4';
      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      console.log('Video blob created:', videoBlob.size, 'bytes');

      setProgress({
        stage: 'analyzing',
        percentage: 30,
        message: 'Sending transcript to Claude for analysis...'
      });

      // Use the live transcript that was captured during recording
      console.log('Using live transcript, length:', liveTranscript.length);

      setProgress({
        stage: 'analyzing',
        percentage: 50,
        message: 'Claude is analyzing your pitch...'
      });

      // Generate MVP document using the live transcript
      const mvpContent = await generateMVPDocument(liveTranscript);

      setProgress({
        stage: 'analyzing',
        percentage: 100,
        message: 'Analysis complete!'
      });

      const now = new Date();
      const document: MVPDocument = {
        content: mvpContent,
        transcript: liveTranscript, // Store the live transcription from recording
        createdAt: now.toISOString(),
        transcriptFileName: `pitch-analysis-${now.toISOString().split('T')[0]}.txt`
      };

      setMvpDocument(document);
      setUploadStatus('success');

      // Navigate to results page with the document
      navigate('/mvp-results', {
        state: { mvpDocument: document }
      });

      toast({
        title: "MVP Document Generated!",
        description: "Your startup idea has been analyzed and converted into an MVP document.",
      });

    } catch (err) {
      console.error('MVP generation failed:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof AnthropicAPIError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setUploadStatus('error');

      toast({
        variant: "destructive",
        title: "Analysis Failed",
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
    uploadAndGenerateMVP,
    resetUpload,
  };
}

