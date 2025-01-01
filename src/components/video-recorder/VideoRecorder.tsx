import type { VideoRecorderProps } from "./types";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVideoRecorder from "./components/MobileVideoRecorder";
import DesktopVideoRecorder from "./components/DesktopVideoRecorder";

const VideoRecorder = ({ maxDuration = 30, onRecordingComplete }: VideoRecorderProps) => {
  const isMobile = useIsMobile();

  const renderVideoRecorder = () => (
    isMobile ? (
      <MobileVideoRecorder
        maxDuration={maxDuration}
        onRecordingComplete={onRecordingComplete}
      />
    ) : (
      <DesktopVideoRecorder
        maxDuration={maxDuration}
        onRecordingComplete={onRecordingComplete}
      />
    )
  );

  return (
    <div className={`flex flex-col ${isMobile ? 'h-[100dvh]' : ''}`}>
      <div className={`w-full ${isMobile ? 'flex-1 relative' : 'max-w-4xl mx-auto'}`}>
        {renderVideoRecorder()}
      </div>
    </div>
  );
};

export default VideoRecorder;
