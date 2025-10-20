import { useRef, useEffect, useCallback } from 'react';
import type { VideoElementRef } from '../components/VideoElement';

export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<VideoElementRef>(null);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeStream = useCallback(async (selectedCamera: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log("Initializing stream with iOS-optimized constraints");
      const constraints = {
        video: {
          deviceId: selectedCamera ? { ideal: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Note: The actual stream attachment is handled by VideoElement component
      // through the useVideoElementState hook. This function just returns the stream.

      console.log("Stream initialized successfully with iOS optimizations");
      return stream;
    } catch (error) {
      console.error("Error initializing stream:", error);
      throw error;
    }
  }, []);

  return {
    streamRef,
    videoRef,
    initializeStream,
  };
};