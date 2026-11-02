"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type UIEvent } from "react";

import { IconAlertCircle, IconBraces, IconCheck, IconWand } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { countLines, indent, newline, outdent, type Edit } from "@rhs-ui/primitives/code-field/edit";
import { formatJson, positionOf, validateJson, type CodeProblem, type CodeValidation } from "@rhs-ui/primitives/code-field/json";
import { DEFAULT_LABELS, type CodeFieldLabels } from "@rhs-ui/primitives/code-field/labels";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export type { CodeProblem, CodeValidation } from "@rhs-ui/primitives/code-field/json";
export type { CodeFieldLabels } from "@rhs-ui/primitives/code-field/labels";

export type CodeLanguage = "json" | "plain";

export interface CodeFieldProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "children" | "rows" | "wrap"> {
  /** The text, when you control it. */
  value?: string;
  /** The text to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the whole text on every change, whether it was typed, pasted, indented or formatted. */
  onValueChange?: (value: string) => void;
  /** `json` checks the text after a pause and offers a Format button; `plain` is for CSS, a webhook body or any other text. Default plain. */
  language?: CodeLanguage;
  /** How many lines are visible before it scrolls. Default 10. */
  rows?: number;
  /** Called with the verdict on the text each time the pause after typing ends (`json` only): valid, or the first mistake with its line and column. */
  onValidate?: (result: CodeValidation) => void;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<CodeFieldLabels>;
}

/** Error text on the tinted bars of this field: a little of the theme's ink in the red keeps it past 4.5:1 where the plain token falls just short. */
const ERROR = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_14%)]";
/** Fixed pixel metrics, so the line numbers stay on their lines whatever the page's font size. */
const LINE = 22;
const PAD = 10;
/** How long the typing has to stop before the text is checked. */
const PAUSE = 450;

/**
 * A text box for code without an editor library: a monospace face, a gutter of
 * line numbers that scrolls with the text, Tab and Shift+Tab to indent and
 * outdent the selection, and Enter that keeps the indentation. Tab would trap a
 * keyboard user, so Escape followed by Tab leaves the field, and a hint under
 * it says so. With `language="json"` the text is checked after a pause and the
 * first mistake is named with its line and column ("Unexpected token } at line
 * 4, column 3"), the line is marked in the gutter and across the text, and a
 * Format button pretty-prints valid JSON without touching a single digit. A thin
 * row shows line, column and length. There is deliberately no syntax
 * highlighting: the gutter, the indentation and the messages are the value.
 * The helpers `validateJson` and `formatJson` live in `code-field/json`.
 */
export function CodeField({
  value,
  defaultValue = "",
  onValueChange,
  language = "plain",
  rows = 10,
  onValidate,
  labels: labelOverrides,
  readOnly,
  disabled,
  maxLength,
  className,
  onKeyDown,
  onSelect,
  onScroll,
  onFocus,
  onBlur,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: CodeFieldProps) {
  const uid = useId();
  const hintId = `${uid}-hint`;
  const problemId = `${uid}-problem`;
  const json = language === "json";
  const labels: CodeFieldLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const area = useRef<HTMLTextAreaElement | null>(null);
  // Where the selection should be once the text has been written, when the browser's own editing could not be used.
  const pending = useRef<[number, number] | null>(null);
  const [caret, setCaret] = useState({ start: 0, end: 0, backward: false });
  const [view, setView] = useState({ top: 0, height: rows * LINE + PAD });
  const [focused, setFocused] = useState(false);
  // After Escape the next Tab moves the focus instead of indenting.
  const [escaped, setEscaped] = useState(false);
  const [said, setSaid] = useState("");
  const [settled, setSettled] = useState<{ text: string; result: CodeValidation } | null>(() => (json ? { text, result: validateJson(text) } : null));
  const announced = useRef<string | null>(null);
  const report = useRef(onValidate);

  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLTextAreaElement | null) => {
      area.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    report.current = onValidate;
  });

  // The text is checked once the typing pauses.
  useEffect(() => {
    if (!json || settled?.text === text) return;
    const timer = window.setTimeout(() => setSettled({ text, result: validateJson(text) }), PAUSE);
    return () => window.clearTimeout(timer);
  }, [json, text, settled]);

  const result = json ? (settled?.result ?? null) : null;

  useEffect(() => {
    if (!result) return;
    report.current?.(result);
    const sentence = result.valid ? (result.empty ? "" : labels.valid) : result.message;
    // The first verdict is what was there from the start; only a change is news.
    if (announced.current !== null && announced.current !== sentence) setSaid(sentence);
    announced.current = sentence;
  }, [result]);

  // What a screen reader was told stays only while it is news; the region is read as a whole.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  // The gutter and the marked line need to know how much of the text is in view.
  useEffect(() => {
    const element = area.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setView((now) => (now.height === element.clientHeight ? now : { ...now, height: element.clientHeight })));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function track() {
    const node = area.current;
    if (!node) return;
    setCaret((now) =>
      now.start === node.selectionStart && now.end === node.selectionEnd ? now : { start: node.selectionStart, end: node.selectionEnd, backward: node.selectionDirection === "backward" },
    );
  }

  useLayoutEffect(() => {
    const selection = pending.current;
    if (!selection) return;
    pending.current = null;
    area.current?.setSelectionRange(selection[0], selection[1]);
    track();
  });

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function apply(edit: Edit) {
    const node = area.current;
    if (!node) return;
    const next = text.slice(0, edit.from) + edit.text + text.slice(edit.to);
    if (maxLength !== undefined && next.length > maxLength && next.length > text.length) return;
    node.focus();
    node.setSelectionRange(edit.from, edit.to);
    // insertText and delete are edits the browser knows about, so Ctrl or Cmd+Z undoes an indent the way it undoes typing.
    let done = false;
    try {
      done = edit.text === "" ? document.execCommand("delete") : document.execCommand("insertText", false, edit.text);
    } catch {
      done = false;
    }
    if (done) {
      node.setSelectionRange(edit.start, edit.end);
      track();
    } else {
      pending.current = [edit.start, edit.end];
      write(next);
    }
  }

  function goTo(problem: CodeProblem) {
    const node = area.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.setSelectionRange(problem.offset, problem.offset);
    node.scrollTop = Math.max(0, (problem.line - 1) * LINE - node.clientHeight / 2 + LINE);
    track();
  }

  function format() {
    const formatted = formatJson(text);
    if (formatted === null) {
      // Do not wait for the pause: whoever pressed Format wants the reason now.
      const now = validateJson(text);
      setSettled({ text, result: now });
      if (!now.valid) goTo(now);
      return;
    }
    if (formatted === text) {
      setSaid(labels.saidAlready);
      return;
    }
    apply({ from: 0, to: text.length, text: formatted, start: 0, end: 0 });
    setSaid(labels.saidFormatted);
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing || readOnly || disabled) return;
    const { key } = event;
    // A modifier on its own is the first half of Shift+Tab, not a key that ends the escape.
    if (key === "Shift" || key === "Control" || key === "Alt" || key === "Meta") return;
    if (key === "Escape") {
      if (!escaped) {
        setEscaped(true);
        setSaid(labels.saidEscaped);
      }
      return;
    }
    const node = event.currentTarget;
    if (key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // The Tab right after Escape is the browser's own.
      if (escaped) {
        setEscaped(false);
        return;
      }
      event.preventDefault();
      const edit = event.shiftKey ? outdent(text, node.selectionStart, node.selectionEnd) : indent(text, node.selectionStart, node.selectionEnd);
      if (edit) apply(edit);
      return;
    }
    if (escaped) setEscaped(false);
    if (key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      apply(newline(text, node.selectionStart, node.selectionEnd));
    }
  }

  const lineCount = useMemo(() => countLines(text), [text]);
  const here = useMemo(() => positionOf(text, caret.backward ? caret.start : caret.end), [text, caret]);
  const problem = result && !result.valid ? result : null;
  const selected = caret.end - caret.start;
  const digits = Math.max(2, String(lineCount).length);
  const first = Math.max(0, Math.floor(view.top / LINE) - 1);
  const last = Math.min(lineCount, first + Math.ceil(view.height / LINE) + 3);
  const current = focused && caret.start === caret.end ? here.line : 0;
  const bandTop = (line: number) => PAD + (line - 1) * LINE - view.top;
  const named = props.id !== undefined || ariaLabel !== undefined || labelledBy !== undefined;

  const gutter: ReactNode[] = [];
  for (let index = first; index < last; index += 1) {
    const line = index + 1;
    const marked = problem?.line === line;
    gutter.push(
      <div
        key={line}
        data-problem={marked || undefined}
        className={cn("flex h-[22px] items-center justify-end gap-1.5 pr-2.5 pl-2 tabular-nums", marked ? cn("bg-destructive/10 font-semibold", ERROR) : line === current && "font-medium text-foreground")}
      >
        {marked ? <span className="size-1.5 shrink-0 rounded-full bg-destructive" /> : null}
        <span>{line}</span>
      </div>,
    );
  }

  return (
    <div data-slot="code-field" className={cn("w-full min-w-0", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
          "has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/40",
          disabled && "opacity-50",
        )}
      >
        {json ? (
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 py-1 pr-1.5 pl-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <IconBraces aria-hidden="true" className="size-3.5" />
              {labels.languageJson}
            </span>
            {readOnly ? null : (
              <Button type="button" variant="ghost" size="sm" disabled={disabled || text.trim() === ""} onClick={format} className="h-7 gap-1.5 px-2 text-xs">
                <IconWand aria-hidden="true" className="size-3.5" />
                {labels.format}
              </Button>
            )}
          </div>
        ) : null}
        <div className="flex min-w-0 items-stretch">
          <div aria-hidden="true" className="relative shrink-0 overflow-hidden border-r border-border bg-muted/40 font-mono text-xs text-muted-foreground select-none" style={{ width: `calc(${digits}ch + 1.75rem)` }}>
            {/* The numbers are clipped to the height of the text, so the strip under the last line stays empty. */}
            <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: view.height }}>
              <div style={{ transform: `translateY(${PAD + first * LINE - view.top}px)` }}>{gutter}</div>
            </div>
          </div>
          {/* The bottom breathing room is outside the textarea: padding inside it would show the top of the next line. */}
          <div className="relative flex min-w-0 flex-1 cursor-text pb-[10px]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: view.height }}>
              {current > 0 && current !== problem?.line && bandTop(current) > -LINE && bandTop(current) < view.height ? (
                <div className="absolute inset-x-0 h-[22px] bg-foreground/[0.04]" style={{ top: bandTop(current) }} />
              ) : null}
              {problem && bandTop(problem.line) > -LINE && bandTop(problem.line) < view.height ? <div className="absolute inset-x-0 h-[22px] bg-destructive/10" style={{ top: bandTop(problem.line) }} /> : null}
            </div>
            <Textarea
              {...props}
              ref={attach}
              rows={rows}
              wrap="off"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              readOnly={readOnly}
              disabled={disabled}
              maxLength={maxLength}
              value={text}
              aria-label={named ? ariaLabel : json ? labels.jsonName : labels.codeName}
              aria-labelledby={labelledBy}
              aria-invalid={problem ? true : undefined}
              aria-describedby={[describedBy, readOnly || disabled ? "" : hintId, problem ? problemId : ""].filter(Boolean).join(" ") || undefined}
              onChange={(event) => {
                write(event.target.value);
                track();
              }}
              onKeyDown={keyDown}
              onSelect={(event) => {
                onSelect?.(event);
                track();
              }}
              onFocus={(event) => {
                onFocus?.(event);
                setFocused(true);
                track();
              }}
              onBlur={(event) => {
                onBlur?.(event);
                setFocused(false);
                setEscaped(false);
              }}
              onScroll={(event: UIEvent<HTMLTextAreaElement>) => {
                onScroll?.(event);
                // Read now: by the time the updater runs the event no longer has its target.
                const top = event.currentTarget.scrollTop;
                setView((now) => (now.top === top ? now : { ...now, top }));
              }}
              className="relative block min-w-0 flex-1 resize-y overflow-auto field-sizing-fixed max-h-none min-h-0 rounded-none border-0 bg-transparent px-3 pt-[10px] pb-0 font-mono text-[13px] leading-[22px] whitespace-pre shadow-none [tab-size:2] focus-visible:border-0 focus-visible:ring-0 disabled:opacity-100"
            />
          </div>
        </div>
        {problem ? (
          <div id={problemId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-border bg-destructive/5 px-3 py-2 text-xs">
            <p className={cn("flex min-w-0 items-start gap-1.5", ERROR)}>
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{problem.message}</span>
            </p>
            <button
              type="button"
              onClick={() => goTo(problem)}
              className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              {labels.goTo(problem.line)}
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground tabular-nums">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{labels.position(here.line, here.column, selected)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{labels.characters(text.length)}</span>
          </p>
          {result ? (
            result.valid ? (
              <span className={cn("inline-flex items-center gap-1", !result.empty && "text-foreground")}>
                {result.empty ? null : <IconCheck aria-hidden="true" className="size-3.5" />}
                {result.empty ? labels.empty : labels.valid}
              </span>
            ) : (
              <span className={cn("inline-flex items-center gap-1 font-medium", ERROR)}>
                <IconAlertCircle aria-hidden="true" className="size-3.5" />
                {labels.invalid}
              </span>
            )
          ) : null}
        </div>
      </div>
      {readOnly || disabled ? null : (
        <p id={hintId} className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          {escaped ? (
            <span className="font-medium text-foreground">{labels.hintEscaped}</span>
          ) : (
            <>
              <Kbd>Tab</Kbd>
              <span>{labels.hintIndents}</span>
              <Kbd>Esc</Kbd>
              <span>{labels.hintThen}</span>
              <Kbd>Tab</Kbd>
              <span>{labels.hintLeaves}</span>
            </>
          )}
        </p>
      )}
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
