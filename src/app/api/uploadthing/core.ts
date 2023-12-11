import { PLANS } from "@/config/stripe";
import { db } from "@/db";
import { vectorizeDocumentsFile } from "@/lib/pinecone";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { options } from "../auth/[...nextauth]/options";
import { isPlanExceeded } from "../lib/utils";

export const utapi = new UTApi();

const f = createUploadthing();

const middleware = async () => {
  // Server BEFORE Upload
  // Verify Auth
  const session = await getServerSession(options);
  const user = session?.user;

  // No user = No Upload
  if (!user || !user.id) throw new Error("Unauthorized.");

  // Subscription Plan
  const subscriptionPlan = await getUserSubscriptionPlan();

  // Return = Access in onUploadComplete as `metadata`
  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  // Server AFTER Upload
  const isFileExists = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExists) return;

  // DB Create
  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}` /* file.url */,
      uploadStatus: "PROCESSING",
    },
  });

  try {
    // Vectorization && Indexation of Document
    if (createdFile) vectorizeDocumentsFile({ file: createdFile });

    // Get File/Plan Status
    const isExceeded = await isPlanExceeded({ file: createdFile });

    if (isExceeded) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    } else {
      // DB Update
      await db.file.update({
        data: {
          uploadStatus: "SUCCESS",
        },
        where: {
          id: createdFile.id,
        },
      });
    }
  } catch (error) {
    await db.file.update({
      data: {
        uploadStatus: "FAILED",
      },
      where: {
        id: createdFile.id,
      },
    });
  }
};

// FileRouter App => FileRoutes
export const ourFileRouter = {
  // FileRoute => Unique RouteSlug & File Types
  freePlanUploader: f({
    pdf: {
      maxFileSize: `${
        PLANS.find((plan) => plan.name === "Free")!.sizeLimit
      }MB` as "4MB",
    },
  })
    // Set Permissions
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({
    pdf: {
      maxFileSize: `${
        PLANS.find((plan) => plan.name === "Pro")!.sizeLimit
      }MB` as "16MB",
    },
  })
    // Set Permissions
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
