"use client";

import { useCallback, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheckCircle, IconLock, IconRefresh, IconXCircle } from "@rhs-ui/icons";
import { DEFAULT_LABELS, answersOf, markOf, sameSet, type QuizMark, type QuizOption, type QuizOptionsLabels, type QuizStatus } from "@rhs-ui/application/quiz-options/quiz";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { cn } from "@/lib/utils";

export type { QuizMark, QuizOption, QuizOptionsLabels, QuizStatus } from "@rhs-ui/application/quiz-options/quiz";

export interface QuizOptionsProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The question. It names the group of options for a screen reader. */
  question: ReactNode;
  /** The options, in the order they are shown. */
  options: readonly QuizOption[];
  /** The value of the right option, or the values of the right ones. When several are right the options are checkboxes, unless `multiple` says otherwise. */
  correct: string | readonly string[];
  /** What is chosen, as a list of values with one entry for a question with a single answer. Pass it to control the question. */
  value?: readonly string[];
  /** What is chosen to begin with, when the question keeps that itself. */
  defaultValue?: readonly string[];
  /** Called with everything that is chosen whenever it changes. */
  onValueChange?: (value: string[]) => void;
  /** Where the question stands, when you control it: "answering" or "checked". Without it the question keeps its own status. */
  status?: QuizStatus;
  /** Check answer was pressed. Gets whether the answer is right and what was chosen. The question locks and marks itself; a controlled `status` is yours to set. */
  onCheck?: (result: { correct: boolean; value: string[] }) => void;
  /** Try again was pressed (after the question has cleared its answer). A controlled `status` is yours to set back to "answering". */
  onRetry?: () => void;
  /** Offer Try again once the question is checked. Without it a checked question stays marked. Default false. */
  allowRetry?: boolean;
  /** Force checkboxes (true) or radio buttons (false), instead of going by how many answers are right. */
  multiple?: boolean;
  /** Turn the whole question off. */
  disabled?: boolean;
  /** The question's name for a plain form submit: one field with this name per chosen value. */
  name?: string;
  /** The words the question says, for translation. */
  labels?: QuizOptionsLabels;
}

/** The ink of a mark. Plain destructive red is short of AA on the pale red of a wrong row, so it is pulled a little toward the text colour (darker in light mode, lighter in dark mode). */
const MARK_INK: Record<QuizMark, string> = {
  correct: "text-foreground",
  incorrect: "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]",
  missed: "text-muted-foreground",
  answer: "text-muted-foreground",
};

/** The row of a marked option: a solid edge for a right answer chosen, a red edge for a wrong one, a dashed edge for a right one that was left out. */
const MARK_ROW: Record<QuizMark, string> = {
  correct: "border-foreground bg-muted/50",
  incorrect: "border-destructive/60 bg-destructive/5",
  missed: "border-dashed border-foreground/50",
  answer: "border-dashed border-foreground/50",
};

/**
 * A multiple-choice question for lessons, onboarding checks and product
 * education. While it is being answered it is a radio group, or a checkbox set
 * when several answers are right; Check answer locks it in and marks every
 * option that matters with an icon and a word, never colour alone: "Correct",
 * "Your answer, incorrect", and "Missed" (or "Correct answer" when only one
 * answer is right) for a right option that was left out. A one-line reason on
 * an option appears under it once the question is checked and is announced
 * politely together with the marks; the options stay in the tab order, so a
 * screen reader can walk the result. The verdict panel is left to your page,
 * which hears the result through onCheck({ correct }). With allowRetry the
 * same button becomes Try again, which clears the question.
 */
export function QuizOptions({
  question,
  options,
  correct,
  value,
  defaultValue,
  onValueChange,
  status,
  onCheck,
  onRetry,
  allowRetry = false,
  multiple,
  disabled = false,
  name,
  labels,
  className,
  ref,
  ...props
}: QuizOptionsProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const root = useRef<HTMLDivElement | null>(null);
  // A ref of the consumer's is kept: the question's own ref (it finds the option to give the focus back to) is composed with it, not replaced by it.
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [ownValue, setOwnValue] = useState<readonly string[]>(defaultValue ?? []);
  const [ownStatus, setOwnStatus] = useState<QuizStatus>("answering");
  const answers = answersOf(correct);
  const several = multiple ?? answers.length > 1;
  const chosen = value ?? ownValue;
  const checked = (status ?? ownStatus) === "checked";
  const ids = { question: `${base}-question`, hint: `${base}-hint` };

  function choose(next: string[]) {
    if (checked || disabled) return;
    if (value === undefined) setOwnValue(next);
    onValueChange?.(next);
  }

  /** Put the focus on a chosen option, or on the first: the button that had it is about to change or go. */
  function focusOption() {
    requestAnimationFrame(() => {
      const target = root.current?.querySelector<HTMLElement>('[data-slot="quiz-option"] [data-state="checked"]') ?? root.current?.querySelector<HTMLElement>('[data-slot="quiz-option"] [role="radio"], [data-slot="quiz-option"] [role="checkbox"]');
      target?.focus();
    });
  }

  function check() {
    if (checked || disabled || chosen.length === 0) return;
    if (status === undefined) setOwnStatus("checked");
    onCheck?.({ correct: sameSet(chosen, answers), value: [...chosen] });
    if (!allowRetry) focusOption();
  }

  function retry() {
    if (value === undefined) setOwnValue([]);
    onValueChange?.([]);
    if (status === undefined) setOwnStatus("answering");
    onRetry?.();
    focusOption();
  }

  // What is said after a check: every option that carries a mark, with its reason, and any reason on another option is left to be read in the list.
  const spoken = checked
    ? [
        text.checked,
        ...options.flatMap((option) => {
          const mark = markOf(option.value, chosen, answers, several);
          return mark ? [`${option.label}, ${text[mark]}${option.reason ? `. ${option.reason}` : ""}`] : [];
        }),
      ].join(". ")
    : "";

  /** One option as a row. A plain function and not a component: a component made here would be a new type on every render, and the row, with its focus, would be remounted at every press. */
  function renderOption(option: QuizOption, index: number) {
    const id = `${base}-option-${index}`;
    const selected = chosen.includes(option.value);
    const mark = checked ? markOf(option.value, chosen, answers, several) : null;
    const MarkIcon = mark === "incorrect" ? IconXCircle : IconCheckCircle;
    const markId = `${id}-mark`;
    const reasonId = `${id}-reason`;
    const showReason = checked && Boolean(option.reason);
    const described = [mark ? markId : null, showReason ? reasonId : null].filter(Boolean).join(" ") || undefined;
    return (
      <div
        key={option.value}
        data-slot="quiz-option"
        data-state={selected ? "selected" : "idle"}
        data-mark={mark ?? undefined}
        className={cn(
          "relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 rounded-lg border bg-background px-3.5 py-3 transition-[background-color,border-color] duration-150 motion-reduce:transition-none @md:grid-cols-[auto_minmax(0,1fr)_auto]",
          mark ? MARK_ROW[mark] : "border-border",
          !checked && !disabled && "hover:bg-muted/50 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/40",
          disabled && "opacity-60",
        )}
      >
        {several ? (
          <Checkbox
            id={id}
            checked={selected}
            disabled={disabled}
            aria-describedby={described}
            aria-readonly={checked || undefined}
            onCheckedChange={(on) => choose(on === true ? [...chosen, option.value] : chosen.filter((item) => item !== option.value))}
            className="relative z-10 col-start-1 row-start-1 mt-0.5"
          />
        ) : (
          <RadioGroupItem id={id} value={option.value} disabled={disabled} aria-describedby={described} className="relative z-10 col-start-1 row-start-1 mt-0.5" />
        )}
        {/* The label stretches over the whole row, so a tap anywhere in it chooses the option; the control itself sits above it and takes its own presses. */}
        <label htmlFor={id} className={cn("col-start-2 row-start-1 text-sm leading-5 [overflow-wrap:anywhere] after:absolute after:inset-0", checked || disabled ? "cursor-default" : "cursor-pointer", mark === "correct" && "font-medium")}>
          {option.label}
        </label>
        {mark ? (
          <span id={markId} className={cn("col-start-2 row-start-2 inline-flex items-center gap-1.5 text-xs leading-5 font-medium @md:col-start-3 @md:row-start-1", MARK_INK[mark])}>
            <MarkIcon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
            {text[mark]}
          </span>
        ) : null}
        {showReason ? (
          <p id={reasonId} className="col-start-2 row-start-3 text-xs leading-5 [overflow-wrap:anywhere] text-muted-foreground @md:row-start-2">
            {option.reason}
          </p>
        ) : null}
      </div>
    );
  }

  const list = options.map(renderOption);

  return (
    <div
      ref={setRoot}
      data-slot="quiz-options"
      data-status={checked ? "checked" : "answering"}
      className={cn("@container grid w-full min-w-0 gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs", className)}
      {...props}
    >
      <div id={ids.question} className="text-base leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere] text-balance">
        {question}
      </div>

      {several ? (
        <div role="group" aria-labelledby={ids.question} aria-describedby={ids.hint} className="grid gap-2">
          {list}
        </div>
      ) : (
        <RadioGroup
          value={chosen[0] ?? ""}
          onValueChange={(next) => choose([next])}
          aria-labelledby={ids.question}
          aria-describedby={ids.hint}
          aria-readonly={checked || undefined}
          className="gap-2"
        >
          {list}
        </RadioGroup>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p id={ids.hint} className="flex min-w-0 items-center gap-1.5 text-xs leading-5 text-muted-foreground">
          {checked ? <IconLock aria-hidden="true" className="size-3.5 shrink-0" /> : null}
          {checked ? text.locked : several ? text.hintMany : text.hintOne}
        </p>
        {!checked || allowRetry ? (
          <Button type="button" variant={checked ? "outline" : "default"} disabled={!checked && (disabled || chosen.length === 0)} onClick={checked ? retry : check}>
            {checked ? <IconRefresh aria-hidden="true" /> : null}
            {checked ? text.tryAgain : text.check}
          </Button>
        ) : null}
      </div>

      {name ? chosen.map((item) => <input key={item} type="hidden" name={name} value={item} />) : null}
      <p role="status" aria-live="polite" className="sr-only">
        {spoken}
      </p>
    </div>
  );
}
