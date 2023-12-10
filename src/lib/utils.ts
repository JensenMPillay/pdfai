import { PLANS } from "@/config/stripe";
import { File } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";
import { getUserSubscriptionPlan } from "./stripe";
import { getDocumentsFile } from "./uploadthing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  // Verify Client Side
  if (typeof window !== "undefined") return path;
  if (process.env.VERCEL_URL)
    return `https://pdfai-jensenmpillay.vercel.app${path}`;
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
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

// Basic Metadata Boilerplate
export function constructMetadata({
  title = "PDFAI - Saas PDF AI Analyzer",
  description = "PDFAI is an open-source software to analyze PDF with AI.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@jensenmpillay",
    },
    icons,
    metadataBase: new URL("https://pdfai-jensenmpillay.vercel.app"),
    themeColor: "#FFF",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
