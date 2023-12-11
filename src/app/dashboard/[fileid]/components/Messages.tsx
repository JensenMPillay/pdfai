import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { ChatContext } from "@/context/ChatContext";
import { useIntersection } from "@mantine/hooks";
import { Loader2, MessageSquare } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import Message from "./Message";

type MessagesProps = { fileId: string };

const Messages = ({ fileId }: MessagesProps) => {
  // Track lastMessageRef for Scrolling Behavior
  const lastMessageRef = useRef<HTMLDivElement>(null);
  // Get Loading State
  const { isLoading: isAiThinking } = useContext(ChatContext);
  // Get Messages Data
  const { data, isLoading, fetchNextPage } =
    trpc.file.getFileMessages.useInfiniteQuery(
      {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      },
      //   InfiniteQuery Point
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        keepPreviousData: true,
      },
    );

  // Get Messages
  const messages = data?.pages.flatMap((page) => page.messages);

  // Loading Component
  const loadingMessage = {
    createdAt: new Date(),
    id: "loading-message",
    isUserMessage: false,
    text: (
      <span className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    ),
  };

  // Messages Combination
  const combinedMessages = [
    ...(isAiThinking ? [loadingMessage] : []),
    ...(messages ?? []),
  ];

  // Track lastMessageRef
  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  return (
    <div className="scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch flex max-h-[calc(100vh-3.5rem-7rem)] flex-1 flex-col-reverse gap-4 overflow-y-auto border-zinc-200 p-3">
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage;

          if (i === combinedMessages.length - 1) {
            return (
              <Message
                ref={ref}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message.id}
              />
            );
          } else
            return (
              <Message
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
                key={message.id}
              />
            );
        })
      ) : isLoading ? (
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="text-xl font-semibold">You&apos;re all set!</h3>
          <p className="text-sm text-zinc-500">
            Ask your first question to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;
