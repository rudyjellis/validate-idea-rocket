import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../types";
import { LAST_CAMERA_KEY } from "../constants";

export const useCameraDevices = () => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const getCameras = async () => {
      try {
        console.log("Fetching available cameras");
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setCameras(videoDevices);
        console.log("Available cameras:", videoDevices);

        // Only set initial camera selection, don't initialize stream here
        const lastSelectedCamera = localStorage.getItem(LAST_CAMERA_KEY);
        const isLastCameraAvailable = videoDevices.some(
          (device) => device.deviceId === lastSelectedCamera
        );

        if (lastSelectedCamera && isLastCameraAvailable) {
          setSelectedCamera(lastSelectedCamera);
          console.log("Restored last selected camera:", lastSelectedCamera);
        } else if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
          console.log("Selected first available camera:", videoDevices[0].deviceId);
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
  }, [toast]);

  useEffect(() => {
    if (selectedCamera) {
      localStorage.setItem(LAST_CAMERA_KEY, selectedCamera);
      console.log("Saved selected camera to localStorage:", selectedCamera);
    }
  }, [selectedCamera]);

  return {
    cameras,
    selectedCamera,
    setSelectedCamera,
  };
};