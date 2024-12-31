import { Camera } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MediaDeviceInfo } from "./types";

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
  if (cameras.length <= 1) return null;

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
          {cameras.map((camera) => (
            <SelectItem key={camera.deviceId} value={camera.deviceId}>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CameraSelector;