import { z } from "zod";

export const sendMessageSchema = z.object({
  fileId: z.string(),
  message: z.string(),
});
