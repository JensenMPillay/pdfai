import { db } from "@/db";
import { getServerSession } from "next-auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { options } from "../auth/[...nextauth]/options";
import { pinecone } from "@/lib/pinecone";

const f = createUploadthing();

// FileRouter App => FileRoutes
export const ourFileRouter = {
  // FileRoute => Unique RouteSlug & File Types
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    // Set Permissions
    .middleware(async () => {
      // Server BEFORE Upload
      // Verify Auth
      const session = await getServerSession(options);
      const user = session?.user;

      // No user = No Upload
      if (!user || !user.id) throw new Error("Unauthorized.");

      // Return = Access in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Server AFTER Upload
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
        // Get File
        const response = await fetch(
          `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
        );

        // Get File Content
        const blob = await response.blob();

        // Load File
        const loader = new PDFLoader(blob);

        // Get File Docs
        const pageLevelDocs = await loader.load();

        // Get File Length
        const pagesAmt = pageLevelDocs.length;

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
      } catch (error) {
        await db.file.update({
          data: {
            uploadStatus: "SUCCESS",
          },
          where: {
            id: createdFile.id,
          },
        });
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
