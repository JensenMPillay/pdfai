import { PLANS } from "@/config/stripe";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { File } from "@prisma/client";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export async function getDocumentsFile({ file }: { file: File }) {
  // Get Real File
  const response = await fetch(file.url);
  //   `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
  // );

  // Get File Content
  const blob = await response.blob();

  // Load File
  const loader = new PDFLoader(blob);

  // Get File Docs
  const pageLevelDocs = await loader.load();

  //   Return Documents[]
  return pageLevelDocs;
}

export async function isPlanExceeded({ file }: { file: File }) {
  const pageLevelDocs = await getDocumentsFile({ file: file });

  // Get File Length
  const pagesAmt = pageLevelDocs.length;

  // Verify Plan Exceeded
  const subscriptionPlan = await getUserSubscriptionPlan();
  const { isSubscribed } = subscriptionPlan;

  // Get Number of Pages
  const isFreeExceeded =
    pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

  const isProExceeded =
    pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;

  // Get File/Plan Status
  const isExceeded =
    (isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded);

  // Return Boolean
  return isExceeded;
}
