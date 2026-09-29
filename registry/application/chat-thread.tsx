import type { ReactNode } from "react";

import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  /** "me" for the reader's own messages; anything else is the other side. */
  author: string;
  name: string;
  /** Plain text or your own rendering (markdown, attachments). */
  body: ReactNode;
  /** Shown under the last message of a run: "09:41". */
  time?: string;
  /** For "me": sending, sent or failed. */
  state?: "sending" | "sent" | "failed";
}

export interface ChatThreadProps {
  messages: readonly ChatMessage[];
  /** Shown at the end while the other side is writing. */
  typing?: string | null;
  label?: string;
  className?: string;
}

/**
 * A conversation: the reader's messages on the right, the other side on the
 * left, consecutive messages from one person grouped under one avatar. It is
 * a log for screen readers, so new messages are announced politely, and a
 * failed message says so in words.
 */
export function ChatThread({ messages, typing = null, label = "Conversation", className }: ChatThreadProps) {
  return (
    <div data-slot="chat-thread" role="log" aria-label={label} aria-live="polite" className={cn("grid gap-1", className)}>
      {messages.map((message, index) => {
        const mine = message.author === "me";
        const first = messages[index - 1]?.author !== message.author;
        const last = messages[index + 1]?.author !== message.author;
        return (
          <div key={message.id} className={cn("flex items-end gap-2", mine && "flex-row-reverse", first && index > 0 && "mt-3")}>
            {!mine ? (
              <span className={cn("w-7 shrink-0", last && (message.time || message.state) && "mb-5")}>
                {last ? (
                  <Avatar size="sm">
                    <AvatarFallback>{initialsOf(message.name)}</AvatarFallback>
                  </Avatar>
                ) : null}
              </span>
            ) : null}
            <div className={cn("grid max-w-[78%] gap-1", mine && "justify-items-end")}>
              {first && !mine ? <span className="px-1 text-xs text-muted-foreground">{message.name}</span> : null}
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  mine ? "bg-foreground text-background" : "bg-muted text-foreground",
                  mine ? (last ? "rounded-br-md" : "") : last ? "rounded-bl-md" : "",
                  message.state === "sending" && "opacity-60",
                  message.state === "failed" && "ring-2 ring-destructive",
                )}
              >
                {message.body}
              </div>
              {last && (message.time || message.state) ? (
                <span className={cn("px-1 text-[0.6875rem] text-muted-foreground", message.state === "failed" && "text-destructive")}>
                  {message.state === "failed" ? "Not sent. Tap to retry." : message.state === "sending" ? "Sending…" : message.time}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
      {typing ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex gap-1 rounded-2xl bg-muted px-3 py-2.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span key={dot} className="size-1.5 rounded-full bg-muted-foreground motion-safe:animate-bounce" style={{ animationDelay: `${dot * 140}ms` }} />
            ))}
          </span>
          {typing} is typing
        </div>
      ) : null}
    </div>
  );
}
