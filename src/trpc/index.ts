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

export const appRouter = router({
  user: router({
    registerUser: registerUserProcedure,
    createStripeSession: createStripeSessionProcedure,
    getUserFiles: getUserFilesProcedure,
  }),
  file: router({
    getFile: getFileProcedure,
    deleteFile: deleteFileProcedure,
    getFileUploadStatus: getFileUploadStatusProcedure,
    getFileMessages: getFileMessagesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
