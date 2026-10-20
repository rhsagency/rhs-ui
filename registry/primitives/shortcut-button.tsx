"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type RefObject } from "react";

import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface ShortcutButtonProps extends Omit<ComponentProps<"button">, "onClick" | "children" | "aria-keyshortcuts"> {
  /** One chord such as "mod+k" or "shift+/", or a sequence of chords separated by spaces such as "g i". `mod` is Cmd on a Mac and Ctrl elsewhere, worked out after mount so the server and the browser agree. */
  shortcut: string;
  /** Runs on a click and when the shortcut is pressed, told which of the two it was. */
  onAction: (source: "pointer" | "shortcut") => void;
  /** The words on the button. */
  label: string;
  /** Where the shortcut is heard: anywhere on the page (the default), or only while focus is inside this element. */
  scope?: "global" | RefObject<HTMLElement | null>;
  /** Also fire while someone is typing in a field. Off by default, so pressing "c" in a text box types a "c". */
  allowInInputs?: boolean;
  /** Any Button variant. */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

interface Chord {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
}

const MODIFIERS: Record<string, "mod" | "ctrl" | "meta" | "alt" | "shift"> = { mod: "mod", ctrl: "ctrl", control: "ctrl", cmd: "meta", command: "meta", meta: "meta", win: "meta", alt: "alt", option: "alt", opt: "alt", shift: "shift" };
const ALIASES: Record<string, string> = { esc: "escape", return: "enter", del: "delete", up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", space: " ", spacebar: " ", plus: "+" };
const GLYPHS: Record<string, string> = { arrowup: "↑", arrowdown: "↓", arrowleft: "←", arrowright: "→", enter: "↵", escape: "Esc", backspace: "⌫", delete: "Del", tab: "Tab", " ": "Space" };
const ARIA_KEYS: Record<string, string> = { arrowup: "ArrowUp", arrowdown: "ArrowDown", arrowleft: "ArrowLeft", arrowright: "ArrowRight", enter: "Enter", escape: "Escape", backspace: "Backspace", delete: "Delete", tab: "Tab", " ": "Space" };

function parse(shortcut: string): Chord[] {
  return shortcut
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((step) => {
      const chord: Chord = { key: "", mod: false, ctrl: false, meta: false, alt: false, shift: false };
      for (const part of step.split("+")) {
        const modifier = MODIFIERS[part];
        if (modifier) chord[modifier] = true;
        else chord.key = ALIASES[part] ?? part;
      }
      return chord;
    });
}

/** Exact: a chord never fires with a modifier it does not name, so "g" ignores Ctrl+G. */
function matches(event: KeyboardEvent, chord: Chord, mac: boolean): boolean {
  if (event.metaKey !== (chord.meta || (chord.mod && mac)) || event.ctrlKey !== (chord.ctrl || (chord.mod && !mac)) || event.altKey !== chord.alt) return false;
  // A symbol like "?" is typed with Shift on some layouts and without it on others: the character decides.
  const symbol = chord.key.length === 1 && !/[a-z0-9]/.test(chord.key);
  if (!symbol && event.shiftKey !== chord.shift) return false;
  // Option+K types another character on a Mac, so a letter with Alt is read from the physical key.
  if (chord.alt && /^[a-z]$/.test(chord.key)) return event.code === `Key${chord.key.toUpperCase()}`;
  return event.key.toLowerCase() === chord.key;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !["button", "checkbox", "radio", "submit", "reset", "range", "color", "file", "image"].includes(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

/** The keys as they are printed on a keyboard of the platform: ⌃ ⌥ ⇧ ⌘ on a Mac, Ctrl Alt Shift on the rest. */
function keysOf(chord: Chord, mac: boolean): string[] {
  const ctrl = chord.ctrl || (chord.mod && !mac);
  const command = chord.meta || (chord.mod && mac);
  const key = GLYPHS[chord.key] ?? (chord.key.length === 1 ? chord.key.toUpperCase() : chord.key);
  const modifiers = mac ? [ctrl && "⌃", chord.alt && "⌥", chord.shift && "⇧", command && "⌘"] : [ctrl && "Ctrl", chord.alt && "Alt", chord.shift && "Shift", command && "Win"];
  return [...modifiers.filter((item): item is string => Boolean(item)), key];
}

/** The same chord as aria-keyshortcuts writes it: "Control+K". */
function ariaOf(chord: Chord, mac: boolean): string {
  const parts: string[] = [];
  if (chord.ctrl || (chord.mod && !mac)) parts.push("Control");
  if (chord.alt) parts.push("Alt");
  if (chord.shift) parts.push("Shift");
  if (chord.meta || (chord.mod && mac)) parts.push("Meta");
  parts.push(ARIA_KEYS[chord.key] ?? chord.key.toUpperCase());
  return parts.join("+");
}

/**
 * A button that shows its keyboard shortcut and listens for it. The shortcut
 * runs the same handler as a click, the keys follow the platform (⌘ on a Mac,
 * Ctrl elsewhere, resolved after mount so the server and the browser agree),
 * and the button flashes its pressed state when the key is used. The listener
 * ignores key repeat, text fields and contenteditable, never fires with extra
 * modifiers, times a sequence like "g i" out after a second, removes itself on
 * unmount, and `aria-keyshortcuts` exposes the combination.
 */
export function ShortcutButton({ shortcut, onAction, label, scope = "global", allowInInputs = false, disabled = false, variant = "outline", size, className, "aria-describedby": describedBy, ...props }: ShortcutButtonProps) {
  const [mac, setMac] = useState<boolean | null>(null);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number>(undefined);
  const action = useRef(onAction);
  useEffect(() => {
    action.current = onAction;
  });
  useEffect(() => {
    setMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    return () => window.clearTimeout(flashTimer.current);
  }, []);

  const hint = useId();
  const isMac = mac === true;
  const chords = useMemo(() => parse(shortcut), [shortcut]);

  useEffect(() => {
    if (disabled || !chords.length) return;
    const host: EventTarget | null = scope === "global" ? document : scope.current;
    if (!host) return;
    let step = 0;
    let timer = 0;
    const reset = () => {
      step = 0;
      window.clearTimeout(timer);
    };
    const wait = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(reset, 1000);
    };
    const onKey = (raw: Event) => {
      const event = raw as KeyboardEvent;
      if (event.repeat || event.isComposing || ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
      if (!allowInInputs && isTyping(event.target)) {
        reset();
        return;
      }
      const wanted = chords[step];
      if (wanted && matches(event, wanted, isMac)) {
        if (step < chords.length - 1) {
          step += 1;
          wait();
          return;
        }
        reset();
        event.preventDefault();
        setFlash(true);
        window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(false), 220);
        action.current("shortcut");
        return;
      }
      reset();
      // The key that broke a sequence may be the start of the next try.
      const first = chords[0];
      if (chords.length > 1 && first && matches(event, first, isMac)) {
        step = 1;
        wait();
      }
    };
    host.addEventListener("keydown", onKey);
    return () => {
      host.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [allowInInputs, chords, disabled, isMac, scope]);

  const steps = chords.map((chord) => keysOf(chord, isMac));
  const first = chords[0];
  const sequence = chords.length > 1;
  // The description comes first and is sr-only, so the button is the last child: a Button Group can then join it.
  return (
    <>
      {sequence ? (
        <span id={hint} className="sr-only">
          Shortcut: {steps.map((keys) => keys.join(" ")).join(" then ")}
        </span>
      ) : null}
      <Button
        data-slot="shortcut-button"
        data-flash={flash || undefined}
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        aria-keyshortcuts={!sequence && first ? ariaOf(first, isMac) : undefined}
        // A sequence has no aria-keyshortcuts spelling, so it is described in words instead.
        aria-describedby={[describedBy, sequence ? hint : undefined].filter(Boolean).join(" ") || undefined}
        onClick={() => action.current("pointer")}
        className={cn("transition-[background-color,border-color,color,box-shadow,translate] data-[flash=true]:translate-y-px data-[flash=true]:ring-[3px] data-[flash=true]:ring-ring/30", className)}
        {...props}
      >
        <span className="min-w-0 truncate">{label}</span>
        {/* The keys are for the eyes, and left out on a touch-only screen where there is no keyboard; the shortcut is exposed through aria-keyshortcuts, or described in words for a sequence. */}
        <KbdGroup aria-hidden="true" className={cn("shrink-0 transition-opacity duration-150 [@media(hover:none)_and_(pointer:coarse)]:hidden", mac === null && "opacity-0")}>
          {steps.map((keys, index) => (
            <Fragment key={`${keys.join("+")}-${index}`}>
              {index > 0 ? <span className="px-0.5 text-[0.6875rem] opacity-70">then</span> : null}
              {keys.map((key, at) => (
                <Kbd key={`${key}-${at}`} className="border-current/20 bg-current/10 text-current/80">
                  {key}
                </Kbd>
              ))}
            </Fragment>
          ))}
        </KbdGroup>
      </Button>
    </>
  );
}
