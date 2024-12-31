import { useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeStream = async (selectedCamera: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      console.log("Initializing stream with iOS-optimized constraints");
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
      }

      console.log("Stream initialized successfully with iOS optimizations");
      return stream;
    } catch (error) {
      console.error("Error initializing stream:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
      });
      throw error;
    }
  };

  return {
    streamRef,
    videoRef,
    initializeStream,
  };
};