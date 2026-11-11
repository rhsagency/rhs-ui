"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";

import { DocumentStatsPanel } from "@rhs-ui/application/document-stats-popover/panel";
import {
  DEFAULT_LABELS,
  IDLE_ABOVE,
  NO_STATS,
  countInIdle,
  countText,
  fill,
  isOne,
  numberText,
  type DocumentGoal,
  type DocumentStats,
  type DocumentStatsLabels,
} from "@rhs-ui/application/document-stats-popover/stats";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { DocumentGoal, DocumentStats, DocumentStatsLabels } from "@rhs-ui/application/document-stats-popover/stats";
export { DocumentStatsPanel, type DocumentStatsPanelProps } from "@rhs-ui/application/document-stats-popover/panel";

export interface DocumentStatsPopoverProps {
  /** The whole text of the document, as plain text. */
  text: string;
  /** The text that is selected right now, if any. While it holds something the button and the panel show its numbers and say so. */
  selectionText?: string;
  /** The language the text is in, for where words and sentences end, and for the numbers. Default "en-US". */
  locale?: string;
  /** How many words a person reads in a minute. Default 238. */
  wordsPerMinute?: number;
  /** How many words a person says in a minute. Default 130. */
  speakingWordsPerMinute?: number;
  /** A goal for the document: the panel adds a bar and "Goal: 800 words, 388 to go". */
  goal?: DocumentGoal;
  /** Your own button. The popover then does not draw the word count on it; the count is announced all the same. Default: a small quiet button with the count. */
  trigger?: ReactElement;
  /** Whether the popover is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The side of the button the panel opens on. Default "top", for a button in a footer. */
  side?: "top" | "right" | "bottom" | "left";
  /** How the panel lines up with the button along that side. Default "start". */
  align?: "start" | "center" | "end";
  /** The words the popover says, for translation. */
  labels?: DocumentStatsLabels;
  /** Classes for the default button. */
  className?: string;
}

/** The numbers of a text. Short texts are counted while rendering; a long one is counted in idle time, and until the first count is done there are no numbers. */
function useCount(text: string, locale: string): { stats: DocumentStats | null; counting: boolean } {
  const long = text.length > IDLE_ABOVE;
  const quick = useMemo(() => (long ? NO_STATS : countText(text, locale)), [text, locale, long]);
  const [slow, setSlow] = useState<DocumentStats | null>(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (!long) {
      setCounting(false);
      return;
    }
    setCounting(true);
    // Counting restarts at every change, and the one before is cancelled: while keys are being pressed, nothing is counted at all.
    return countInIdle(text, locale, (done) => {
      setSlow(done);
      setCounting(false);
    });
  }, [text, locale, long]);

  return long ? { stats: slow, counting } : { stats: quick, counting: false };
}

/**
 * The word count in an editor's footer, and what is behind it. The button reads "412 words" (or "36 of 412 words" while
 * something is selected) and opens a panel with words, characters with and without spaces, sentences, paragraphs and the
 * time to read and to say it aloud, for the document or for the selection, labelled with which. A goal adds a bar and
 * "Goal: 800 words, 388 to go". Words and sentences are counted by the rules of the locale, a long text is counted in
 * idle time so typing never stalls, and a screen reader hears the new count only once typing pauses, not on every key.
 */
export function DocumentStatsPopover({
  text,
  selectionText = "",
  locale = "en-US",
  wordsPerMinute,
  speakingWordsPerMinute,
  goal,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  side = "top",
  align = "start",
  labels,
  className,
}: DocumentStatsPopoverProps) {
  const words: Required<DocumentStatsLabels> = { ...DEFAULT_LABELS, ...labels };
  const whole = useCount(text, locale);
  const hasSelection = /\S/.test(selectionText);
  const selection = useCount(hasSelection ? selectionText : "", locale);

  const total = whole.stats?.words ?? 0;
  const count = (value: number) => fill(isOne(value, locale) ? words.wordsOne : words.wordsOther, { count: numberText(value, locale) });
  // What the button says: the count, or while something is selected how much of it that is.
  const summary = !whole.stats
    ? words.counting
    : hasSelection && selection.stats
      ? fill(words.selectionOf, { selection: numberText(selection.stats.words, locale), total: numberText(total, locale) })
      : count(total);

  // A screen reader hears the count once typing has paused, not at every key: the live region only changes after a quiet second.
  const [announced, setAnnounced] = useState(summary);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(summary), 1000);
    return () => window.clearTimeout(timer);
  }, [summary]);

  return (
    <>
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          {trigger ?? (
            <button
              type="button"
              data-slot="document-stats-trigger"
              className={cn(
                "inline-flex h-7 items-center rounded-md px-2 text-xs font-medium whitespace-nowrap text-muted-foreground tabular-nums outline-none",
                "transition-[background-color,color] duration-150 motion-reduce:transition-none",
                "hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
                "focus-visible:ring-[3px] focus-visible:ring-ring/40 pointer-coarse:h-9",
                className,
              )}
            >
              {summary}
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent
          data-slot="document-stats-popover"
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          aria-label={words.title}
          // Never taller than the room there is: on a small screen the panel scrolls inside itself instead of running off the edge.
          className="relative w-72 max-w-[min(18rem,var(--radix-popover-content-available-width))] max-h-(--radix-popover-content-available-height) overflow-x-hidden overflow-y-auto overscroll-contain p-0 [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]"
        >
          <DocumentStatsPanel
            stats={whole.stats ?? NO_STATS}
            selection={hasSelection ? (selection.stats ?? NO_STATS) : null}
            goal={goal}
            wordsPerMinute={wordsPerMinute}
            speakingWordsPerMinute={speakingWordsPerMinute}
            counting={whole.counting || (hasSelection && selection.counting)}
            locale={locale}
            labels={labels}
          />
        </PopoverContent>
      </Popover>
      <span role="status" aria-live="polite" className="sr-only">
        {announced}
      </span>
    </>
  );
}
