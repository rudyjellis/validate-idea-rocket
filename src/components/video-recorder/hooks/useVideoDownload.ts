import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { VideoFormat } from "../types";

export const useVideoDownload = () => {
  const [downloadCounter, setDownloadCounter] = useState(1);
  const { toast } = useToast();

  const downloadVideo = (recordedChunks: Blob[], format: VideoFormat) => {
    if (recordedChunks.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `recording-${timestamp}-${downloadCounter}`;
    const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = `${fileName}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    setDownloadCounter(prev => prev + 1);

    toast({
      title: "Download started",
      description: `Your video will be downloaded in ${format.toUpperCase()} format`,
    });
  };

  return { downloadVideo };
};