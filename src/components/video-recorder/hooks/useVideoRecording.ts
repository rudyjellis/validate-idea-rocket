import { useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { RecordingState, VideoFormat } from '../types';
import { useMediaStream } from './useMediaStream';
import { useMediaRecorder } from './useMediaRecorder';
import { useRecordingTimer } from './useRecordingTimer';
import { useVideoPlayback } from './useVideoPlayback';
import { useVideoDownload } from './useVideoDownload';

export const useVideoRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();
  
  const { streamRef, videoRef, initializeStream } = useMediaStream();
  const { downloadVideo } = useVideoDownload();
  const { timeLeft, startTimer, stopTimer, resetTimer } = useRecordingTimer();
  const { playRecording } = useVideoPlayback();

  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async (selectedCamera: string) => {
    console.log("Starting recording with camera:", selectedCamera);
    try {
      const stream = await initializeStream(selectedCamera);
      
      if (!stream) {
        console.error("No stream available");
        return;
      }

      mediaRecorder.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        setRecordedChunks(chunks);
      };

      mediaRecorder.current.start();
      setRecordingState('recording');
      startTimer();
      
      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
      });
    }
  }, [initializeStream, startTimer, toast]);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording");
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      stopTimer();
      setRecordingState('idle');
    }
  }, [stopTimer]);

  const pauseRecording = useCallback(() => {
    console.log("Pausing recording");
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      setRecordingState('paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    console.log("Resuming recording");
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setRecordingState('recording');
    }
  }, []);

  const resetRecording = useCallback(() => {
    console.log("Resetting recording");
    setRecordedChunks([]);
    resetTimer();
    setRecordingState('idle');
  }, [resetTimer]);

  return {
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    initializeStream,
    downloadVideo,
    resetRecording,
  };
};
