import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../types";

export const useCameraDevices = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const { toast } = useToast();

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

  return {
    cameras,
    selectedCamera,
    setSelectedCamera,
  };
};