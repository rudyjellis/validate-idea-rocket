import { useState, useCallback, useRef } from 'react';
import type { VideoRecorderProps } from '../types';
import { useVideoRecording } from './useVideoRecording';
import { useCameraDevices } from './useCameraDevices';
import { useMicrophoneDevices } from './useMicrophoneDevices';
import { useToast } from '@/components/ui/use-toast';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useRecorderLogic');

export const useRecorderLogic = ({ maxDuration = 30 }: VideoRecorderProps) => {
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();
  const pendingStreamRef = useRef<MediaStream | null>(null);

  const {
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
    transcript,
    interimTranscript,
    fullTranscript,
    isTranscribing,
    isTranscriptionSupported,
    transcriptionError,
  } = useVideoRecording(maxDuration);

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();
  const { microphones, selectedMicrophone, setSelectedMicrophone } = useMicrophoneDevices();

  const handleStartRecording = useCallback(async () => {
    log.log("Starting recording with camera:", selectedCamera, "and microphone:", selectedMicrophone);
    if (!selectedCamera) {
      log.error("No camera selected");
      toast({
        title: "No Camera Selected",
        description: "Please select a camera before recording.",
        variant: "destructive",
      });
      return;
    }

    setIsPlayingBack(false);
    const stream = await startRecording(selectedCamera, selectedMicrophone);
    if (stream) {
      pendingStreamRef.current = stream;
    }
  }, [selectedCamera, selectedMicrophone, startRecording, toast]);

  const handleCountdownComplete = useCallback(() => {
    log.log("Countdown complete, starting actual recording");
    if (pendingStreamRef.current) {
      startRecordingAfterCountdown(pendingStreamRef.current);
      pendingStreamRef.current = null;
    }
  }, [startRecordingAfterCountdown]);

  const handleDownload = useCallback((format: "webm" | "mp4") => {
    log.log("Initiating download with format:", format);
    downloadVideo(format);
    // Don't reset - let user keep the recording to upload or download again
  }, [downloadVideo]);

  const handlePlayback = useCallback(async () => {
    log.log("Starting playback");
    setIsPlayingBack(true);
    
    if (videoRef.current) {
      try {
        await videoRef.current.play();
      } catch (error) {
        log.error("Playback error:", error);
      }
    }
  }, [videoRef]);

  const handleStopPlayback = useCallback(() => {
    log.log("Stopping playback");
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlayingBack(false);
  }, [videoRef]);

  const handleCameraChange = useCallback(async (deviceId: string) => {
    try {
      log.log("Changing camera to:", deviceId);
      setIsInitializing(true);

      if (recordingState !== "idle") {
        stopRecording();
      }

      setSelectedCamera(deviceId);
      await initializeStream(deviceId, selectedMicrophone);
    } catch (error) {
      log.error("Camera switch error:", error);
      toast({
        title: "Camera Switch Error",
        description: "Failed to switch cameras. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [recordingState, stopRecording, setSelectedCamera, selectedMicrophone, initializeStream, toast]);

  const handleMicrophoneChange = useCallback(async (deviceId: string) => {
    try {
      log.log("Changing microphone to:", deviceId);
      setIsInitializing(true);

      if (recordingState !== "idle") {
        stopRecording();
      }

      setSelectedMicrophone(deviceId);
      await initializeStream(selectedCamera, deviceId);
    } catch (error) {
      log.error("Microphone switch error:", error);
      toast({
        title: "Microphone Switch Error",
        description: "Failed to switch microphones. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [recordingState, stopRecording, selectedCamera, setSelectedMicrophone, initializeStream, toast]);

  return {
    // State
    isPlayingBack,
    isInitializing,
    setIsInitializing,

    // Video recording state
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    currentStream,
    showCountdown,

    // Camera state
    cameras,
    selectedCamera,
    setSelectedCamera,

    // Microphone state
    microphones,
    selectedMicrophone,
    setSelectedMicrophone,

    // Transcription state
    transcript,
    interimTranscript,
    fullTranscript,
    isTranscribing,
    isTranscriptionSupported,
    transcriptionError,

    // Handlers
    handleStartRecording,
    handleCountdownComplete,
    handleDownload,
    handlePlayback,
    handleStopPlayback,
    handleCameraChange,
    handleMicrophoneChange,

    // Direct access to recording functions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    restartRecording,
    initializeStream,

    // Toast for error handling
    toast,
  };
};
