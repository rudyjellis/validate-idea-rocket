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
  const [downloadCounter, setDownloadCounter] = useState(1);
  const { toast } = useToast();

  const initializeStream = async (selectedCamera: string) => {
    try {
      stopMediaStream(streamRef.current);
      const stream = await initializeMediaStream(selectedCamera);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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
        setTimeLeft(30);
        console.log("Recording stopped, chunks stored:", chunks.length);
      };

      mediaRecorder.start();
      setRecordingState("recording");
      setTimeLeft(30);
      console.log("Recording started");

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
      console.log("Recording stopped manually");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      console.log("Recording paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      console.log("Recording resumed");
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

  useEffect(() => {
    return () => {
      stopMediaStream(streamRef.current);
    };
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
    initializeStream,
    downloadVideo,
    playRecording,
  };
};