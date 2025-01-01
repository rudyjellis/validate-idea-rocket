import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { RecordingState, VideoFormat } from '../types';
import { useMediaStream } from './useMediaStream';
import { useRecordingTimer } from './useRecordingTimer';

export const useVideoRecording = (maxDuration: number = 30) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();
  
  const { streamRef, videoRef, initializeStream } = useMediaStream();
  const { timeLeft, startTimer, stopTimer, pauseTimer, resetTimer } = useRecordingTimer(maxDuration);

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

  const downloadVideo = useCallback((chunks: Blob[], format: VideoFormat) => {
    if (chunks.length === 0) {
      console.log("No recorded chunks available for download");
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "No recording available to download",
      });
      return;
    }

    console.log(`Downloading video in ${format} format`);
    const blob = new Blob(chunks, { type: `video/${format}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording.${format}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Download Started",
      description: `Your video is being downloaded in ${format.toUpperCase()} format`,
    });
  }, [toast]);

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
