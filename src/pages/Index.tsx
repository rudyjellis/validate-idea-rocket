import VideoRecorder from "@/components/video-recorder/VideoRecorder";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'p-0 flex items-center justify-center' : 'p-4'}`}>
      <div className={`${isMobile ? 'w-full h-screen' : 'max-w-2xl mx-auto'}`}>
        <h1 className={`text-2xl font-bold ${isMobile ? 'sr-only' : 'mb-6 text-center'} text-foreground`}>
          Video Recorder
        </h1>
        <div className={`${isMobile ? 'h-full' : 'bg-card rounded-lg shadow-md p-6'}`}>
          <VideoRecorder />
        </div>
      </div>
    </div>
  );
};

export default Index;