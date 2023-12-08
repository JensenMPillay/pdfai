import { UploadStatus } from "@prisma/client";
import { HelpCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const FileStatusBadge = ({ value }: { value: string }) => {
  const variant = (() => {
    switch (value) {
      case UploadStatus.PENDING:
        return "secondary";
      case UploadStatus.PROCESSING:
        return "outline";
      case UploadStatus.FAILED:
        return "destructive";
      case UploadStatus.SUCCESS:
        return "default";
      default:
        return null;
    }
  })();

  return (
    <TooltipProvider>
      <div className="flex w-full items-center justify-center">
        <Badge variant={variant}>{value}</Badge>
        {value === UploadStatus.FAILED && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger className="ml-1.5 cursor-default">
              <HelpCircle className="h-4 w-4 text-zinc-500" />
            </TooltipTrigger>
            <TooltipContent className="w-auto p-2">
              <p>
                File exceeds subscribed plan limit.
                <br />
                Please upgrade your plan.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default FileStatusBadge;
