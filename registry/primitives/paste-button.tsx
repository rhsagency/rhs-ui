"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type ComponentProps, type ReactNode, type RefObject } from "react";

import { Glyph, IconAlertCircle, IconCheck, IconClipboard, IconKeyboard, IconLock } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

type Field = HTMLInputElement | HTMLTextAreaElement;

export interface PasteButtonProps extends Omit<ComponentProps<"button">, "onPaste" | "onClick" | "children" | "title" | "aria-label"> {
  /** Called with the text once it has passed every check. Nothing from the clipboard is kept anywhere else. */
  onPaste?: (text: string) => void;
  /** Return a sentence to refuse the text with, in words ("That is not an IBAN"), or nothing to accept it. */
  validate?: (text: string) => string | null | undefined | void;
  /** Trim white space and line breaks from both ends before checking. On by default. */
  trim?: boolean;
  /** Refuse text longer than this, saying how long it was. Defaults to the target's own maxLength. */
  maxLength?: number;
  /** The button's words. Default "Paste". */
  label?: string;
  /** An input or textarea to fill and focus. When the browser cannot read the clipboard it is focused anyway, so Ctrl V lands in it. */
  targetRef?: RefObject<Field | null>;
  /** 32, 36 or 44px tall. */
  size?: "sm" | "default" | "lg";
  /** Any Button variant. Outline by default. */
  variant?: ButtonProps["variant"];
  /** Which edge of the button the message lines up with: `end` (default) suits a button at the right end of a field, `start` one on the left. */
  align?: "start" | "center" | "end";
  /** Where the text comes from. Defaults to `navigator.clipboard.readText()`. Pass your own for a native shell (Capacitor, Tauri) or to test every outcome. */
  read?: () => Promise<string>;
}

type Hint = { touch: boolean; key: "Ctrl" | "⌘" };
type Notice =
  | { kind: "pasted"; count: number }
  | { kind: "empty" }
  | { kind: "refused"; reason: string }
  | { kind: "blocked"; hint: Hint }
  | { kind: "unsupported"; hint: Hint };

interface Words {
  tone: "ok" | "info" | "error";
  icon: ReactNode;
  title: string;
  detail?: ReactNode;
  /** The same thing as plain text, for the live region. */
  speech: string;
}

const pasteHint = (): Hint => ({
  touch: typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches,
  key: /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl",
});

/** What to do instead, as a sentence: on a phone there is no Ctrl V. */
function instead({ touch, key }: Hint, field: boolean): { visual: ReactNode; speech: string } {
  const where = field ? "the field" : "the field you are pasting into";
  if (touch) return { visual: `touch and hold ${where}, then choose Paste`, speech: `touch and hold ${where}, then choose Paste` };
  return {
    visual: (
      <>
        click {where} and press{" "}
        <KbdGroup className="align-middle">
          <Kbd>{key}</Kbd>
          <Kbd>V</Kbd>
        </KbdGroup>
      </>
    ),
    speech: `click ${where} and press ${key === "⌘" ? "Command" : "Control"} V`,
  };
}

function wordsFor(notice: Notice, field: boolean): Words {
  switch (notice.kind) {
    case "pasted": {
      const title = `Pasted ${notice.count} ${notice.count === 1 ? "character" : "characters"}`;
      return { tone: "ok", icon: <IconCheck />, title, speech: title };
    }
    case "empty":
      return { tone: "info", icon: <IconClipboard />, title: "Nothing to paste", detail: "The clipboard is empty. Copy something, then press the button again.", speech: "Nothing to paste. The clipboard is empty. Copy something, then press the button again." };
    case "refused":
      return { tone: "error", icon: <IconAlertCircle />, title: "Not pasted", detail: notice.reason, speech: `Not pasted. ${notice.reason}` };
    case "blocked": {
      const other = instead(notice.hint, field);
      return {
        tone: "info",
        icon: <IconLock />,
        title: "The browser blocked the clipboard",
        detail: <>Allow clipboard access in the site settings, or {other.visual}.</>,
        speech: `The browser blocked the clipboard. Allow clipboard access in the site settings, or ${other.speech}.`,
      };
    }
    case "unsupported": {
      const other = instead(notice.hint, field);
      return {
        tone: "info",
        icon: <IconKeyboard />,
        title: "Paste with the keyboard",
        detail: <>This browser does not let a button read the clipboard. Please {other.visual}.</>,
        speech: `Paste with the keyboard. This browser does not let a button read the clipboard. Please ${other.speech}.`,
      };
    }
  }
}

/** Sets the value the way a person's typing would, so a controlled React input hears about it, then puts the caret at the end. */
function fill(field: Field, text: string) {
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, text);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.focus();
  try {
    field.setSelectionRange(text.length, text.length);
  } catch {
    /* Types without a caret (email, number) have nothing to move. */
  }
}

const fade = "col-start-1 row-start-1 transition-[opacity,scale] duration-200 motion-reduce:transition-none";
const draw = "transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none";

/**
 * Paste from the clipboard with one press, for the codes, links, IBANs and
 * addresses that are awkward to long-press on a phone. It reads the clipboard
 * only when pressed (the browser may ask first), checks the text and says what
 * happened in a small panel by the button: how many characters it pasted, why
 * it refused, or how to allow access or paste with the keys when the browser
 * will not let a button read the clipboard. Pressing Ctrl V while the button
 * has focus works too, without any permission. Results are announced politely
 * and the text is handed to `onPaste` and the target field, never stored.
 */
export function PasteButton({ onPaste, validate, trim = true, maxLength, label = "Paste", targetRef, size = "default", variant = "outline", align = "end", read, className, ...props }: PasteButtonProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [stamp, setStamp] = useState(0);
  const [busy, setBusy] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<number>(undefined);
  const pending = useRef(false);
  const alive = useRef(true);
  const last = useRef<Notice | null>(null);
  if (notice) last.current = notice;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  // Typing or pasting in the target field means the problem is being dealt with: put the message away.
  useEffect(() => {
    const field = targetRef?.current;
    if (!notice || !field) return;
    const away = () => setNotice(null);
    field.addEventListener("input", away);
    return () => field.removeEventListener("input", away);
  }, [notice, targetRef]);

  function show(next: Notice, hold?: number) {
    window.clearTimeout(timer.current);
    setNotice(next);
    setStamp((count) => count + 1);
    if (hold) timer.current = window.setTimeout(() => setNotice(null), hold);
  }
  function dismiss() {
    window.clearTimeout(timer.current);
    setNotice(null);
  }

  /** Every route in ends here: trim, check, hand over, say so. The text itself is never kept. */
  function settle(raw: string) {
    const target = targetRef?.current ?? null;
    const text = trim ? raw.trim() : raw;
    if (text === "") {
      show({ kind: "empty" });
      return;
    }
    const length = [...text].length;
    const limit = maxLength ?? (target && target.maxLength > 0 ? target.maxLength : undefined);
    const reason = limit !== undefined && length > limit ? `That is ${length} characters and this field takes at most ${limit}.` : validate?.(text);
    if (reason) {
      show({ kind: "refused", reason });
      return;
    }
    if (target) fill(target, text);
    onPaste?.(text);
    show({ kind: "pasted", count: length }, 2600);
  }

  async function press() {
    if (pending.current) return;
    const target = targetRef?.current ?? null;
    const reader = read ?? (typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function" ? () => navigator.clipboard.readText() : undefined);
    if (!reader) {
      target?.focus();
      show({ kind: "unsupported", hint: pasteHint() });
      return;
    }
    pending.current = true;
    setBusy(true);
    let raw: string;
    try {
      raw = await reader();
    } catch {
      pending.current = false;
      if (!alive.current) return;
      setBusy(false);
      target?.focus();
      show({ kind: "blocked", hint: pasteHint() });
      return;
    }
    pending.current = false;
    if (!alive.current) return;
    setBusy(false);
    settle(raw);
  }

  const pasted = notice?.kind === "pasted";
  const shown = notice ?? last.current;
  const words = shown ? wordsFor(shown, Boolean(targetRef)) : null;
  return (
    <>
      <span role="status" className="sr-only">
        <span key={stamp}>{notice && words ? words.speech : ""}</span>
      </span>
      <Popover
        open={notice !== null}
        onOpenChange={(open) => {
          if (!open) dismiss();
        }}
      >
        <PopoverAnchor asChild>
          <Button
            ref={button}
            data-slot="paste-button"
            data-status={notice?.kind ?? "idle"}
            type="button"
            variant={variant}
            size={size}
            aria-busy={busy || undefined}
            onClick={() => void press()}
            // A keyboard user can Tab here and press Ctrl V: the browser hands over the text with no permission prompt.
            onPaste={(event: ClipboardEvent<HTMLButtonElement>) => {
              event.preventDefault();
              settle(event.clipboardData.getData("text/plain"));
            }}
            className={className}
            {...props}
          >
            <span aria-hidden="true" className="relative grid size-4 shrink-0 place-items-center">
              <IconClipboard className={cn(fade, "size-full", pasted ? "scale-75 opacity-0" : "opacity-100")} />
              <Glyph size="100%" className="absolute inset-0 size-full">
                <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn(draw, pasted ? "[stroke-dashoffset:0] delay-100" : "[stroke-dashoffset:1]")} />
              </Glyph>
            </span>
            {label}
          </Button>
        </PopoverAnchor>
        <PopoverContent
          aria-hidden="true"
          side="bottom"
          align={align}
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // Focus moves to the target field on purpose; only a press somewhere else, or Escape, puts the message away.
          onFocusOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (button.current?.contains(event.target as Node)) event.preventDefault();
          }}
          className="w-auto max-w-[min(22rem,calc(100vw-1.5rem))] p-3"
        >
          {words ? (
            <div className="flex items-start gap-2.5">
              <span className={cn("mt-0.5 shrink-0 [&_svg]:size-4", words.tone === "error" ? "text-destructive" : "text-foreground")}>{words.icon}</span>
              <div className="min-w-0">
                <p className="text-sm leading-5 font-medium">{words.title}</p>
                {words.detail ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">{words.detail}</p> : null}
              </div>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
