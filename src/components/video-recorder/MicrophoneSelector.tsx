import { Mic } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type MediaDeviceInfo } from "./types";

interface MicrophoneSelectorProps {
  microphones: MediaDeviceInfo[];
  selectedMicrophone: string;
  onMicrophoneChange: (deviceId: string) => void;
  disabled: boolean;
}

const MicrophoneSelector = ({
  microphones,
  selectedMicrophone,
  onMicrophoneChange,
  disabled,
}: MicrophoneSelectorProps) => {
  const formatMicrophoneLabel = (microphone: MediaDeviceInfo, index: number) => {
    return microphone.label || `Microphone ${index + 1}`;
  };

  const getCurrentMicrophoneName = () => {
    const currentMic = microphones.find(mic => mic.deviceId === selectedMicrophone);
    return currentMic ? formatMicrophoneLabel(currentMic, microphones.indexOf(currentMic)) : "Unknown";
  };

  if (microphones.length === 0) {
    return (
      <div className="mb-4">
        <div className="text-sm text-muted-foreground">
          No microphones found.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Select
        value={selectedMicrophone}
        onValueChange={onMicrophoneChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select microphone" />
        </SelectTrigger>
        <SelectContent>
          {microphones.map((microphone, index) => (
            <SelectItem key={microphone.deviceId} value={microphone.deviceId}>
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                {formatMicrophoneLabel(microphone, index)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedMicrophone && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
          <span>🎙️</span>
          <span>Currently using: {getCurrentMicrophoneName()}</span>
        </div>
      )}
    </div>
  );
};

export default MicrophoneSelector;