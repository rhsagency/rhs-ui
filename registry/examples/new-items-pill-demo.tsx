"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";

import { IconSend } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { NewItemsPill } from "@rhs-ui/primitives/new-items-pill";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  name: string;
  time: string;
  text: string;
}

const EARLIER: readonly Omit<Post, "id">[] = [
  { name: "Mara Visser", time: "3h", text: "Halcyon 2.4 is out. Boards now sync offline and merge cleanly when you reconnect." },
  { name: "Jonas Albrecht", time: "3h", text: "Hot take: a changelog nobody reads is still better than no changelog. Write it for the person who is angry in six months." },
  { name: "Amara Okafor", time: "4h", text: "We cut Kestrel's onboarding from nine steps to four. Activation went from 41% to 58% in two weeks." },
  { name: "Leo Marchetti", time: "5h", text: "Dark mode is not just inverted colours. Check your borders, your shadows and your images." },
  { name: "Hana Sato", time: "6h", text: "Our Friday deploys are boring now. That was the whole goal." },
  { name: "Daniel Cho", time: "7h", text: "Looking for a staff designer who likes data tables more than hero sections. Remote, EU time zones." },
  { name: "Priya Raman", time: "8h", text: "Retro notes: we spent three weeks on search and one afternoon on the thing customers actually asked for." },
  { name: "Tomás Silva", time: "9h", text: "New favourite keyboard shortcut: / to focus search. Every app should have it." },
  { name: "Mara Visser", time: "11h", text: "Northwind's pricing page now loads in 380 ms. The trick was deleting a carousel." },
  { name: "Jonas Albrecht", time: "12h", text: "Accessibility audit done. 14 issues, 11 fixed before lunch, 3 are design debates." },
];

const ARRIVING: readonly Omit<Post, "id">[] = [
  { name: "Hana Sato", time: "now", text: "Beta 3 is live. Thank you to everyone who filed issues over the weekend." },
  { name: "Leo Marchetti", time: "1m", text: "Anyone else seeing the Rotterdam warehouse sync lag? Mine is about four minutes behind." },
  { name: "Priya Raman", time: "2m", text: "Pricing experiment, day 5: the annual toggle on by default lifted trials by 9%." },
  { name: "Daniel Cho", time: "3m", text: "Design review at 15:00. Bring one screen you are unsure about." },
  { name: "Amara Okafor", time: "5m", text: "Just merged the new empty states. Every list now says what to do next." },
  { name: "Tomás Silva", time: "6m", text: "Reminder: the release freeze starts Thursday at noon." },
  { name: "Jonas Albrecht", time: "8m", text: "The new tokens file is 40% smaller and nothing looks different. My favourite kind of refactor." },
  { name: "Mara Visser", time: "9m", text: "Customer call notes are in the Kestrel folder. Three themes, one clear winner." },
  { name: "Hana Sato", time: "11m", text: "The coffee machine on floor two is fixed. You can stop walking to floor three." },
  { name: "Leo Marchetti", time: "12m", text: "Draft of the Q4 roadmap is up for comments until Friday." },
  { name: "Priya Raman", time: "14m", text: "Our support queue is at its lowest in a year. Thank you, Amara and team." },
  { name: "Daniel Cho", time: "15m", text: "Shipping the keyboard shortcuts sheet today. Press ? anywhere to see it." },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Panel({ title, subtitle, action, children, footer }: { title: string; subtitle: string; action: ReactNode; children: ReactNode; footer?: ReactNode }): React.JSX.Element {
  return (
    <section className="flex h-[30rem] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium tracking-[-0.01em]">{title}</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </header>
      <div className="relative min-h-0 flex-1">{children}</div>
      {footer}
    </section>
  );
}

function PostRow({ post }: { post: Post }): React.JSX.Element {
  return (
    <li className="flex gap-3 border-b border-border px-4 py-5 last:border-b-0">
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(post.name)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="flex items-baseline gap-2 text-sm">
          <span className="font-medium">{post.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{post.time}</span>
        </p>
        <p className="text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">{post.text}</p>
      </div>
    </li>
  );
}

/**
 * Puts a scroller where the story starts, and again once the page font is in:
 * the font changes how the lines wrap and with it where everything is, so a
 * fixed offset would drift. `place` measures the content and returns the
 * scrollTop. It leaves the reader alone once they have moved the scroller.
 */
function useStartingPlace(ref: RefObject<HTMLElement | null>, place: (scroller: HTMLElement) => number | null) {
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    let at: number | null = null;
    const put = () => {
      if (at !== null && Math.abs(node.scrollTop - at) > 2) return;
      const top = place(node);
      if (top === null) return;
      node.scrollTop = top;
      at = node.scrollTop;
    };
    put();
    void document.fonts?.ready.then(put);
  }, []);
}

function Feed(): React.JSX.Element {
  const [posts, setPosts] = useState<readonly Post[]>(() => EARLIER.map((post, index) => ({ ...post, id: index + 1 })));
  // Posts that have arrived but are held back: the pill counts them and a click puts them at the top.
  const [held, setHeld] = useState<readonly Post[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const next = useRef(0);
  const ids = useRef(100);

  function receive(amount: number) {
    const fresh = Array.from({ length: amount }, () => {
      const source = ARRIVING[next.current++ % ARRIVING.length] as Omit<Post, "id">;
      return { ...source, id: ids.current++ };
    });
    setHeld((current) => [...fresh, ...current]);
  }

  function merge() {
    setPosts((current) => [...held, ...current]);
    setHeld([]);
  }

  // The page opens in the middle of a busy morning: the reader is a little way down, and twelve posts have come in above them.
  // The pill (24px from the top, 32px tall) floats over the line between two posts, a little above its middle, so it covers their padding and not their words.
  useStartingPlace(scroller, (node) => {
    const row = node.querySelectorAll("li")[2];
    return row ? row.offsetTop - 42 : 150;
  });
  useLayoutEffect(() => {
    if (next.current > 0) return;
    receive(12);
  }, []);

  return (
    <Panel
      title="Team feed"
      subtitle="New posts land at the top"
      action={
        <Button variant="outline" size="sm" onClick={() => receive(3)}>
          Receive 3 posts
        </Button>
      }
    >
      <NewItemsPill count={held.length} direction="up" scrollRef={scroller} className="top-6" onClick={merge} onReach={merge} />
      <div ref={scroller} tabIndex={0} role="region" aria-label="Team feed" className="relative h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        <ul>
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </ul>
      </div>
    </Panel>
  );
}

interface Message {
  id: number;
  mine: boolean;
  text: string;
  time: string;
}

const HISTORY: readonly Omit<Message, "id">[] = [
  { mine: false, text: "Hi, this is Mara from Halcyon support. How can I help?", time: "09:41" },
  { mine: true, text: "Hi Mara, my desk lamp arrived with a cracked base. Order 48211.", time: "09:42" },
  { mine: false, text: "I am sorry about that. Could you send a photo of the crack?", time: "09:42" },
  { mine: true, text: "Sure, sending it now. The box was dented too.", time: "09:44" },
  { mine: false, text: "Thank you, that is clear. I will arrange a replacement today.", time: "09:45" },
  { mine: true, text: "Do I need to send the broken one back?", time: "09:46" },
  { mine: false, text: "No need. Keep it or recycle it, whichever is easier.", time: "09:46" },
  { mine: true, text: "That is generous, thank you.", time: "09:47" },
  { mine: false, text: "The new lamp ships tomorrow with tracking. You will get an email within the hour.", time: "09:48" },
  { mine: true, text: "Lovely. Can the new one go to my office instead?", time: "09:49" },
  { mine: false, text: "Of course. What is the address?", time: "09:49" },
  { mine: false, text: "I can also add a note for reception if you like.", time: "09:50" },
  { mine: false, text: "One more thing: the lamp comes with a free spare bulb.", time: "09:50" },
];

/** The messages at the end of HISTORY that came in while the reader was scrolled up. */
const UNSEEN = 3;

const REPLIES: readonly string[] = [
  "I have updated the order, tracking goes to your inbox as before.",
  "Added: leave with reception for Mara Visser, second floor.",
  "Anything else I can do for you today?",
  "Happy to help. Have a good one!",
];

function Bubble({ message }: { message: Message }): React.JSX.Element {
  return (
    <li className={cn("flex max-w-[82%] flex-col", message.mine ? "items-end self-end" : "items-start self-start")}>
      <p className={cn("rounded-2xl px-3.5 py-2 text-sm leading-relaxed", message.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground")}>{message.text}</p>
      <span className="mt-1 px-1 text-[0.6875rem] text-muted-foreground tabular-nums">{message.time}</span>
    </li>
  );
}

function Chat(): React.JSX.Element {
  const [messages, setMessages] = useState<readonly Message[]>(() => HISTORY.map((message, index) => ({ ...message, id: index })));
  // The reader scrolled up to read the history while the last messages came in below.
  const [unseen, setUnseen] = useState(UNSEEN);
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const reply = useRef(0);
  const ids = useRef(HISTORY.length);

  /** Whether the reader is at the end: then a new message is simply followed, and only otherwise it is counted. */
  function atEnd(): boolean {
    const node = scroller.current;
    return !node || node.scrollHeight - node.clientHeight - node.scrollTop < 80;
  }

  /** Follows the conversation down, smoothly unless the reader asked their system for less motion. */
  function toEnd() {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    window.requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior }));
  }

  function add(text: string, mine: boolean) {
    const follow = mine || atEnd();
    setMessages((current) => [...current, { id: ids.current++, mine, text, time: "09:51" }]);
    if (follow) toEnd();
    else setUnseen((count) => count + 1);
  }

  function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    add(text, true);
    setDraft("");
  }

  // They stopped at the last message they had read, and the first of the new ones peeks out from under the pill: its top edge is 18px above the pill's, never on it.
  useStartingPlace(scroller, (node) => {
    const first = node.querySelectorAll("li")[HISTORY.length - UNSEEN];
    return first ? first.offsetTop - node.clientHeight + 62 : null;
  });

  return (
    <Panel
      title="Mara Visser"
      subtitle="Halcyon support, order 48211"
      action={
        <Button variant="outline" size="sm" onClick={() => add(REPLIES[reply.current++ % REPLIES.length] as string, false)}>
          Receive a reply
        </Button>
      }
      footer={
        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Reply to Mara" aria-label="Message" autoComplete="off" />
          <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
            <IconSend />
          </Button>
        </form>
      }
    >
      <div ref={scroller} tabIndex={0} role="region" aria-label="Conversation with Mara" className="relative h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        <ul className="flex min-h-full flex-col justify-end gap-2.5 px-4 py-4">
          {messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
        </ul>
      </div>
      <NewItemsPill count={unseen} direction="down" scrollRef={scroller} label={{ one: "{count} new message", other: "{count} new messages" }} onClick={() => setUnseen(0)} onReach={() => setUnseen(0)} />
    </Panel>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl grid-cols-1 content-center gap-x-8 gap-y-10 px-6 py-10 md:grid-cols-2">
      <Example caption="A feed: twelve posts landed above while you read. Press the pill">
        <Feed />
      </Example>
      <Example caption="A chat: type in the box and press the pill, and your cursor stays where it was">
        <Chat />
      </Example>
    </div>
  );
}
