import { useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export const useMediaStream = () => {
  const streamRef = useRef<MediaStream | null>(null);

  const initializeStream = async (selectedCamera: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera },
        audio: true,
      });

      streamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
      });
      return null;
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return { initializeStream, cleanup, streamRef };
};