"use client";

import { useId, useState, type ComponentProps } from "react";

import { dateIn, fill, type DateInput } from "@rhs-ui/application/stamp-card/format";
import { IconCheck, IconGift } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the card uses, for translation. `{label}`, `{filled}`, `{total}`, `{left}`, `{reward}`, `{date}` and `{count}` are filled in. */
export interface StampCardLabels {
  /** The card's name when you give no `label`. Default "Loyalty card". */
  card?: string;
  /** What a screen reader hears as the card's name. Default "{label}, {filled} of {total} stamps, {left} to go". */
  summary?: string;
  /** The same for a full card. Default "{label}, {filled} of {total} stamps, reward ready". */
  summaryDone?: string;
  /** The count under the title. Default "{filled} of {total} stamps". */
  count?: string;
  /** The badge of a card that is not full. Default "{left} to go". */
  toGo?: string;
  /** The badge of a full card. Default "Reward ready". */
  ready?: string;
  /** Under the reward while the card is not full. Default "Reward on stamp {total}". */
  onLast?: string;
  /** Under the reward once the card is full. Default "Reward unlocked". */
  unlocked?: string;
  /** The date of the last stamp. Default "Last stamp {date}". */
  lastStamp?: string;
  /** The redeem button. Default "Redeem". */
  redeem?: string;
  /** The name of the redeem button. Default "Redeem {reward}". */
  redeemFor?: string;
  /** Said politely when a stamp is added. Default "Stamp added. {filled} of {total} stamps, {left} to go.". */
  stamped?: string;
  /** Said when the stamp that is added fills the card. Default "Stamp added. {filled} of {total} stamps, reward ready.". */
  stampedDone?: string;
}

export interface StampCardProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** How many stamps the card has: 8 or 10 for a coffee shop. */
  total: number;
  /** How many are stamped. A card whose count goes up plays a short press on each new stamp, and says so politely. */
  filled: number;
  /** What the last stamp earns: "Free cappuccino". It sits on the last stamp and unlocks when the card is full. */
  reward: string;
  /** The card's name: "Cappuccino card". It is the heading, and the start of the sentence a screen reader hears. */
  label?: string;
  /** When the last stamp was given. Written as a short date. */
  lastStampedAt?: DateInput;
  /** The Redeem button was pressed on a full card. May return a promise: the button shows a spinner until it settles. Leave it out and a full card only says that the reward is unlocked. */
  onRedeem?: () => void | Promise<void>;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: StampCardLabels;
}

const DEFAULT_LABELS = {
  card: "Loyalty card",
  summary: "{label}, {filled} of {total} stamps, {left} to go",
  summaryDone: "{label}, {filled} of {total} stamps, reward ready",
  count: "{filled} of {total} stamps",
  toGo: "{left} to go",
  ready: "Reward ready",
  onLast: "Reward on stamp {total}",
  unlocked: "Reward unlocked",
  lastStamp: "Last stamp {date}",
  redeem: "Redeem",
  redeemFor: "Redeem {reward}",
  stamped: "Stamp added. {filled} of {total} stamps, {left} to go.",
  stampedDone: "Stamp added. {filled} of {total} stamps, reward ready.",
};

/** How many stamps sit in a row: a card of ten is two rows of five, a card of eight two of four, and so on. */
function columnsFor(total: number): number {
  if (total <= 5) return total;
  for (const columns of [5, 4, 3]) if (total % columns === 0) return columns;
  return 5;
}

/**
 * A digital loyalty card for a coffee shop, a salon or a bakery: a grid of
 * stamps, the filled ones drawn in the foreground with a check and the empty
 * ones as dashed circles that count up, and the reward on the last stamp. The
 * card reads as one sentence, "Cappuccino card, 6 of 10 stamps, 4 to go", and
 * the grid is left out of it. Fill the card and the reward unlocks: the badge
 * changes and a Redeem button appears. When `filled` goes up, each new stamp
 * plays a short press (skipped under reduced motion) and the new count is
 * announced politely.
 */
export function StampCard({ total: rawTotal, filled: rawFilled, reward, label, lastStampedAt, onRedeem, headingLevel = 3, locale = "en-US", timeZone = "UTC", labels, className, ...props }: StampCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const total = Math.max(1, Math.round(rawTotal));
  const filled = Math.min(total, Math.max(0, Math.round(rawFilled)));
  const left = total - filled;
  const complete = left === 0;
  const name = label ?? text.card;
  const values = { label: name, filled, total, left, reward };

  // A count that went up is a stamp that was just given: the new ones press in, and the card says so. Worked out while rendering, from the count it saw last.
  const [seen, setSeen] = useState(filled);
  const [fresh, setFresh] = useState<{ from: number; to: number } | null>(null);
  const [said, setSaid] = useState("");
  const [busy, setBusy] = useState(false);
  if (filled !== seen) {
    setSeen(filled);
    setFresh(filled > seen ? { from: seen, to: filled } : null);
    setSaid(filled > seen ? fill(complete ? text.stampedDone : text.stamped, values) : "");
  }

  const last = lastStampedAt === undefined ? null : dateIn(lastStampedAt, locale, timeZone, { day: "numeric", month: "short" });
  const lastMoment = last === null || lastStampedAt === undefined ? undefined : new Date(lastStampedAt).toISOString();
  const columns = columnsFor(total);

  async function redeem() {
    if (busy || !onRedeem) return;
    setBusy(true);
    try {
      await onRedeem();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-slot="stamp-card"
      data-complete={complete ? "" : undefined}
      role="group"
      aria-label={fill(complete ? text.summaryDone : text.summary, values)}
      className={cn("w-full rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs", className)}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-36">
          <Heading id={titleId} className="text-base leading-tight font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
            {name}
          </Heading>
          <p className="mt-1 text-[0.8125rem] leading-5 text-muted-foreground tabular-nums">{fill(text.count, values)}</p>
          {last && lastMoment ? (
            <p className="text-xs leading-5 whitespace-nowrap text-muted-foreground tabular-nums">
              <time dateTime={lastMoment}>{fill(text.lastStamp, { date: last })}</time>
            </p>
          ) : null}
        </div>
        <Badge variant={complete ? "default" : "outline"} className="shrink-0 gap-1 tabular-nums">
          {complete ? <IconGift /> : null}
          {complete ? text.ready : fill(text.toGo, values)}
        </Badge>
      </div>

      <ol
        aria-hidden="true"
        className="mx-auto mt-5 grid gap-2.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, maxWidth: `${columns * 4.75 + (columns - 1) * 0.625}rem` }}
      >
        {Array.from({ length: total }, (_, index) => {
          const on = index < filled;
          const isReward = index === total - 1;
          const delay = fresh !== null && index >= fresh.from && index < fresh.to ? (index - fresh.from) * 90 : null;
          return (
            <li
              key={index}
              data-filled={on ? "" : undefined}
              style={delay === null ? undefined : { animationDelay: `${delay}ms` }}
              className={cn(
                "relative grid aspect-square place-items-center rounded-full text-xs tabular-nums transition-colors duration-200 motion-reduce:transition-none",
                on ? "bg-foreground text-background" : isReward ? "border-2 border-foreground/50 bg-muted/60 text-foreground" : "border-2 border-dashed border-muted-foreground/40 text-muted-foreground",
                delay !== null && "motion-safe:animate-rhs-stamp-press",
              )}
            >
              {isReward ? <IconGift className="size-[44%]" /> : on ? <IconCheck className="size-[46%]" strokeWidth={2.5} /> : index + 1}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border pt-4">
        <div className="min-w-0 flex-1 basis-40">
          <p className="flex items-center gap-2 text-sm leading-5 font-medium">
            <IconGift className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{reward}</span>
          </p>
          <p className="mt-0.5 pl-6 text-xs leading-5 text-muted-foreground tabular-nums">{complete ? text.unlocked : fill(text.onLast, values)}</p>
        </div>
        {complete && onRedeem ? (
          <Button type="button" loading={busy} aria-label={fill(text.redeemFor, values)} onClick={() => void redeem()} className="shrink-0">
            {text.redeem}
          </Button>
        ) : null}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  );
}
