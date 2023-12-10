import { db } from "@/db";
import { openai } from "@/lib/openai";
import { getResultsFromVectorizedDocumentsFile } from "@/lib/pinecone";
import { sendMessageSchema } from "@/lib/schemas/SendMessageSchema";
import { Message } from "@prisma/client";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { options } from "../auth/[...nextauth]/options";

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

  // DB Create
  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });

  // get Results From Vectorization
  const results = await getResultsFromVectorizedDocumentsFile({
    file: file,
    message: message,
  });

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
  const formattedPrevMessages = prevMessages.map((msg: Message) => ({
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
          "Please be brief, precise, and concise, using the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format.",
      },
      {
        role: "user",
        content: `Please be brief, precise, and concise, using the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === "user") return `User: ${message.content}\n`;
    return `Assistant: ${message.content}\n`;
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results && results.map((r) => r.pageContent).join("\n\n")}
  
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
