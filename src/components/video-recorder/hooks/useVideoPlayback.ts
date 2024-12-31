import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export const useVideoPlayback = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const playRecording = (recordedChunks: Blob[]) => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not play the recording",
        });
      });
    }
  };

  return { videoRef, playRecording };
};