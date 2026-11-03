"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconHistory } from "@rhs-ui/icons";
import { Alert } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { InlineConfirm } from "@rhs-ui/primitives/inline-confirm";
import { cn } from "@/lib/utils";

export { useLocalDraft, type LocalDraft, type UseLocalDraft, type UseLocalDraftOptions } from "@rhs-ui/application/draft-restored-notice/use-local-draft";

/** The words the notice uses, for translation. `{time}` is filled in. */
export interface DraftRestoredNoticeLabels {
  /** The sentence; `{time}` becomes the time element. Default "We restored your draft from {time}". */
  title?: string;
  /** The button that keeps it. Default "Keep draft". */
  keep?: string;
  /** The button that deletes it, which asks again. Default "Start over". */
  discard?: string;
  /** The question that replaces it. Default "Delete this draft?". */
  discardQuestion?: string;
  /** The button that confirms. Default "Delete". */
  discardConfirm?: string;
  /** The name of the notice for a screen reader. Default "Draft restored". */
  region?: string;
}

export interface DraftRestoredNoticeProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** When the draft was saved: `draft.savedAt` from `useLocalDraft`, or any Date or ISO moment. */
  savedAt: Date | string | number;
  /** How much the draft holds, in a few words: "3 fields changed", "412 words". It is shown under the sentence. */
  summary?: ReactNode;
  /** Called when "Keep draft" is pressed. The notice folds away; the draft stays in storage until you save. */
  onKeep?: () => void;
  /** Called once "Start over" has been confirmed with its second press. Reset your form and call `clear()` here. Return a promise and the notice waits for it before it folds away. */
  onDiscard?: () => unknown;
  /** Called after the notice has folded away, whichever button closed it. Stop rendering it here, not before, or it vanishes without its fold. */
  onClosed?: () => void;
  /** The time zone the time is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** Pins the moment "today" is worked out from, for previews and tests. Leave it out to use the browser's clock, read once the page is live. */
  now?: Date | string | number;
  /** The words the notice uses, for translation. */
  labels?: DraftRestoredNoticeLabels;
}

const DEFAULT_LABELS = {
  title: "We restored your draft from {time}",
  keep: "Keep draft",
  discard: "Start over",
  discardQuestion: "Delete this draft?",
  discardConfirm: "Delete",
  region: "Draft restored",
} satisfies Required<DraftRestoredNoticeLabels>;

/** How long the notice takes to fold away, in ms: the length of its transition. */
const LEAVE_MS = 220;

function momentOf(input: Date | string | number | undefined): Date | null {
  if (input === undefined) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function written(date: Date, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

/** The calendar day in the zone, as 2026-11-02: two moments are the same day when this is the same. */
const dayOf = (date: Date, timeZone: string) => written(date, "en-CA", timeZone, { year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * Tells people that their unsaved work came back: "We restored your draft from
 * 10:42", how much it holds ("3 fields changed", "412 words") and two ways on.
 * Keep draft simply dismisses the notice. Start over deletes the draft for
 * good, so it asks for a second press before it calls `onDiscard`. The time is
 * a time element in the zone you pass, and it carries the day too when the
 * draft is not from today. The notice is a polite status: it is spoken once
 * and never takes the focus, and it holds no alert role, so a validation error
 * in the form beside it is always the louder voice. Put it above the form,
 * where `useLocalDraft` (exported from here) reports that a draft exists.
 */
export function DraftRestoredNotice({ savedAt, summary, onKeep, onDiscard, onClosed, timeZone = "UTC", locale = "en-US", now, labels, className, ...props }: DraftRestoredNoticeProps) {
  const text: Required<DraftRestoredNoticeLabels> = { ...DEFAULT_LABELS, ...labels };
  const [phase, setPhase] = useState<"open" | "leaving" | "gone">("open");
  const [said, setSaid] = useState("");
  const [clock, setClock] = useState<number | null>(null);
  const leave = useRef<number | undefined>(undefined);

  // The browser's clock is read once the page is live, so the server and the first paint draw the same sentence.
  const pinned = momentOf(now)?.getTime() ?? null;
  useEffect(() => {
    setClock(pinned ?? Date.now());
  }, [pinned]);
  useEffect(() => () => window.clearTimeout(leave.current), []);

  const saved = momentOf(savedAt);
  const today = saved !== null && clock !== null && dayOf(saved, timeZone) === dayOf(new Date(clock), timeZone);
  const time = saved
    ? {
        iso: saved.toISOString(),
        short: written(saved, locale, timeZone, today ? { hour: "numeric", minute: "2-digit" } : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
        full: written(saved, locale, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }),
      }
    : null;

  const [before = "", ...rest] = text.title.split("{time}");
  const sentence = time ? `${before}${time.short}${rest.join("{time}")}` : before + rest.join("");

  // Said once, a moment after the notice is in the page: a status region that appears with its text is not always read.
  const spoken = `${sentence}${typeof summary === "string" ? `. ${summary}` : ""}`;
  useEffect(() => {
    const timer = window.setTimeout(() => setSaid(spoken), 150);
    return () => window.clearTimeout(timer);
  }, [spoken]);

  const closed = useRef(onClosed);
  useEffect(() => {
    closed.current = onClosed;
  });

  function close() {
    setPhase("leaving");
    window.clearTimeout(leave.current);
    leave.current = window.setTimeout(() => {
      setPhase("gone");
      closed.current?.();
    }, LEAVE_MS);
  }

  if (phase === "gone") return null;

  return (
    <>
      <div
        data-slot="draft-restored-notice"
        inert={phase === "leaving" || undefined}
        // A grid row folds from 1fr to 0fr, which animates height without measuring anything; `starting:` plays it backwards as the notice arrives.
        className={cn(
          "grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
          phase === "open" ? "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0" : "grid-rows-[0fr] opacity-0",
          className,
        )}
        {...props}
      >
        {/* The padding gives the focus ring room inside the clip; the negative margin takes it back out of the layout. */}
        <div className="-m-1 min-h-0 overflow-hidden p-1">
          <Alert role="group" aria-label={text.region} className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground [&_svg]:size-4">
                <IconHistory />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug font-medium text-balance">
                  {before}
                  {time ? (
                    // The time is one unit: the sentence breaks before it, never inside it.
                    <time dateTime={time.iso} title={time.full} suppressHydrationWarning className="whitespace-nowrap tabular-nums decoration-muted-foreground/60 decoration-dotted underline-offset-4 hover:underline">
                      {time.short}
                    </time>
                  ) : null}
                  {rest.join("{time}")}
                </p>
                {summary ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground tabular-nums">{summary}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onKeep?.();
                  close();
                }}
              >
                {text.keep}
              </Button>
              <InlineConfirm
                question={text.discardQuestion}
                confirmLabel={text.discardConfirm}
                onConfirm={async () => {
                  await onDiscard?.();
                  close();
                }}
                // The question is the primitive's destructive red on a faint red: a little of the page colour is mixed in, so it reads at 4.5:1 on both.
                className="text-muted-foreground hover:text-foreground [&>span]:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_28%)]"
              >
                {text.discard}
              </InlineConfirm>
            </div>
          </Alert>
        </div>
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </>
  );
}
