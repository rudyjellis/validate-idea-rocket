import { useState, useCallback, useRef } from 'react';
import type { VideoRecorderProps } from '../types';
import { useVideoRecording } from './useVideoRecording';
import { useCameraDevices } from './useCameraDevices';
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
    currentStream,
    showCountdown,
  } = useVideoRecording(maxDuration);

  const { cameras, selectedCamera, setSelectedCamera } = useCameraDevices();

  const handleStartRecording = useCallback(async () => {
    log.log("Starting recording with camera:", selectedCamera);
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
    const stream = await startRecording(selectedCamera);
    if (stream) {
      pendingStreamRef.current = stream;
    }
  }, [selectedCamera, startRecording, toast]);

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
      await initializeStream(deviceId);
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
  }, [recordingState, stopRecording, setSelectedCamera, initializeStream, toast]);

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
    
    // Handlers
    handleStartRecording,
    handleCountdownComplete,
    handleDownload,
    handlePlayback,
    handleStopPlayback,
    handleCameraChange,
    
    // Direct access to recording functions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    initializeStream,
    
    // Toast for error handling
    toast,
  };
};
