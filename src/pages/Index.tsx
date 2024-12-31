import VideoRecorder from "@/components/VideoRecorder";

const Index = () => {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Video Recorder</h1>
        <VideoRecorder />
      </div>
    </div>
  );
};

export default Index;