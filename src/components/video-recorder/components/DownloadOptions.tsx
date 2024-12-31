import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DownloadOptionsProps {
  downloadFormat: 'webm' | 'mp4';
  onFormatChange: (format: 'webm' | 'mp4') => void;
}

export const DownloadOptions = ({
  downloadFormat,
  onFormatChange,
}: DownloadOptionsProps) => {
  return (
    <Select
      value={downloadFormat}
      onValueChange={(value: 'webm' | 'mp4') => onFormatChange(value)}
    >
      <SelectTrigger className="w-[180px] mb-2">
        <SelectValue placeholder="Select format" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="webm">WebM</SelectItem>
        <SelectItem value="mp4">MP4</SelectItem>
      </SelectContent>
    </Select>
  );
};