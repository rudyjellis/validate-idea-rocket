import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../types";

const LAST_CAMERA_KEY = "last-selected-camera";

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

        // Get the last selected camera from localStorage
        const lastSelectedCamera = localStorage.getItem(LAST_CAMERA_KEY);
        
        // Check if the last selected camera is still available
        const isLastCameraAvailable = videoDevices.some(
          (device) => device.deviceId === lastSelectedCamera
        );

        if (lastSelectedCamera && isLastCameraAvailable) {
          setSelectedCamera(lastSelectedCamera);
        } else if (videoDevices.length > 0) {
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

  // Save the selected camera to localStorage whenever it changes
  useEffect(() => {
    if (selectedCamera) {
      localStorage.setItem(LAST_CAMERA_KEY, selectedCamera);
    }
  }, [selectedCamera]);

  return {
    cameras,
    selectedCamera,
    setSelectedCamera,
  };
};