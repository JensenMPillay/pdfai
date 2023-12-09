import { utapi } from "@/app/api/uploadthing/core";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { PLANS } from "@/config/stripe";
import { db } from "@/db";
import { signUpSchema } from "@/lib/schemas/CredentialsSchema";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { TRPCError } from "@trpc/server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { z } from "zod";
import { privateProcedure, publicProcedure, router } from "./trpc";
const bcrypt = require("bcrypt");

export const appRouter = router({
  registerUser: publicProcedure
    // POST
    .input(signUpSchema)
    // Business Logic
    .mutation(async ({ input }) => {
      const dbUser = await db.user.findFirst({
        where: {
          email: input.email,
        },
      });

      // Error
      if (dbUser) throw new TRPCError({ code: "CONFLICT" });

      const user = await db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: await bcrypt.hash(input.password, 10),
        },
      });

      // Error
      if (dbUser) throw new TRPCError({ code: "PARSE_ERROR" });

      // OPTIONAL
      return { success: true };
    }),
  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

    const billingUrl = absoluteUrl("/dashboard/billing");

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
        userId: userId,
      },
    });

    return { url: stripeSession.url };
  }),
  // GET
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),
  getFile: privateProcedure
    // POST
    .input(z.object({ key: z.string() }))
    // Business Logic
    .mutation(async ({ ctx, input }) => {
      // Get User
      const { userId } = ctx;

      // Find File
      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId,
        },
      });

      // Error
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      return file;
    }),
  // Zod : Zod-TypeScript:RunTime != Typescript:BuildTime
  deleteFile: privateProcedure
    // POST
    .input(z.object({ id: z.string() }))
    // Business Logic
    .mutation(async ({ ctx, input }) => {
      // Get User
      const { userId } = ctx;

      // Find File
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      // Error
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete DB File
      await db.file.delete({
        where: {
          id: input.id,
          userId,
        },
      });

      // Delete UploadThing File
      await utapi.deleteFiles(file.key);

      // OPTIONAL
      return file;
    }),
  getFileUploadStatus: privateProcedure
    // POST
    .input(z.object({ fileId: z.string() }))
    // Business Logic
    .query(async ({ ctx, input }) => {
      // Find File
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      });

      // Error
      if (!file) return { status: "PENDING" as const };

      // Get Real File
      const response = await fetch(file.url);

      // Get File Content
      const blob = await response.blob();

      // Load File
      const loader = new PDFLoader(blob);

      // Get File Docs
      const pageLevelDocs = await loader.load();

      // Get File Length
      const pagesAmt = pageLevelDocs.length;

      // Verify Plan Exceeded
      const subscriptionPlan = await getUserSubscriptionPlan();
      const { isSubscribed } = subscriptionPlan;

      const isFreeExceeded =
        pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

      const isProExceeded =
        pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;

      if (
        (isSubscribed && isProExceeded) ||
        (!isSubscribed && isFreeExceeded)
      ) {
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

      return { status: file.uploadStatus };
    }),
  getFileMessages: privateProcedure
    // POST
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
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      // Find File
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      });

      // Error
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.message.findMany({
        // + 1 for cursor up (take : How Many)
        take: limit + 1,
        // (where: Case)
        where: {
          fileId,
        },
        // (orderBy : Order)
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        // (select : Selection)
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });

      // To Know where to Fetch Data when Scrolling
      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return { messages, nextCursor };
    }),
});

export type AppRouter = typeof appRouter;
