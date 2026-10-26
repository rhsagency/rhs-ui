"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MessageBubble, type MessagePosition, type MessageReply, type MessageSide, type MessageStatus } from "@rhs-ui/application/message-bubble";
import { IconSend } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";

const SUPPORT = { name: "Hana Sato" };

interface Message {
  id: string;
  side: MessageSide;
  text: string;
  time: string;
  status?: MessageStatus;
  replyTo?: MessageReply;
  label?: boolean;
}

const LABEL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 132'><rect width='240' height='132' rx='10' fill='#f4f4f2'/><rect x='14' y='14' width='84' height='10' rx='3' fill='#161616'/><rect x='14' y='32' width='128' height='6' rx='3' fill='#9a9a96'/><rect x='14' y='44' width='104' height='6' rx='3' fill='#9a9a96'/><g fill='#161616'><rect x='14' y='72' width='3' height='40'/><rect x='20' y='72' width='1.5' height='40'/><rect x='25' y='72' width='4' height='40'/><rect x='32' y='72' width='1.5' height='40'/><rect x='37' y='72' width='3' height='40'/><rect x='43' y='72' width='5' height='40'/><rect x='51' y='72' width='1.5' height='40'/><rect x='56' y='72' width='3' height='40'/><rect x='62' y='72' width='1.5' height='40'/><rect x='67' y='72' width='4' height='40'/><rect x='74' y='72' width='3' height='40'/><rect x='80' y='72' width='1.5' height='40'/><rect x='85' y='72' width='5' height='40'/><rect x='93' y='72' width='1.5' height='40'/><rect x='98' y='72' width='3' height='40'/><rect x='104' y='72' width='4' height='40'/></g><rect x='168' y='14' width='58' height='58' rx='6' fill='none' stroke='#161616' stroke-width='3'/><rect x='178' y='24' width='14' height='14' fill='#161616'/><rect x='202' y='24' width='14' height='14' fill='#161616'/><rect x='178' y='48' width='14' height='14' fill='#161616'/><rect x='168' y='88' width='58' height='24' rx='4' fill='#161616'/></svg>",
  );

const START: readonly Message[] = [
  { id: "m1", side: "other", text: "Hi Mara, thanks for getting in touch. I can see order #10482 shipped on Friday.", time: "2026-10-26T10:12:00Z" },
  { id: "m2", side: "other", text: "It should arrive tomorrow, but the courier flagged a problem with the address at the depot.", time: "2026-10-26T10:12:40Z" },
  { id: "m3", side: "other", text: "Could you confirm the street and house number for me?", time: "2026-10-26T10:13:05Z" },
  { id: "m4", side: "own", text: "Sure, it is Hoogstraat 14 in Rotterdam.", time: "2026-10-26T10:14:10Z", status: "read" },
  { id: "m5", side: "own", text: "Apartment 3B, and the top bell is the one that works.", time: "2026-10-26T10:14:32Z", status: "read" },
  { id: "m6", side: "other", text: "Thank you, that explains it. Updating the label now.", time: "2026-10-26T10:15:20Z", replyTo: { author: "You", text: "Sure, it is Hoogstraat 14 in Rotterdam." } },
  { id: "m7", side: "other", text: "Here is the corrected delivery label:", time: "2026-10-26T10:16:02Z", label: true },
  {
    id: "m8",
    side: "own",
    text: "Perfect. The tracking page says delayed: https://tracking.northwind.example/parcel/NW-10482-7731-ZZ-0000000000000000000000",
    time: "2026-10-26T10:17:15Z",
    status: "sent",
  },
  { id: "m9", side: "own", text: "Thank you so much!", time: "2026-10-26T10:17:48Z", status: "sending" },
  { id: "m10", side: "own", text: "One more thing: can you send the invoice to our finance address as well?", time: "2026-10-26T10:18:30Z", status: "failed" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The corners join along a run of messages from the same person. */
function positionOf(list: readonly Message[], index: number): MessagePosition {
  const here = list[index];
  const joined = (other: Message | undefined) => other !== undefined && other.side === here?.side;
  const before = joined(list[index - 1]);
  const after = joined(list[index + 1]);
  if (before && after) return "middle";
  if (before) return "last";
  if (after) return "first";
  return "single";
}

export default function Demo(): React.JSX.Element {
  const [messages, setMessages] = useState(START);
  const [draft, setDraft] = useState("");
  const sent = useRef(0);
  const timers = useRef(new Set<number>());
  const set = useCallback((id: string, status: MessageStatus) => setMessages((list) => list.map((message) => (message.id === id ? { ...message, status } : message))), []);
  const later = useCallback((run: () => void, ms: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, ms);
    timers.current.add(timer);
  }, []);

  // The message that was sending goes through a moment after the preview opens.
  useEffect(() => {
    const pending = timers.current;
    later(() => set("m9", "sent"), 4000);
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
      pending.clear();
    };
  }, [later, set]);

  // A new message goes the whole way: sending, sent, read. The times follow the conversation, one minute apart.
  function send() {
    const text = draft.trim();
    if (!text) return;
    sent.current += 1;
    const id = `new-${sent.current}`;
    setMessages((list) => [...list, { id, side: "own", text, time: new Date(Date.parse(list[list.length - 1]?.time ?? "2026-10-26T10:18:30Z") + 60_000).toISOString(), status: "sending" }]);
    setDraft("");
    later(() => set(id, "sent"), 900);
    later(() => set(id, "read"), 2600);
  }

  async function retry(id: string) {
    set(id, "sending");
    await wait(1200);
    set(id, "sent");
  }

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar>
          <AvatarFallback>HS</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-[-0.01em]">Northwind support</h2>
          <p className="truncate text-xs text-muted-foreground">Hana Sato, usually replies within minutes</p>
        </div>
      </header>
      <div role="log" aria-label="Conversation with Northwind support" className="px-4 py-4">
        <LabeledDivider className="mb-4">Today</LabeledDivider>
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            side={message.side}
            text={message.text}
            time={message.time}
            locale="en-GB"
            status={message.status}
            replyTo={message.replyTo}
            position={positionOf(messages, index)}
            author={message.side === "other" ? SUPPORT : undefined}
            onRetry={message.status === "failed" ? () => void retry(message.id) : undefined}
            attachments={
              message.label ? (
                // eslint-disable-next-line @next/next/no-img-element -- a drawn preview image, nothing to optimise
                <img src={LABEL} alt="Delivery label for order 10482, with a barcode and a QR code" width={240} height={132} className="block h-auto w-full max-w-60 rounded-lg" />
              ) : undefined
            }
          />
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <Input aria-label="Write a message" placeholder="Write a message" autoComplete="off" value={draft} onChange={(event) => setDraft(event.target.value)} className="h-10 flex-1 rounded-full px-4" />
        <Button type="submit" size="icon" aria-label="Send message" aria-disabled={!draft.trim()} className="size-10 shrink-0 rounded-full aria-disabled:opacity-50">
          <IconSend />
        </Button>
      </form>
    </div>
  );
}
