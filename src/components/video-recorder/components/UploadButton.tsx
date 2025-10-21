import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UploadStatus } from "@/hooks/useVideoUpload";

interface UploadButtonProps {
  onUpload: () => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadStatus: UploadStatus;
}

const UploadButton = ({ 
  onUpload, 
  disabled = false, 
  isUploading = false, 
  uploadStatus 
}: UploadButtonProps) => {
  const isDisabled = disabled || isUploading || uploadStatus === 'uploading' || uploadStatus === 'analyzing';
  
  const getTooltipMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'Uploading video...';
      case 'analyzing':
        return 'Claude is analyzing your video...';
      case 'error':
        return 'Upload failed. Click to try again.';
      default:
        return 'Generate MVP document from your video';
    }
  };

  const getIcon = () => {
    if (isUploading || uploadStatus === 'uploading' || uploadStatus === 'analyzing') {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return <Brain className="h-5 w-5" />;
  };

  const getButtonVariant = () => {
    if (uploadStatus === 'error') {
      return 'destructive' as const;
    }
    return 'default' as const;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onUpload}
          variant={getButtonVariant()}
          size="icon"
          className="shadow-sm"
          disabled={isDisabled}
        >
          {getIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipMessage()}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default UploadButton;

