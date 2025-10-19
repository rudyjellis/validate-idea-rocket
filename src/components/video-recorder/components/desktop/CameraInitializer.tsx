import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../../types";

interface CameraInitializerProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  setSelectedCamera: (deviceId: string) => void;
  initializeStream: (deviceId: string) => Promise<MediaStream>;
  setIsInitializing: (value: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraInitializer = ({
  cameras,
  selectedCamera,
  setSelectedCamera,
  initializeStream,
  setIsInitializing,
  videoRef,
}: CameraInitializerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initCamera = async () => {
      try {
        if (!isMounted) return;
        
        console.log("[CameraInitializer] Starting camera initialization");
        setIsInitializing(true);

        // Timeout protection
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log("[CameraInitializer] Initialization timeout");
            setIsInitializing(false);
          }
        }, 10000);

        // Only initialize if we have a selected camera and no existing stream
        if (cameras.length > 0 && !videoRef.current?.srcObject) {
          const cameraToUse = cameras.find(c => c.deviceId === selectedCamera) || cameras[0];
          console.log("[CameraInitializer] Initializing with camera:", cameraToUse.deviceId);
          
          try {
            await initializeStream(cameraToUse.deviceId);
            console.log("[CameraInitializer] Camera initialized successfully");
          } catch (error) {
            // Fallback: try without specific deviceId
            console.log("[CameraInitializer] First attempt failed, trying fallback");
            await initializeStream("");
          }
        } else if (cameras.length === 0) {
          console.log("[CameraInitializer] No cameras available");
          toast({
            title: "No cameras found",
            description: "Please connect a camera and allow access to use this feature.",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error("[CameraInitializer] Camera initialization error:", error);
        
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
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      console.log("[CameraInitializer] Cleaning up camera initialization");
    };
  }, [cameras, selectedCamera, initializeStream, setIsInitializing, toast, videoRef]);

  return null;
};

export default CameraInitializer;