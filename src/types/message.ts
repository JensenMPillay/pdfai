import { AppRouter } from "@/trpc";
import { inferRouterOutputs } from "@trpc/server";

// Get Type Router Outputs from AppRouter
type RouterOutput = inferRouterOutputs<AppRouter>;

// Get Type Messages Output from Router Outputs
type Messages = RouterOutput["getFileMessages"]["messages"];

// Get Type /w text (which can only be string here)
type OmitText = Omit<Messages[number], "text">;

// Create new Type for text (string | JSX)
type ExtendedText = {
  text: string | React.JSX.Element;
};

// Combine Message Type /w Text & new Text Type
export type ExtendedMessage = OmitText & ExtendedText;
