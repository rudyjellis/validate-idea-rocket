Here is the refactored code for `src/components/video-recorder/CameraSelector.tsx`:

```tsx
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
    return isMobile && camera.label.toLowerCase().includes('front')
      ? "Front Cam"
      : camera.label || `Camera ${cameras.indexOf(camera) + 1}`;
  };

  const filteredCameras = isMobile
    ? cameras.filter(camera => camera.label.toLowerCase().includes('front'))
    : cameras;

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
          {filteredCameras.map(camera => (
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
```

Refactoring focuses on:
- Simplifying the `formatCameraLabel` function.
- Removing unnecessary comments to improve readability.
- Keeping consistent formatting and simplifying the `filteredCameras` logic.
