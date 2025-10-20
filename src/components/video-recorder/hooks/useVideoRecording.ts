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
  const [showCountdown, setShowCountdown] = useState(false);
  const { toast } = useToast();
  
  const { streamRef, videoRef, initializeStream, currentStream } = useMediaStream();
  
  const { 
    recordedChunks, 
    startRecording: startMediaRecorder, 
    stopRecording: stopMediaRecorder,
    pauseRecording: pauseMediaRecorder,
    resumeRecording: resumeMediaRecorder,
    resetRecording: resetMediaRecorder,
    downloadRecording
  } = useMediaRecorder();

  // Declare stopRecording ref to avoid circular dependency
  const stopRecordingRef = useRef<(() => void) | null>(null);

  // Initialize timer with auto-stop callback
  const handleTimeExpired = useCallback(() => {
    log.log("Recording time expired - auto-stopping");
    if (stopRecordingRef.current) {
      stopRecordingRef.current();
    }
    toast({
      title: "Recording Complete",
      description: `Maximum recording duration of ${maxDuration} seconds reached.`,
    });
  }, [toast, maxDuration]);

  const { timeLeft, startTimer, stopTimer, pauseTimer, resetTimer } = useRecordingTimer(maxDuration, handleTimeExpired);

  const stopRecording = useCallback(() => {
    log.log("Stopping recording");
    stopMediaRecorder();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    stopTimer();
    setRecordingState('idle');
  }, [stopMediaRecorder, streamRef, stopTimer]);

  // Update ref when stopRecording changes
  stopRecordingRef.current = stopRecording;

  const startRecordingAfterCountdown = useCallback(async (stream: MediaStream) => {
    log.log("Starting recording after countdown");
    // Start the MediaRecorder with the stream
    startMediaRecorder(stream);
    setRecordingState('recording');
    startTimer();
    setShowCountdown(false);
    log.log("Recording started successfully");
  }, [startMediaRecorder, startTimer]);

  const startRecording = useCallback(async (selectedCamera: string) => {
    log.log("Starting recording with camera:", selectedCamera);
    try {
      const stream = await initializeStream(selectedCamera);
      if (!stream) {
        log.error("No stream available");
        return;
      }

      // Show countdown before starting recording
      setShowCountdown(true);
      
      // Return the stream so countdown can trigger actual recording
      return stream;
    } catch (error) {
      log.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
      });
    }
  }, [initializeStream, toast]);

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
    startRecordingAfterCountdown,
    stopRecording,
    pauseRecording,
    resumeRecording,
    initializeStream,
    downloadVideo,
    resetRecording,
    currentStream,
    showCountdown,
  };
};
