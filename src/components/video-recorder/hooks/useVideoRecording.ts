import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { RecordingState, VideoFormat } from "../types";
import { MAX_RECORDING_TIME } from "../constants";
import { initializeMediaStream, stopMediaStream, createDownloadLink } from "../utils";

export const useVideoRecording = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [downloadCounter, setDownloadCounter] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recordingState === "recording") {
      console.log("Starting timer");
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        console.log("Timer update - Elapsed:", elapsed, "Remaining:", remaining);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          console.log("Timer reached zero, stopping recording");
          stopRecording();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      }, 1000);
    } else {
      console.log("Clearing timer, state:", recordingState);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingState === "idle") {
        startTimeRef.current = null;
        setTimeLeft(30);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState]);

  const initializeStream = async (selectedCamera: string) => {
    try {
      stopMediaStream(streamRef.current);
      console.log("Initializing stream with constraints for iOS compatibility");
      
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video playback works on iOS
        videoRef.current.setAttribute('playsinline', '');
        await videoRef.current.play();
      }
      
      console.log("Stream initialized successfully");
    } catch (error) {
      console.error("Error initializing stream:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
      });
    }
  };

  const startRecording = async (selectedCamera: string) => {
    try {
      if (!streamRef.current) {
        await initializeStream(selectedCamera);
      }

      const stream = streamRef.current;
      if (!stream) throw new Error("No active stream");

      // Set proper MIME type for iOS compatibility
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      let mediaRecorder: MediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.log("WebM not supported, trying MP4");
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      console.log("MediaRecorder created with options:", mediaRecorder.mimeType);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log("Received chunk of size:", e.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        setRecordingState("idle");
        startTimeRef.current = null;
        setTimeLeft(30);
        console.log("Recording stopped, chunks stored:", chunks.length);
      };

      // Request data more frequently on iOS
      mediaRecorder.start(1000);
      setRecordingState("recording");
      console.log("Recording started with mime type:", mediaRecorder.mimeType);
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
    console.log("Stopping recording");
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseRecording = () => {
    console.log("Pausing recording");
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    console.log("Resuming recording");
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
    }
  };

  const downloadVideo = (format: VideoFormat) => {
    if (recordedChunks.length === 0) return;

    const { url, fileName } = createDownloadLink(recordedChunks, format, downloadCounter);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setDownloadCounter(prev => prev + 1);
    console.log(`Video downloaded as ${fileName}`);

    toast({
      title: "Download started",
      description: `Your video will be downloaded in ${format.toUpperCase()} format`,
    });
  };

  const playRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: "video/webm" });
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
    playRecording,
  };
};
