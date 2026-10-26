"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconCheckDouble, IconSpinner } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** Whose message it is: `own` sits on the right on the primary surface, `other` on the left on a muted one. */
export type MessageSide = "own" | "other";

/** Where a message of your own stands. Only `failed` asks for something: a retry. */
export type MessageStatus = "sending" | "sent" | "read" | "failed";

/** Where the bubble sits in a run of messages from the same person, so the corners can join. */
export type MessagePosition = "single" | "first" | "middle" | "last";

/** The message a bubble answers, quoted above its text. */
export interface MessageReply {
  /** Who wrote the message being answered. */
  author: string;
  /** What it said. Clamped to two lines. */
  text: string;
}

/** The person who wrote a message, for a chat with more than two people. */
export interface MessageAuthor {
  /** Their name: it leads a run of their messages, and their initials sit on the avatar. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

export interface MessageBubbleLabels {
  /** Read before your own messages. Default "You". */
  you?: string;
  /** Default "Sending". */
  sending?: string;
  /** Default "Sent". */
  sent?: string;
  /** Default "Read". */
  read?: string;
  /** Default "Not sent". */
  failed?: string;
  /** The retry button's visible text. Default "Retry". */
  retry?: string;
  /** The retry button's name for screen readers. Default "Retry sending this message". */
  retryName?: string;
  /** Read before the quoted message, followed by its author. Default "Replying to". */
  replyingTo?: string;
}

export interface MessageBubbleProps extends Omit<ComponentProps<"div">, "children"> {
  /** `own` aligns right on the primary surface, `other` left on a muted one. Default "other". */
  side?: MessageSide;
  /** The message. Long words and URLs wrap instead of overflowing, and line breaks in a string are kept. */
  text: ReactNode;
  /** When it was sent. It is written as a clock time in `locale` and `timeZone`, under the last bubble of a run. */
  time: DateInput;
  /** Your own message's state, in words as well as a mark. `failed` shows a retry button. */
  status?: MessageStatus;
  /** The message this one answers, quoted above the text. */
  replyTo?: MessageReply;
  /** Images or files, drawn inside the bubble above the text. */
  attachments?: ReactNode;
  /** Where it sits in a run from one person: `first`, `middle` and `last` square off the corners that touch their neighbours. Default "single". */
  position?: MessagePosition;
  /** The retry button was pressed. Without it a failed message still says so. */
  onRetry?: () => void;
  /** Who wrote it, for a team chat. Their name leads a run, and their avatar closes it. */
  author?: MessageAuthor;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the clock time is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the bubble uses, for translation. */
  labels?: MessageBubbleLabels;
}

const cache = new Map<string, Intl.DateTimeFormat>();
function dateFormat(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch {
      format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    cache.set(key, format);
  }
  return format;
}

/** The failure text, darkened toward the foreground so the small red words reach 4.5:1 on a card, on a muted surface and on the dashed bubble. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** The grouped corners: the side that faces the avatar or the edge squares off where a neighbour is. Logical corners, so a mirrored layout (dir="rtl") joins the right ones. */
const CORNERS: Record<MessageSide, Record<MessagePosition, string>> = {
  own: {
    single: "",
    first: "rounded-ee-[0.3125rem]",
    middle: "rounded-se-[0.3125rem] rounded-ee-[0.3125rem]",
    last: "rounded-se-[0.3125rem]",
  },
  other: {
    single: "",
    first: "rounded-es-[0.3125rem]",
    middle: "rounded-ss-[0.3125rem] rounded-es-[0.3125rem]",
    last: "rounded-ss-[0.3125rem]",
  },
};

/**
 * A single bubble for a team or customer chat. Your own messages sit on the
 * right on the primary surface, other people's on the left on a muted one, and
 * the corners join along a run of messages from one person (`position`) the way
 * every chat app does. Under the last bubble of a run the time is written,
 * and for your own messages the state in words as well as a mark: Sending,
 * Sent, Read, or Not sent with a Retry button. A failed bubble turns hollow
 * with a dashed edge, so it differs by shape and not by colour alone. A reply
 * quotes the message it answers, attachments go inside above the text, and
 * long words and URLs wrap instead of pushing the layout out. Put the bubbles
 * in a plain block: each one brings its own spacing, tight inside a run and
 * wider between runs.
 */
export function MessageBubble({
  side = "other",
  text,
  time,
  status,
  replyTo,
  attachments,
  position = "single",
  onRetry,
  author,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: MessageBubbleProps) {
  const words = { you: "You", sending: "Sending", sent: "Sent", read: "Read", failed: "Not sent", retry: "Retry", retryName: "Retry sending this message", replyingTo: "Replying to", ...labels };
  const bubble = useRef<HTMLDivElement>(null);
  const meta = useRef<HTMLParagraphElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const keepFocus = useRef(false);
  const own = side === "own";
  const failed = own && status === "failed";
  const first = position === "single" || position === "first";
  const last = position === "single" || position === "last";
  // A message that is on its way, or did not go through, is never left without its state, wherever it sits in a run.
  const showMeta = last || failed || (own && status === "sending");

  const at = new Date(time).getTime();
  const valid = !Number.isNaN(at);
  const clock = valid ? dateFormat(locale, timeZone, { hour: "numeric", minute: "2-digit" }).format(at) : "";
  const full = valid ? dateFormat(locale, timeZone, { dateStyle: "medium", timeStyle: "short" }).format(at) : "";

  const state = own && status ? { sending: { word: words.sending, icon: <IconSpinner className="size-3" /> }, sent: { word: words.sent, icon: <IconCheck className="size-3" /> }, read: { word: words.read, icon: <IconCheckDouble className="size-3" /> }, failed: { word: words.failed, icon: <IconAlertCircle className="size-3.5" /> } }[status] : null;

  const place = own ? "justify-self-end" : "justify-self-start";
  const who = own ? words.you : author?.name;

  // The retry button leaves once the message is on its way again. Whoever pressed it with the keyboard is not sent back to the top of the page: focus goes to the line that now says "Sending".
  useEffect(() => {
    if (!keepFocus.current || retryButton.current) return;
    keepFocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    (meta.current ?? bubble.current)?.focus({ preventScroll: true });
  });

  return (
    <div
      data-slot="message-bubble"
      data-side={side}
      data-position={position}
      data-status={status}
      className={cn("@container grid w-full grid-cols-[auto_minmax(0,1fr)] items-end", first ? "mt-3 first:mt-0" : "mt-0.5", className)}
      {...props}
    >
      {!own && author ? (
        <div className="col-start-1 row-start-2 me-2 w-7 self-end">
          {last ? (
            <Avatar size="sm" aria-hidden="true">
              {author.image ? <AvatarImage src={author.image} alt="" /> : null}
              <AvatarFallback>{initialsOf(author.name)}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}

      {!own && author && first ? <p className="col-start-2 row-start-1 mb-1 px-1 text-xs font-medium text-muted-foreground">{author.name}</p> : null}

      <div
        ref={bubble}
        tabIndex={-1}
        className={cn(
          "col-start-2 row-start-2 max-w-[85%] min-w-0 rounded-[1.125rem] border px-3.5 py-2 text-[0.9375rem] leading-[1.45] outline-none @md:max-w-[75%]",
          place,
          failed ? "border-dashed border-destructive bg-background text-foreground" : cn("border-transparent", own ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"),
          CORNERS[side][position],
        )}
      >
        {who ? <span className="sr-only">{who}: </span> : null}
        {replyTo ? (
          <div className={cn("mb-1.5 rounded-lg border-s-2 py-1 pe-2 ps-2.5 text-xs leading-snug", own && !failed ? "border-primary-foreground/70 bg-primary-foreground/15" : "border-foreground/50 bg-foreground/[0.06]")}>
            <p className="font-semibold">
              <span className="sr-only">{words.replyingTo} </span>
              {replyTo.author}
            </p>
            <p className="line-clamp-2 [overflow-wrap:anywhere]">{replyTo.text}</p>
          </div>
        ) : null}
        {attachments ? <div className={cn(text ? "mb-1.5" : "")}>{attachments}</div> : null}
        {text ? <div className="whitespace-pre-wrap [overflow-wrap:anywhere]">{text}</div> : null}
        {!showMeta && valid ? <span className="sr-only">, {clock}</span> : null}
      </div>

      {showMeta ? (
        <p
          ref={meta}
          tabIndex={-1}
          className={cn("col-start-2 row-start-3 mt-1 flex flex-wrap items-center gap-x-1.5 rounded-sm px-1 text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", place, own && "justify-end")}
        >
          {valid ? (
            <time dateTime={new Date(at).toISOString()} title={full} suppressHydrationWarning className="tabular-nums">
              {clock}
            </time>
          ) : null}
          {state ? (
            <>
              {valid ? <span aria-hidden="true">·</span> : null}
              <span role="status" className={cn("inline-flex items-center gap-1", failed && cn("font-medium", DANGER_TEXT))}>
                {state.icon}
                {state.word}
              </span>
            </>
          ) : null}
          {failed && onRetry ? (
            <button
              ref={retryButton}
              type="button"
              aria-label={words.retryName}
              onClick={() => {
                keepFocus.current = true;
                onRetry?.();
              }}
              className={cn("rounded-sm px-1 font-semibold underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/40", DANGER_TEXT)}
            >
              {words.retry}
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
