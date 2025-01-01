import { useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { RecordingState, VideoFormat } from '../types';
import { useMediaStream } from './useMediaStream';
import { useMediaRecorder } from './useMediaRecorder';
import { useRecordingTimer } from './useRecordingTimer';
import { useVideoPlayback } from './useVideoPlayback';
import { useVideoDownload } from './useVideoDownload';

export const useVideoRecording = (maxDuration: number = 30) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();
  
  const { streamRef, videoRef, initializeStream } = useMediaStream();
  const { timeLeft, startTimer, stopTimer, pauseTimer, resetTimer } = useRecordingTimer(maxDuration);
  const { downloadVideo } = useVideoDownload();
  const { playRecording } = useVideoPlayback();

  const startRecording = useCallback(async (selectedCamera: string) => {
    console.log("Starting recording with camera:", selectedCamera);
    try {
      const stream = await initializeStream(selectedCamera);
      if (!stream) {
        console.error("No stream available");
        return;
      }

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    stopTimer();
    setRecordingState('idle');
  }, [stopTimer]);

  const pauseRecording = useCallback(() => {
    console.log("Pausing recording");
    pauseTimer();
    setRecordingState('paused');
  }, [pauseTimer]);

  const resumeRecording = useCallback(() => {
    console.log("Resuming recording");
    startTimer();
    setRecordingState('recording');
  }, [startTimer]);

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