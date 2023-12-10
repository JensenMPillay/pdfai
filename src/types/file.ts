import { LucideIcon } from "lucide-react";

// // Get Type Router Outputs from AppRouter
// type RouterOutput = inferRouterOutputs<AppRouter>;

// // Get Type Messages Output from Router Outputs
// export type File = RouterOutput["getFile"];

export type UploadStatusType = {
  value: string;
  label: string;
  icon: LucideIcon;
};
