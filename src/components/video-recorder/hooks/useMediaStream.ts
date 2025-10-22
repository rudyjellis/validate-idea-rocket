import { useRef, useEffect, useCallback, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { VideoElementRef } from '../components/VideoElement';
import { createVideoRecorderLogger } from '@/utils/logger';

const log = createVideoRecorderLogger('useMediaStream');

export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<VideoElementRef>(null);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeStream = useCallback(async (selectedCamera: string, selectedMicrophone?: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Device-aware constraints: portrait (9:16) for mobile, landscape (16:9) for desktop
      const videoConstraints = isMobile ? {
        deviceId: selectedCamera ? { ideal: selectedCamera } : undefined,
        width: { ideal: 720, min: 480 },
        height: { ideal: 1280, min: 640 },
        aspectRatio: { ideal: 9/16 },
        facingMode: 'user',
        zoom: { ideal: 1.0 },  // Zoomed out for wider field of view
      } : {
        deviceId: selectedCamera ? { ideal: selectedCamera } : undefined,
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        aspectRatio: { ideal: 16/9 },
      };

      log.log(`Initializing stream for ${isMobile ? 'mobile (9:16)' : 'desktop (16:9)'}`);

      const audioConstraints = selectedMicrophone ? {
        deviceId: { ideal: selectedMicrophone },
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      } : {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      };

      const constraints = {
        video: videoConstraints,
        audio: audioConstraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCurrentStream(stream);

      // Log actual stream dimensions and capabilities for verification
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        const capabilities = videoTrack.getCapabilities();
        
        log.log(`Stream initialized: ${settings.width}x${settings.height} (aspect: ${(settings.width! / settings.height!).toFixed(4)})`);
        
        // Log zoom info if available
        if (settings.zoom !== undefined) {
          log.log(`Zoom: ${settings.zoom}`);
        }
        if (capabilities.zoom) {
          log.log(`Zoom capabilities: min=${capabilities.zoom.min}, max=${capabilities.zoom.max}`);
        }
      }

      return stream;
    } catch (error) {
      log.error("Error initializing stream:", error);
      throw error;
    }
  }, [isMobile]);

  return {
    streamRef,
    videoRef,
    initializeStream,
    currentStream,
  };
};