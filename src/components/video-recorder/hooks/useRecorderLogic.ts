import { useState, useCallback } from 'react';
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

  const {
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
    await startRecording(selectedCamera);
  }, [selectedCamera, startRecording, toast]);

  const handleDownload = useCallback((format: "webm" | "mp4") => {
    log.log("Initiating download with format:", format);
    downloadVideo(format);
  }, [downloadVideo]);

  const handlePlayback = useCallback(() => {
    log.log("Starting playback");
    setIsPlayingBack(true);
    
    if (videoRef.current) {
      videoRef.current.onended = () => {
        log.log("Playback ended");
        setIsPlayingBack(false);
      };
    }
  }, [videoRef]);

  const handleStopPlayback = useCallback(() => {
    log.log("Stopping playback");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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
    
    // Camera state
    cameras,
    selectedCamera,
    setSelectedCamera,
    
    // Handlers
    handleStartRecording,
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
