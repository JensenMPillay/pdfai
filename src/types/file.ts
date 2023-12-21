import { LucideIcon } from "lucide-react";

type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
type SizeUnit = "B" | "KB" | "MB" | "GB";
export type FileSize = `${PowOf2}${SizeUnit}`;

export type UploadStatusType = {
  value: string;
  label: string;
  icon: LucideIcon;
};
