"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactElement, type RefObject } from "react";

import { IconRedo, IconUndo } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface UndoRedoLabels {
  /** The name of the pair for screen readers. Default "History". */
  group?: string;
  /** Tooltip of Undo while there is nothing to undo. Default "Nothing to undo". */
  nothingToUndo?: string;
  /** Tooltip of Redo while there is nothing to redo. Default "Nothing to redo". */
  nothingToRedo?: string;
  /** Said after an undo; `{step}` is the step in words. Default "Undid: {step}". */
  undone?: string;
  /** Said after a redo; `{step}` is the step in words. Default "Redid: {step}". */
  redone?: string;
  /** What `{step}` becomes when the label names no step. Default "the last change". */
  anyStep?: string;
}

export interface UndoRedoButtonsProps extends Omit<ComponentProps<"div">, "children"> {
  /** Whether there is a step to undo. When false the button stays in place, dimmed, and says so in its tooltip. */
  canUndo: boolean;
  /** Whether there is a step to redo. */
  canRedo: boolean;
  /** Step back. You own the history; this only reports the press. */
  onUndo: () => void;
  /** Step forward again. */
  onRedo: () => void;
  /** The next undo step in words, for example "Undo: Move layer". It is the button's name, its tooltip, and what is announced afterwards. Default "Undo". */
  undoLabel?: string;
  /** The next redo step in words, for example "Redo: Move layer". Default "Redo". */
  redoLabel?: string;
  /** Listen for Ctrl or Cmd with Z, Shift with Cmd and Z, and Ctrl with Y. Ignored while someone types in a field, so the field keeps its own undo. Default true. */
  bindKeys?: boolean;
  /** Listen only while focus is inside this element (an editor, a canvas) instead of anywhere on the page. */
  scope?: RefObject<HTMLElement | null>;
  /** Button size: 28, 32 or 40px (44px on touch screens). */
  size?: "sm" | "md" | "lg";
  /** `outline` joins the two into one bar; `ghost` is two quiet buttons for a toolbar that already has a surface. */
  variant?: "outline" | "ghost";
  /** The words used for the group name, the empty tooltips and the announcements. */
  labels?: UndoRedoLabels;
}

const BOX = {
  sm: "size-7 [&_svg:not([class*='size-'])]:size-3.5 [@media(pointer:coarse)]:size-11",
  md: "size-8 [&_svg:not([class*='size-'])]:size-4 [@media(pointer:coarse)]:size-11",
  lg: "size-10 [&_svg:not([class*='size-'])]:size-[1.125rem] [@media(pointer:coarse)]:size-11",
} as const;

/** True for a field where the keys belong to the person typing: Ctrl Z there is the field's own undo. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !["button", "checkbox", "radio", "submit", "reset", "range", "color", "file", "image"].includes(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.closest("[role='textbox'], [role='searchbox'], [role='combobox']") !== null;
}

/** "Undo: Move layer" -> "Move layer", "Undo" -> "". A label that does not start with the verb is taken as the step itself. */
function stepOf(label: string, verb: string): string {
  return label.trim().replace(new RegExp(`^${verb}\\b\\s*:?\\s*`, "i"), "");
}

/** Keys are drawn for the platform, resolved after mount so the server and the browser agree. */
function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setMac(/mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent));
  }, []);
  return mac;
}

interface StepButtonProps {
  icon: ReactElement;
  label: string;
  /** What the tooltip says when the button is dimmed. */
  emptyTip: string;
  keys: readonly string[];
  shortcuts: string | undefined;
  disabled: boolean;
  variant: "outline" | "ghost";
  size: "sm" | "md" | "lg";
  placement: "start" | "end";
  /** True for a moment after the shortcut ran, so a key press shows on the button it belongs to. */
  flashing: boolean;
  onPress: () => void;
}

function StepButton({ icon, label, emptyTip, keys, shortcuts, disabled, variant, size, placement, flashing, onPress }: StepButtonProps) {
  const joined = variant === "outline";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="icon-sm"
          aria-label={label}
          aria-disabled={disabled || undefined}
          aria-keyshortcuts={shortcuts}
          // The name already says it; the tooltip only repeats it and adds the keys.
          aria-describedby={undefined}
          data-flash={flashing || undefined}
          className={cn(
            BOX[size],
            "data-[flash=true]:bg-muted data-[flash=true]:text-foreground",
            "aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:active:translate-y-0",
            joined ? "aria-disabled:hover:border-border aria-disabled:hover:bg-background" : "aria-disabled:hover:bg-transparent",
            joined && "hover:z-10 focus-visible:z-10 active:not-disabled:translate-y-0",
            joined && (placement === "start" ? "rounded-e-none" : "-ms-px rounded-s-none"),
          )}
          onClick={(event) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            onPress();
          }}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className={cn(!disabled && keys.length ? "flex items-center gap-2.5" : undefined)}>
        {disabled ? emptyTip : label}
        {!disabled && keys.length ? (
          <KbdGroup aria-hidden="true">
            {keys.map((key, index) => (
              <Kbd key={`${key}-${index}`} className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">
                {key}
              </Kbd>
            ))}
          </KbdGroup>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The undo and redo pair of any editor. Each button is dimmed, not removed,
 * when there is nothing to step through, so a toolbar never shifts; the
 * tooltip names the next step ("Undo: Move layer") and the shortcut for the
 * platform, and the shortcuts are bound for you without touching a field the
 * person is typing in. A polite live region says what happened ("Undid: Move
 * layer"). It owns no history: keep yours in a reducer, a store or the editor
 * itself and wire the two callbacks.
 */
export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  undoLabel = "Undo",
  redoLabel = "Redo",
  bindKeys = true,
  scope,
  size = "md",
  variant = "outline",
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: UndoRedoButtonsProps) {
  const text = {
    group: labels?.group ?? "History",
    nothingToUndo: labels?.nothingToUndo ?? "Nothing to undo",
    nothingToRedo: labels?.nothingToRedo ?? "Nothing to redo",
    undone: labels?.undone ?? "Undid: {step}",
    redone: labels?.redone ?? "Redid: {step}",
    anyStep: labels?.anyStep ?? "the last change",
  };
  const mac = useIsMac();
  const [heard, setHeard] = useState({ id: 0, text: "" });
  const [flash, setFlash] = useState<"undo" | "redo" | null>(null);
  const clearTimer = useRef<number>(undefined);
  const flashTimer = useRef<number>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(clearTimer.current);
      window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const blink = (which: "undo" | "redo") => {
    window.clearTimeout(flashTimer.current);
    setFlash(which);
    flashTimer.current = window.setTimeout(() => setFlash(null), 180);
  };

  const say = (message: string) => {
    window.clearTimeout(clearTimer.current);
    // A new id remounts the text, so saying the same thing twice is heard twice.
    setHeard((previous) => ({ id: previous.id + 1, text: message }));
    clearTimer.current = window.setTimeout(() => setHeard((previous) => ({ ...previous, text: "" })), 3000);
  };

  const undo = () => {
    if (!canUndo) {
      say(text.nothingToUndo);
      return;
    }
    const step = stepOf(undoLabel, "Undo") || text.anyStep;
    onUndo();
    say(text.undone.replace("{step}", step));
  };
  const redo = () => {
    if (!canRedo) {
      say(text.nothingToRedo);
      return;
    }
    const step = stepOf(redoLabel, "Redo") || text.anyStep;
    onRedo();
    say(text.redone.replace("{step}", step));
  };

  const latest = useRef({ undo, redo, canUndo, canRedo, blink });
  useEffect(() => {
    latest.current = { undo, redo, canUndo, canRedo, blink };
  });

  useEffect(() => {
    if (!bindKeys) return;
    const host: EventTarget = scope?.current ?? document;
    const onKey = (raw: Event) => {
      const event = raw as KeyboardEvent;
      if (event.defaultPrevented || event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey) || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      const now = latest.current;
      if (key === "z" && !event.shiftKey) {
        // Nothing to undo: say so, and leave the key to the browser.
        if (now.canUndo) {
          event.preventDefault();
          now.blink("undo");
        }
        now.undo();
      } else if ((key === "z" && event.shiftKey) || (key === "y" && event.ctrlKey && !event.metaKey && !event.shiftKey)) {
        if (now.canRedo) {
          event.preventDefault();
          now.blink("redo");
        }
        now.redo();
      }
    };
    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [bindKeys, scope]);

  const joined = variant === "outline";
  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="group"
        aria-label={ariaLabel ?? text.group}
        data-slot="undo-redo-buttons"
        data-size={size}
        data-variant={variant}
        className={cn("inline-flex items-center", joined ? "rounded-md shadow-xs" : "gap-0.5", className)}
        {...props}
      >
        <StepButton
          icon={<IconUndo />}
          label={undoLabel}
          emptyTip={text.nothingToUndo}
          keys={mac ? ["⌘", "Z"] : ["Ctrl", "Z"]}
          shortcuts={bindKeys ? "Control+Z Meta+Z" : undefined}
          disabled={!canUndo}
          variant={variant}
          size={size}
          placement="start"
          flashing={flash === "undo"}
          onPress={undo}
        />
        <StepButton
          icon={<IconRedo />}
          label={redoLabel}
          emptyTip={text.nothingToRedo}
          keys={mac ? ["⇧", "⌘", "Z"] : ["Ctrl", "Y"]}
          shortcuts={bindKeys ? "Control+Y Control+Shift+Z Meta+Shift+Z" : undefined}
          disabled={!canRedo}
          variant={variant}
          size={size}
          placement="end"
          flashing={flash === "redo"}
          onPress={redo}
        />
        <span role="status" className="sr-only">
          <span key={heard.id}>{heard.text}</span>
        </span>
      </div>
    </TooltipProvider>
  );
}
