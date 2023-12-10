import { utapi } from "@/app/api/uploadthing/core";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { PLANS } from "@/config/stripe";
import { db } from "@/db";
import { getDbFile, getDbUser } from "@/db/utils";
import { deleteVectorizedDocumentsFile } from "@/lib/pinecone";
import { signUpSchema } from "@/lib/schemas/CredentialsSchema";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { absoluteUrl, isPlanExceeded } from "@/lib/utils";
import { UploadStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure, publicProcedure } from "./trpc";
const bcrypt = require("bcrypt");

// Zod : Zod-TypeScript:RunTime != Typescript:BuildTime

export const registerUserProcedure = publicProcedure
  .input(signUpSchema)
  // Business Logic
  .mutation(async ({ input }) => {
    // Get User
    const dbUser = await getDbUser({
      email: input.email,
    });

    // Error : Case User!
    if (dbUser) throw new TRPCError({ code: "CONFLICT" });

    // Create User
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: await bcrypt.hash(input.password, 10),
      },
    });

    // Error
    if (user) throw new TRPCError({ code: "PARSE_ERROR" });

    // RETURN
    return { success: true };
  });

export const createStripeSessionProcedure = privateProcedure.mutation(
  async ({ ctx }) => {
    // Private Verification
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // DB Verification
    const dbUser = await getDbUser({
      id: ctx.userId,
    });

    if (!dbUser) throw new TRPCError({ code: "NOT_FOUND" });

    // Get Billing URL
    const billingUrl = absoluteUrl("/dashboard/billing");

    // Get Plan
    const subscriptionPlan = await getUserSubscriptionPlan();

    // Case Suscribed -> Stripe Session
    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });

      return { url: stripeSession.url };
    }
    // Case Not Suscribed -> Create Stripe Session
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card", "paypal"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: ctx.userId,
      },
    });

    // RETURN
    return { url: stripeSession.url };
  },
);

export const getUserFilesProcedure = privateProcedure.query(async ({ ctx }) => {
  // Private Verification
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

  // Get Files
  const files = await db.file.findMany({
    where: {
      userId: ctx.userId,
    },
  });
  // Error
  if (!files) throw new TRPCError({ code: "NOT_FOUND" });

  // RETURN
  return files;
});

export const getFileProcedure = privateProcedure
  .input(z.object({ key: z.string() }))
  // Business Logic
  .mutation(async ({ ctx, input }) => {
    // Private Verification
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Get File
    const file = await getDbFile({
      key: input.key,
      userId: ctx.userId,
    });

    // RETURN
    return file;
  });

export const deleteFileProcedure = privateProcedure
  .input(z.object({ id: z.string() }))
  // Business Logic
  .mutation(async ({ ctx, input }) => {
    // Private Verification
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Get File
    const file = await getDbFile({
      id: input.id,
      userId: ctx.userId,
    });

    // Delete DB File
    await db.file.delete({
      where: {
        id: input.id,
        userId: ctx.userId,
      },
    });

    // Delete UploadThing File
    await utapi.deleteFiles(file.key);

    // Delete Pinecone Documents File
    await deleteVectorizedDocumentsFile({ file: file });

    // RETURN
    return file;
  });

export const getFileUploadStatusProcedure = privateProcedure
  .input(z.object({ fileId: z.string() }))
  // Business Logic
  .query(async ({ ctx, input }) => {
    // Private Verification
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Get File
    const file = await db.file.findFirst({
      where: { id: input.fileId, userId: ctx.userId },
    });

    // Error
    if (!file) return { status: "PENDING" as UploadStatus };

    // Get File/Plan Status
    const isExceeded = await isPlanExceeded({ file: file });

    // Update Status
    if (isExceeded) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: file.id,
        },
      });
    } else {
      await db.file.update({
        data: {
          uploadStatus: "SUCCESS",
        },
        where: {
          id: file.id,
        },
      });
    }

    // RETURN
    return { status: file.uploadStatus };
  });

export const getFileMessagesProcedure = privateProcedure
  .input(
    z.object({
      // Limit Optional
      limit: z.number().min(1).max(100).nullish(),
      cursor: z.string().nullish(),
      fileId: z.string(),
    }),
  )
  // Business Logic
  .query(async ({ ctx, input }) => {
    // Private Verification
    if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Limit Configuration to Query
    const limit = input.limit ?? INFINITE_QUERY_LIMIT;

    // Get File
    const file = await getDbFile({
      id: input.fileId,
      userId: ctx.userId,
    });

    const messages = await db.message.findMany({
      // + 1 for cursor up (take : How Many)
      take: limit + 1,
      // (where: Case)
      where: {
        fileId: input.fileId,
      },
      // (orderBy : Order)
      orderBy: {
        createdAt: "desc",
      },
      cursor: input.cursor ? { id: input.cursor } : undefined,
      // (select : Selection)
      select: {
        id: true,
        isUserMessage: true,
        createdAt: true,
        text: true,
      },
    });

    // To Know where to Fetch Data when Scrolling
    let nextCursor: typeof input.cursor | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    // RETURN
    return { messages, nextCursor };
  });
