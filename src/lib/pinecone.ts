import { Pinecone } from "@pinecone-database/pinecone";
import { File } from "@prisma/client";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { getDocumentsFile } from "./uploadthing";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: "gcp-starter",
});

export const vectorizeDocumentsFile = async ({ file }: { file: File }) => {
  // Db Indexes
  const pineconeIndex = pinecone.Index("pdfai");

  // Vectorization of Message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Get Documents File
  const pageLevelDocs = await getDocumentsFile({ file: file });

  const documentsFileVectorized =
    pageLevelDocs &&
    // Vector Store
    (await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
      namespace: file.id,
    }));

  // Return PineconeStore
  return documentsFileVectorized;
};

export const getResultsFromVectorizedDocumentsFile = async ({
  file,
  message,
}: {
  file: File;
  message: string;
}) => {
  // Db Indexes
  const pineconeIndex = pinecone.Index("pdfai");

  // Vectorization of Message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Vector Store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: file.id,
  });

  // Results by Similarity of Vectors
  const results = await vectorStore.similaritySearch(message, 4);

  // Return Documents[]
  return results;
};

export const deleteVectorizedDocumentsFile = async ({
  file,
}: {
  file: File;
}) => {
  // Db Indexes
  const pineconeIndex = pinecone.Index("pdfai");

  // Vectorization of Message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Vector Store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: file.id,
  });

  return await vectorStore.delete({ deleteAll: true, namespace: file.id });
};
