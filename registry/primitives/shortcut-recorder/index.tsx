"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd } from "@rhs-ui/primitives/kbd";
import {
  describeModifiers,
  describeShortcut,
  detectPlatform,
  isComplete,
  isInertKey,
  isModifierKey,
  modifiersOf,
  normaliseShortcut,
  shortcutFromEvent,
  shortcutWords,
  type ShortcutKey,
  type ShortcutModifier,
  type ShortcutPlatform,
} from "@rhs-ui/primitives/shortcut-recorder/shortcut";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type { ShortcutPlatform } from "@rhs-ui/primitives/shortcut-recorder/shortcut";

/** Every sentence the field says or shows. Each one can be replaced, for another language or your own voice. */
export interface ShortcutRecorderMessages {
  /** Shown while no shortcut is set. */
  empty: string;
  /** Shown while recording, before a key is held. */
  recording: string;
  /** The reminder that floats under the field while recording, after the Esc keycap. */
  cancelHint: string;
  /** The reminder after the Backspace keycap. */
  clearHint: string;
  /** The reminder after the Tab keycap. */
  leaveHint: string;
  /** The name of the button that clears the shortcut. */
  clear: string;
  /** Said and shown when a combination belongs to something else: "Already used by Search". */
  conflict: (action: string) => string;
  /** Said and shown when a combination is reserved and no reason was given. */
  reserved: string;
  /** Said and shown when a combination needs a modifier key (with `requireModifier`). A function gets the keyboard that is shown, so the sentence names keys the person has. */
  needsModifier: string | ((platform: ShortcutPlatform) => string);
  /** What a screen reader hears with the field, so it knows how to leave. */
  help: string;
  /** Announced when recording starts. */
  started: string;
  /** Announced when a shortcut is set, with its keys in words. */
  set: (words: string) => string;
  /** Announced when the shortcut is cleared. */
  cleared: string;
  /** Announced when recording is cancelled. */
  cancelled: string;
}

const MESSAGES: ShortcutRecorderMessages = {
  empty: "Not set",
  recording: "Press the keys",
  cancelHint: "cancel",
  clearHint: "clear",
  leaveHint: "move on",
  clear: "Clear shortcut",
  conflict: (action) => `Already used by ${action}`,
  reserved: "That combination is reserved",
  needsModifier: (platform) => (platform === "mac" ? "Add ⌘, ⌃ or ⌥ to the key" : "Add Ctrl or Alt to the key"),
  help: "Press Enter or Space to record a shortcut. While recording, press the keys you want, Escape to cancel, Backspace or Delete to clear, or Tab to move on.",
  started: "Recording. Press the keys.",
  set: (words) => `Shortcut set to ${words}`,
  cleared: "Shortcut cleared",
  cancelled: "Recording cancelled",
};

export interface ShortcutRecorderProps extends Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children" | "name" | "className"> {
  /** The shortcut, written the same on every platform: `Mod+Shift+K`, where `Mod` is Command on a Mac and Ctrl elsewhere. `null` is none. */
  value?: string | null;
  /** The shortcut to start with, when you do not control the field. */
  defaultValue?: string | null;
  /** Called with the new combination in that form, or `null` when it is cleared. Only a combination that was accepted is reported. */
  onValueChange?: (value: string | null) => void;
  /** Combinations that cannot be used: a list, or an object that names the reason for each (`{ "Mod+W": "Closes the tab" }`). They are refused with the reason in words. */
  reserved?: readonly string[] | Readonly<Record<string, string>>;
  /** Given a combination, returns the name of what already uses it ("Search"), or nothing. The field then refuses it with "Already used by Search". The combination being replaced is never a conflict. */
  findConflict?: (shortcut: string) => string | null | undefined | false;
  /** Whose keyboard to show: symbols (⌘ ⇧ ⌥) for `mac`, words (Ctrl, Shift, Alt) for `windows` and `linux`. Default: read from the browser after mount. */
  platform?: ShortcutPlatform;
  /** Refuse a key pressed alone, other than a function key, so a plain letter never becomes a shortcut. Default false. */
  requireModifier?: boolean;
  /** Marks the field as having an error from outside, such as a duplicate your form found. */
  invalid?: boolean;
  /** The field's name, for a plain form submit: the combination goes out in a hidden input, `Mod+Shift+K`. */
  name?: string;
  /** Every sentence the field says or shows. Each can be replaced. */
  messages?: Partial<ShortcutRecorderMessages>;
  /** Classes for the whole field. */
  className?: string;
}

/** A key named in the reminder under the field, drawn for the dark surface it sits on. */
function HintKey({ children }: { children: string }) {
  return <Kbd className="h-5 rounded border-background/25 bg-background/15 px-1.5 text-[0.6875rem] text-background">{children}</Kbd>;
}

/** The keycaps of a shortcut: calm when it is set, inverted while a key is held, red when it was refused. */
function Keycaps({ keys, tone }: { keys: readonly ShortcutKey[]; tone: "set" | "held" | "refused" }) {
  return (
    <>
      {keys.map((key, index) => (
        <Kbd
          key={`${key.glyph}-${index}`}
          className={cn(
            "h-6 min-w-6 rounded-md px-1.5 text-xs font-medium shadow-[0_1px_0_var(--border)] transition-colors duration-100 motion-reduce:transition-none",
            tone === "held" && "border-foreground bg-foreground text-background shadow-none",
            tone === "refused" && "border-destructive/40 bg-destructive/10 text-destructive shadow-none",
          )}
        >
          {key.glyph}
        </Kbd>
      ))}
    </>
  );
}

/**
 * A field that records a keyboard shortcut. Focus it and press the keys: the
 * held modifiers show live as keycaps, and the combination is committed when a
 * key that is not a modifier lands. Escape cancels, Backspace or Delete clears,
 * and a reserved or conflicting combination is refused with the reason in
 * words ("Already used by Search"). Shortcuts show with the keys of the
 * platform (⌘ ⇧ ⌥ on a Mac, Ctrl Shift Alt elsewhere) and read as words to a
 * screen reader ("Command plus Shift plus K"). The field has to capture keys,
 * so it says how to leave, and Tab always moves on: it never traps focus. It
 * listens at the top of the window while it has focus, so a dialog around it
 * does not close on the Escape that cancels the recording.
 */
export function ShortcutRecorder({
  value,
  defaultValue = null,
  onValueChange,
  reserved,
  findConflict,
  platform: platformProp,
  requireModifier = false,
  invalid = false,
  name,
  messages: custom,
  disabled = false,
  className,
  onFocus,
  onBlur,
  onClick,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ShortcutRecorderProps) {
  const text = useMemo<ShortcutRecorderMessages>(() => ({ ...MESSAGES, ...custom }), [custom]);
  const id = useId();
  const [own, setOwn] = useState<string | null>(() => normaliseShortcut(defaultValue));
  const current = value !== undefined ? normaliseShortcut(value) : own;
  const [detected, setDetected] = useState<ShortcutPlatform | null>(null);
  const [focused, setFocused] = useState(false);
  const [recording, setRecording] = useState(false);
  const [held, setHeld] = useState<readonly ShortcutModifier[]>([]);
  const [refused, setRefused] = useState<{ shortcut: string; reason: string } | null>(null);
  const [note, setNote] = useState("");
  const button = useRef<HTMLButtonElement>(null);
  // A focus put back by the Clear button must not start a recording.
  const quiet = useRef(false);
  const latest = useRef<{ down: (event: KeyboardEvent) => void; up: (event: KeyboardEvent) => void }>({ down: () => {}, up: () => {} });

  useEffect(() => {
    if (platformProp === undefined) setDetected(detectPlatform());
  }, [platformProp]);
  const ready = platformProp !== undefined || detected !== null;
  const platform: ShortcutPlatform = platformProp ?? detected ?? "windows";

  const blocked = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(reserved)) {
      for (const item of reserved as readonly string[]) {
        const shortcut = normaliseShortcut(item);
        if (shortcut) map.set(shortcut, text.reserved);
      }
    } else if (reserved) {
      for (const [item, reason] of Object.entries(reserved as Readonly<Record<string, string>>)) {
        const shortcut = normaliseShortcut(item);
        if (shortcut) map.set(shortcut, reason || text.reserved);
      }
    }
    return map;
  }, [reserved, text.reserved]);

  function write(next: string | null) {
    if (value === undefined) setOwn(next);
    if (next !== current) onValueChange?.(next);
  }

  function finish(announcement: string) {
    setRecording(false);
    setHeld([]);
    setRefused(null);
    setNote(announcement);
  }

  function start() {
    if (disabled) return;
    setRecording(true);
    setHeld([]);
    setRefused(null);
    setNote(text.started);
  }

  function attempt(shortcut: string) {
    const reason = requireModifier && !isComplete(shortcut) ? (typeof text.needsModifier === "function" ? text.needsModifier(platform) : text.needsModifier) : blocked.get(shortcut);
    if (reason) {
      setRefused({ shortcut, reason });
      setHeld([]);
      return;
    }
    const owner = shortcut === current ? null : findConflict?.(shortcut);
    if (owner) {
      setRefused({ shortcut, reason: text.conflict(owner) });
      setHeld([]);
      return;
    }
    write(shortcut);
    finish(text.set(shortcutWords(shortcut, platform)));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (disabled || event.isComposing || document.activeElement !== button.current) return;
    const bare = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
    if (!recording) {
      // Focused but done: Enter or Space starts again.
      if (bare && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        start();
      }
      return;
    }
    // Tab, with or without Shift, is how to leave: it is never captured.
    if (event.key === "Tab" && !event.ctrlKey && !event.metaKey && !event.altKey) return;
    if (isInertKey(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (isModifierKey(event.key)) {
      setHeld(modifiersOf(event, platform));
      setRefused(null);
      return;
    }
    if (bare && event.key === "Escape") {
      finish(text.cancelled);
      return;
    }
    if (bare && (event.key === "Backspace" || event.key === "Delete")) {
      write(null);
      finish(text.cleared);
      return;
    }
    if (event.repeat) return;
    const shortcut = shortcutFromEvent(event, platform);
    if (shortcut) attempt(shortcut);
  }

  function onKeyUp(event: KeyboardEvent) {
    if (recording && isModifierKey(event.key) && document.activeElement === button.current) setHeld(modifiersOf(event, platform));
  }

  useEffect(() => {
    latest.current = { down: onKeyDown, up: onKeyUp };
  });

  // Listen on the window, in the capture phase, only while the field has focus: nothing else gets the keys that are being recorded, not even the Escape a dialog around the field would close on.
  useEffect(() => {
    if (!focused) return;
    const down = (event: KeyboardEvent) => latest.current.down(event);
    const up = (event: KeyboardEvent) => latest.current.up(event);
    const forget = () => setHeld([]);
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", forget);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", forget);
    };
  }, [focused]);

  const showRefused = refused !== null;
  const keys: ShortcutKey[] = showRefused ? describeShortcut(refused.shortcut, platform) : recording ? describeModifiers(held, platform) : current ? describeShortcut(current, platform) : [];
  const tone = showRefused ? "refused" : recording ? "held" : "set";
  const valueText = current ? shortcutWords(current, platform) : text.empty;
  const valueId = `${id}-value`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [ariaDescribedBy, helpId, ariaLabel || ariaLabelledBy ? undefined : valueId, showRefused ? errorId : undefined].filter(Boolean).join(" ");
  const clearable = current !== null && !recording && !disabled;
  const bad = invalid || showRefused;

  // The reminder of how to leave floats under it while it records, so the field itself stays as quiet as a text input.
  const recorder = (
    <button
      ref={button}
      type="button"
      data-slot="shortcut-recorder-button"
      disabled={disabled}
      aria-invalid={bad || undefined}
      aria-label={ariaLabel ? `${ariaLabel}: ${valueText}` : undefined}
      aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${valueId}` : undefined}
      aria-describedby={describedBy}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
        if (quiet.current) quiet.current = false;
        else start();
      }}
      onBlur={(event) => {
        setFocused(false);
        finish("");
        onBlur?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        // Safari does not focus a button that was clicked; the focus is what starts the recording.
        if (document.activeElement !== event.currentTarget) event.currentTarget.focus();
        else if (!recording) start();
      }}
      className="flex h-full min-w-0 flex-1 items-center gap-1.5 rounded-[inherit] px-1.5 text-left text-sm outline-none enabled:cursor-pointer disabled:cursor-not-allowed"
      {...props}
    >
      <span aria-hidden="true" className={cn("flex min-w-0 flex-1 items-center gap-1.5 pl-1 transition-opacity duration-150 motion-reduce:transition-none", !ready && "opacity-0")}>
        {keys.length > 0 ? (
          <>
            <Keycaps keys={keys} tone={tone} />
            {recording && !showRefused ? <Kbd className="h-6 min-w-6 rounded-md border-dashed bg-transparent shadow-none" /> : null}
          </>
        ) : recording ? (
          <>
            <span className="size-1.5 shrink-0 rounded-full bg-foreground motion-safe:animate-pulse" />
            <span className="truncate text-muted-foreground">{text.recording}</span>
          </>
        ) : (
          <span className="truncate text-muted-foreground">{text.empty}</span>
        )}
      </span>
      <span id={valueId} className="sr-only">
        {valueText}
      </span>
    </button>
  );

  return (
    <div data-slot="shortcut-recorder" data-recording={recording || undefined} data-invalid={bad || undefined} className={cn("w-full min-w-0", className)}>
      <div
        data-recording={recording}
        data-invalid={bad}
        data-disabled={disabled}
        className={cn(
          "relative flex h-9 w-full items-center rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none",
          "has-[[data-slot=shortcut-recorder-button]:focus-visible]:border-ring has-[[data-slot=shortcut-recorder-button]:focus-visible]:ring-[3px] has-[[data-slot=shortcut-recorder-button]:focus-visible]:ring-ring/40",
          "data-[recording=true]:border-ring data-[recording=true]:bg-muted/30 data-[recording=true]:ring-[3px] data-[recording=true]:ring-ring/40",
          "data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/25 data-[invalid=true]:data-[recording=true]:border-destructive data-[invalid=true]:data-[recording=true]:ring-destructive/30 data-[invalid=true]:has-[[data-slot=shortcut-recorder-button]:focus-visible]:border-destructive data-[invalid=true]:has-[[data-slot=shortcut-recorder-button]:focus-visible]:ring-destructive/30",
          "data-[disabled=true]:opacity-50",
        )}
      >
        <TooltipProvider delayDuration={0}>
          <Tooltip open={recording && !showRefused}>
            <TooltipTrigger asChild>{recorder}</TooltipTrigger>
            <TooltipContent side="bottom" align="start" sideOffset={8} className="flex items-center gap-1.5 px-2 py-1.5 text-xs whitespace-nowrap">
              <HintKey>Esc</HintKey>
              <span className="mr-1.5">{text.cancelHint}</span>
              <HintKey>⌫</HintKey>
              <span className="mr-1.5">{text.clearHint}</span>
              <HintKey>Tab</HintKey>
              <span>{text.leaveHint}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {clearable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={text.clear}
            onClick={() => {
              write(null);
              setNote(text.cleared);
              quiet.current = true;
              button.current?.focus();
              // If the field already had the focus, no focus event comes to use up the flag.
              quiet.current = false;
            }}
            className="mr-1 size-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <IconClose />
          </Button>
        ) : null}
      </div>
      {showRefused ? (
        <p id={errorId} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {refused.reason}
        </p>
      ) : null}
      <span id={helpId} className="sr-only">
        {text.help}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {note}
      </span>
      {name ? <input type="hidden" name={name} value={current ?? ""} /> : null}
    </div>
  );
}
