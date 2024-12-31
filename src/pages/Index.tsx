import VideoRecorder from "@/components/video-recorder/VideoRecorder";

const Index = () => {
  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Video Recorder</h1>
        <div className="bg-card rounded-lg shadow-md p-6">
          <VideoRecorder />
        </div>
      </div>
    </div>
  );
};

export default Index;