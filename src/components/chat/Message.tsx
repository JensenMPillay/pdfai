import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ExtendedMessage } from "@/types/message";
import { Icons } from "../Icons";

type MessageProps = {
  message: ExtendedMessage;
  isNextMessageSamePerson: boolean;
};

// forwardRef Syntax : () => {} & displayName
const Message = forwardRef<HTMLDivElement, MessageProps>(
  ({ message, isNextMessageSamePerson }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-end", {
          "justify-end": message.isUserMessage,
        })}
      >
        <div
          className={cn(
            "relative flex aspect-square h-6 w-6 items-center justify-center",
            {
              "order-2 rounded-sm bg-blue-600": message.isUserMessage,
              "order-1 rounded-sm bg-zinc-800": !message.isUserMessage,
              invisible: isNextMessageSamePerson,
            },
          )}
        >
          {message.isUserMessage ? (
            <Icons.user className="h-3/4 w-3/4 fill-zinc-200 text-zinc-200" />
          ) : (
            <Icons.logo className="h-3/4 w-3/4 fill-zinc-300" />
          )}
        </div>

        <div
          className={cn("mx-2 flex max-w-md flex-col space-y-2 text-base", {
            "order-1 items-end": message.isUserMessage,
            "order-2 items-start": !message.isUserMessage,
          })}
        >
          <div
            className={cn("inline-block rounded-lg px-4 py-2", {
              "bg-blue-600 text-white": message.isUserMessage,
              "bg-gray-200 text-gray-900": !message.isUserMessage,
              "rounded-br-none":
                !isNextMessageSamePerson && message.isUserMessage,
              "rounded-bl-none":
                !isNextMessageSamePerson && !message.isUserMessage,
            })}
          >
            {typeof message.text === "string" ? (
              <ReactMarkdown
                className={cn("prose", {
                  "text-zinc-50": message.isUserMessage,
                })}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
              message.text
            )}
            {message.id !== "loading-message" ? (
              <div
                className={cn("mt-2 w-full select-none text-right text-xs", {
                  "text-zinc-500": !message.isUserMessage,
                  "text-blue-300": message.isUserMessage,
                })}
              >
                {format(new Date(message.createdAt), "HH:mm")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  },
);

Message.displayName = "Message";

export default Message;
