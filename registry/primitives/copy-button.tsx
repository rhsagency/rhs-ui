"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconKeyboard } from "@rhs-ui/icons";
import { IconCopyAnimated } from "@rhs-ui/icons/animated/copy";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type CopyStatus = "idle" | "copied" | "manual";

export interface CopyButtonProps extends Omit<ComponentProps<"button">, "value" | "children" | "onClick" | "onCopy" | "onError" | "title" | "aria-label"> {
  /** What to copy: a string, or a function that returns one (it may be async) and is called when the button is pressed. */
  value: string | (() => string | Promise<string>);
  /** The label before copying. */
  label?: string;
  /** The label after copying, for the length of `timeout`. */
  copiedLabel?: string;
  /** The label shown when the browser refused to copy and the text is selected for the person to copy with the keyboard. Defaults to "Press Ctrl C" ("Press ⌘ C" on a Mac). */
  manualLabel?: string;
  /** Only the icon, with the label in a tooltip. The label is still the accessible name. */
  iconOnly?: boolean;
  /** How long "Copied" stays, in milliseconds. Pressing again restarts it. */
  timeout?: number;
  /** Called with the text once it is on the clipboard. */
  onCopy?: (value: string) => void;
  /** Called when copying failed, before the manual fallback is shown. */
  onError?: (error: unknown) => void;
  /** Show a state without pressing the button: for a preview, or when the copying happens elsewhere. The button then only displays it. */
  status?: CopyStatus;
  /** Any Button variant. */
  variant?: ButtonProps["variant"];
  /** The height: 32, 36 or 44px. With `iconOnly` it is the width too. */
  size?: "sm" | "default" | "lg";
}

/** Writes with the Clipboard API. A promise goes in as a ClipboardItem, so Safari keeps the click's permission while it resolves. */
async function writeClipboard(source: string | Promise<string>): Promise<string> {
  const clipboard = navigator.clipboard;
  if (typeof source === "string") {
    await clipboard.writeText(source);
    return source;
  }
  if (typeof ClipboardItem !== "undefined" && typeof clipboard.write === "function") {
    let text = "";
    const blob = source.then((value) => {
      text = value;
      return new Blob([value], { type: "text/plain" });
    });
    await clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    return text;
  }
  const text = await source;
  await clipboard.writeText(text);
  return text;
}

/** The old way, for pages where the Clipboard API is blocked: a hidden textarea, selected, and execCommand. */
function legacyCopy(text: string, near: HTMLElement | null): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  Object.assign(area.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
  // Next to the button, so a dialog's focus trap does not push focus away from the field.
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

const iconSizes = { sm: "icon-sm", default: "icon", lg: "icon" } as const;
// The old words leave quickly and the new ones arrive just after, so the two are hardly ever on screen together.
const swap = "col-start-1 row-start-1 transition-[opacity,translate] motion-reduce:transition-none";
const arriving = "opacity-100 delay-75 duration-200";
const leaving = "opacity-0 duration-100";
const fade = "col-start-1 row-start-1 transition-opacity duration-200 motion-reduce:transition-none";

/**
 * A button that copies text and says so: the icon draws into a check, the
 * label becomes "Copied", a screen reader hears it, and then it resets on its
 * own timer (pressing again restarts it). The width holds while the label
 * changes. Where the browser refuses to copy, it selects the text and shows
 * "Press Ctrl C", so nobody is left with nothing.
 */
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  manualLabel,
  iconOnly = false,
  timeout = 1800,
  onCopy,
  onError,
  status: shown,
  variant = "outline",
  size = "default",
  className,
  ...props
}: CopyButtonProps) {
  const [own, setOwn] = useState<CopyStatus>("idle");
  const [apple, setApple] = useState(false);
  const [manualText, setManualText] = useState("");
  const [hovered, setHovered] = useState(false);
  const timer = useRef<number>(undefined);
  const button = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const wasManual = useRef(false);

  // Which key to name in the fallback is only known in the browser, so it is worked out after mount and the server and the browser agree.
  useEffect(() => {
    setApple(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    return () => window.clearTimeout(timer.current);
  }, []);
  // The person has to press Ctrl C in the selected text; when it folds back, focus returns to the button.
  useEffect(() => {
    if (own === "manual") {
      area.current?.focus({ preventScroll: true });
      area.current?.select();
    } else if (wasManual.current) button.current?.focus({ preventScroll: true });
    wasManual.current = own === "manual";
  }, [own]);

  const status = shown ?? own;
  const settle = (next: CopyStatus, hold: number) => {
    window.clearTimeout(timer.current);
    setOwn(next);
    timer.current = window.setTimeout(() => setOwn("idle"), hold);
  };

  async function copy() {
    let source: string | Promise<string>;
    try {
      source = typeof value === "function" ? value() : value;
    } catch (error) {
      onError?.(error);
      return;
    }
    let text = typeof source === "string" ? source : undefined;
    try {
      text = await writeClipboard(source);
      settle("copied", timeout);
      onCopy?.(text);
    } catch (error) {
      try {
        text ??= await source;
      } catch (inner) {
        onError?.(inner);
        return;
      }
      if (legacyCopy(text, button.current)) {
        settle("copied", timeout);
        onCopy?.(text);
        return;
      }
      onError?.(error);
      setManualText(text);
      settle("manual", Math.max(timeout, 6000));
    }
  }

  const manual = status === "manual" ? (manualLabel ?? `Press ${apple ? "⌘" : "Ctrl"} C`) : "";
  const current = status === "copied" ? copiedLabel : status === "manual" ? manual : label;
  const control = (
    <Button
      ref={button}
      data-slot="copy-button"
      data-status={status}
      type="button"
      variant={variant}
      size={iconOnly ? iconSizes[size] : size}
      aria-label={iconOnly ? current : undefined}
      onClick={() => void copy()}
      className={cn(iconOnly && size === "lg" && "size-11", className)}
      {...props}
    >
      <span className="relative grid size-4 shrink-0 place-items-center">
        <IconCopyAnimated active={status === "copied"} className={cn(fade, status === "manual" && "opacity-0")} />
        <IconKeyboard className={cn(fade, status === "manual" ? "opacity-100" : "opacity-0")} />
      </span>
      {iconOnly ? null : (
        <span className="inline-grid">
          <span aria-hidden={status !== "idle"} className={cn(swap, status === "idle" ? arriving : cn(leaving, "-translate-y-1"))}>
            {label}
          </span>
          <span aria-hidden={status !== "copied"} className={cn(swap, status === "copied" ? arriving : cn(leaving, "translate-y-1"))}>
            {copiedLabel}
          </span>
          {status === "manual" ? <span className={cn(swap, arriving)}>{manual}</span> : null}
        </span>
      )}
    </Button>
  );

  // The live region and the fallback field come first and are sr-only, so the control is the last child: a Button Group can then join it.
  return (
    <>
      <span role="status" className="sr-only">
        {status === "copied" ? copiedLabel : manual}
      </span>
      {own === "manual" ? (
        <textarea
          ref={area}
          readOnly
          aria-label="Text to copy"
          tabIndex={-1}
          value={manualText}
          // When the person does press Ctrl C, say so. After the event: removing the field inside it would cancel the copy.
          onCopy={() =>
            window.setTimeout(() => {
              settle("copied", timeout);
              onCopy?.(manualText);
            }, 0)
          }
          className="sr-only"
        />
      ) : null}
      {iconOnly ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip open={hovered || status !== "idle"} onOpenChange={setHovered}>
            <TooltipTrigger asChild>{control}</TooltipTrigger>
            <TooltipContent>{current}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        control
      )}
    </>
  );
}
