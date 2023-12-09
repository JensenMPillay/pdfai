import {
  createStripeSessionProcedure,
  deleteFileProcedure,
  getFileMessagesProcedure,
  getFileProcedure,
  getFileUploadStatusProcedure,
  getUserFilesProcedure,
  registerUserProcedure,
} from "./procedures";
import { router } from "./trpc";
const bcrypt = require("bcrypt");

export const appRouter = router({
  registerUser: registerUserProcedure,
  createStripeSession: createStripeSessionProcedure,
  getUserFiles: getUserFilesProcedure,
  getFile: getFileProcedure,
  deleteFile: deleteFileProcedure,
  getFileUploadStatus: getFileUploadStatusProcedure,
  getFileMessages: getFileMessagesProcedure,
});

export type AppRouter = typeof appRouter;
