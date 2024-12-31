import React, { useRef, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import CameraSelector from "./CameraSelector";
import VideoPreview from "./VideoPreview";
import RecordingControls from "./RecordingControls";
import type { MediaDeviceInfo } from "./types";

const VideoRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const { toast } = useToast();
  const MAX_RECORDING_TIME = 30000; // 30 seconds in milliseconds

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

    if (isRecording) {
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
  }, [isRecording]);

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
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

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
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "recorded-video.webm";
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (isRecording) {
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
          disabled={isRecording}
        />
        <VideoPreview ref={videoRef} isRecording={isRecording} timeLeft={timeLeft} />
      </div>

      <RecordingControls
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onDownload={downloadVideo}
        hasRecording={recordedChunks.length > 0}
      />
    </div>
  );
};

export default VideoRecorder;