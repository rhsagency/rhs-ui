import type { ComponentProps, ReactNode } from "react";

import { IconCheck, IconCursor, IconFileText, IconSpinner } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  durationText,
  fill,
  minutesFor,
  numberText,
  isOne,
  type DocumentGoal,
  type DocumentStats,
  type DocumentStatsLabels,
} from "@rhs-ui/application/document-stats-popover/stats";
import { Badge } from "@rhs-ui/primitives/badge";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export interface DocumentStatsPanelProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** The numbers of the whole document. Count a text with `countText` from the item's `stats` file, or with your editor. */
  stats: DocumentStats;
  /** The numbers of the selection. While it is set the panel shows these, says so, and keeps the whole document in a line beneath. */
  selection?: DocumentStats | null;
  /** A goal for the document: a bar and a sentence, "Goal: 800 words, 388 to go". The goal is always about the whole document. */
  goal?: DocumentGoal;
  /** How many words a person reads in a minute. Default 238. */
  wordsPerMinute?: number;
  /** How many words a person says in a minute. Default 130. */
  speakingWordsPerMinute?: number;
  /** A long text is still being counted: the panel says so and keeps the numbers it has. */
  counting?: boolean;
  /** The language of the numbers and of the times. Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: DocumentStatsLabels;
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * The numbers of a text as the content of a card: the words large, with a tag that says whether they are for the
 * document or for the selection, then characters with and without spaces, sentences, paragraphs, and the time to read it
 * and to say it aloud. A goal adds a bar and one sentence. Figures use tabular numerals, so they do not shift as they
 * change. It is what DocumentStatsPopover shows, usable by itself in a sidebar or a status bar.
 */
export function DocumentStatsPanel({
  stats,
  selection,
  goal,
  wordsPerMinute = 238,
  speakingWordsPerMinute = 130,
  counting = false,
  locale = "en-US",
  labels,
  className,
  ...props
}: DocumentStatsPanelProps) {
  const words: Required<DocumentStatsLabels> = { ...DEFAULT_LABELS, ...labels };
  const shown = selection ?? stats;
  const n = (value: number) => numberText(value, locale);

  // A goal of nothing is no goal: there is nothing to go towards.
  const target = goal && goal.words > 0 ? goal : null;
  const rest = target ? target.words - stats.words : 0;
  const percent = target ? Math.min(100, Math.round((stats.words / target.words) * 100)) : 0;
  const goalText = !target
    ? ""
    : rest > 0
      ? fill(words.goalToGo, { goal: n(target.words), rest: n(rest) })
      : rest === 0
        ? fill(words.goalReached, { goal: n(target.words) })
        : fill(words.goalPassed, { goal: n(target.words), extra: n(-rest) });

  return (
    <div data-slot="document-stats-panel" data-scope={selection ? "selection" : "document"} aria-busy={counting || undefined} className={cn("grid gap-4 p-4 text-sm text-popover-foreground", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {selection ? (
            <Badge>
              <IconCursor />
              {words.selection}
            </Badge>
          ) : (
            <Badge variant="muted">
              <IconFileText />
              {words.document}
            </Badge>
          )}
          <p className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-3xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{n(shown.words)}</span>
            <span className="text-muted-foreground">{words.words.toLowerCase()}</span>
          </p>
          {selection ? <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">{fill(words.wholeDocument, { total: fill(isOne(stats.words, locale) ? words.wordsOne : words.wordsOther, { count: n(stats.words) }) })}</p> : null}
        </div>
        {counting ? (
          <span role="status" className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <IconSpinner aria-hidden="true" className="size-3.5" />
            {words.counting}
          </span>
        ) : null}
      </div>

      <dl className="divide-y divide-border border-y border-border">
        <Row term={words.characters}>{n(shown.characters)}</Row>
        <Row term={words.charactersNoSpaces}>{n(shown.charactersNoSpaces)}</Row>
        <Row term={words.sentences}>{n(shown.sentences)}</Row>
        <Row term={words.paragraphs}>{n(shown.paragraphs)}</Row>
      </dl>

      <dl className="-my-1.5">
        <Row term={words.readingTime}>{durationText(minutesFor(shown.words, wordsPerMinute), locale, words.underMinute)}</Row>
        <Row term={words.speakingTime}>{durationText(minutesFor(shown.words, speakingWordsPerMinute), locale, words.underMinute)}</Row>
      </dl>

      {target ? (
        <div className="grid gap-2 border-t border-border pt-4">
          <p className="flex items-center gap-1.5 font-medium tabular-nums">
            {rest <= 0 ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : null}
            {goalText}
          </p>
          <Progress value={percent} aria-label={words.goalProgress} className="h-1.5" />
        </div>
      ) : null}
    </div>
  );
}
