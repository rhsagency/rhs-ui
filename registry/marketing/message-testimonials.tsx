import { useId, type ComponentProps, type ReactNode } from "react";

import { IconInfo, IconMessage } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface ThreadMessage {
  /** The sender's first name, shown above the first bubble of a run. Also the source of the initials. */
  from: string;
  /** A portrait. Initials stand in until it loads, and when there is none. */
  avatar?: string;
  /** What they wrote. Plain text. */
  text: string;
  /** When it was sent, written as it should be read: "09:41". */
  time: string;
  /** Set it on a message your own team sent: it sits on the right, in an outlined bubble. */
  own?: boolean;
}

export interface MessageThread {
  /** Identifies the thread in the grid. */
  id: string;
  /** Where it arrived, in plain words: "Direct message", "Email". Name no brand, copy no interface. */
  channel: string;
  /** When it was sent, written as it should be read: "12 March". */
  date: string;
  /** The same date for machines, as `2026-03-12`. Without it the date is plain text. */
  dateTime?: string;
  /** One to three messages, in the order they were sent. */
  messages: readonly ThreadMessage[];
  /** A small icon for the channel, drawn at 16px. Default a speech bubble. */
  icon?: ReactNode;
}

export interface MessageTestimonialsLabels {
  /** The name of a thread's list for screen readers; `{name}` and `{date}` are filled in. Default "Messages from {name}, {date}". */
  thread: string;
}

export interface MessageTestimonialsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Two or three threads read well, in a grid. */
  threads: readonly MessageThread[];
  /** A line under the grid about how the messages were chosen: "Shared with permission, lightly trimmed for length". */
  note?: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<MessageTestimonialsLabels>;
}

const LABELS: MessageTestimonialsLabels = { thread: "Messages from {name}, {date}" };

/** A template with `{name}` holes, filled in. */
const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => values[name] ?? hole);

/** Column classes written out per count, so Tailwind sees every one. */
function columnsFor(count: number): string {
  if (count <= 1) return "mx-auto max-w-md";
  if (count === 2 || count === 4) return "md:grid-cols-2";
  return "md:grid-cols-2 lg:grid-cols-3";
}

/**
 * The praise that arrives by direct message or email, shown as a calm chat: a few short conversations in a
 * grid, each a card with the channel and the date on top and one to three bubbles under it. Messages from one
 * sender are grouped under one avatar, first name and time; the first bubble of a group has a softened corner
 * on the side of the speaker, and a message from your own team sits on the right in an outlined bubble, so the
 * customer's words are the ones with the fill. Bubbles are plain text, with no tails drawn from images and no
 * interface copied from a messenger, and nothing animates. Each thread is a list named "Messages from Anna,
 * 12 March", and every message is read with its sender and time. It suits praise that was never written as
 * a testimonial, which tends to be the most believable kind. No state of its own, so it renders on the server.
 */
export function MessageTestimonials({ title, description, threads, note, labels, className, ...props }: MessageTestimonialsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="message-testimonials" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className={cn("mt-12 grid gap-4 sm:mt-16", columnsFor(threads.length))}>
        {threads.map((thread) => {
          const speaker = thread.messages.find((message) => !message.own) ?? thread.messages[0];
          return (
            <li key={thread.id} className="md:max-lg:last:odd:col-span-2">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground">
                <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 text-[0.8125rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground">
                    {thread.icon ?? <IconMessage />}
                    {thread.channel}
                  </span>
                  {thread.dateTime ? (
                    <time dateTime={thread.dateTime} className="tabular-nums">
                      {thread.date}
                    </time>
                  ) : (
                    <span className="tabular-nums">{thread.date}</span>
                  )}
                </header>
                <ul role="list" aria-label={fill(words.thread, { name: speaker?.from ?? "", date: thread.date })} className="flex flex-1 flex-col p-5">
                  {thread.messages.map((message, index) => {
                    const previous = thread.messages[index - 1];
                    const own = Boolean(message.own);
                    const first = !previous || previous.from !== message.from || Boolean(previous.own) !== own;
                    return (
                      <li key={`${index}-${message.from}`} className={cn("flex items-start gap-3", own && "flex-row-reverse", first ? "mt-5 first:mt-0" : "mt-1")}>
                        <span className="size-9 shrink-0">
                          {first ? (
                            // Only for the eye: the sender's name is read with every message, so the initials are not.
                            <Avatar aria-hidden="true">
                              {message.avatar ? <AvatarImage src={message.avatar} alt="" /> : null}
                              <AvatarFallback>{initialsOf(message.from)}</AvatarFallback>
                            </Avatar>
                          ) : null}
                        </span>
                        <div className={cn("grid max-w-[85%] min-w-0 gap-1", own ? "justify-items-end" : "justify-items-start")}>
                          {first ? (
                            <p aria-hidden="true" className="flex items-baseline gap-2 text-xs">
                              <span className="font-medium text-foreground">{message.from}</span>
                              <span className="text-muted-foreground tabular-nums">{message.time}</span>
                            </p>
                          ) : null}
                          <p
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed text-foreground",
                              own ? "border border-border" : "bg-muted",
                              first && (own ? "rounded-tr-md" : "rounded-tl-md"),
                            )}
                          >
                            <span className="sr-only">
                              {message.from}, {message.time}:{" "}
                            </span>
                            {message.text}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            </li>
          );
        })}
      </ul>
      {note ? (
        <div role="note" className="mx-auto mt-8 flex w-fit max-w-2xl items-start gap-2.5 text-left text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>{note}</div>
        </div>
      ) : null}
    </section>
  );
}
