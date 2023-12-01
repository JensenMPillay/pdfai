import { db } from "@/db";
import { getServerSession } from "next-auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { options } from "../auth/[...nextauth]/options";
import { pinecone } from "@/lib/pinecone";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";

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
    // Get Real File
    const response = await fetch(createdFile.url);
    //   `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
    // );

    // Get File Content
    const blob = await response.blob();

    // Load File
    const loader = new PDFLoader(blob);

    // Get File Docs
    const pageLevelDocs = await loader.load();

    // Get File Length
    const pagesAmt = pageLevelDocs.length;

    // Verify Plan Exceeded
    const { subscriptionPlan } = metadata;
    const { isSubscribed } = subscriptionPlan;

    const isFreeExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

    const isProExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    } else {
      // Vectorization && Indexation of Document
      const pineconeIndex = pinecone.Index("pdfai");

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
        pineconeIndex,
        // namespace: createdFile.id,
      });

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
