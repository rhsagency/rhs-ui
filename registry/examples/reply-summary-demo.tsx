"use client";

import { useState, type MouseEvent } from "react";

import { ReplySummary, type Replier } from "@rhs-ui/application/reply-summary";
import { IconCheck } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";

// A fixed "now" keeps "2 hours ago" the same on every load. In an app, leave `now` out and the line reads the browser's clock.
const NOW = Date.parse("2026-10-26T15:30:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

// Drawn portraits as data URIs, so the preview needs no image host.
const portrait = (background: string, figure: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${background}"/><circle cx="48" cy="38" r="17" fill="${figure}"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="${figure}"/></svg>`);

const PEOPLE = {
  mara: { name: "Mara Okafor", image: portrait("#d9d6cf", "#3a3733") },
  tom: { name: "Tom Brandt" },
  anna: { name: "Anna de Vries", image: portrait("#767b81", "#ecebe7") },
  priya: { name: "Priya Nair" },
  leo: { name: "Leo Martins", image: portrait("#cfd3d6", "#2f3438") },
  mia: { name: "Mia Jansen" },
  jonas: { name: "Jonas Keller" },
} satisfies Record<string, Replier>;

interface Thread {
  id: string;
  author: Replier;
  time: string;
  text: string;
  replies: number;
  repliers: Replier[];
  lastReplyAt: string;
  unread?: boolean | number;
  asLink?: boolean;
}

const THREADS: readonly Thread[] = [
  {
    id: "onboarding",
    author: PEOPLE.mara,
    time: "09:12",
    text: "Draft of the new onboarding checklist is in Figma. Comments welcome before Thursday.",
    replies: 5,
    repliers: [PEOPLE.tom, PEOPLE.anna, PEOPLE.priya, PEOPLE.leo],
    lastReplyAt: ago(125),
    unread: 2,
    asLink: true,
  },
  {
    id: "checkout",
    author: PEOPLE.tom,
    time: "Yesterday",
    text: "The checkout redirect fix is merged and live on staging.",
    replies: 1,
    repliers: [PEOPLE.anna],
    lastReplyAt: ago(60 * 20),
  },
  {
    id: "launch",
    author: PEOPLE.leo,
    time: "15:02",
    text: "Northwind 4.0 is live. Thank you all for the late evenings.",
    replies: 1284,
    repliers: [PEOPLE.mia, PEOPLE.jonas, PEOPLE.priya],
    lastReplyAt: ago(9),
    unread: true,
  },
];

function Post({ thread, onOpen }: { thread: Thread; onOpen: (thread: Thread, event: MouseEvent<HTMLElement>) => void }): React.JSX.Element {
  return (
    <li className="flex gap-3 px-4 py-3.5">
      <Avatar className="mt-0.5">
        {thread.author.image ? <AvatarImage src={thread.author.image} alt="" /> : null}
        <AvatarFallback>{initialsOf(thread.author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-[-0.01em]">{thread.author.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{thread.time}</span>
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-pretty">{thread.text}</p>
        <ReplySummary
          className="mt-1.5"
          replies={thread.replies}
          repliers={thread.repliers}
          lastReplyAt={thread.lastReplyAt}
          unread={thread.unread}
          href={thread.asLink ? `#thread-${thread.id}` : undefined}
          onOpen={(event) => onOpen(thread, event)}
          now={NOW}
        />
      </div>
    </li>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState("");

  function open(thread: Thread, event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    setOpened(`Opening the thread under ${thread.author.name}'s message from ${thread.time}.`);
  }

  return (
    <div className="mx-auto grid w-full max-w-xl gap-8">
      <section aria-labelledby="reply-summary-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="reply-summary-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
            # announcements
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">2,310 members</p>
        </div>
        <ul className="divide-y divide-border">
          {THREADS.map((thread) => (
            <Post key={thread.id} thread={thread} onOpen={open} />
          ))}
        </ul>
        <p aria-live="polite" className="flex min-h-11 items-center gap-2 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          {opened ? (
            <>
              <IconCheck className="size-3.5 shrink-0 text-foreground" />
              {opened}
            </>
          ) : (
            "Hover or tab to the lines above: the time makes way for View thread, and the width stays put."
          )}
        </p>
      </section>

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">In a narrow column the words Last reply give way to the bare time.</p>
        <div className="w-full max-w-[17rem] rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
          <ReplySummary replies={12} repliers={[PEOPLE.anna, PEOPLE.tom]} lastReplyAt={ago(60 * 24 * 3)} now={NOW} onOpen={(event) => open(THREADS[0] as Thread, event)} />
        </div>
      </div>
    </div>
  );
}
