"use client";

import { Fragment, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCopyAnimated } from "@rhs-ui/icons/animated/copy";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type CopyStatus = "idle" | "pending" | "copied" | "manual";

export interface CopyableTextProps extends Omit<ComponentProps<"button">, "value" | "children" | "title" | "onCopy" | "onError"> {
  /** The text that lands on the clipboard. */
  value: string;
  /** What the value is, in a word or two: "order id", "email". The button is named "Copy order id: ORD-1048", so a screen reader hears what a press does. */
  label?: string;
  /** What is written on the page when it should differ from `value`: seven characters of a hash, an id without its prefix. The tooltip shows the whole value. */
  display?: string;
  /** Set the text in the mono font, for ids, hashes and keys. */
  mono?: boolean;
  /** What happens when the text is wider than its box. `false` (the default) wraps it anywhere, `true` or "end" cuts it with an ellipsis, and "middle" cuts the middle and keeps the end visible. */
  truncate?: boolean | "end" | "middle";
  /** With `truncate="middle"`: how many characters at the end stay visible. Default 6. */
  tail?: number;
  /** How long the check stays, in milliseconds. Pressing again restarts it. Default 1600. */
  timeout?: number;
  /** Called with the text once it is on the clipboard. */
  onCopy?: (value: string) => void;
  /** Called when the browser refused to copy, just before the text is selected for the keyboard. */
  onError?: (error: unknown) => void;
  /** Show a state without pressing the button: for a preview, or when the copying happens elsewhere. `copied` draws the check, `manual` selects the text and asks for the keys. The button then only displays it. */
  status?: "idle" | "copied" | "manual";
  /** The words, for another language. `manual` is what the tooltip says when the text is selected and the person has to press the keys; it defaults to "Press Ctrl C" ("Press ⌘ C" on a Mac). */
  labels?: { copy?: string; copied?: string; manual?: string };
}

/** The old way, for pages where the Clipboard API is blocked: a hidden textarea, selected, and execCommand. */
function legacyCopy(text: string, near: HTMLElement | null): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  Object.assign(area.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
  // Next to the button, so a dialog's focus trap does not push focus away from it.
  (near?.parentElement ?? document.body).appendChild(area);
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  area.select();
  area.setSelectionRange(0, text.length); // iOS ignores select() alone
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  active?.focus({ preventScroll: true });
  return copied;
}

/** Splits at a code point, so an emoji is never cut in half. */
function splitEnd(text: string, tail: number): [string, string] {
  const chars = Array.from(text);
  const cut = Math.max(0, chars.length - Math.max(1, Math.floor(tail)));
  return [chars.slice(0, cut).join(""), chars.slice(cut).join("")];
}

/** How many of the last characters never part from the icon: enough that the last line is never an icon beside one letter, few enough that a long token still breaks anywhere and a narrow box does not overflow. */
const GLUED = 3;

/**
 * Where a value may break when it wraps: after a slash, a dot or an @, so an email or a link splits at a sensible place instead of anywhere. A token such
 * as a key has none of those and breaks wherever it has to. `<wbr>` adds no character, so what is selected and copied does not change.
 * `tail` is drawn right after the last character and cannot be parted from it, so a wrapped value keeps its icon on the last line, beside its last word,
 * and not stranded at the end of the first.
 */
function breakable(text: string, tail?: ReactNode): ReactNode {
  const parts = text.split(/(?<=[/.@])/);
  return parts.map((part, index) => {
    if (!tail || index < parts.length - 1) {
      return (
        <Fragment key={`${index}-${part}`}>
          {index > 0 ? <wbr /> : null}
          {part}
        </Fragment>
      );
    }
    // The last part: the last few characters hold the icon, and the rest of it breaks like any other text.
    const chars = Array.from(part);
    const cut = Math.max(0, chars.length - GLUED);
    return (
      <Fragment key={`${index}-${part}`}>
        {index > 0 ? <wbr /> : null}
        {chars.slice(0, cut).join("")}
        <span className="whitespace-nowrap">
          {chars.slice(cut).join("")}
          {tail}
        </span>
      </Fragment>
    );
  });
}

/**
 * A value you copy with one click, written into the page where it belongs: an
 * order id, an email, a hash, a tracking number. The text itself is the
 * button, named "Copy order id: ORD-1048", and a small copy icon sits beside
 * it all the time, because a hover-only affordance does not exist on a phone.
 * A press draws the icon into a check for a moment, a tooltip says "Copied"
 * and a screen reader hears it through a polite status. Where the browser
 * refuses to write to the clipboard, the text is selected and the tooltip asks
 * for Ctrl C, so nobody is left with nothing. It is small enough for a table
 * cell or a key-value row: it takes the size of the text around it, and when
 * the text wraps the icon stays with its last word.
 */
export function CopyableText({
  value,
  label,
  display,
  mono = false,
  truncate = false,
  tail = 6,
  timeout = 1600,
  onCopy,
  onError,
  status: forced,
  labels,
  className,
  type = "button",
  onClick,
  ...props
}: CopyableTextProps) {
  const [own, setStatus] = useState<CopyStatus>("idle");
  // A shown state wins over the one a press made, so a preview stays what it was told to be.
  const status = forced ?? own;
  const [apple, setApple] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<number>(undefined);
  const button = useRef<HTMLButtonElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  // Which key to name in the fallback is only known in the browser, so it is worked out after mount and the server and the browser agree.
  useEffect(() => {
    setApple(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    return () => window.clearTimeout(timer.current);
  }, []);

  // The fallback: the text is selected, and what is selected is what Ctrl C copies.
  useEffect(() => {
    if (status !== "manual") return;
    const node = text.current;
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    return () => {
      if (selection && selection.anchorNode && node.contains(selection.anchorNode)) selection.removeAllRanges();
    };
  }, [status]);

  const settle = (next: CopyStatus, hold: number) => {
    window.clearTimeout(timer.current);
    setStatus(next);
    timer.current = window.setTimeout(() => setStatus("idle"), hold);
  };

  async function copy() {
    // A press closes a tooltip; being pending keeps it open until it can say how it went.
    window.clearTimeout(timer.current);
    setStatus("pending");
    try {
      await navigator.clipboard.writeText(value);
      settle("copied", timeout);
      onCopy?.(value);
    } catch (error) {
      if (legacyCopy(value, button.current)) {
        settle("copied", timeout);
        onCopy?.(value);
        return;
      }
      onError?.(error);
      settle("manual", Math.max(timeout, 6000));
    }
  }

  if (!value) {
    return (
      <span data-slot="copyable-text" data-empty="true" className={cn("text-muted-foreground", className)}>
        {display ?? "–"}
      </span>
    );
  }

  const copied = status === "copied";
  const manual = status === "manual";
  const verb = labels?.copy ?? "Copy";
  const action = label ? `${verb} ${label}` : verb;
  const done = labels?.copied ?? "Copied";
  const hint = labels?.manual ?? `Press ${apple ? "⌘" : "Ctrl"} C`;
  // While the person has to copy with the keys, the whole value is written out, so what is selected is what lands on the clipboard.
  const shown = manual ? value : (display ?? value);
  const [start, end] = truncate === "middle" && !manual ? splitEnd(shown, tail) : [shown, ""];
  const split = end !== "" && Array.from(start).length >= 3;
  const more = truncate !== false || (display !== undefined && display !== value);

  const tip = copied ? (
    done
  ) : manual ? (
    hint
  ) : (
    <span className="grid gap-1">
      <span>{action}</span>
      {more ? <span className="font-mono text-[0.6875rem] [overflow-wrap:anywhere] opacity-70">{value}</span> : null}
    </span>
  );

  // Text that wraps carries its icon inside its own flow, after the last character, so the icon follows the last word onto the last line.
  // Text that is cut keeps one line, and the icon sits beside it.
  const inline = truncate === false;
  const icon = (
    <IconCopyAnimated
      active={copied}
      className={cn(
        "text-muted-foreground transition-colors duration-150 motion-reduce:transition-none",
        "group-hover/copy:text-foreground group-focus-visible/copy:text-foreground",
        copied && "text-foreground",
        inline ? "ms-[0.4em] inline-block align-[-0.125em] select-none" : "mt-[calc((1lh-1em)/2)] shrink-0",
      )}
    />
  );

  const control = (
    <button
      ref={button}
      data-slot="copyable-text"
      data-status={status}
      type={type}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) void copy();
      }}
      // The person pressed the keys themselves: say so. After the event, so a re-render cannot cancel the copy.
      onCopy={() => {
        if (status === "manual") {
          window.setTimeout(() => {
            settle("copied", timeout);
            onCopy?.(value);
          }, 0);
        }
      }}
      className={cn(
        "group/copy -mx-[0.3em] inline-flex max-w-full min-w-0 cursor-pointer items-start gap-[0.4em] rounded-[0.3em] px-[0.3em] text-start outline-none",
        "transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
        mono && "font-mono text-[0.875em]",
        className,
      )}
    >
      <span className="sr-only select-none">{`${action}: `}</span>
      <span
        ref={text}
        className={cn("min-w-0", truncate === false && "[overflow-wrap:anywhere]", (truncate === true || truncate === "end") && "truncate", split && "inline-flex")}
      >
        {split ? (
          <>
            <span aria-hidden="true" className="min-w-0 overflow-hidden text-ellipsis whitespace-pre">
              {start}
            </span>
            <span aria-hidden="true" className="max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-pre">
              {end}
            </span>
            <span className="sr-only select-none">{shown}</span>
          </>
        ) : inline ? (
          breakable(shown, icon)
        ) : (
          shown
        )}
      </span>
      {inline ? null : icon}
    </button>
  );

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip open={hovered || status !== "idle"} onOpenChange={setHovered}>
          <TooltipTrigger asChild>{control}</TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span role="status" className="sr-only">
        {copied ? done : manual ? hint : ""}
      </span>
    </>
  );
}
