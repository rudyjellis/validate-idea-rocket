import { useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { VideoFormat } from '../types';

export const useMediaRecorder = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = (stream: MediaStream) => {
    try {
      const options = { 
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
      };

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log("Using WebM recording");
      } catch (e) {
        console.log("WebM not supported, falling back to default format");
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      console.log("MediaRecorder initialized with:", mediaRecorder.mimeType);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log("Recorded chunk size:", e.data.size);
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
        description: "Could not start recording",
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

  const downloadRecording = (format: VideoFormat) => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: format === 'webm' ? 'video/webm' : 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    recordedChunks,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
  };
};