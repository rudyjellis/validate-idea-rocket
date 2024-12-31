import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { RecordingState } from "../types";

export const useVideoRecording = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [downloadCounter, setDownloadCounter] = useState(1);
  const { toast } = useToast();
  const MAX_RECORDING_TIME = 30000;

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (recordingState === "recording") {
      setTimeLeft(30);
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [recordingState]);

  const startRecording = async (selectedCamera: string) => {
    try {
      if (!streamRef.current) {
        await initializeStream(selectedCamera);
      }

      const stream = streamRef.current;
      if (!stream) throw new Error("No active stream");

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
        setRecordingState("idle");
      };

      mediaRecorder.start();
      setRecordingState("recording");

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
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start recording",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
    }
  };

  const downloadVideo = (format: 'webm' | 'mp4') => {
    if (recordedChunks.length === 0) return;

    const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `recorded-video-${downloadCounter}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setDownloadCounter(prev => prev + 1);

    toast({
      title: "Download started",
      description: `Your video will be downloaded in ${format.toUpperCase()} format`,
    });
  };

  return {
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
  };
};