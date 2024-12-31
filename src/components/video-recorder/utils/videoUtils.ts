import { VideoFormat } from "../types/video";
import { toast } from "@/hooks/use-toast";

export const createVideoUrl = (chunks: Blob[]): string => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  return URL.createObjectURL(blob);
};

export const downloadVideoFile = (chunks: Blob[], format: VideoFormat) => {
  if (chunks.length === 0) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `recording-${timestamp}`;
  const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
  const blob = new Blob(chunks, { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  a.href = url;
  a.download = `${fileName}.${format}`;
  a.click();
  
  URL.revokeObjectURL(url);
  document.body.removeChild(a);

  toast({
    title: "Download started",
    description: `Your video will be downloaded in ${format.toUpperCase()} format`,
  });
};