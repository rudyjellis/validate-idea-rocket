import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import type { MediaDeviceInfo } from "../../types";

interface CameraInitializerProps {
  cameras: MediaDeviceInfo[];
  setSelectedCamera: (deviceId: string) => void;
  initializeStream: (deviceId: string) => Promise<MediaStream>;
  setIsInitializing: (value: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraInitializer = ({
  cameras,
  setSelectedCamera,
  initializeStream,
  setIsInitializing,
  videoRef,
}: CameraInitializerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const initCamera = async () => {
      try {
        if (!isMounted) return;
        
        console.log("[CameraInitializer] Starting camera initialization");
        setIsInitializing(true);

        if (cameras.length > 0 && !videoRef.current?.srcObject) {
          console.log("[CameraInitializer] Found cameras, selecting first camera");
          const firstCamera = cameras[0].deviceId;
          setSelectedCamera(firstCamera);
          await initializeStream(firstCamera);
          console.log("[CameraInitializer] Camera initialized successfully");
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
        toast({
          title: "Camera Access Error",
          description: "Please make sure you've granted camera permissions and try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      console.log("[CameraInitializer] Cleaning up camera initialization");
    };
  }, [cameras.length, initializeStream, setIsInitializing, setSelectedCamera, toast, videoRef]);

  return null;
};

export default CameraInitializer;