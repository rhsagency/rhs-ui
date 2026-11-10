"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Label } from "@rhs-ui/primitives/label";
import { LoadEarlier } from "@rhs-ui/primitives/load-earlier";
import { Switch } from "@rhs-ui/primitives/switch";

const PEOPLE = ["Mara Okafor", "Jonas Lindqvist", "Priya Raman", "Tomasz Wrona", "Lena Hartmann"] as const;

/** Who said it (an index into PEOPLE), when, and what. The oldest message comes first. */
const LOG: readonly (readonly [number, string, string])[] = [
  [0, "08:02", "Morning all. The Rotterdam warehouse confirms the pallets left at 06:40."],
  [3, "08:05", "Great. I will hold the label printer queue until the new batch lands."],
  [4, "08:11", "Support inbox is quiet: three tickets overnight, all about invoice PDFs."],
  [2, "08:14", "Those are mine. The February export used the old template, fixing it now."],
  [1, "08:20", "Heads up: I am rolling the retry change out to 10% of traffic at nine."],
  [0, "08:21", "Thanks Jonas. Please post the dashboard here when it is live."],
  [1, "08:22", "Will do."],
  [3, "08:37", "Do we still need the Antwerp courier on Friday?"],
  [4, "08:39", "Yes, Atlas confirmed two pickups, 10:00 and 15:30."],
  [2, "08:52", "PDF template fixed and re-sent to the three customers."],
  [0, "08:55", "Perfect. Can someone check the Halcyon renewal quote before noon?"],
  [4, "09:03", "On it. They asked for four extra seats."],
  [1, "09:07", "Rollout is live at 10%. Error rate is flat so far."],
  [3, "09:18", "Label printer is back, the queue is moving."],
  [2, "09:26", "Reminder: the billing freeze starts Thursday at 17:00."],
  [0, "09:30", "Noted. Jonas, anything blocking the 50% step?"],
  [1, "09:41", "Nothing yet. I want one more hour of data before 25%."],
  [4, "09:58", "Quote for Halcyon is out: €1,240 a month with the extra seats."],
  [3, "10:12", "Pallet count mismatch in aisle 4: 112 counted against 118 booked."],
  [0, "10:14", "Can you recount after the break? If it is still off I will call Rotterdam."],
  [3, "10:15", "Will do."],
  [2, "10:33", "Finance asks if we can move the month-end close one day earlier."],
  [0, "10:36", "Not this month, the audit pack is not ready. Next month, yes."],
  [1, "10:48", "Moving to 25%. P99 latency is 4 ms better than the baseline."],
  [4, "11:02", "A customer in Utrecht says the tracking page shows yesterday's status."],
  [3, "11:09", "That is the cache, it refreshes every 30 minutes. I will add it to the macro."],
  [4, "11:11", "Thanks, I will tell her it updates by noon."],
  [2, "11:27", "February invoices are all out: 214 sent, none bounced."],
  [0, "11:30", "Great work everyone. Lunch is on the second floor, there is soup."],
  [3, "12:41", "Recount done: 118. The extra six were on the wrong shelf."],
  [0, "12:44", "Good. Close it."],
  [1, "13:05", "Going to 50%. Watching the queue depth."],
  [4, "13:20", "Two tickets about the same duplicate charge, forwarding to billing."],
  [2, "13:26", "Got them. One was a double click on pay, I am refunding it."],
  [2, "13:31", "Refund issued, customer notified."],
  [0, "13:48", "Can we get the Q3 numbers into the board deck by Friday?"],
  [2, "13:55", "I will have revenue by Wednesday. Margin needs Tomasz's stock figures."],
  [3, "14:02", "I will send the stock figures tomorrow morning."],
  [1, "14:15", "50% looks clean. Retry storms are gone and the dead letter queue is empty."],
  [0, "14:18", "Excellent. Full rollout tomorrow if it stays quiet overnight?"],
  [1, "14:20", "Agreed. The flag stays at 50% tonight and I will watch the 03:00 batch."],
  [4, "14:52", "Customer call at 15:30 with Kestrel & Co about their onboarding."],
  [2, "15:10", "Do you need the pricing sheet for that?"],
  [4, "15:12", "Yes please, the version with the annual discount."],
  [2, "15:14", "Sent."],
  [3, "16:05", "Atlas collected the second pickup: 41 parcels in total today."],
  [0, "16:30", "Thanks all. Anything I should know before I log off?"],
  [1, "16:34", "Nothing from me. The flag stays at 50% overnight."],
];

const PAGE = 12;
const NOUN = { one: "message", other: "messages" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Message({ index }: { index: number }): React.JSX.Element {
  const [who, time, text] = LOG[index] ?? LOG[0]!;
  const name = PEOPLE[who] ?? PEOPLE[0];
  return (
    <li className="flex gap-3 px-4 py-2">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 gap-0.5">
        <p className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{time}</span>
        </p>
        <p className="text-sm leading-relaxed text-pretty">{text}</p>
      </div>
    </li>
  );
}

function Chat(): React.JSX.Element {
  // The newest page is shown first, and the chat opens at the bottom.
  const [first, setFirst] = useState(LOG.length - PAGE);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [auto, setAuto] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    // A web font that arrives later changes how the lines wrap: until the reader has moved, the bottom is still the place.
    let moved = false;
    const note = () => (moved = true);
    element.addEventListener("wheel", note, { once: true, passive: true });
    element.addEventListener("touchstart", note, { once: true, passive: true });
    element.addEventListener("keydown", note, { once: true });
    void document.fonts?.ready.then(() => {
      if (!moved) element.scrollTop = element.scrollHeight;
    });
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Pretends to ask a server: the answer comes after a moment, and the next one can be made to fail. */
  function loadEarlier() {
    const fails = failNext;
    setLoading(true);
    setFailed(false);
    timer.current = window.setTimeout(() => {
      if (fails) {
        setFailNext(false);
        setFailed(true);
      } else {
        setFirst((now) => Math.max(0, now - PAGE));
      }
      setLoading(false);
    }, 900);
  }

  const shown = LOG.length - first;
  return (
    <div className="grid gap-4">
      <div className="flex h-[30rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-[-0.01em]">Warehouse and billing</h2>
          <p className="text-xs text-muted-foreground">5 people</p>
        </div>
        <div ref={scroller} tabIndex={0} role="region" aria-label="Messages" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40">
          <LoadEarlier
            scrollRef={scroller}
            auto={auto}
            hasEarlier={first > 0}
            loading={loading}
            error={failed ? "The message service did not answer." : false}
            onLoadEarlier={loadEarlier}
            count={shown}
            noun={NOUN}
          />
          <ul>
            {Array.from({ length: shown }, (_, offset) => (
              <Message key={first + offset} index={first + offset} />
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <Switch id="load-earlier-auto" checked={auto} onCheckedChange={setAuto} />
          <Label htmlFor="load-earlier-auto" className="font-normal text-muted-foreground">
            Load when I scroll up
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Switch id="load-earlier-fail" checked={failNext} onCheckedChange={setFailNext} />
          <Label htmlFor="load-earlier-fail" className="font-normal text-muted-foreground">
            Make the next load fail
          </Label>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {shown} of {LOG.length} messages
        </p>
      </div>
    </div>
  );
}

function Frame({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid content-start gap-2">
      <p className="text-xs font-medium">{title}</p>
      <div className="rounded-xl border border-border bg-card shadow-xs">{children}</div>
    </div>
  );
}

const noop = () => undefined;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Example caption="The chat opens at the bottom. Scroll to the top or press the button: older messages arrive above and you stay on the one you were reading.">
        <Chat />
      </Example>
      <Example caption="The four states of the row">
        <div className="grid gap-4">
          <Frame title="Waiting, with the button">
            <LoadEarlier hasEarlier onLoadEarlier={noop} />
          </Frame>
          <Frame title="Loading older messages">
            <LoadEarlier hasEarlier loading onLoadEarlier={noop} />
          </Frame>
          <Frame title="Failed, and waiting for Retry">
            <LoadEarlier hasEarlier error="The message service did not answer." onLoadEarlier={noop} />
          </Frame>
          <Frame title="Nothing older">
            <LoadEarlier hasEarlier={false} onLoadEarlier={noop} />
          </Frame>
        </div>
      </Example>
    </div>
  );
}
