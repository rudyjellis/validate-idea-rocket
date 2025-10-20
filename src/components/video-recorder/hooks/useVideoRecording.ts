import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { RecordingState, VideoFormat } from '../types';
import { useMediaStream } from './useMediaStream';
import { useRecordingTimer } from './useRecordingTimer';
import { useMediaRecorder } from './useMediaRecorder';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useVideoRecording');

export const useVideoRecording = (maxDuration: number = 30) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const { toast } = useToast();
  
  const { streamRef, videoRef, initializeStream, currentStream } = useMediaStream();
  const { timeLeft, startTimer, stopTimer, pauseTimer, resetTimer } = useRecordingTimer(maxDuration);
  const { 
    recordedChunks, 
    startRecording: startMediaRecorder, 
    stopRecording: stopMediaRecorder,
    pauseRecording: pauseMediaRecorder,
    resumeRecording: resumeMediaRecorder,
    resetRecording: resetMediaRecorder,
    downloadRecording
  } = useMediaRecorder();

  const startRecording = useCallback(async (selectedCamera: string) => {
    log.log("Starting recording with camera:", selectedCamera);
    try {
      const stream = await initializeStream(selectedCamera);
      if (!stream) {
        log.error("No stream available");
        return;
      }

      // Start the MediaRecorder with the stream
      startMediaRecorder(stream);
      setRecordingState('recording');
      startTimer();
      
      log.log("Recording started successfully");
    } catch (error) {
      log.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
      });
    }
  }, [initializeStream, startMediaRecorder, startTimer, toast]);

  const stopRecording = useCallback(() => {
    log.log("Stopping recording");
    stopMediaRecorder();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    stopTimer();
    setRecordingState('idle');
  }, [stopMediaRecorder, stopTimer]);

  const pauseRecording = useCallback(() => {
    log.log("Pausing recording");
    pauseMediaRecorder();
    pauseTimer();
    setRecordingState('paused');
  }, [pauseMediaRecorder, pauseTimer]);

  const resumeRecording = useCallback(() => {
    log.log("Resuming recording");
    resumeMediaRecorder();
    startTimer();
    setRecordingState('recording');
  }, [resumeMediaRecorder, startTimer]);

  const resetRecording = useCallback(() => {
    log.log("Resetting recording");
    resetMediaRecorder();
    resetTimer();
    setRecordingState('idle');
  }, [resetMediaRecorder, resetTimer]);

  const downloadVideo = useCallback((format: VideoFormat) => {
    downloadRecording(format);
  }, [downloadRecording]);

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
    currentStream,
  };
};
