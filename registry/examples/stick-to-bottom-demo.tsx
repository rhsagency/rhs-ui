"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { IconRefresh, IconSend, IconTerminal } from "@rhs-ui/icons";
import { StickToBottom } from "@rhs-ui/motion/stick-to-bottom";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  mine: boolean;
  text: string;
}

const HISTORY: readonly string[] = [
  "Hi, my Halcyon desk lamp arrived with a cracked base. Order 48211.",
  "Hi Mara, I am sorry about that. Could you send a photo of the crack?",
  "Sure, sending it now. The box was dented too.",
  "Thank you, that is clear. I will arrange a replacement today.",
  "Do I need to send the broken one back?",
  "No need. Keep it or recycle it, whichever is easier.",
  "That is generous, thank you.",
  "The new lamp ships tomorrow with tracking. You will get an email within the hour.",
  "Lovely. Can the new one go to my office instead?",
  "Of course. What is the address?",
];

const INCOMING: readonly string[] = [
  "Kestrel Yard 12, 3511 AB Utrecht, second floor.",
  "Got it, I have updated the order. Tracking goes to your inbox as before.",
  "Could you add a note for reception?",
  "Added: leave with reception for Mara Visser, 2nd floor.",
  "You are a star.",
  "Happy to help. Anything else I can do today?",
  "Not at all, have a good one!",
  "You too, Mara. Take care.",
];

/** Message times are worked out from the order, so the demo renders the same everywhere. */
function clock(index: number): string {
  const minutes = 9 * 60 + 41 + Math.floor(index * 0.8);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function Bubble({ message }: { message: Message }): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex max-w-[82%] flex-col motion-safe:transition-[opacity,translate] motion-safe:duration-300 starting:translate-y-2 starting:opacity-0",
        message.mine ? "items-end self-end" : "items-start self-start",
      )}
    >
      <p
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          message.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground",
        )}
      >
        {message.text}
      </p>
      <span className="mt-1 px-1 text-[0.6875rem] text-muted-foreground tabular-nums">{clock(message.id)}</span>
    </div>
  );
}

function Panel({ title, subtitle, lead, status, action, children, footer }: { title: string; subtitle: string; lead?: ReactNode; status: ReactNode; action?: ReactNode; children: ReactNode; footer?: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {lead ? <span aria-hidden="true" className="hidden size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground @min-[26rem]:grid">{lead}</span> : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium tracking-[-0.01em]">{title}</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground @max-[26rem]:hidden">{subtitle}</p>
            {/* In a narrow header the state takes the subtitle's place, so it always comes with its word. */}
            <div className="mt-0.5 hidden @max-[26rem]:block">{status}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="@max-[26rem]:hidden">{status}</div>
          {action}
        </div>
      </header>
      {children}
      {footer}
    </section>
  );
}

/** A filled dot while it follows, a hollow one while the reader is away: shape and words, not colour. */
function FollowState({ following }: { following: boolean }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden="true" className={cn("size-2 rounded-full border border-foreground", following ? "bg-foreground" : "bg-transparent")} />
      {following ? "Following" : "Scrolled up"}
    </span>
  );
}

function Chat(): React.JSX.Element {
  const [messages, setMessages] = useState<readonly Message[]>(() => HISTORY.map((text, index) => ({ id: index, mine: index % 2 === 1, text })));
  const [live, setLive] = useState(true);
  const [ended, setEnded] = useState(false);
  const [following, setFollowing] = useState(true);
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const next = useRef(0);

  // The conversation runs its course and stops on "Take care", instead of looping back to the first line.
  useEffect(() => {
    if (!live) return;
    const timer = window.setInterval(() => {
      const index = next.current;
      const text = INCOMING[index];
      if (text === undefined) return;
      next.current = index + 1;
      // The customer writes on the even beats: the history ends on the agent's question, so the next line is Mara's.
      setMessages((list) => [...list, { id: list.length, mine: index % 2 === 1, text }]);
      if (next.current >= INCOMING.length) {
        setLive(false);
        setEnded(true);
      }
    }, 2800);
    return () => window.clearInterval(timer);
  }, [live]);

  // Your own reply always takes you to the end, wherever you were reading.
  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length]);

  function send(event: FormEvent): void {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    pending.current = true;
    setMessages((list) => [...list, { id: list.length, mine: true, text }]);
    setDraft("");
  }

  return (
    <Panel
      title="Mara Visser"
      subtitle="Order 48211, Halcyon desk lamp"
      lead="MV"
      status={<FollowState following={following} />}
      action={
        <div className="flex items-center gap-2">
          <Label htmlFor="live-chat" className="text-xs font-normal text-muted-foreground">
            {ended ? "Ended" : "Live"}
          </Label>
          <Switch id="live-chat" checked={live} onCheckedChange={setLive} disabled={ended} />
        </div>
      }
      footer={
        <form onSubmit={send} className="flex h-15 items-center gap-2 border-t border-border px-3">
          <Input aria-label="Reply to Mara" placeholder="Reply to Mara" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <Button type="submit" size="icon" aria-label="Send reply" disabled={!draft.trim()}>
            <IconSend />
          </Button>
        </form>
      }
    >
      <StickToBottom label="Conversation with Mara Visser" onAtBottomChange={setFollowing} className="h-80">
        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="self-center rounded-full bg-muted px-2.5 py-0.5 text-[0.6875rem] text-muted-foreground">Today</p>
          {messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
          <div ref={end} aria-hidden="true" />
        </div>
      </StickToBottom>
    </Panel>
  );
}

interface Line {
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  text: string;
}

const BUILD: readonly Line[] = [
  { time: "09:41:02", level: "INFO", text: "Cloning halcyon-web at 3f9c2e1" },
  { time: "09:41:04", level: "INFO", text: "Restoring build cache (412 MB)" },
  { time: "09:41:09", level: "INFO", text: "Installing dependencies with pnpm 10.15" },
  { time: "09:41:21", level: "INFO", text: "Resolved 1,284 packages in 11.8s" },
  { time: "09:41:22", level: "INFO", text: "Running typecheck" },
  { time: "09:41:37", level: "INFO", text: "Typecheck passed, 0 errors" },
  { time: "09:41:38", level: "INFO", text: "Running 238 unit tests" },
  { time: "09:41:52", level: "WARN", text: "Slow test: checkout/promo-codes (3.1s)" },
  { time: "09:41:58", level: "INFO", text: "238 passed, 0 failed" },
  { time: "09:41:59", level: "INFO", text: "Building production bundle" },
  { time: "09:42:08", level: "INFO", text: "Compiled /, /pricing, /changelog" },
  { time: "09:42:14", level: "INFO", text: "Compiled /docs (88 pages)" },
  { time: "09:42:20", level: "INFO", text: "Compiled 64 routes" },
  { time: "09:42:21", level: "WARN", text: "/hero.jpg is 2.4 MB, consider resizing" },
  { time: "09:42:24", level: "INFO", text: "Optimizing 112 images" },
  { time: "09:42:33", level: "INFO", text: "Generating sitemap.xml (1,042 urls)" },
  { time: "09:42:41", level: "INFO", text: "Uploading 3.8 MB of static assets" },
  { time: "09:42:47", level: "INFO", text: "Promoting build to production" },
  { time: "09:42:49", level: "INFO", text: "Health check: eu-west ok" },
  { time: "09:42:50", level: "INFO", text: "Health check: us-east ok" },
  { time: "09:42:52", level: "INFO", text: "Health check: ap-south ok" },
  { time: "09:42:55", level: "ERROR", text: "Health check: eu-central timed out" },
  { time: "09:42:57", level: "INFO", text: "Retrying eu-central (1 of 3)" },
  { time: "09:43:03", level: "INFO", text: "Health check: eu-central ok" },
  { time: "09:43:04", level: "INFO", text: "Warming 12 edge caches" },
  { time: "09:43:09", level: "INFO", text: "Purging previous deployment" },
  { time: "09:43:11", level: "INFO", text: "Updating alias halcyon.example" },
  { time: "09:43:12", level: "INFO", text: "Deploy finished in 2m 10s" },
];

const START = 18;

function BuildLog({ onReplay }: { onReplay: () => void }): React.JSX.Element {
  const [shown, setShown] = useState(START);
  const [following, setFollowing] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const done = shown >= BUILD.length;

  // Start part-way up on purpose, so the button is already showing and counting.
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")?.scrollTo({ top: 40, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (done) return;
    const timer = window.setTimeout(() => setShown((count) => count + 1), 1000);
    return () => window.clearTimeout(timer);
  }, [shown, done]);

  return (
    <Panel
      title="Deploy halcyon-web"
      subtitle="Production, 4 regions"
      lead={<IconTerminal className="size-4" />}
      status={done ? <span className="text-xs text-muted-foreground">Finished</span> : <FollowState following={following} />}
      action={
        <Button variant="ghost" size="sm" onClick={onReplay}>
          <IconRefresh />
          <span className="@max-[26rem]:sr-only">Replay</span>
        </Button>
      }
      footer={
        <div className="flex h-15 items-center justify-between gap-4 border-t border-border px-4 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {shown} of {BUILD.length} lines
          </span>
          <span aria-hidden="true" className="h-1 w-28 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-foreground transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${(shown / BUILD.length) * 100}%` }} />
          </span>
        </div>
      }
    >
      <StickToBottom
        ref={root}
        label="Build log for halcyon-web"
        onAtBottomChange={setFollowing}
        jumpLabel={(count) => (count > 0 ? `${count} new ${count === 1 ? "line" : "lines"}` : "Jump to latest")}
        className="h-80 bg-muted/40"
      >
        <ol className="px-4 py-3 font-mono text-xs leading-6">
          {BUILD.slice(0, shown).map((line) => (
            <li key={line.time} className="flex gap-3 motion-safe:transition-[opacity] motion-safe:duration-300 starting:opacity-0">
              <span className="hidden shrink-0 text-muted-foreground tabular-nums @min-[24rem]:block">{line.time}</span>
              <span className={cn("w-10 shrink-0", line.level === "ERROR" ? "font-semibold text-destructive" : line.level === "WARN" ? "font-semibold" : "text-muted-foreground")}>{line.level}</span>
              <span className="min-w-0">{line.text}</span>
            </li>
          ))}
        </ol>
      </StickToBottom>
    </Panel>
  );
}

export default function Demo(): React.JSX.Element {
  const [run, setRun] = useState(0);
  return (
    <div className="@container w-full">
      <div className="grid items-start gap-x-6 gap-y-10 @2xl:grid-cols-2">
        <figure className="@container min-w-0">
          <Chat />
          <figcaption className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">Follows while you are at the end. Scroll up to read and new messages wait behind a count.</figcaption>
        </figure>
        <figure className="@container min-w-0">
          <BuildLog key={run} onReplay={() => setRun((value) => value + 1)} />
          <figcaption className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">Starts scrolled up, so the button is already counting. Its words are yours to set.</figcaption>
        </figure>
      </div>
    </div>
  );
}
