import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";
import { string } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  // Verify Client Side
  if (typeof window !== "undefined") return path;
  if (process.env.VERCEL_URL) return `https://pdfai-seven.vercel.app${path}`;
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
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
    metadataBase: new URL("https://pdfai-seven.vercel.app"),
    themeColor: "#FFF",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
