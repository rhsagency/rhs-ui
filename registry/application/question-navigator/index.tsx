"use client";

import { useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconFlag } from "@rhs-ui/icons";
import {
  columnsOf,
  counts,
  DEFAULT_LABELS,
  fill,
  nameOf,
  summaryOf,
  visibleQuestions,
  type NavigatorQuestion,
  type QuestionFilter,
  type QuestionNavigatorLabels,
  type QuestionState,
} from "@rhs-ui/application/question-navigator/questions";
import { cn } from "@/lib/utils";

export type { NavigatorQuestion, QuestionFilter, QuestionNavigatorLabels, QuestionState } from "@rhs-ui/application/question-navigator/questions";

export interface QuestionNavigatorProps extends Omit<ComponentProps<"nav">, "children" | "onSelect"> {
  /** The questions, in order. Each has an `id`, the `label` its cell shows, a `state` (unanswered or answered) and whether it is `flagged` for review. */
  questions: readonly NavigatorQuestion[];
  /** The `id` of the question on screen. Its cell gets an outline and is the one the Tab key lands on. */
  current?: string;
  /** A question was chosen, by click, tap or Enter. Take the reader there. */
  onSelect: (id: string) => void;
  /** How many cells fit in a row at the most. In a narrower space there are fewer, and a cell is never smaller than 2.5rem. Default 5. */
  columns?: number;
  /** The key to the marks under the grid. Default true. */
  showLegend?: boolean;
  /** Which questions the grid lists: all, only those without an answer, or only the flagged ones. Controlled: pair it with `onFilterChange`. */
  filter?: QuestionFilter;
  /** The filter at the start, when you do not control it. Default "all". */
  defaultFilter?: QuestionFilter;
  /** The filter was changed with the buttons of `showFilter`. */
  onFilterChange?: (filter: QuestionFilter) => void;
  /** Draws a row of buttons, All, Unanswered and Flagged, with their counts, above the grid. Without it the filter is whatever you pass. Default false. */
  showFilter?: boolean;
  /** The language the counts are written in. Default "en-US". */
  locale?: string;
  /** The words the navigator says, for translation. */
  labels?: QuestionNavigatorLabels;
}

/** One cell of the key: the same drawing as a real cell, small. Each mark is a different shape, so none depends on colour. */
function Sample({ kind }: { kind: QuestionState | "flagged" | "current" }) {
  return (
    <span
      aria-hidden="true"
      data-slot="question-navigator-sample"
      data-kind={kind}
      className={cn("relative grid size-5 shrink-0 place-items-center rounded-md border border-border", kind === "answered" && "bg-muted", kind === "current" && "border-foreground ring-1 ring-foreground")}
    >
      {kind === "answered" ? <span className="size-1 rounded-full bg-foreground" /> : null}
      {kind === "flagged" ? <IconFlag strokeWidth={2.2} className="size-3" /> : null}
    </span>
  );
}

/**
 * The navigator beside an exam or a long survey: a grid of numbered cells,
 * each in a state that differs in shape and in words, not in colour alone, a
 * dot for answered, a flag for flagged and an outline for the question on
 * screen, with a key under it and a summary line above ("Answered 14 of 20, 2
 * flagged") that is a polite live region. Each cell is named as one phrase,
 * "Question 7, answered, flagged". The grid is one Tab stop and moves like a
 * grid: arrow keys step by a cell or a row, Home and End go to the ends of a
 * row, Control with them to the first and last, Enter jumps. A filter lists
 * only the unanswered or only the flagged questions, set by you or with the
 * buttons of `showFilter`. With no questions at all it says so, instead of
 * drawing a summary of zeros and a grid of nothing.
 */
export function QuestionNavigator({
  questions,
  current,
  onSelect,
  columns = 5,
  showLegend = true,
  filter,
  defaultFilter = "all",
  onFilterChange,
  showFilter = false,
  locale = "en-US",
  labels,
  className,
  ...props
}: QuestionNavigatorProps) {
  const text: Required<QuestionNavigatorLabels> = { ...DEFAULT_LABELS, ...labels };
  const [ownFilter, setOwnFilter] = useState<QuestionFilter>(defaultFilter);
  // The cell the keyboard moved to; while it is gone from the grid the one tab stop sits on the current question, or else the first.
  const [stop, setStop] = useState<string | null>(null);
  const active = filter ?? ownFilter;
  const shown = visibleQuestions(questions, active);
  const total = counts(questions);
  const stopId = shown.find((question) => question.id === stop)?.id ?? shown.find((question) => question.id === current)?.id ?? shown[0]?.id;
  const number = new Intl.NumberFormat(locale);
  const per = Math.max(1, Math.floor(columns));

  function pick(next: QuestionFilter) {
    if (filter === undefined) setOwnFilter(next);
    onFilterChange?.(next);
  }

  /** The arrow keys, Home and End move between cells like a grid; the cells are real buttons, so Enter and Space choose. */
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.altKey || event.metaKey) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-question]");
    if (!cell) return;
    const cells = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-question]"));
    const here = cells.indexOf(cell);
    const across = columnsOf(cells);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const rowStart = here - (here % across);
    let to: number;
    switch (event.key) {
      case "ArrowRight":
        to = here + (rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        to = here + (rtl ? 1 : -1);
        break;
      case "ArrowDown":
        // A short last row has no cell under the right-hand ones: go to its last cell, unless this is already the last row.
        to = here + across < cells.length ? here + across : rowStart + across < cells.length ? cells.length - 1 : here;
        break;
      case "ArrowUp":
        to = here - across >= 0 ? here - across : here;
        break;
      case "Home":
        to = event.ctrlKey ? 0 : rowStart;
        break;
      case "End":
        to = event.ctrlKey ? cells.length - 1 : Math.min(cells.length - 1, rowStart + across - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    cells[Math.max(0, Math.min(cells.length - 1, to))]?.focus();
  }

  const options: readonly { value: QuestionFilter; label: string; count: number }[] = [
    { value: "all", label: text.filterAll, count: total.all },
    { value: "unanswered", label: text.filterUnanswered, count: total.unanswered },
    { value: "flagged", label: text.filterFlagged, count: total.flagged },
  ];

  // No questions at all (still loading, or none yet): a plain statement, not "Answered 0 of 0" over three zeros and a key to nothing.
  if (questions.length === 0) {
    return (
      <nav data-slot="question-navigator" aria-label={text.navigation} className={cn("@container grid gap-4", className)} {...props}>
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">{text.empty}</p>
      </nav>
    );
  }

  return (
    <nav data-slot="question-navigator" aria-label={text.navigation} className={cn("@container grid gap-4", className)} {...props}>
      <div className="grid gap-2">
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm leading-5 font-medium tabular-nums">
          {summaryOf(questions, text, locale)}
          {active !== "all" ? <span className="sr-only"> {fill(text.showing, { shown: number.format(shown.length), total: number.format(total.all) })}</span> : null}
        </p>
        <div aria-hidden="true" data-slot="question-navigator-bar" className="h-1 overflow-hidden rounded-full bg-foreground/12">
          <div className="h-full rounded-full bg-foreground transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${total.all ? (total.answered / total.all) * 100 : 0}%` }} />
        </div>
      </div>

      {showFilter ? (
        <div role="group" aria-label={text.filter} className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={active === option.value}
              onClick={() => pick(option.value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs leading-none font-medium outline-none",
                "transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                active === option.value ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-muted",
              )}
            >
              {option.label}
              <span className={cn("tabular-nums", active === option.value ? "text-background/70" : "text-muted-foreground")}>{number.format(option.count)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">{active === "flagged" ? text.noneFlagged : text.noneUnanswered}</p>
      ) : (
        <ul
          role="list"
          onKeyDown={onKeyDown}
          // At the most `columns` cells across; below that the cells keep their size and the row takes fewer.
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(max(2.5rem, calc((100% - ${(per - 1) * 0.5}rem) / ${per})), 1fr))` }}
          className="grid gap-2"
        >
          {shown.map((question) => {
            const isCurrent = question.id === current;
            const answered = question.state === "answered";
            return (
              <li key={question.id} className="min-w-0">
                <button
                  type="button"
                  data-question={question.id}
                  data-state={question.state}
                  data-flagged={question.flagged ? "" : undefined}
                  aria-current={isCurrent ? "true" : undefined}
                  aria-label={nameOf(question, isCurrent, text)}
                  tabIndex={question.id === stopId ? 0 : -1}
                  onFocus={() => setStop(question.id)}
                  onClick={() => onSelect(question.id)}
                  className={cn(
                    "relative grid aspect-square w-full min-w-0 place-items-center rounded-lg border text-sm leading-none font-medium tabular-nums select-none",
                    "transition-[background-color,border-color,box-shadow] duration-150 outline-none motion-reduce:transition-none",
                    // outline-none sets the outline style to none for good, and outline-2 only borrows it: the ring needs its own style.
                    "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    answered ? "bg-muted" : "bg-background",
                    isCurrent ? "border-foreground font-semibold ring-1 ring-foreground" : "border-border hover:border-foreground/40",
                  )}
                >
                  <span aria-hidden="true" className="max-w-full truncate px-1">
                    {question.label}
                  </span>
                  {question.flagged ? <IconFlag aria-hidden="true" strokeWidth={2.2} className="absolute end-1 top-1 size-3" /> : null}
                  {answered ? <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showLegend ? (
        <ul role="list" data-slot="question-navigator-legend" className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-5 text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <Sample kind="unanswered" />
            {text.legendUnanswered}
          </li>
          <li className="flex items-center gap-1.5">
            <Sample kind="answered" />
            {text.legendAnswered}
          </li>
          <li className="flex items-center gap-1.5">
            <Sample kind="flagged" />
            {text.legendFlagged}
          </li>
          <li className="flex items-center gap-1.5">
            <Sample kind="current" />
            {text.legendCurrent}
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
