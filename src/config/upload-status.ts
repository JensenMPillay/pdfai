import { UploadStatusType } from "@/types/file";
import { UploadStatus } from "@prisma/client";
import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  HelpCircleIcon,
  XCircleIcon,
} from "lucide-react";

export const uploadStatuses: UploadStatusType[] = Object.entries(
  UploadStatus,
).map(([key, value]) => {
  return {
    value: key,
    label: value,
    icon: (() => {
      switch (value) {
        case UploadStatus.PENDING:
          return HelpCircleIcon;
        case UploadStatus.PROCESSING:
          return ClockIcon;
        case UploadStatus.FAILED:
          return XCircleIcon;
        case UploadStatus.SUCCESS:
          return CheckCircleIcon;
        default:
          return CircleIcon;
      }
    })(),
  };
});
