import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { uploadVideoFile, generateMVPDocument, AnthropicAPIError } from '@/services/anthropic';

export type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export interface UploadProgress {
  stage: 'uploading' | 'analyzing';
  percentage: number;
  message: string;
}

export interface MVPDocument {
  content: string;
  fileId: string;
  createdAt: string;
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

    setUploadStatus('uploading');
    setError(null);
    setProgress({
      stage: 'uploading',
      percentage: 0,
      message: 'Converting video...'
    });

    try {
      // Convert chunks to a single blob (prefer MP4 format)
      const mimeType = 'video/mp4';
      const videoBlob = new Blob(recordedChunks, { type: mimeType });
      
      setProgress({
        stage: 'uploading',
        percentage: 20,
        message: 'Uploading video to Anthropic...'
      });

      // Upload video file
      const fileId = await uploadVideoFile(videoBlob);
      
      setProgress({
        stage: 'analyzing',
        percentage: 60,
        message: 'Claude is analyzing your video...'
      });

      // Generate MVP document
      const mvpContent = await generateMVPDocument(fileId);
      
      setProgress({
        stage: 'analyzing',
        percentage: 100,
        message: 'Analysis complete!'
      });

      const document: MVPDocument = {
        content: mvpContent,
        fileId,
        createdAt: new Date().toISOString()
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
      console.error('Upload and MVP generation failed:', err);
      
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
        title: "Upload Failed",
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

