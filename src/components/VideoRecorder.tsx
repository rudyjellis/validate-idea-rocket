import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Video, StopCircle } from "lucide-react";

const VideoRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();
  const MAX_RECORDING_TIME = 30000; // 30 seconds in milliseconds

  useEffect(() => {
    return () => {
      // Cleanup function to stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Automatically stop recording after MAX_RECORDING_TIME
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          stopRecording();
          toast({
            title: "Recording completed",
            description: "Maximum recording time (30 seconds) reached",
          });
        }
      }, MAX_RECORDING_TIME);

    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "recorded-video.webm";
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md rounded-lg border border-gray-200 bg-black"
      />
      
      <div className="flex gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="gap-2"
            disabled={recordedChunks.length > 0}
          >
            <Video className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="gap-2"
          >
            <StopCircle className="h-4 w-4" />
            Stop Recording
          </Button>
        )}
        
        {recordedChunks.length > 0 && (
          <Button onClick={downloadVideo} variant="outline">
            Download Recording
          </Button>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;