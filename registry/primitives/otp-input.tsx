"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export interface OtpInputProps {
  /** Number of characters, 6 by default. */
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
  /** Called once every box is filled, with the whole code. */
  onComplete?: (code: string) => void;
  /** Digits only (the default) or letters and digits. */
  mode?: "numeric" | "alphanumeric";
  /** Draw a gap after this many boxes, e.g. 3 for "123 456". */
  groupAfter?: number;
  /** The field's name, for a plain form submit: the whole code is in one hidden input. */
  name?: string;
  label?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/**
 * A one-time code in separate boxes: typing moves on, Backspace moves back,
 * pasting a whole code fills every box, and the first box asks the phone to
 * offer the code from the message (autocomplete="one-time-code").
 */
export function OtpInput({ length = 6, value, onValueChange, onComplete, mode = "numeric", groupAfter, name, label = "Verification code", disabled, invalid, className }: OtpInputProps) {
  const [own, setOwn] = useState("");
  const code = (value ?? own).slice(0, length);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const allowed = mode === "numeric" ? /\d/ : /[a-z\d]/i;
  const set = (next: string) => {
    const clean = [...next].filter((char) => allowed.test(char)).join("").slice(0, length).toUpperCase();
    if (value === undefined) setOwn(clean);
    onValueChange?.(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };
  const focus = (index: number) => boxes.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  const onKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (code[index]) set(code.slice(0, index) + code.slice(index + 1));
      else if (index > 0) {
        set(code.slice(0, index - 1) + code.slice(index));
        focus(index - 1);
      }
    } else if (event.key === "ArrowLeft") focus(index - 1);
    else if (event.key === "ArrowRight") focus(index + 1);
  };
  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    focus(set(event.clipboardData.getData("text")).length);
  };
  return (
    <div data-slot="otp-input" role="group" aria-label={label} className={cn("flex items-center gap-2", className)}>
      {Array.from({ length }, (_, index) => (
        <span key={index} className={cn("contents", groupAfter && index === groupAfter && "[&>input]:ml-3")}>
          <input
            ref={(element) => {
              boxes.current[index] = element;
            }}
            aria-label={`${label}, character ${index + 1} of ${length}`}
            aria-invalid={invalid || undefined}
            inputMode={mode === "numeric" ? "numeric" : "text"}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={length}
            disabled={disabled}
            value={code[index] ?? ""}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const typed = event.target.value.slice(-1);
              if (event.target.value.length > 1 && index === 0) {
                focus(set(event.target.value).length);
                return;
              }
              if (!allowed.test(typed)) return;
              set(code.slice(0, index) + typed + code.slice(index + 1));
              focus(index + 1);
            }}
            onKeyDown={(event) => onKey(index, event)}
            onPaste={onPaste}
            className="size-11 rounded-md border border-input bg-background text-center font-mono text-lg shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive disabled:opacity-50"
          />
        </span>
      ))}
      {name ? <input type="hidden" name={name} value={code} /> : null}
    </div>
  );
}
