import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { File } from "@prisma/client";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export const getDocumentsFile = async ({ file }: { file: File }) => {
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
};
