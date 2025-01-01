import { useState, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { RecordingState } from "../types";

export const useVideoRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async (selectedCamera: string) => {
    try {
      console.log("Initializing recording with camera:", selectedCamera);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Stream obtained successfully");

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=h264,opus'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setRecordingState("recording");
      startTimer();
      
      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error in startRecording:", error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Failed to start recording. Please check camera permissions.",
      });
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording");
    if (mediaRecorderRef.current && recordingState !== "idle") {
      mediaRecorderRef.current.stop();
      setRecordingState("idle");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTimeLeft(30);
    }
  }, [recordingState]);

  const pauseRecording = useCallback(() => {
    console.log("Pausing recording");
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    console.log("Resuming recording");
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      startTimer();
    }
  }, [recordingState]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playRecording = useCallback(() => {
    if (recordedChunks.length === 0 || !videoRef.current) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    videoRef.current.srcObject = null;
    videoRef.current.src = url;
    videoRef.current.play().catch(console.error);
  }, [recordedChunks]);

  const resetRecording = useCallback(() => {
    setRecordedChunks([]);
    setRecordingState("idle");
    setTimeLeft(30);
  }, []);

  return {
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    resetRecording,
  };
};