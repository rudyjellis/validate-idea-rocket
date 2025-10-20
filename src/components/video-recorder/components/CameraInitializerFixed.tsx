import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../types";

interface CameraInitializerFixedProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  setSelectedCamera: (deviceId: string) => void;
  initializeStream: (deviceId: string) => Promise<MediaStream>;
  setIsInitializing: (value: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraInitializerFixed = ({
  cameras,
  selectedCamera,
  setSelectedCamera,
  initializeStream,
  setIsInitializing,
  videoRef,
}: CameraInitializerFixedProps) => {
  const { toast } = useToast();
  const [initStep, setInitStep] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initCamera = async () => {
      try {
        if (!isMounted) return;
        
        console.log("[CameraInitializerFixed] Starting camera initialization");
        setInitStep("Starting initialization...");
        setIsInitializing(true);

        // Shorter timeout for better UX
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log("[CameraInitializerFixed] Initialization timeout");
            setInitStep("Timeout - trying fallback...");
            setIsInitializing(false);
            toast({
              title: "Camera Setup Timeout",
              description: "Camera setup is taking too long. Please check permissions and try again.",
              variant: "destructive",
            });
          }
        }, 5000); // Reduced from 10 seconds to 5 seconds

        // Check if we have cameras
        if (cameras.length === 0) {
          console.log("[CameraInitializerFixed] No cameras available");
          setInitStep("No cameras detected");
          toast({
            title: "No cameras found",
            description: "Please connect a camera and allow access to use this feature.",
            variant: "destructive",
          });
          return;
        }

        setInitStep("Cameras detected, requesting access...");

        // Check if we already have a stream
        if (videoRef.current?.srcObject) {
          console.log("[CameraInitializerFixed] Stream already exists");
          setInitStep("Camera already active");
          setIsInitializing(false);
          return;
        }

        // Try to initialize with selected camera or first available
        const cameraToUse = cameras.find(c => c.deviceId === selectedCamera) || cameras[0];
        console.log("[CameraInitializerFixed] Initializing with camera:", cameraToUse?.label || cameraToUse?.deviceId);
        setInitStep(`Using ${cameraToUse?.label || 'camera'}...`);
        
        try {
          const stream = await initializeStream(cameraToUse.deviceId);
          if (stream && isMounted) {
            console.log("[CameraInitializerFixed] Camera initialized successfully");
            setInitStep("Camera ready!");
            setIsInitializing(false);
          }
        } catch (error) {
          console.error("[CameraInitializerFixed] Camera initialization error:", error);
          setInitStep("Access denied, trying fallback...");
          
          // Fallback: try without specific deviceId
          try {
            console.log("[CameraInitializerFixed] Trying fallback initialization");
            await initializeStream("");
            if (isMounted) {
              setInitStep("Fallback successful!");
              setIsInitializing(false);
            }
          } catch (fallbackError) {
            console.error("[CameraInitializerFixed] Fallback also failed:", fallbackError);
            setInitStep("Failed to access camera");
            
            // Better error differentiation
            const errorMessage = error instanceof Error ? error.message : String(error);
            let description = "Please make sure you've granted camera permissions and try refreshing the page.";
            
            if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission")) {
              description = "Camera access was denied. Please check your browser settings and grant camera permissions.";
            } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("not found")) {
              description = "Camera not found. Please check your camera connection and try again.";
            }
            
            toast({
              title: "Camera Access Error",
              description,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error("[CameraInitializerFixed] Unexpected error:", error);
        setInitStep("Unexpected error occurred");
        
        toast({
          title: "Camera Setup Error",
          description: "An unexpected error occurred during camera setup. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsInitializing(false);
        }
      }
    };

    // Only initialize when we have both cameras and a selected camera
    if (cameras.length > 0 && selectedCamera) {
      initCamera();
    } else if (cameras.length > 0 && !selectedCamera) {
      // Set the first camera as selected
      setSelectedCamera(cameras[0].deviceId);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      console.log("[CameraInitializerFixed] Cleaning up camera initialization");
    };
  }, [cameras, selectedCamera, initializeStream, setIsInitializing, toast, videoRef, setSelectedCamera]);

  return null;
};

export default CameraInitializerFixed;
