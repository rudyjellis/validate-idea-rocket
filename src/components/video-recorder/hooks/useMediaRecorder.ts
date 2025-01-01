import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { VideoFormat } from '../types';

export const useMediaRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = (stream: MediaStream) => {
    try {
      // Try H.264/MP4 first for iOS compatibility
      const options = { 
        mimeType: 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"',
        videoBitsPerSecond: 2500000,
      };

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log("Using MP4/H.264 recording");
      } catch (e) {
        console.log("H.264 not supported, trying WebM");
        try {
          mediaRecorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm;codecs=h264,opus',
            videoBitsPerSecond: 2500000,
          });
          console.log("Using WebM/H.264 recording");
        } catch (e2) {
          console.log("Falling back to default format");
          mediaRecorder = new MediaRecorder(stream);
        }
      }

      mediaRecorderRef.current = mediaRecorder;
      console.log("MediaRecorder initialized with:", mediaRecorder.mimeType);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log("Recorded chunk size:", e.data.size, "MIME type:", e.data.type);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        console.log("Recording completed, total chunks:", chunks.length);
      };

      // Use smaller timeslices for more frequent data availability
      mediaRecorder.start(1000);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start recording. Please make sure you've granted camera permissions.",
      });
      throw error;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  };

  const resetRecording = () => {
    setRecordedChunks([]);
    console.log("Recording state reset");
  };

  const downloadRecording = (format: VideoFormat) => {
    if (recordedChunks.length === 0) return;

    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: `Your video will be downloaded in ${format.toUpperCase()} format`,
    });
  };

  return {
    recordedChunks,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    resetRecording,
  };
};
