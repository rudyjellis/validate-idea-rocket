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
  const isProcessing = uploadStatus === 'transcribing' || uploadStatus === 'analyzing';
  const isDisabled = disabled || isUploading || isProcessing;

  const getTooltipMessage = () => {
    switch (uploadStatus) {
      case 'transcribing':
        return 'Transcribing your pitch audio...';
      case 'analyzing':
        return 'Claude 3.5 Haiku is analyzing your transcript...';
      case 'error':
        return 'Upload failed. Click to try again.';
      case 'success':
        return 'Transcript analyzed. Generate again?';
      default:
        return 'Generate MVP document with Claude 3.5 Haiku';
    }
  };

  const getIcon = () => {
    if (isUploading || isProcessing) {
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

  const getButtonClassName = () => {
    if (uploadStatus === 'error') {
      return 'shadow-sm';
    }
    // Anthropic brand color - warm orange/coral
    return 'shadow-sm bg-[#D97757] hover:bg-[#C86647] text-white';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onUpload}
          variant={getButtonVariant()}
          size="icon"
          className={getButtonClassName()}
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

