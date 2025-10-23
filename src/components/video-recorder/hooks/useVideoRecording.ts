import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { RecordingState, VideoFormat } from '../types';
import { useMediaStream } from './useMediaStream';
import { useRecordingTimer } from './useRecordingTimer';
import { useMediaRecorder } from './useMediaRecorder';
import { useLiveTranscription } from './useLiveTranscription';
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

  // Live transcription hook
  const {
    transcript,
    interimTranscript,
    isTranscribing,
    isSupported: isTranscriptionSupported,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
    resetTranscription,
    fullTranscript,
  } = useLiveTranscription();

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

    // Stop live transcription
    stopTranscription();
    log.log("Live transcription stopped, final transcript length:", transcript.length);

    stopMediaRecorder();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    stopTimer();
    setRecordingState('idle');
  }, [stopMediaRecorder, streamRef, stopTimer, stopTranscription, transcript]);

  // Update ref when stopRecording changes
  stopRecordingRef.current = stopRecording;

  const startRecordingAfterCountdown = useCallback(async (stream: MediaStream) => {
    log.log("Starting recording after countdown");

    // Start live transcription
    const transcriptionStarted = startTranscription();
    if (!transcriptionStarted && isTranscriptionSupported) {
      log.warn("Failed to start transcription, but continuing with recording");
      toast({
        title: "Transcription Warning",
        description: "Live transcription could not start. Recording will continue, but you may need to retry.",
        variant: "default",
      });
    } else if (!isTranscriptionSupported) {
      log.warn("Speech recognition not supported in this browser");
      toast({
        title: "Browser Compatibility",
        description: "Live transcription is not supported in your browser. Please use Chrome or Edge for best results.",
        variant: "default",
      });
    }

    // Start the MediaRecorder with the stream
    startMediaRecorder(stream);
    setRecordingState('recording');
    startTimer();
    setShowCountdown(false);
    log.log("Recording started successfully");
  }, [startMediaRecorder, startTimer, startTranscription, isTranscriptionSupported, toast]);

  const startRecording = useCallback(async (selectedCamera: string, selectedMicrophone?: string) => {
    log.log("Starting recording with camera:", selectedCamera, "and microphone:", selectedMicrophone);
    try {
      const stream = await initializeStream(selectedCamera, selectedMicrophone);
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
    resetTranscription();
    setRecordingState('idle');
  }, [resetMediaRecorder, resetTimer, resetTranscription]);

  const restartRecording = useCallback(() => {
    log.log("Restarting recording");
    // Reset the recording data
    resetMediaRecorder();
    resetTimer();
    // Keep the stream active and restart recording immediately
    if (streamRef.current) {
      startMediaRecorder(streamRef.current);
      setRecordingState('recording');
      startTimer();
      log.log("Recording restarted successfully");
    }
  }, [resetMediaRecorder, resetTimer, startMediaRecorder, startTimer, streamRef]);

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
    restartRecording,
    currentStream,
    showCountdown,

    // Transcription state
    transcript,
    interimTranscript,
    fullTranscript,
    isTranscribing,
    isTranscriptionSupported,
    transcriptionError,
  };
};
