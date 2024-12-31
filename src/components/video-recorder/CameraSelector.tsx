import { Camera } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MediaDeviceInfo } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraSelectorProps {
  cameras: MediaDeviceInfo[];
  selectedCamera: string;
  onCameraChange: (deviceId: string) => void;
  disabled: boolean;
}

const CameraSelector = ({
  cameras,
  selectedCamera,
  onCameraChange,
  disabled,
}: CameraSelectorProps) => {
  const isMobile = useIsMobile();

  const formatCameraLabel = (camera: MediaDeviceInfo) => {
    if (isMobile && camera.label.toLowerCase().includes('front')) {
      return "Front Cam";
    }
    return camera.label || `Camera ${cameras.indexOf(camera) + 1}`;
  };

  // Filter cameras for mobile devices to only show front camera
  const filteredCameras = isMobile
    ? cameras.filter((camera) => 
        camera.label.toLowerCase().includes('front')
      )
    : cameras;

  // If on mobile and no cameras are shown after filtering, or if there's only one camera, hide the selector
  if (filteredCameras.length <= 1) return null;

  return (
    <div className="mb-4">
      <Select
        value={selectedCamera}
        onValueChange={onCameraChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select camera" />
        </SelectTrigger>
        <SelectContent>
          {filteredCameras.map((camera) => (
            <SelectItem key={camera.deviceId} value={camera.deviceId}>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {formatCameraLabel(camera)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CameraSelector;