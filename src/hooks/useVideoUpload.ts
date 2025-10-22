import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { generateMVPDocument, uploadAudioToClaude, AnthropicAPIError } from '@/services/anthropic';
import { extractAudioWithProgress, AudioExtractionError } from '@/services/audioExtraction';
import { transcribeAudioWithWhisper, WhisperAPIError } from '@/services/whisper';

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
        message: 'Transcribing audio with Whisper...'
      });

      // Transcribe audio using Whisper API
      let transcriptText: string;
      let transcriptionDuration: number | undefined;
      
      try {
        const transcriptionResult = await transcribeAudioWithWhisper(
          audioBlob,
          'en', // English language
          (status) => {
            setProgress({
              stage: 'transcribing',
              percentage: 50,
              message: status
            });
          }
        );
        
        transcriptText = transcriptionResult.text;
        transcriptionDuration = transcriptionResult.duration;
        console.log('✅ Whisper transcription successful');
        console.log('Transcript length:', transcriptText.length, 'characters');
        console.log('Audio duration:', transcriptionDuration, 'seconds');
      } catch (whisperError) {
        // Fallback to Claude audio processing if Whisper fails
        console.warn('⚠️ Whisper transcription failed, falling back to Claude audio processing');
        console.error('Whisper error:', whisperError);
        
        setProgress({
          stage: 'transcribing',
          percentage: 45,
          message: 'Using alternative transcription method...'
        });

        // Upload audio to Claude as fallback
        const uploadResult = await uploadAudioToClaude(audioBlob);
        console.log('Audio uploaded to Claude, file ID:', uploadResult.fileId);

        setProgress({
          stage: 'analyzing',
          percentage: 60,
          message: 'Claude is transcribing and analyzing your pitch...'
        });

        // Generate MVP using Claude's audio processing
        const mvpContent = await generateMVPDocument(
          undefined,
          uploadResult.fileId,
          uploadResult.audioData,
          uploadResult.mimeType
        );

        setProgress({
          stage: 'analyzing',
          percentage: 100,
          message: 'Analysis complete!'
        });

        const now = new Date();
        const document: MVPDocument = {
          content: mvpContent,
          transcript: 'Audio processed directly by Claude (Whisper unavailable)',
          createdAt: now.toISOString(),
          transcriptFileName: `pitch-analysis-${now.toISOString().split('T')[0]}.txt`
        };

        setMvpDocument(document);
        setUploadStatus('success');

        navigate('/mvp-results', {
          state: { mvpDocument: document }
        });

        toast({
          title: "MVP Document Generated!",
          description: "Your startup idea has been analyzed and converted into an MVP document.",
        });

        return;
      }

      setProgress({
        stage: 'analyzing',
        percentage: 70,
        message: 'Analyzing your pitch with Claude...'
      });

      // Generate MVP document using the transcript (preferred method)
      const mvpContent = await generateMVPDocument(transcriptText);

      setProgress({
        stage: 'analyzing',
        percentage: 100,
        message: 'Analysis complete!'
      });

      const now = new Date();
      const document: MVPDocument = {
        content: mvpContent,
        transcript: transcriptText, // Now we have the actual transcript from Whisper!
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
      } else if (err instanceof WhisperAPIError) {
        errorMessage = `Transcription failed: ${err.message}`;
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

