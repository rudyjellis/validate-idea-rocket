import { useRef, useEffect, useCallback, useState } from 'react';
import type { VideoElementRef } from '../components/VideoElement';

export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<VideoElementRef>(null);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);

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
      setCurrentStream(stream);

      console.log("Stream initialized and attached to video element");
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
    currentStream,
  };
};