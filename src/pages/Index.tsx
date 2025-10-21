import VideoRecorder from "@/components/video-recorder/VideoRecorder";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'p-0' : 'p-4'}`}>
      <div className={`${isMobile ? 'w-full h-[100dvh] flex items-center justify-center' : 'max-w-2xl mx-auto'}`}>
        <h1 className={`text-2xl font-bold ${isMobile ? 'sr-only' : 'mb-6 text-center'} text-foreground`}>
          Pitch the problem you're solving. Go!
        </h1>
        <div className={`${isMobile ? 'w-full h-full' : 'bg-card rounded-lg shadow-md p-6'}`}>
          <VideoRecorder />
        </div>
      </div>
    </div>
  );
};

export default Index;