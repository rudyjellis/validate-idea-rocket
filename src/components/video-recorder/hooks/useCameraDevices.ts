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
        console.log("Requesting camera permissions and fetching devices");
        
        // First, request camera permission to get device labels
        let permissionGranted = false;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          permissionGranted = true;
          // Stop the stream immediately, we just needed permission
          stream.getTracks().forEach(track => track.stop());
          console.log("Camera permission granted");
        } catch (permError) {
          console.warn("Camera permission not granted yet:", permError);
        }
        
        // Now enumerate devices - will have labels if permission granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("All devices found:", devices);
        
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        
        // Filter out devices with empty deviceId (shouldn't happen after permission)
        const validCameras = videoDevices.filter(device => device.deviceId && device.deviceId !== '');
        
        if (validCameras.length === 0 && videoDevices.length > 0) {
          console.warn("Found cameras but no valid deviceIds. Permission may not be granted.");
          toast({
            title: "Camera Permission Required",
            description: "Please allow camera access to use video recording.",
          });
          return;
        }
        
        setCameras(validCameras);
        console.log("Available cameras:", validCameras);

        // Set initial camera selection
        const lastSelectedCamera = localStorage.getItem(LAST_CAMERA_KEY);
        const isLastCameraAvailable = validCameras.some(
          (device) => device.deviceId === lastSelectedCamera
        );

        if (lastSelectedCamera && isLastCameraAvailable) {
          setSelectedCamera(lastSelectedCamera);
          console.log("Restored last selected camera:", lastSelectedCamera);
        } else if (validCameras.length > 0) {
          setSelectedCamera(validCameras[0].deviceId);
          console.log("Selected first available camera:", validCameras[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
        toast({
          variant: "destructive",
          title: "Camera Access Error",
          description: "Could not access camera. Please check permissions.",
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