import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { options } from "../auth/[...nextauth]/options";
import { sendMessageSchema } from "@/lib/schemas/SendMessageSchema";
import { db } from "@/db";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { pinecone } from "@/lib/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { openai } from "@/lib/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

export const POST = async (req: NextRequest) => {
  // Endpoint for message to pdf file

  //   Json from Message
  const body = await req.json();

  //   Get User
  const session = await getServerSession(options);
  const user = session?.user;

  const { id: userId } = user;

  //   Error User
  if (!userId) return new Response("Unauthorized.", { status: 401 });

  //   Validator by Zod Schema
  const { fileId, message } = sendMessageSchema.parse(body);

  //   Get File
  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  //   Error File
  if (!file) return new Response("Not Found.", { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });

  // Vectorization of Message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Db Indexes
  const pineconeIndex = pinecone.Index("pdfai");

  // Vector Store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  // Results by Similarity of Vectors
  const results = await vectorStore.similaritySearch(message, 4);

  // PrevMessages
  const prevMessages = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 6,
  });

  // Formatted PrevMessages for OpenAI
  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
    content: msg.text,
  }));

  // OpenAI API Call
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.",
      },
      {
        role: "user",
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === "user") return `User: ${message.content}\n`;
    return `Assistant: ${message.content}\n`;
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join("\n\n")}
  
  USER INPUT: ${message}`,
      },
    ],
  });

  // Stream OpenAI API Response
  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId,
        },
      });
    },
  });

  return new StreamingTextResponse(stream);
};
