"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentProps, type MouseEvent, type ReactNode, type UIEvent } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { analyse, countLines, DEFAULT_LABELS, Kind, lineRange, pasteAsLines, withoutKind, type Analysis, type AnalyseOptions, type BulkPasteLabels } from "@rhs-ui/primitives/bulk-paste-field/lines";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export type { BulkPasteLabels } from "@rhs-ui/primitives/bulk-paste-field/lines";

export interface BulkPasteFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The text, one item per line, when you control it. */
  value?: string;
  /** The text to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the text on every change, and when a tidy action rewrites it. */
  onValueChange?: (text: string) => void;
  /** Called with the clean list (normalised, valid, each once, in order, up to `max`) after a pause in the typing, and whenever a tidy action changes it. */
  onItemsChange?: (items: string[]) => void;
  /** Your check of a line, given the normalised line. Return true or nothing when it is fine, false for the default reason, or the reason in words ("Not a Northwind address"). A change to the check is picked up on the next edit. */
  validate?: (line: string) => boolean | string | void;
  /** The line as it is compared for duplicates and listed: trim and lower-case an address, strip a protocol. Default: trimmed. */
  normalise?: (line: string) => string;
  /** The most valid items. Lines past it are counted as over the limit and can be dropped in one click. */
  max?: number;
  /** The name of the field, shown above it. */
  label: string;
  /** Keep `label` for assistive technology only. */
  hideLabel?: boolean;
  /** What the empty field says. Line breaks are kept. */
  placeholder?: string;
  /** How many lines are visible before it scrolls. Default 8. */
  rows?: number;
  /** The field's name for a plain form submit: the text as it is. */
  name?: string;
  /** Dim the field and stop it responding. */
  disabled?: boolean;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<BulkPasteLabels>;
}

/** Fixed pixel metrics, so the line numbers stay on their lines whatever the page's font size. */
const LINE = 24;
const PAD = 8;
/** How long the typing has to stop before the summary is worked out again. */
const PAUSE = 350;
const FOLDED = 5;
const LISTED = 100;

/** A part of the summary with its number in weight: "38 valid". */
function Part({ text }: { text: string }) {
  const found = /^([\d.,]+)(.*)$/.exec(text);
  if (!found) return text;
  return (
    <>
      <span className="font-medium text-foreground tabular-nums">{found[1]}</span>
      {found[2]}
    </>
  );
}

/**
 * Paste a list of emails, SKUs or URLs and see what was understood. One item
 * per line, checked with a validator you pass; under the field a summary reads
 * "38 valid, 2 invalid, 5 duplicates", and the lines that need attention are
 * listed with their number and the reason, each a button that jumps to the
 * line. Remove duplicates and Remove invalid tidy the text in one click, keep
 * the order, and can be undone. A paste with commas, semicolons or tabs becomes
 * one item per line, so a column from a spreadsheet and a comma list both work.
 * It stays a plain textarea (with line numbers that follow the scrolling) rather
 * than chips, so it stays fast with thousands of lines, and the summary is a
 * polite live region that updates after a pause, not on every key.
 */
export function BulkPasteField({
  value,
  defaultValue = "",
  onValueChange,
  onItemsChange,
  validate,
  normalise,
  max,
  label,
  hideLabel = false,
  placeholder = "One item per line",
  rows = 8,
  name,
  disabled,
  labels: labelOverrides,
  className,
  ...props
}: BulkPasteFieldProps) {
  const id = useId();
  const areaId = `${id}-area`;
  const summaryId = `${id}-summary`;
  const panelId = `${id}-panel`;
  const labels: BulkPasteLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const area = useRef<HTMLTextAreaElement>(null);
  // The latest checks, read when the pause ends: an inline validator changes identity on every render and must not restart the clock.
  const options = useRef<AnalyseOptions>({});
  const [settled, setSettled] = useState<Analysis>(() => analyse(text, { validate, normalise, max, labels }));
  const analysed = useRef({ text, max });
  const [view, setView] = useState({ top: 0, height: rows * LINE + PAD });
  const [expanded, setExpanded] = useState(false);
  const [undo, setUndo] = useState<{ text: string; message: string } | null>(null);
  const emitted = useRef<string | null>(null);
  const onItems = useRef(onItemsChange);

  useEffect(() => {
    options.current = { validate, normalise, max, labels };
    onItems.current = onItemsChange;
  });

  // The summary, the panel and the line marks are worked out once the typing pauses.
  useEffect(() => {
    if (analysed.current.text === text && analysed.current.max === max) return;
    const timer = window.setTimeout(() => {
      analysed.current = { text, max };
      setSettled(analyse(text, options.current));
    }, PAUSE);
    return () => window.clearTimeout(timer);
  }, [text, max]);

  // The clean list is handed over when it changes, not on every key.
  useEffect(() => {
    const key = settled.items.join("\n");
    if (emitted.current === null && settled.items.length === 0) {
      emitted.current = key;
      return;
    }
    if (emitted.current === key) return;
    emitted.current = key;
    onItems.current?.(settled.items);
  }, [settled]);

  // The line numbers need to know how much of the text is in view.
  useEffect(() => {
    const element = area.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setView((now) => (now.height === element.clientHeight ? now : { ...now, height: element.clientHeight })));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function change(event: ChangeEvent<HTMLTextAreaElement>) {
    setUndo(null);
    write(event.target.value);
  }

  function paste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const converted = pasteAsLines(event.clipboardData.getData("text"));
    if (converted === null) return;
    event.preventDefault();
    const element = event.currentTarget;
    // The pasted items start and end on lines of their own: they never get glued to the text on either side of the cursor.
    const before = element.value.slice(0, element.selectionStart);
    const after = element.value.slice(element.selectionEnd);
    const lines = `${before !== "" && !before.endsWith("\n") ? "\n" : ""}${converted}${after !== "" && !after.startsWith("\n") && !converted.endsWith("\n") ? "\n" : ""}`;
    // insertText keeps the browser's own undo history; setRangeText is the fallback where it is not available.
    if (!document.execCommand("insertText", false, lines)) {
      element.setRangeText(lines, element.selectionStart, element.selectionEnd, "end");
      setUndo(null);
      write(element.value);
    }
  }

  /** A tidy action: the lines of one kind go, everything else stays in order, and it can be undone. */
  function tidy(kind: typeof Kind.Duplicate | typeof Kind.Invalid | typeof Kind.Over, said: (count: number) => string) {
    const fresh = analyse(text, options.current);
    const count = kind === Kind.Duplicate ? fresh.duplicates : kind === Kind.Invalid ? fresh.invalid : fresh.over;
    if (count === 0) return;
    const next = withoutKind(text, fresh.kinds, kind);
    write(next);
    analysed.current = { text: next, max };
    setSettled(analyse(next, options.current));
    setUndo({ text, message: said(count) });
    area.current?.focus();
  }

  function restore() {
    if (!undo) return;
    write(undo.text);
    analysed.current = { text: undo.text, max };
    setSettled(analyse(undo.text, options.current));
    setUndo(null);
    area.current?.focus();
  }

  // A press on the strip under the text is a press on the text.
  function pressSpace(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    area.current?.focus();
  }

  function goTo(line: number) {
    const element = area.current;
    const range = lineRange(text, line);
    if (!element || !range) return;
    element.focus({ preventScroll: true });
    element.setSelectionRange(range[0], range[1]);
    element.scrollTop = Math.max(0, (line - 1) * LINE - element.clientHeight / 2 + LINE);
  }

  const lineCount = countLines(text);
  const digits = Math.max(2, String(lineCount).length);
  const first = Math.max(0, Math.floor(view.top / LINE) - 1);
  const last = Math.min(lineCount, first + Math.ceil(view.height / LINE) + 3);
  const problems = settled.invalid + settled.over;
  const total = settled.valid + settled.invalid + settled.duplicates + settled.over;
  const parts = [
    total > 0 ? labels.valid(settled.valid) : "",
    settled.invalid > 0 ? labels.invalid(settled.invalid) : "",
    settled.duplicates > 0 ? labels.duplicates(settled.duplicates) : "",
    settled.over > 0 && max !== undefined ? labels.over(settled.over, max) : "",
  ].filter(Boolean);
  const listed = expanded ? settled.issues.slice(0, LISTED) : settled.issues.slice(0, FOLDED);

  const gutter: ReactNode[] = [];
  for (let index = first; index < last; index += 1) {
    const kind = settled.kinds[index] ?? Kind.Empty;
    gutter.push(
      <div
        key={index}
        data-kind={kind}
        className={cn(
          "flex h-[24px] items-center justify-end gap-1.5 pr-2.5 pl-2 tabular-nums",
          kind === Kind.Invalid && "bg-destructive/10 font-semibold text-destructive",
          kind === Kind.Over && "bg-muted font-medium text-foreground",
          kind === Kind.Duplicate && "text-foreground",
        )}
      >
        {kind === Kind.Invalid ? <span className="size-1.5 shrink-0 rounded-full bg-destructive" /> : null}
        {kind === Kind.Over ? <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground" /> : null}
        {kind === Kind.Duplicate ? <span className="size-1.5 shrink-0 rounded-full border border-muted-foreground" /> : null}
        <span>{index + 1}</span>
      </div>,
    );
  }

  return (
    <div data-slot="bulk-paste-field" className={cn("grid w-full min-w-0 grid-cols-1 gap-2.5", className)} {...props}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={areaId} className={cn(hideLabel && "sr-only")}>
          {label}
        </Label>
        {max !== undefined ? <span className={cn("text-xs text-muted-foreground tabular-nums", settled.over > 0 && "font-medium text-destructive")}>{labels.counter(settled.valid + settled.over, max)}</span> : null}
      </div>
      <div
        className={cn(
          "flex min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150",
          "has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/40",
          "has-[textarea[aria-invalid=true]]:border-destructive has-[textarea[aria-invalid=true]:focus-visible]:ring-destructive/30",
          disabled && "opacity-50",
        )}
      >
        <div aria-hidden="true" className="relative shrink-0 overflow-hidden border-r border-border bg-muted/40 font-mono text-xs text-muted-foreground select-none" style={{ width: `calc(${digits}ch + 1.75rem)` }}>
          {/* The numbers are clipped to the height of the text, so the strip under the last line stays empty. */}
          <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: view.height }}>
            <div style={{ transform: `translateY(${PAD + first * LINE - view.top}px)` }}>{gutter}</div>
          </div>
        </div>
        {/* The bottom breathing room is outside the textarea: padding inside it would show the top of the next line. */}
        <div className="flex min-w-0 flex-1 cursor-text pb-[8px]" onMouseDown={pressSpace}>
          <textarea
            ref={area}
            id={areaId}
            name={name}
            rows={rows}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={text}
            aria-invalid={problems > 0 ? true : undefined}
            aria-describedby={[summaryId, problems > 0 ? panelId : ""].filter(Boolean).join(" ")}
            onChange={change}
            onPaste={paste}
            onScroll={(event: UIEvent<HTMLTextAreaElement>) => {
              // Read now: by the time the updater runs the event no longer has its target.
              const top = event.currentTarget.scrollTop;
              setView((now) => (now.top === top ? now : { ...now, top }));
            }}
            className="relative block min-w-0 flex-1 resize-y overflow-auto bg-transparent px-3 pt-[8px] pb-0 font-mono text-[13px] leading-[24px] whitespace-pre outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <p id={summaryId} role="status" className="min-w-0 text-sm text-muted-foreground">
          {parts.length === 0
            ? labels.empty
            : parts.map((part, index) => (
                <span key={part}>
                  {index > 0 ? ", " : ""}
                  <Part text={part} />
                </span>
              ))}
        </p>
        {total > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={disabled || settled.duplicates === 0} onClick={() => tidy(Kind.Duplicate, labels.removedDuplicates)}>
              {labels.removeDuplicates}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={disabled || settled.invalid === 0} onClick={() => tidy(Kind.Invalid, labels.removedInvalid)}>
              {labels.removeInvalid}
            </Button>
            {settled.over > 0 && max !== undefined ? (
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => tidy(Kind.Over, labels.trimmed)}>
                {labels.trim(max)}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p role="status" className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground empty:hidden">
        {undo ? (
          <>
            <span>{undo.message}</span>
            <button type="button" onClick={restore} className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
              {labels.undo}
            </button>
          </>
        ) : null}
      </p>
      {problems > 0 ? (
        <div id={panelId} className="overflow-hidden rounded-lg border border-border bg-muted/30">
          <p className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-xs font-medium text-foreground">
            <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0 text-destructive" />
            {labels.problems(problems)}
          </p>
          <ul className="relative max-h-56 divide-y divide-border overflow-y-auto">
            {listed.map((issue) => (
              <li key={issue.line}>
                <button
                  type="button"
                  aria-label={`${labels.goToLine(issue.line)}: ${issue.text}. ${issue.reason}`}
                  onClick={() => goTo(issue.line)}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-left text-xs outline-none transition-colors duration-100 hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
                >
                  <Badge variant="outline" className="shrink-0 bg-background font-mono tabular-nums">
                    {labels.line(issue.line)}
                  </Badge>
                  <span className="min-w-0 flex-1 basis-28 truncate font-mono text-foreground">{issue.text}</span>
                  <span className="shrink-0 text-muted-foreground">{issue.reason}</span>
                </button>
              </li>
            ))}
          </ul>
          {settled.issues.length > FOLDED ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
              <button type="button" aria-expanded={expanded} onClick={() => setExpanded((now) => !now)} className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {expanded ? labels.showFewer : labels.showMore(Math.min(settled.issues.length, LISTED) - FOLDED)}
              </button>
              {expanded && settled.issues.length > LISTED ? <span>{labels.andMore(settled.issues.length - LISTED)}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
