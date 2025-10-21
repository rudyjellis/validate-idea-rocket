import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { generateMVPDocument, AnthropicAPIError } from '@/services/anthropic';
import { transcribeVideoWithProgress, TranscriptionError, isWebSpeechSupported } from '@/services/transcription';

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

  const uploadAndGenerateMVP = useCallback(async (recordedChunks: Blob[]) => {
    if (recordedChunks.length === 0) {
      setError('No video recording found. Please record a video first.');
      setUploadStatus('error');
      return;
    }

    // Check browser support
    if (!isWebSpeechSupported()) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setUploadStatus('error');
      toast({
        variant: "destructive",
        title: "Browser Not Supported",
        description: "Please use Chrome or Edge for speech recognition.",
      });
      return;
    }

    setUploadStatus('transcribing');
    setError(null);
    setProgress({
      stage: 'transcribing',
      percentage: 0,
      message: 'Preparing audio for transcription...'
    });

    try {
      // Convert chunks to a single blob (prefer MP4 format)
      const mimeType = 'video/mp4';
      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      
      setProgress({
        stage: 'transcribing',
        percentage: 20,
        message: 'Transcribing your pitch...'
      });

      // Transcribe video using Web Speech API
      const transcript = await transcribeVideoWithProgress(videoBlob, (status) => {
        setProgress({
          stage: 'transcribing',
          percentage: 40,
          message: status
        });
      });
      
      setProgress({
        stage: 'analyzing',
        percentage: 60,
        message: 'Sending transcript to Claude...'
      });

      // Generate MVP document from transcript
      const mvpContent = await generateMVPDocument(transcript);
      
      setProgress({
        stage: 'analyzing',
        percentage: 100,
        message: 'Analysis complete!'
      });

      const now = new Date();
      const document: MVPDocument = {
        content: mvpContent,
        transcript,
        createdAt: now.toISOString(),
        transcriptFileName: `pitch-transcript-${now.toISOString().split('T')[0]}.txt`
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
      console.error('Transcription and MVP generation failed:', err);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof TranscriptionError) {
        if (err.code === 'UNSUPPORTED_BROWSER') {
          errorMessage = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
        } else if (err.code === 'NO_SPEECH') {
          errorMessage = 'No speech detected in the video. Please ensure your microphone is working and try again.';
        } else if (err.code === 'PERMISSION_DENIED') {
          errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
        } else {
          errorMessage = err.message;
        }
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
    uploadAndGenerateMVP,
    resetUpload,
  };
}

