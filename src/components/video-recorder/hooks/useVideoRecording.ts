import { useState, useRef } from 'react';
import type { RecordingState, VideoFormat } from '../types';
import { useMediaStream } from './useMediaStream';
import { useRecordingTimer } from './useRecordingTimer';
import { useMediaRecorder } from './useMediaRecorder';

export const useVideoRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const { streamRef, videoRef, initializeStream } = useMediaStream();
  const { timeLeft, startTimer, stopTimer, pauseTimer } = useRecordingTimer();
  const {
    recordedChunks,
    startRecording,
    stopRecording: stopMediaRecorder,
    pauseRecording: pauseMediaRecorder,
    resumeRecording: resumeMediaRecorder,
    downloadRecording,
    resetRecording: resetMediaRecorder,
  } = useMediaRecorder();

  const startRecordingProcess = async (selectedCamera: string) => {
    try {
      const stream = await initializeStream(selectedCamera);
      startRecording(stream);
      setRecordingState("recording");
      startTimer();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecordingProcess = () => {
    stopMediaRecorder();
    stopTimer();
    setRecordingState("idle");
  };

  const pauseRecordingProcess = () => {
    pauseMediaRecorder();
    pauseTimer();
    setRecordingState("paused");
  };

  const resumeRecordingProcess = () => {
    resumeMediaRecorder();
    startTimer();
    setRecordingState("recording");
  };

  const resetRecording = () => {
    resetMediaRecorder();
    setRecordingState("idle");
  };

  const playRecording = () => {
    if (recordedChunks.length === 0 || !videoRef.current) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    videoRef.current.srcObject = null;
    videoRef.current.src = url;
    videoRef.current.play().catch(console.error);
  };

  return {
    videoRef,
    recordingState,
    recordedChunks,
    timeLeft,
    startRecording: startRecordingProcess,
    stopRecording: stopRecordingProcess,
    pauseRecording: pauseRecordingProcess,
    resumeRecording: resumeRecordingProcess,
    initializeStream,
    downloadVideo: downloadRecording,
    playRecording,
    resetRecording,
  };
};