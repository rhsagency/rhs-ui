"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconArrowDown } from "@rhs-ui/icons";
import {
  ARROW_STEPS,
  DEFAULT_LABELS,
  DEFAULT_OPTIONS,
  fill,
  stateOf,
  type AnswerChecklistLabels,
  type ChecklistItem,
  type ChecklistOption,
  type ChecklistValue,
  type RowState,
} from "@rhs-ui/application/answer-checklist/checklist";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Progress } from "@rhs-ui/primitives/progress";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export type { AnswerChecklistLabels, ChecklistAnswer, ChecklistItem, ChecklistOption, ChecklistValue } from "@rhs-ui/application/answer-checklist/checklist";

export interface AnswerChecklistProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The statements to answer, in order. */
  items: readonly ChecklistItem[];
  /** The answers a statement can get. Default Pass, Fail and Not applicable. */
  options?: readonly ChecklistOption[];
  /** The answers and notes so far, by statement id, when you control the checklist. */
  value?: ChecklistValue;
  /** The answers to begin with, when the checklist keeps them itself. */
  defaultValue?: ChecklistValue;
  /** Called with every answer and note whenever one changes. */
  onValueChange?: (value: ChecklistValue) => void;
  /** The `value`s of the options that need a note. Choosing one opens a note field under the row, and the row stays open until it is filled. Default none. */
  noteOn?: readonly string[];
  /** The words the checklist says, for translation. */
  labels?: AnswerChecklistLabels;
}

type MarkKind = RowState | "pass" | "fail" | "skip";

/** The mark of a row, on a 16 unit grid: a dashed ring while open, a disc with a check or a cross cut out of it once answered, a ring with a dash for not applicable, a ring with an exclamation mark while a note is missing. */
function Mark({ kind }: { kind: MarkKind }) {
  const mask = useId().replace(/[^\w-]/g, "");
  const tone = kind === "fail" || kind === "needs-note" ? "text-destructive" : kind === "open" || kind === "skip" ? "text-muted-foreground" : "text-foreground";
  const cut = kind === "fail" ? "M5.9 5.9l4.2 4.2M10.1 5.9l-4.2 4.2" : kind === "pass" || kind === "answered" ? "M5.1 8.2l2 2 3.8-4.2" : null;
  return (
    <svg data-slot="answer-checklist-mark" data-kind={kind} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" className={cn("mt-0.5 size-4 shrink-0", tone)}>
      {cut ? (
        <>
          <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
            <rect width="16" height="16" fill="white" />
            <path d={cut} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
          <circle cx="8" cy="8" r="7" fill="currentColor" mask={`url(#${mask})`} />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" strokeDasharray={kind === "open" ? "1.9 2.03" : undefined} />
          {kind === "skip" ? <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : null}
          {kind === "needs-note" ? <path d="M8 4.9v3.7M8 11.1h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : null}
        </>
      )}
    </svg>
  );
}

/**
 * A list of statements that each get an answer, for inspections, audits,
 * intake questionnaires and quality checks: Pass, Fail or Not applicable (or
 * Yes and No, or any set you give) on the house segmented control. Every row
 * is a radio group named by its statement, and shows where it stands in words
 * as well as a mark: not answered, the answer, or the answer with a note still
 * to write. Answers listed in `noteOn` open a note field under the row that is
 * required until it has text. A header counts what is left ("7 of 12 answered,
 * 1 note missing") in a polite live region, and a button moves focus to the
 * first row that is still open, to its answer or to its empty note. On a phone
 * the control wraps under the statement at full width.
 */
export function AnswerChecklist({ items, options = DEFAULT_OPTIONS, value, defaultValue, onValueChange, noteOn = [], labels, className, ...props }: AnswerChecklistProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const rows = useRef(new Map<string, HTMLLIElement>());
  const [own, setOwn] = useState<ChecklistValue>(defaultValue ?? {});
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const current = value ?? own;

  const states = items.map((item) => stateOf(current[item.id], noteOn));
  const answered = states.filter((state) => state !== "open").length;
  const missing = states.filter((state) => state === "needs-note").length;
  const left = states.filter((state) => state !== "answered").length;
  const summary = left === 0 ? fill(text.summaryDone, { total: items.length }) : fill(text.summary, { answered, total: items.length }) + (missing ? `, ${missing === 1 ? text.noteOne : fill(text.noteMany, { count: missing })}` : "");

  function write(id: string, change: Partial<{ answer: string | null; note: string }>) {
    const before = current[id];
    const next: ChecklistValue = { ...current, [id]: { answer: before?.answer ?? null, note: before?.note ?? "", ...change } };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  /**
   * The house segmented control finds the next answer from the chosen one, so on a row with no answer an arrow key starts from nowhere:
   * Right would choose the first answer and Left the one before the last, whichever has focus. While a row is open the keys start from
   * the answer that has focus instead, the way a radio group does, and move and choose from there.
   */
  function stepFromFocus(event: KeyboardEvent<HTMLLIElement>) {
    const step = ARROW_STEPS[event.key];
    const from = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="radio"]');
    if (!step || !from) return;
    const points = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')];
    const index = points.indexOf(from);
    if (index < 0) return;
    event.preventDefault();
    event.stopPropagation();
    const next = points[(index + step + points.length) % points.length];
    next?.focus();
    next?.click();
  }

  function jump() {
    const index = states.findIndex((state) => state !== "answered");
    const item = items[index];
    const row = item ? rows.current.get(item.id) : undefined;
    if (!item || !row) return;
    const target = states[index] === "needs-note" ? row.querySelector<HTMLElement>("textarea") : (row.querySelector<HTMLElement>('[role="radio"][tabindex="0"]') ?? row.querySelector<HTMLElement>('[role="radio"]'));
    target?.focus({ preventScroll: true });
    row.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <div data-slot="answer-checklist" className={cn("overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border bg-muted/30 px-4 py-3">
        <div className="grid min-w-0 flex-1 basis-52 gap-2">
          <p role="status" aria-live="polite" className="text-sm leading-5 font-medium tabular-nums">
            {summary}
          </p>
          <Progress value={answered} max={Math.max(1, items.length)} aria-label={text.progress} getValueLabel={() => summary} className="h-1" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={jump} disabled={left === 0} className="max-sm:w-full">
          {text.jump}
          <IconArrowDown aria-hidden="true" />
        </Button>
      </div>

      <ol role="list" className="divide-y divide-border">
        {items.map((item, index) => {
          const state = states[index] ?? "open";
          const answer = current[item.id];
          const chosen = options.find((option) => option.value === answer?.answer);
          const mark: MarkKind = state === "answered" ? (chosen?.tone ?? "answered") : state;
          const open = noteOn.includes(answer?.answer ?? "");
          const noteId = `${base}-${item.id}-note`;
          return (
            <li
              key={item.id}
              ref={(element) => {
                if (element) rows.current.set(item.id, element);
                else rows.current.delete(item.id);
              }}
              data-state={state}
              onKeyDownCapture={chosen ? undefined : stepFromFocus}
              className="grid px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6"
            >
              <div className="flex min-w-0 gap-3">
                <Mark kind={mark} />
                <div className="min-w-0">
                  <p className="text-sm leading-5 font-medium text-pretty">{item.label}</p>
                  {item.hint ? <p className="mt-0.5 text-xs leading-5 text-pretty text-muted-foreground">{item.hint}</p> : null}
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs leading-4">
                    {state === "open" ? (
                      <span className="text-muted-foreground">{text.unanswered}</span>
                    ) : (
                      <span className={cn("font-medium", chosen?.tone === "fail" ? "text-destructive" : "text-foreground")}>{chosen?.label}</span>
                    )}
                    {state === "needs-note" ? (
                      <>
                        <span aria-hidden="true" className="text-muted-foreground">
                          ·
                        </span>
                        <span className="font-medium text-destructive">{text.noteRequired}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              <SegmentedControl
                label={item.hint ? `${item.label}. ${item.hint}` : item.label}
                options={options.map(({ value: optionValue, label }) => ({ value: optionValue, label }))}
                value={answer?.answer ?? ""}
                onValueChange={(next) => write(item.id, { answer: next })}
                className="w-full rounded-lg max-sm:mt-3 sm:w-auto sm:self-start [&>button]:flex-1 [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[0.8125rem] sm:[&>button]:flex-none sm:[&>button]:px-3.5"
              />

              {/* The note opens under the row and folds away again; closed, it is out of the tab order and not required. The row has no gap of its own, so a closed note adds no space below the row. */}
              <div className={cn("grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none sm:col-span-2", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div inert={!open} className="-mx-1 -mb-1 min-h-0 overflow-hidden px-1 pb-1">
                  <div className="grid gap-1.5 pt-4 sm:pl-7">
                    <Label htmlFor={noteId} className="text-xs font-medium">
                      {text.note}
                      <span className="font-normal text-muted-foreground">({text.required})</span>
                    </Label>
                    <Textarea
                      id={noteId}
                      rows={2}
                      required={open}
                      aria-invalid={open && touched.has(item.id) && !(answer?.note ?? "").trim() ? true : undefined}
                      placeholder={item.notePlaceholder ?? text.notePlaceholder}
                      value={answer?.note ?? ""}
                      onChange={(event) => write(item.id, { note: event.target.value })}
                      onBlur={() => setTouched((set) => new Set(set).add(item.id))}
                      className="min-h-16 text-sm"
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
