import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { RecordingState, VideoFormat } from "../types";
import { initializeMediaStream, stopMediaStream } from "../utils/mediaUtils";
import { useRecordingTimer } from "./useRecordingTimer";
import { useVideoDownload } from "./useVideoDownload";
import { useVideoPlayback } from "./useVideoPlayback";

export const useVideoRecording = () => {
  const { videoRef, playRecording } = useVideoPlayback();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { timeLeft, resetTimer } = useRecordingTimer(recordingState);
  const { downloadVideo } = useVideoDownload();
  const { toast } = useToast();
  const MAX_RECORDING_TIME = 30000;

  const initializeStream = async (selectedCamera: string) => {
    try {
      stopMediaStream(streamRef.current);
      const stream = await initializeMediaStream(selectedCamera);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
      });
    }
  };

  useEffect(() => {
    return () => {
      stopMediaStream(streamRef.current);
    };
  }, []);

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
        resetTimer();
      };

      mediaRecorder.start();
      setRecordingState("recording");
      resetTimer();

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

  const handleDownload = (format: VideoFormat) => {
    downloadVideo(recordedChunks, format);
  };

  const handlePlayRecording = () => {
    playRecording(recordedChunks);
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
    downloadVideo: handleDownload,
    playRecording: handlePlayRecording,
  };
};