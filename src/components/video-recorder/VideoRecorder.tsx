import React, { useRef, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import CameraSelector from "./CameraSelector";
import VideoPreview from "./VideoPreview";
import RecordingControls from "./RecordingControls";
import type { MediaDeviceInfo, RecordingState } from "./types";

const VideoRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const { toast } = useToast();
  const MAX_RECORDING_TIME = 30000; // 30 seconds in milliseconds
  const [downloadFormat, setDownloadFormat] = useState<'webm' | 'mp4'>('webm');

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not get available cameras",
        });
      }
    };

    getCameras();
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Only run the timer when the recording state is "recording"
    if (recordingState === "recording") {
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
  }, [recordingState]); // Now depends on recordingState instead of isRecording

  const startRecording = async () => {
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
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
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
      console.error("Error accessing media devices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access camera or microphone",
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
      // Timer will automatically pause due to the useEffect dependency on recordingState
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      // Timer will automatically resume due to the useEffect dependency on recordingState
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;

    const mimeType = downloadFormat === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `recorded-video.${downloadFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Download started",
      description: `Your video will be downloaded in ${downloadFormat.toUpperCase()} format`,
    });
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (recordingState !== "idle") {
      stopRecording();
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId },
        audio: true,
      });

      streamRef.current = newStream;
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("Error switching camera:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not switch camera",
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-md">
        <CameraSelector
          cameras={cameras}
          selectedCamera={selectedCamera}
          onCameraChange={handleCameraChange}
          disabled={recordingState !== "idle"}
        />
        <VideoPreview 
          ref={videoRef} 
          isRecording={recordingState === "recording"} 
          timeLeft={timeLeft} 
        />
      </div>

      <div className="flex flex-col gap-2 items-center">
        {recordedChunks.length > 0 && (
          <Select
            value={downloadFormat}
            onValueChange={(value: 'webm' | 'mp4') => setDownloadFormat(value)}
          >
            <SelectTrigger className="w-[180px] mb-2">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webm">WebM</SelectItem>
              <SelectItem value="mp4">MP4</SelectItem>
            </SelectContent>
          </Select>
        )}
        
        <RecordingControls
          recordingState={recordingState}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onDownload={downloadVideo}
          hasRecording={recordedChunks.length > 0}
        />
      </div>
    </div>
  );
};

export default VideoRecorder;
