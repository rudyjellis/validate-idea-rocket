import type { VideoRecorderProps } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVideoRecorder from "./components/MobileVideoRecorder";
import DesktopVideoRecorder from "./components/DesktopVideoRecorder";

const VideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col ${isMobile ? 'h-full' : ''}`}>
      <div className={`w-full ${isMobile ? 'flex-1 relative' : 'max-w-md mx-auto'}`}>
        {isMobile ? (
          <MobileVideoRecorder
            maxDuration={maxDuration}
            onRecordingComplete={onRecordingComplete}
          />
        ) : (
          <DesktopVideoRecorder
            maxDuration={maxDuration}
            onRecordingComplete={onRecordingComplete}
          />
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;