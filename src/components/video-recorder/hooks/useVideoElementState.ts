import React, { useRef, useCallback, useState } from 'react';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useVideoElementState');

export type VideoElementMode = 'stream' | 'playback' | 'idle';

export const useVideoElementState = () => {
  const [currentMode, setCurrentMode] = useState<VideoElementMode>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const switchToStream = useCallback(async (stream: MediaStream) => {
    if (!videoRef.current) {
      log.error("Video element not available for stream switch");
      return;
    }

    try {
      setIsLoading(true);
      log.log("Switching video element to stream mode");
      
      // Clear any existing sources
      if (videoRef.current && videoRef.current.src) {
        videoRef.current.src = '';
        videoRef.current.load();
      }
      
      // Set the stream as source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Ensure proper attributes for live stream
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
      }
      
      // Wait for the stream to be ready
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element not available'));
          return;
        }
        
        const handleLoadedMetadata = () => {
          videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current?.removeEventListener('error', handleError);
          resolve(void 0);
        };
        
        const handleError = (e: Event) => {
          videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current?.removeEventListener('error', handleError);
          reject(e);
        };
        
        if (videoRef.current) {
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.addEventListener('error', handleError);
        }
      });
      
      setCurrentMode('stream');
      log.log("Successfully switched to stream mode");
    } catch (error) {
      log.error("Error switching to stream mode:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchToPlayback = useCallback(async (videoBlob: Blob) => {
    if (!videoRef.current) {
      log.error("Video element not available for playback switch");
      return;
    }

    try {
      setIsLoading(true);
      log.log("Switching video element to playback mode");
      
      // Clear the stream source
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      
      // Create object URL for the blob
      const url = URL.createObjectURL(videoBlob);
      if (videoRef.current) {
        videoRef.current.src = url;
        
        // Set attributes for playback
        videoRef.current.muted = false;
        videoRef.current.autoplay = false;
        videoRef.current.playsInline = true;
      }
      
      // Wait for the video to be ready
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element not available'));
          return;
        }
        
        const handleCanPlay = () => {
          videoRef.current?.removeEventListener('canplay', handleCanPlay);
          videoRef.current?.removeEventListener('error', handleError);
          resolve(void 0);
        };
        
        const handleError = (e: Event) => {
          videoRef.current?.removeEventListener('canplay', handleCanPlay);
          videoRef.current?.removeEventListener('error', handleError);
          reject(e);
        };
        
        if (videoRef.current) {
          videoRef.current.addEventListener('canplay', handleCanPlay);
          videoRef.current.addEventListener('error', handleError);
        }
      });
      
      setCurrentMode('playback');
      log.log("Successfully switched to playback mode");
    } catch (error) {
      log.error("Error switching to playback mode:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetToIdle = useCallback(() => {
    if (!videoRef.current) return;
    
    log.log("Resetting video element to idle mode");
    
    // Stop any playback
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      
      // Clear sources
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      if (videoRef.current.src) {
        URL.revokeObjectURL(videoRef.current.src);
        videoRef.current.src = '';
      }
    }
    
    setCurrentMode('idle');
    setIsLoading(false);
  }, []);

  const cleanup = useCallback(() => {
    if (videoRef.current?.src) {
      URL.revokeObjectURL(videoRef.current.src);
    }
  }, []);

  return {
    videoRef,
    currentMode,
    isLoading,
    switchToStream,
    switchToPlayback,
    resetToIdle,
    cleanup,
  };
};
