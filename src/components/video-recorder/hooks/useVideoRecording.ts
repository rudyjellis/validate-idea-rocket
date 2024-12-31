import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { VideoFormat, RecordingState } from "../types/video";
import { createVideoUrl, downloadVideoFile } from "../utils/videoUtils";
import { useRecordingTimer } from "./useRecordingTimer";
import { useMediaStream } from "./useMediaStream";

export const useVideoRecording = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { timeLeft, resetTimer } = useRecordingTimer(recordingState);
  const { initializeStream, cleanup, streamRef } = useMediaStream();
  const { toast } = useToast();
  const MAX_RECORDING_TIME = 30000;

  const initializeVideoStream = async (selectedCamera: string) => {
    const stream = await initializeStream(selectedCamera);
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const startRecording = async (selectedCamera: string) => {
    try {
      if (!streamRef.current) {
        await initializeVideoStream(selectedCamera);
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

  const playRecording = () => {
    if (recordedChunks.length === 0) return;

    const url = createVideoUrl(recordedChunks);
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

  const downloadVideo = (format: VideoFormat) => {
    downloadVideoFile(recordedChunks, format);
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
    initializeStream: initializeVideoStream,
    downloadVideo,
    playRecording,
  };
};