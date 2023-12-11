import { trpc } from "@/app/_trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { useMutation } from "@tanstack/react-query";
import React, { createContext, useRef, useState } from "react";

// Types
type StreamResponse = {
  addMessage: () => void;
  message: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
};

type ChatContextProviderProps = {
  fileId: string;
  children: React.ReactNode;
};

// creation of Context
export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: "",
  handleInputChange: () => {},
  isLoading: false,
});

// Definition of Provider
export const ChatContextProvider = ({
  fileId,
  children,
}: ChatContextProviderProps) => {
  //   Message
  const [message, setMessage] = useState<string>("");

  //   Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //   Utils
  const utils = trpc.useUtils();

  //   Notifications
  const { toast } = useToast();

  // Save BackUp Message to Handle Optimistic Update
  const backupMessage = useRef("");

  //   sendMessage (POST API)
  const { mutate: sendMessage } = useMutation({
    // Mutation Function
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message.");

      return response.body;
    },
    // Direct Mutation to Handle Optimistic Update
    onMutate: async ({ message }) => {
      // Save Message
      backupMessage.current = message;
      // Clean Input
      setMessage("");

      // Cancel Refresh
      await utils.file.getFileMessages.cancel();

      // Get Infinite Data
      const previousMessages = utils.file.getFileMessages.getInfiniteData();

      // Combine Infinite Data
      utils.file.getFileMessages.setInfiniteData(
        {
          fileId,
          limit: INFINITE_QUERY_LIMIT,
        },
        (oldData) => {
          if (!oldData) return { pages: [], pageParams: [] };
          let newPages = [...oldData.pages];
          let latestPage = newPages[0]!;

          // Changing LatestPage Messages Manually
          latestPage.messages = [
            {
              createdAt: new Date(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;

          return { ...oldData, pages: newPages };
        },
      );

      // Loading State
      setIsLoading(true);

      return {
        previousMessages: previousMessages?.pages.flatMap(
          (page) => page.messages ?? [],
        ),
      };
    },
    // Handle Error w/ AI Response : BackupMessage
    onError: (_, __, context) => {
      setMessage(backupMessage.current);
      utils.file.getFileMessages.setData(
        { fileId },
        { messages: context?.previousMessages ?? [], nextCursor: undefined },
      );
    },
    // Handle Success w/ AI Response : Stream
    onSuccess: async (stream) => {
      setIsLoading(false);
      if (!stream)
        return toast({
          title: "There was a problem with this request.",
          description: "Please refresh this page and try again.",
          variant: "destructive",
        });

      // Read Stream
      const reader = stream.getReader();
      // Decoder
      const decoder = new TextDecoder();
      // Task State Initialization
      let done = false;

      // Response Accumulation
      let accResponse = "";

      while (!done) {
        // Read until the end of stream
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        // Accumulate Value
        accResponse += chunkValue;

        utils.file.getFileMessages.setInfiniteData(
          {
            fileId,
            limit: INFINITE_QUERY_LIMIT,
          },
          (oldData) => {
            if (!oldData) return { pages: [], pageParams: [] };

            // Check in Any Message from any Page in OldData Pages
            let isAiResponseCreated = oldData.pages.some((page) =>
              page.messages.some((message) => message.id === "ai-response"),
            );

            let updatedPages = oldData.pages.map((page) => {
              // First Page : Last Message
              if (page === oldData.pages[0]) {
                // Update Message Initialization
                let updatedMessages;
                // Creation of AI Response if Not
                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date(),
                      id: "ai-response",
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ];
                }
                // Accumulation AI Response if Yes
                else {
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === "ai-response")
                      return { ...message, text: accResponse };
                    return message;
                  });
                }
                // Return Override Messages
                return { ...page, messages: updatedMessages };
              }
              // Return Page w/ Override Messages
              return page;
            });
            // Return OldData w/ Override Pages
            return { ...oldData, pages: updatedPages };
          },
        );
      }
    },
    // Handle End of Mutation/Error/Success
    onSettled: async () => {
      // Loading State
      setIsLoading(false);
      // Refresh File Messages
      await utils.file.getFileMessages.invalidate({ fileId });
    },
  });

  //   addMessage Function
  const addMessage = () => sendMessage({ message });

  //   handleInputChange Function
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(e.target.value);

  return (
    <ChatContext.Provider
      value={{ addMessage, message, handleInputChange, isLoading }}
    >
      {children}
    </ChatContext.Provider>
  );
};
