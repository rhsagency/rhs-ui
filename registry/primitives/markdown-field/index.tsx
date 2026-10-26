"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconBold, IconCode, IconItalic, IconLink, IconList, IconListOrdered, IconQuote } from "@rhs-ui/icons";
import { applyAction, continueList, type Edit, type MarkdownAction } from "@rhs-ui/primitives/markdown-field/edit";
import { Markdown } from "@rhs-ui/primitives/markdown-field/markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { Toolbar, type ToolbarAction } from "@rhs-ui/primitives/toolbar";
import { cn } from "@/lib/utils";

export type { MarkdownAction } from "@rhs-ui/primitives/markdown-field/edit";

export interface MarkdownFieldProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "rows" | "children"> {
  /** The Markdown, when you control it. It is the plain text that is saved, never HTML. */
  value?: string;
  /** The Markdown to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change of the text, whether it is typed, pasted or made by a button. */
  onValueChange?: (value: string) => void;
  /** The buttons in the toolbar, in this order, and the only shortcuts that work: Ctrl or Cmd with B, I and K are bold, italic and link. Default all seven. */
  toolbar?: readonly MarkdownAction[];
  /** How many lines of text the writing area shows before it grows or scrolls. Default 8. */
  rows?: number;
  /** The tab that is open at the start: "write" (the default), or "preview" for text that is read more often than it is edited. */
  defaultTab?: "write" | "preview";
}

const ALL: readonly MarkdownAction[] = ["bold", "italic", "link", "bulleted-list", "numbered-list", "quote", "code"];

// The buttons that belong together sit together, with a divider between the groups.
const GROUP: Record<MarkdownAction, number> = { bold: 0, italic: 0, link: 0, "bulleted-list": 1, "numbered-list": 1, quote: 1, code: 2 };

const BUTTONS: Record<MarkdownAction, { label: string; icon: ReactNode; key?: string }> = {
  bold: { label: "Bold", icon: <IconBold />, key: "B" },
  italic: { label: "Italic", icon: <IconItalic />, key: "I" },
  link: { label: "Link", icon: <IconLink />, key: "K" },
  "bulleted-list": { label: "Bulleted list", icon: <IconList /> },
  "numbered-list": { label: "Numbered list", icon: <IconListOrdered /> },
  quote: { label: "Quote", icon: <IconQuote /> },
  code: { label: "Code", icon: <IconCode /> },
};

const KEYS: Record<string, MarkdownAction> = { b: "bold", i: "italic", k: "link" };

// The tabs and the buttons are a little smaller than their own defaults, so that both fit in one row of a box of ordinary width.
const TAB = "group-data-[variant=pill]/list:h-7 group-data-[variant=pill]/list:px-2.5";

const SYNTAX = ["**bold**", "_italic_", "[link](url)", "- list", "> quote", "`code`"] as const;

/** One piece of syntax in the hint under the box. */
function Syntax({ token }: { token: string }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-foreground">{token}</code>;
}

/**
 * A writing box for Markdown without an editor library: a textarea with a
 * toolbar (bold, italic, link, bulleted and numbered list, quote, code), and
 * Write and Preview tabs. A button wraps or prefixes the selected text with
 * Markdown syntax, takes it off again when it is already there, and leaves the
 * selection where you can keep typing; Ctrl or Cmd with B, I and K do the same
 * from the keyboard, and Enter in a list starts the next item. Changes go
 * through the browser's own editing, so Undo still works after a button. The
 * preview shows a deliberately small subset as React elements, never as raw
 * HTML, so pasted markup cannot run. The toolbar is one tab stop with arrow
 * keys inside it and comes before the text in the tab order, and a line under
 * the box names the syntax for people who do not know Markdown.
 */
export function MarkdownField({
  value,
  defaultValue = "",
  onValueChange,
  toolbar = ALL,
  rows = 8,
  defaultTab = "write",
  maxLength,
  className,
  disabled,
  onKeyDown,
  ref,
  "aria-describedby": describedBy,
  ...props
}: MarkdownFieldProps) {
  const hintId = useId();
  const [own, setOwn] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">(defaultTab);
  const [command, setCommand] = useState("Ctrl+");
  const [said, setSaid] = useState("");
  const area = useRef<HTMLTextAreaElement | null>(null);
  // Where the selection should be once the text has been written, when the browser's own editing could not be used.
  const pending = useRef<[number, number] | null>(null);
  const text = value ?? own;
  const shown = new Set(toolbar);
  const height = `calc(${rows} * 1.625 * 0.875rem + 1rem)`;

  // The shortcut is written the way the platform writes it. The server cannot know it, so Ctrl is what is rendered first.
  useEffect(() => {
    setCommand(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl+");
  }, []);

  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  useLayoutEffect(() => {
    const selection = pending.current;
    if (!selection) return;
    pending.current = null;
    area.current?.setSelectionRange(selection[0], selection[1]);
  });

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function apply(edit: Edit) {
    const node = area.current;
    if (!node) return;
    const next = text.slice(0, edit.from) + edit.text + text.slice(edit.to);
    if (maxLength !== undefined && next.length > maxLength && next.length > text.length) {
      setSaid(`There is no room for that: the limit is ${maxLength} characters.`);
      node.focus();
      return;
    }
    node.focus();
    node.setSelectionRange(edit.from, edit.to);
    // insertText and delete are edits the browser knows about, so Ctrl or Cmd+Z undoes a button the way it undoes typing.
    let done = false;
    try {
      done = edit.text === "" ? document.execCommand("delete") : document.execCommand("insertText", false, edit.text);
    } catch {
      done = false;
    }
    if (done) {
      node.setSelectionRange(edit.start, edit.end);
    } else {
      pending.current = [edit.start, edit.end];
      write(next);
    }
  }

  function run(action: MarkdownAction) {
    const node = area.current;
    if (!node) return;
    apply(applyAction(action, { value: text, start: node.selectionStart, end: node.selectionEnd }));
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
      const action = KEYS[event.key.toLowerCase()];
      if (action && shown.has(action)) {
        event.preventDefault();
        run(action);
      }
    } else if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const node = event.currentTarget;
      const edit = continueList({ value: text, start: node.selectionStart, end: node.selectionEnd });
      if (edit) {
        event.preventDefault();
        apply(edit);
      }
    }
  }

  const groups: ToolbarAction[][] = [];
  let last = -1;
  for (const action of toolbar) {
    const button = BUTTONS[action];
    if (GROUP[action] !== last) groups.push([]);
    last = GROUP[action];
    groups[groups.length - 1]?.push({
      id: action,
      label: button.key ? `${button.label} (${command}${button.key})` : button.label,
      icon: button.icon,
      disabled,
      onSelect: () => run(action),
    });
  }

  const near = maxLength !== undefined && maxLength - text.length <= Math.max(10, Math.round(maxLength * 0.1));

  return (
    <div data-slot="markdown-field" className={cn("w-full", className)}>
      <Tabs
        value={tab}
        onValueChange={(next) => setTab(next === "preview" ? "preview" : "write")}
        className="gap-0 overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/40"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-border bg-muted/40 px-2 py-1.5">
          <TabsList variant="pill" aria-label="Writing mode" className="h-8 bg-muted/80">
            <TabsTrigger value="write" className={TAB}>
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className={TAB}>
              Preview
            </TabsTrigger>
          </TabsList>
          {tab === "write" && groups.length > 0 ? (
            <Toolbar label="Formatting" groups={groups} className="gap-0.5 rounded-none border-0 bg-transparent p-0 [&_button]:size-7" />
          ) : null}
        </div>
        {/* The text stays mounted behind the preview: it keeps its undo history, and a form still posts it. The panel itself is no tab stop: the text in it is. */}
        <TabsContent value="write" forceMount tabIndex={-1} className="data-[state=inactive]:hidden">
          <Textarea
            ref={(node) => {
              area.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            aria-describedby={[describedBy, hintId].filter(Boolean).join(" ")}
            {...props}
            value={text}
            onChange={(event) => write(event.target.value)}
            onKeyDown={keyDown}
            style={{ minHeight: height }}
            className="max-h-[28rem] min-h-0 resize-y rounded-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:border-0 focus-visible:ring-0"
          />
        </TabsContent>
        <TabsContent value="preview" className="px-3 py-2" style={{ minHeight: height }}>
          {text.trim() ? <Markdown text={text} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
        </TabsContent>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <p id={hintId} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Markdown:</span>
            {SYNTAX.slice(0, -2).map((token) => (
              <Syntax key={token} token={token} />
            ))}
            {/* The last two stay together, so on a narrow screen the hint never ends with one chip on a line of its own. */}
            <span className="flex items-center gap-x-2">
              {SYNTAX.slice(-2).map((token) => (
                <Syntax key={token} token={token} />
              ))}
            </span>
          </p>
          {maxLength !== undefined ? (
            <span aria-live={near ? "polite" : "off"} className={cn("py-0.5 tabular-nums", near && "text-foreground")}>
              {text.length}/{maxLength}
            </span>
          ) : null}
        </div>
      </Tabs>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
