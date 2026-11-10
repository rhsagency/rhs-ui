"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  ROW_KEYS,
  fill,
  normaliseOptions,
  type LikertMatrixLabels,
  type MatrixOption,
  type MatrixStatement,
  type MatrixValue,
} from "@rhs-ui/application/likert-matrix/matrix";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { LikertMatrixLabels, MatrixOption, MatrixStatement, MatrixValue } from "@rhs-ui/application/likert-matrix/matrix";

export interface LikertMatrixProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The statements to rate, one row each. */
  statements: readonly MatrixStatement[];
  /** The scale every statement shares, first point first. A plain word is its own label and value; `{ value, label }` keeps them apart. */
  options: readonly (string | MatrixOption)[];
  /** The chosen point of each statement, by statement id, when you control the grid. */
  value?: MatrixValue;
  /** The answers to begin with, when the grid keeps them itself. */
  defaultValue?: MatrixValue;
  /** Called with every answer whenever one changes. */
  onValueChange?: (value: MatrixValue) => void;
  /** Every statement needs an answer. A form the grid sits in refuses to submit until each has one, focus moves to the first that has not, and rows without an answer are flagged. Default false. */
  requireAll?: boolean;
  /** Flag the rows without an answer now, for a submit of your own. Without it the grid waits for a submit of the form it is in. */
  showErrors?: boolean;
  /** What the grid is about: "How did the last quarter feel?". It names the table and the list of cards. */
  legend: ReactNode;
  /** A line under the legend that says more. */
  description?: ReactNode;
  /** The grid's name for a plain form submit: one field `<name>.<statement id>` with the chosen value. */
  name?: string;
  /** Turn the whole grid off. */
  disabled?: boolean;
  /** The words the grid says, for translation. */
  labels?: LikertMatrixLabels;
}

/** The ink of the error headline. Plain destructive red is 4.4:1 on the pale red of the error box, short of AA, so it is pulled a little toward the text colour (darker in light mode, lighter in dark mode). */
const ERROR_INK = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]";

/** The tone of the header row. It is opaque, so the statement column can hold its place over the points that scroll under it, and it is the same across the whole row. */
const HEADER = "bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)]";

/** The circle of a point: a ring at rest, filled when chosen, ringed in the focus colour for the keyboard. It lives inside a button named `radio`. */
const CIRCLE =
  "relative grid size-[18px] place-items-center rounded-full border border-muted-foreground bg-background shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none group-hover/radio:border-foreground group-aria-checked/radio:border-primary group-focus-visible/radio:border-ring group-focus-visible/radio:ring-[3px] group-focus-visible/radio:ring-ring/40";

/**
 * Several statements on one scale, the grid of a satisfaction or opinion
 * survey. On a wide container it is a real table: the scale as visible column
 * headers, each statement a row header, one point per cell. Each row has one tab
 * stop and the arrow keys move and choose inside it, like a radio group, and
 * every point is named by its statement and its column ("I know what is
 * expected of me, Agree, 4 of 5"). The table scrolls inside its own frame with
 * the statement column held in place, so a long scale never hides which row you
 * are in. On a narrow container it turns into one card per statement with the
 * scale as a vertical radio list, so nobody scrolls sideways to find an answer.
 * With `requireAll` a form the grid sits in refuses to submit until every
 * statement is answered; focus then goes to the first that is not, the missing
 * rows say "Choose one" in text, and an error lists them with a link to each.
 */
export function LikertMatrix({ statements, options: scale, value, defaultValue, onValueChange, requireAll = false, showErrors = false, legend, description, name, disabled, labels, className, ...props }: LikertMatrixProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const legendId = `${base}-legend`;
  const root = useRef<HTMLDivElement>(null);
  const gate = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState<MatrixValue>(defaultValue ?? {});
  const [attempted, setAttempted] = useState(false);
  const options = normaliseOptions(scale);
  const current = value ?? own;
  const isAnswered = (id: string) => options.some((option) => option.value === current[id]);
  const missing = statements.filter((statement) => !isAnswered(statement.id));
  const answered = statements.length - missing.length;
  const flagging = requireAll && (attempted || showErrors);
  const flagged = (id: string) => flagging && !isAnswered(id);

  // A grid that needs every answer tells the form it is invalid while one is missing: the form will not submit, the browser's own bubble is
  // cancelled, and the rows and the error speak instead.
  useEffect(() => {
    gate.current?.setCustomValidity(requireAll && missing.length > 0 ? text.gate : "");
  }, [requireAll, missing.length, text.gate]);

  function choose(id: string, next: string) {
    if (disabled) return;
    const merged = { ...current, [id]: next };
    if (value === undefined) setOwn(merged);
    onValueChange?.(merged);
  }

  /** Focus the first point of a row, in whichever of the two layouts is showing. */
  function focusRow(id: string) {
    const points = [...(root.current?.querySelectorAll<HTMLElement>(`[data-statement="${CSS.escape(id)}"] [role="radio"]`) ?? [])];
    points.find((point) => point.offsetParent !== null)?.focus();
  }

  /** Arrow keys move and choose inside a row, the way a radio group does. */
  function onRowKey(event: KeyboardEvent<HTMLTableRowElement>) {
    const key = event.key;
    const point = event.target as HTMLElement;
    if (!(ROW_KEYS as readonly string[]).includes(key) || point.getAttribute("role") !== "radio") return;
    const points = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')];
    const index = points.indexOf(point as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const forward = key === "ArrowRight" || key === "ArrowDown";
    const target = points[key === "Home" ? 0 : key === "End" ? points.length - 1 : (index + (forward ? 1 : -1) + points.length) % points.length];
    target?.focus();
    target?.click();
  }

  return (
    <div ref={root} data-slot="likert-matrix" className={cn("@container grid w-full min-w-0 gap-3", className)} {...props}>
      <div className="grid gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p id={legendId} className="text-sm leading-5 font-medium">
            {legend}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{fill(text.answered, { answered, total: statements.length })}</p>
        </div>
        {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <div role="status" aria-live="polite" className="empty:hidden">
        {flagging && missing.length > 0 ? (
          <div data-slot="likert-matrix-error" className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3.5 py-3">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="grid min-w-0 gap-1.5 text-sm leading-5">
              <p className={cn("font-medium", ERROR_INK)}>{missing.length === 1 ? text.missingOne : fill(text.missingMany, { count: missing.length })}</p>
              <ul className="grid gap-1">
                {missing.map((statement) => (
                  <li key={statement.id}>
                    <button type="button" onClick={() => focusRow(statement.id)} className="rounded-sm text-left underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                      {statement.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Wide: a real table, scrolling inside its own frame with the statements held in place. */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-xs @xl:block">
        <Table aria-labelledby={legendId} className="table-fixed border-separate border-spacing-0" style={{ minWidth: `calc(13rem + ${options.length} * 4.25rem)` }}>
          {/* Fixed columns: the statements take two fifths of a wide container (at least 13rem) and the points share the rest equally, whatever their labels say. */}
          <colgroup>
            <col className="w-52 @3xl:w-2/5" />
            {options.map((option) => (
              <col key={option.value} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className={cn("sticky left-0 z-10 h-auto border-r border-b border-border px-4 py-3 text-xs", HEADER)}>
                {text.statement}
              </TableHead>
              {options.map((option, column) => (
                <TableHead key={option.value} scope="col" id={`${base}-c${column}`} className={cn("h-auto border-b border-border px-2 py-3 text-center text-xs leading-4 whitespace-normal", HEADER)}>
                  {option.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr:last-child>*]:border-b-0">
            {statements.map((statement, row) => (
              <TableRow key={statement.id} data-statement={statement.id} onKeyDown={onRowKey} className="hover:bg-transparent">
                <TableHead
                  scope="row"
                  id={`${base}-r${row}`}
                  className={cn(
                    "sticky left-0 z-10 h-auto border-r border-b border-l-[3px] border-border border-l-transparent bg-card px-4 py-3.5 text-left text-sm leading-5 font-normal whitespace-normal text-pretty text-foreground",
                    flagged(statement.id) && "border-l-destructive",
                  )}
                >
                  {statement.text}
                  {flagged(statement.id) ? (
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                      {text.chooseOne}
                    </span>
                  ) : null}
                </TableHead>
                {options.map((option, column) => {
                  const checked = current[statement.id] === option.value;
                  return (
                    <TableCell key={option.value} className="border-b border-border p-0">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-labelledby={`${base}-r${row} ${base}-c${column}`}
                        aria-posinset={column + 1}
                        aria-setsize={options.length}
                        tabIndex={checked || (nobodyInRow(current[statement.id], options) && column === 0) ? 0 : -1}
                        disabled={disabled}
                        onClick={() => choose(statement.id, option.value)}
                        className="group/radio grid min-h-14 w-full place-items-center outline-none transition-colors duration-150 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        <span aria-hidden="true" className={CIRCLE}>
                          <span className="size-2 scale-0 rounded-full bg-primary transition-transform duration-150 group-aria-checked/radio:scale-100 motion-reduce:transition-none" />
                        </span>
                      </button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Narrow: one card per statement, the scale as a vertical radio list. */}
      <ol aria-labelledby={legendId} role="list" className="grid gap-3 @xl:hidden">
        {statements.map((statement, row) => (
          <li key={statement.id} data-statement={statement.id} className={cn("rounded-xl border bg-card p-4 shadow-xs", flagged(statement.id) ? "border-destructive/50" : "border-border")}>
            <p id={`${base}-k${row}`} className="text-sm leading-5 font-medium">
              {statement.text}
            </p>
            {flagged(statement.id) ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                {text.chooseOne}
              </p>
            ) : null}
            <RadioGroup value={current[statement.id] ?? ""} onValueChange={(next) => choose(statement.id, next)} disabled={disabled} aria-labelledby={`${base}-k${row}`} className="-mx-1 mt-2 gap-0.5">
              {options.map((option, column) => (
                <Label
                  key={option.value}
                  htmlFor={`${base}-k${row}-${column}`}
                  className="min-h-11 cursor-pointer gap-3 rounded-lg px-3 py-2 text-sm leading-5 font-normal transition-colors duration-150 hover:bg-muted/60 has-[[data-state=checked]]:bg-muted has-[[data-state=checked]]:font-medium motion-reduce:transition-none"
                >
                  <RadioGroupItem id={`${base}-k${row}-${column}`} value={option.value} />
                  {option.label}
                </Label>
              ))}
            </RadioGroup>
          </li>
        ))}
      </ol>

      {name ? statements.map((statement) => <input key={statement.id} type="hidden" name={`${name}.${statement.id}`} value={current[statement.id] ?? ""} disabled={disabled} />) : null}
      <input
        ref={gate}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        disabled={disabled}
        className="sr-only"
        onInvalid={(event) => {
          event.preventDefault();
          setAttempted(true);
          const first = missing[0];
          if (first) focusRow(first.id);
        }}
      />
    </div>
  );
}

/** Whether a row has no chosen point yet: the first point then takes the tab stop. */
function nobodyInRow(answer: string | undefined, options: readonly MatrixOption[]): boolean {
  return !options.some((option) => option.value === answer);
}
