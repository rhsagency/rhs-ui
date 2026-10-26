"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconAlertCircle, IconCheckCircle, IconPackage, IconStar } from "@rhs-ui/icons";
import { dateWords, isoOf, wholeStars, type ReviewItem, type ReviewMoment } from "@rhs-ui/commerce/reviews-to-write/reviews";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Rating } from "@rhs-ui/primitives/rating";
import { toast } from "@rhs-ui/primitives/toast";
import { cn } from "@/lib/utils";

export type { ReviewItem, ReviewMoment } from "@rhs-ui/commerce/reviews-to-write/reviews";

export interface ReviewsToWriteLabels {
  /** The heading. */
  title?: string;
  /** Under the heading. */
  description?: string;
  /** The badge beside the heading. `{count}` products are still waiting for a rating. */
  waitingOne?: string;
  waitingOther?: string;
  /** Under a product's name. `{date}` is the day it arrived. */
  delivered?: string;
  /** The name of a product's stars. `{name}`. */
  rate?: string;
  /** The name of the stars once they are given and only shown. `{name}`. */
  yourRating?: string;
  /** The link to the review form. */
  write?: string;
  /** What a screen reader hears on it. `{name}`. */
  writeName?: string;
  /** The button that sets a product aside. */
  skip?: string;
  /** What a screen reader hears on it. `{name}`. */
  skipName?: string;
  /** The toast after a product was skipped. `{name}`. */
  skipped?: string;
  /** The toast's button. */
  undo?: string;
  /** What a screen reader hears on it. `{name}`. */
  undoName?: string;
  /** What each rating is called, from one star to five. */
  ratingWords?: readonly [string, string, string, string, string];
  /** What a row says once it was rated. `{rating}` stars out of five and what that is called, `{word}`. */
  rated?: string;
  /** The link under it. */
  addWords?: string;
  /** What a screen reader hears on it. `{name}`. */
  addWordsName?: string;
  /** The link beside it that brings the stars back. */
  change?: string;
  /** What a screen reader hears on it. `{name}`. */
  changeName?: string;
  /** Under a row whose rating could not be saved. */
  rateFailed?: string;
  /** What a screen reader hears after a rating. `{name}`, `{rating}` and `{word}`. */
  ratedStatus?: string;
  /** What a screen reader hears after a skip. `{name}`. */
  skippedStatus?: string;
  /** What a screen reader hears after Undo. `{name}`. */
  restoredStatus?: string;
  /** What a screen reader hears when the stars come back. `{name}`. */
  changedStatus?: string;
  /** The empty state's heading, when nothing is left to review. */
  emptyTitle?: string;
  /** Under it. */
  emptyDescription?: string;
}

const WORDS = {
  title: "Reviews to write",
  description: "One tap on a star is enough. Add a few words if you like.",
  waitingOne: "{count} waiting",
  waitingOther: "{count} waiting",
  delivered: "Delivered {date}",
  rate: "Rate {name}",
  yourRating: "Your rating of {name}",
  write: "Write a review",
  writeName: "Write a review of {name}",
  skip: "Skip",
  skipName: "Skip {name}",
  skipped: "Skipped “{name}”",
  undo: "Undo",
  undoName: "Undo, bring back {name}",
  ratingWords: ["Poor", "Fair", "Good", "Very good", "Excellent"],
  rated: "Thanks, you gave it {rating} out of 5: {word}.",
  addWords: "Add a few words",
  addWordsName: "Add a few words about {name}",
  change: "Change",
  changeName: "Change your rating of {name}",
  rateFailed: "We could not save your rating. Try again.",
  ratedStatus: "Thanks. You rated {name} {rating} out of 5, {word}.",
  skippedStatus: "{name} skipped.",
  restoredStatus: "{name} is back in the list.",
  changedStatus: "Choose a new rating for {name}.",
  emptyTitle: "You are all caught up",
  emptyDescription: "Nothing is waiting for a review right now. When your next order arrives, we will ask how it went.",
} satisfies Required<ReviewsToWriteLabels>;

export interface ReviewsToWriteProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The delivered products that have not been reviewed, in the order they are shown. */
  items: readonly ReviewItem[];
  /** The heading. Defaults to "Reviews to write". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** Called with the product and the stars the moment a rating is given, and again when the customer changes it with "Change". Return a promise: if it rejects, the row goes back to its stars and says so. */
  onRate?: (id: string, rating: number) => void | Promise<void>;
  /** Called when a product is skipped. It leaves the list at once and a toast offers Undo: save the skip. */
  onSkip?: (id: string) => void;
  /** Called when Undo brings a skipped product back, so you can save that too. */
  onUnskip?: (id: string) => void;
  /** Called when "Write a review" or "Add a few words" is pressed on a row without a `reviewHref`, with the stars if there are any. */
  onWrite?: (id: string, rating?: number) => void;
  /** Always pass your application locale, so the dates are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone the delivery dates are read in. A bare date such as "2026-10-12" is a calendar day and ignores it. */
  timeZone?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: ReviewsToWriteLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A sentence with a node where `{date}` is. */
function withDate(template: string, date: ReactNode): ReactNode {
  const [before = "", after = ""] = template.split("{date}");
  return (
    <>
      {before}
      {date}
      {after}
    </>
  );
}

interface RowProps {
  item: ReviewItem;
  words: Required<ReviewsToWriteLabels>;
  rating: number | undefined;
  leaving: boolean;
  failed: boolean;
  locale: string;
  timeZone: string;
  onRate: (rating: number) => void;
  onChange: () => void;
  onWrite: () => void;
  onSkip: () => void;
}

// A text link is a small target: it is padded up to 24px (and more) tall, and the same amount is taken back off the margin so nothing moves.
const LINK = "-my-1 inline-flex min-h-6 items-center rounded-sm py-1 text-sm font-medium underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40";

/** With the keyboard every arrow chooses a star, so the answer waits for Enter, Space or leaving the stars. Only a person who does none of these is answered for, and only after this long without a change. */
const IDLE_MS = 3000;

function Row({ item, words, rating, leaving, failed, locale, timeZone, onRate, onChange, onWrite, onSkip }: RowProps) {
  const [draft, setDraft] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const pointer = useRef(false);
  const sent = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Empty stars (a rating that could not be saved, or "Change") start over: nothing is chosen and nothing has been sent.
  useEffect(() => {
    if (rating === undefined) {
      setDraft(0);
      sent.current = false;
    }
  }, [rating]);

  // One answer per round of stars: Enter, leaving the stars and the row folding away can all follow each other.
  const commit = (value: number) => {
    window.clearTimeout(timer.current);
    if (value > 0 && !sent.current) {
      sent.current = true;
      onRate(value);
    }
  };

  const when = dateWords(item.deliveredAt, locale, timeZone);
  const moment = isoOf(item.deliveredAt);
  const date = when === null || moment === null ? null : (
    <time dateTime={moment} title={dateWords(item.deliveredAt, locale, timeZone, true) ?? undefined} className="whitespace-nowrap">
      {when}
    </time>
  );
  const nameParams = { name: item.name };
  const write = item.reviewHref ? (
    <a href={item.reviewHref} className={LINK} aria-label={fill(words.writeName, nameParams)} onClick={() => onWrite()}>
      {words.write}
    </a>
  ) : (
    <button type="button" className={LINK} aria-label={fill(words.writeName, nameParams)} onClick={() => onWrite()}>
      {words.write}
    </button>
  );

  return (
    <li
      data-slot="reviews-to-write-item"
      data-row-id={item.id}
      data-state={leaving ? "leaving" : rating ? "rated" : "idle"}
      inert={leaving}
      className="grid grid-rows-[1fr] border-t border-border transition-[grid-template-rows,opacity] duration-300 ease-out first:border-t-0 starting:opacity-0 data-[state=leaving]:grid-rows-[0fr] data-[state=leaving]:border-t-0 data-[state=leaving]:opacity-0 motion-reduce:transition-none"
    >
      <div className="min-h-0 overflow-hidden">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-3 px-4 py-4 @2xl:grid-cols-[auto_minmax(0,1fr)_auto] @2xl:items-center @2xl:px-5">
          <div className="w-14 shrink-0 @2xl:w-16">
            <AspectRatio ratio={1} className="grid place-items-center overflow-hidden rounded-lg border border-border bg-muted">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is decorative, the name is beside it
                <img src={item.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
              ) : (
                <IconPackage aria-hidden="true" className="size-5 text-muted-foreground" />
              )}
            </AspectRatio>
          </div>

          <div className="min-w-0">
            <p className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">
              {item.href ? (
                <a href={item.href} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {item.name}
                </a>
              ) : (
                item.name
              )}
            </p>
            {item.variant ? <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{item.variant}</p> : null}
            {date ? <p className="mt-1 text-xs text-muted-foreground">{withDate(words.delivered, date)}</p> : null}
          </div>

          {rating === undefined ? (
            <div className="col-start-2 grid justify-items-start gap-2.5 @2xl:col-start-3 @2xl:justify-items-end">
              {/* Stars are radios, and arrow keys select as they move. A tap or a click answers at once. With the keyboard the answer is taken on Space (the star that has the focus) or Enter (the star that is chosen), or when the focus leaves the stars; only after a long pause without a change is it taken for the person. */}
              <div
                onPointerDownCapture={() => {
                  pointer.current = true;
                  window.setTimeout(() => {
                    pointer.current = false;
                  }, 500);
                }}
                onKeyDown={(event) => {
                  const star = event.target;
                  if (!(star instanceof HTMLInputElement) || star.type !== "radio") return;
                  if (event.key === " ") {
                    event.preventDefault();
                    commit(Number(star.value));
                  } else if (event.key === "Enter" && draft > 0) {
                    event.preventDefault();
                    commit(draft);
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) commit(draft);
                }}
              >
                {/* The empty stars are the only control in the row, so they are drawn at the 3:1 that a control needs, not the faint tone the stars have on their own. */}
                <Rating
                  value={draft}
                  label={fill(words.rate, nameParams)}
                  size={26}
                  className="[&_svg[fill=none]]:text-muted-foreground"
                  onValueChange={(next) => {
                    setDraft(next);
                    window.clearTimeout(timer.current);
                    if (pointer.current) commit(next);
                    else timer.current = window.setTimeout(() => commit(next), IDLE_MS);
                  }}
                />
              </div>
              {failed ? (
                <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {words.rateFailed}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {write}
                <Button type="button" variant="ghost" size="sm" aria-label={fill(words.skipName, nameParams)} onClick={onSkip} className="-mx-1.5 text-muted-foreground">
                  {words.skip}
                </Button>
              </div>
            </div>
          ) : (
            <div className="col-start-2 grid justify-items-start gap-1.5 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none @2xl:col-start-3 @2xl:justify-items-end @2xl:text-right">
              <Rating readOnly value={rating} size={18} label={fill(words.yourRating, nameParams)} />
              <p className="flex items-start gap-2 text-sm font-medium @2xl:justify-end">
                <IconCheckCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="text-pretty">{fill(words.rated, { rating: String(rating), word: words.ratingWords[rating - 1] ?? "" })}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 @2xl:justify-end">
                {item.reviewHref ? (
                  <a data-focus="" href={item.reviewHref} className={LINK} aria-label={fill(words.addWordsName, nameParams)} onClick={() => onWrite()}>
                    {words.addWords}
                  </a>
                ) : (
                  <button data-focus="" type="button" className={LINK} aria-label={fill(words.addWordsName, nameParams)} onClick={() => onWrite()}>
                    {words.addWords}
                  </button>
                )}
                <button type="button" className={cn(LINK, "text-muted-foreground hover:text-foreground")} aria-label={fill(words.changeName, nameParams)} onClick={onChange}>
                  {words.change}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * The reviews a customer has not written yet, asked for at the moment of delivery and without a pop-up: each
 * delivered product has five stars that are the first answer. Picking one folds the row into a thank-you with the
 * rating in words and an optional "Add a few words" link, so a review costs one tap; a "Change" link beside it
 * brings the stars back. "Write a review" goes straight to the form and "Skip" sets a product aside; it leaves the
 * list and a toast offers Undo (mount the Toaster once in your app). The stars are a real radio group on every row,
 * answered by a click, a tap or the keyboard (arrows to move, Space or Enter to answer), and when nothing is left
 * the empty state says so kindly.
 */
export function ReviewsToWrite({
  items,
  title,
  description,
  onRate,
  onSkip,
  onUnskip,
  onWrite,
  locale = "en-US",
  timeZone = "UTC",
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: ReviewsToWriteProps) {
  const words: Required<ReviewsToWriteLabels> = { ...WORDS, ...labels };
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const timers = useRef(new Map<string, number>());
  // A rating given here, or null once "Change" has brought the stars back (that also overrides one that came with the item).
  const [ratings, setRatings] = useState<Readonly<Record<string, number | null>>>({});
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [said, setSaid] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  const visible = items.filter((item) => !skipped.has(item.id));
  const ratingOf = (item: ReviewItem): number | undefined => (item.id in ratings ? (ratings[item.id] ?? undefined) : item.rating === undefined ? undefined : wholeStars(item.rating));
  const waiting = visible.filter((item) => !leaving.has(item.id) && ratingOf(item) === undefined).length;
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timeout of pending.values()) window.clearTimeout(timeout);
    };
  }, []);

  // After a row folds, leaves or comes back, focus follows it, so a keyboard user is never dropped on the page.
  useEffect(() => {
    if (focusId === null) return;
    const target = focusId ? root.current?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(focusId)}"]:not([data-state="leaving"]) :is([data-focus], input[type="radio"])`) : null;
    (target ?? root.current)?.focus();
    setFocusId(null);
  }, [focusId]);

  async function rate(item: ReviewItem, rating: number) {
    setRatings((current) => ({ ...current, [item.id]: rating }));
    setFailed((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setSaid(fill(words.ratedStatus, { name: item.name, rating: String(rating), word: words.ratingWords[rating - 1] ?? "" }));
    setFocusId(item.id);
    try {
      await onRate?.(item.id, rating);
    } catch {
      setRatings((current) => ({ ...current, [item.id]: null }));
      setFailed((current) => new Set(current).add(item.id));
      setFocusId(item.id);
    }
  }

  /** "Change": the stars come back empty, and the next answer goes to `onRate` again. */
  function change(item: ReviewItem) {
    setRatings((current) => ({ ...current, [item.id]: null }));
    setFailed((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setSaid(fill(words.changedStatus, { name: item.name }));
    setFocusId(item.id);
  }

  function skip(item: ReviewItem) {
    if (leaving.has(item.id)) return;
    const others = visible.filter((entry) => entry.id !== item.id && !leaving.has(entry.id));
    const index = visible.findIndex((entry) => entry.id === item.id);
    const neighbour = others.find((entry) => visible.indexOf(entry) > index) ?? others[others.length - 1];
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLeaving((current) => new Set(current).add(item.id));
    timers.current.set(
      item.id,
      window.setTimeout(() => {
        timers.current.delete(item.id);
        setSkipped((current) => new Set(current).add(item.id));
        setLeaving((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        });
      }, reduced ? 0 : 320),
    );
    setFocusId(neighbour?.id ?? "");
    setSaid(fill(words.skippedStatus, { name: item.name }));
    onSkip?.(item.id);
    toast(fill(words.skipped, { name: item.name }), {
      duration: 6000,
      action: { label: words.undo, altText: fill(words.undoName, { name: item.name }), onClick: () => unskip(item) },
    });
  }

  function unskip(item: ReviewItem) {
    const pending = timers.current.get(item.id);
    if (pending !== undefined) window.clearTimeout(pending);
    timers.current.delete(item.id);
    setLeaving((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setSkipped((current) => {
      const next = new Set(current);
      next.delete(item.id);
      return next;
    });
    setSaid(fill(words.restoredStatus, { name: item.name }));
    setFocusId(item.id);
    onUnskip?.(item.id);
  }

  return (
    <section ref={root} tabIndex={-1} data-slot="reviews-to-write" aria-labelledby={`${id}-title`} className={cn("@container grid min-w-0 gap-5 outline-none", className)} {...props}>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
        <Heading id={`${id}-title`} className="text-lg leading-snug font-semibold tracking-[-0.02em]">
          {title ?? words.title}
        </Heading>
        {waiting > 0 ? (
          <Badge variant="outline" className="tabular-nums">
            {fill(plural.select(waiting) === "one" ? words.waitingOne : words.waitingOther, { count: numbers.format(waiting) })}
          </Badge>
        ) : null}
        <p className="col-span-2 text-sm text-muted-foreground">{description ?? words.description}</p>
      </header>

      {visible.length === 0 ? (
        <EmptyState icon={<IconStar className="size-6" />} title={words.emptyTitle} description={words.emptyDescription} className="bg-card py-12" />
      ) : (
        <ul role="list" className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {visible.map((item) => (
            <Row
              key={item.id}
              item={item}
              words={words}
              rating={ratingOf(item)}
              leaving={leaving.has(item.id)}
              failed={failed.has(item.id)}
              locale={locale}
              timeZone={timeZone}
              onRate={(next) => void rate(item, next)}
              onChange={() => change(item)}
              onWrite={() => onWrite?.(item.id, ratingOf(item))}
              onSkip={() => skip(item)}
            />
          ))}
        </ul>
      )}

      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  );
}
