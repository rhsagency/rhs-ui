"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface HoldToConfirmButtonProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "type"> {
  /** What it does, and how to do it: "Hold to delete project". The text always says how to confirm, so the gesture is never a secret. */
  label: string;
  /** Shown while the button is held, before the fill is full. Default "Keep holding". */
  holdLabel?: string;
  /** Shown after a quick press, for the three seconds in which a second press confirms. Default "Press again to confirm". */
  armedLabel?: string;
  /** Shown once it is confirmed. Default "Done". */
  confirmedLabel?: string;
  /** Called once, when the hold reaches the end or a second press confirms. */
  onConfirm: () => void;
  /** How long to hold, in milliseconds. Default 1200. */
  duration?: number;
  /** `destructive` fills with the destructive colour. Default "default". */
  tone?: "default" | "destructive";
  /** `outline` has a border; `soft` is a tinted surface. */
  variant?: "outline" | "soft";
  /** Button height: 32, 36 or 44px. */
  size?: "sm" | "md" | "lg";
  /** An icon before the label, while at rest. */
  icon?: ReactNode;
  /** How long the confirmed state stays before the button is ready again, in milliseconds. Default 2000. */
  resetAfter?: number;
}

type Phase = "idle" | "holding" | "armed" | "confirmed";

const PHASES: readonly Phase[] = ["idle", "holding", "armed", "confirmed"];
const BUTTON_SIZE = { sm: "sm", md: "default", lg: "lg" } as const;
/** A press shorter than this is a tap, not an attempt to hold. */
const TAP_MS = 350;
/** The time a second press may take to confirm, after a tap. */
const ARM_MS = 3000;

// Colours per tone and variant. The label is drawn twice, in the resting colour and (clipped to the fill) in the inverted one, so it stays legible on both sides of the sweep.
// Red text on a red tint is a shade darker than the destructive colour itself (a mix with the foreground), so it keeps 4.5:1 on the tint.
const LOOK = {
  default: {
    outline: "border-border bg-background text-foreground hover:bg-muted data-[phase=holding]:border-foreground data-[phase=confirmed]:border-foreground",
    soft: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70",
    fill: "bg-foreground",
    inverted: "text-background",
  },
  destructive: {
    outline:
      "border-destructive/40 bg-background text-destructive hover:border-destructive/70 hover:bg-destructive/5 hover:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)] data-[phase=holding]:border-destructive data-[phase=confirmed]:border-destructive",
    soft: "border-transparent bg-destructive/10 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)] hover:bg-destructive/15",
    fill: "bg-destructive",
    inverted: "text-destructive-foreground",
  },
} as const;

/**
 * A button for an action that should not happen by accident: press and hold,
 * and a fill sweeps across until it is full, then `onConfirm` runs once.
 * Letting go, leaving the button, scrolling or pressing Escape rolls it back.
 * Holding is impossible for some people, so a quick press also works as the
 * first half of a pair: it says "Press again to confirm" (and a screen reader
 * hears it) and a second press within three seconds confirms. Pointer, touch
 * and the Space and Enter keys held down all count as holding. The words
 * change with the state in a button that stays the width of the longest, and
 * under reduced motion the fill steps instead of sweeping.
 */
export function HoldToConfirmButton({
  label,
  holdLabel = "Keep holding",
  armedLabel = "Press again to confirm",
  confirmedLabel = "Done",
  onConfirm,
  duration = 1200,
  tone = "default",
  variant = "outline",
  size = "md",
  icon,
  resetAfter = 2000,
  disabled,
  className,
  style,
  onPointerDown,
  onPointerUp,
  onPointerMove,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  onContextMenu,
  ...props
}: HoldToConfirmButtonProps) {
  const [holding, setHolding] = useState(false);
  const [armed, setArmed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [said, setSaid] = useState({ id: 0, text: "" });

  const source = useRef<"pointer" | "key" | null>(null);
  const startedAt = useRef(0);
  const holdTimer = useRef<number>(undefined);
  const armTimer = useRef<number>(undefined);
  const resetTimer = useRef<number>(undefined);
  const clickTimer = useRef<number>(undefined);
  const armedNow = useRef(false);
  const confirmedNow = useRef(false);
  const swallowClick = useRef(false);
  const confirmCallback = useRef(onConfirm);
  useEffect(() => {
    confirmCallback.current = onConfirm;
  });
  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
      window.clearTimeout(armTimer.current);
      window.clearTimeout(resetTimer.current);
      window.clearTimeout(clickTimer.current);
    },
    [],
  );

  // Escape rolls the hold back wherever focus is.
  useEffect(() => {
    if (!holding) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      window.clearTimeout(holdTimer.current);
      source.current = null;
      setHolding(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [holding]);

  const say = (text: string) => setSaid((previous) => ({ id: previous.id + 1, text }));

  const stop = () => {
    window.clearTimeout(holdTimer.current);
    source.current = null;
    setHolding(false);
  };

  const confirm = () => {
    if (confirmedNow.current) return;
    confirmedNow.current = true;
    window.clearTimeout(armTimer.current);
    armedNow.current = false;
    setArmed(false);
    setConfirmed(true);
    say(confirmedLabel);
    // A short buzz on phones that can: the one place a hold ends is worth feeling. Only after the person has touched the page, or the browser objects.
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function" && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate(14);
    confirmCallback.current();
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      confirmedNow.current = false;
      setConfirmed(false);
    }, resetAfter);
  };

  const arm = () => {
    if (confirmedNow.current) return;
    armedNow.current = true;
    setArmed(true);
    say(armedLabel);
    window.clearTimeout(armTimer.current);
    armTimer.current = window.setTimeout(() => {
      armedNow.current = false;
      setArmed(false);
    }, ARM_MS);
  };

  const tap = () => {
    if (confirmedNow.current) return;
    if (armedNow.current) confirm();
    else arm();
  };

  /** The click that follows a press belongs to the press. If no click comes (the pointer left, the press was cancelled) the flag must not outlive it. */
  const settleClick = () => {
    window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      swallowClick.current = false;
    }, 400);
  };

  const begin = (by: "pointer" | "key") => {
    if (disabled || confirmedNow.current || source.current) return;
    source.current = by;
    startedAt.current = performance.now();
    setHolding(true);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      stop();
      confirm();
    }, duration);
  };

  /** The press ended where it began. Short means a tap; longer and early means it was given up. */
  const release = () => {
    if (!source.current) return;
    const held = performance.now() - startedAt.current;
    stop();
    if (held < Math.min(TAP_MS, duration / 3)) tap();
  };

  const inside = (event: PointerEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
  };

  const phase: Phase = confirmed ? "confirmed" : holding ? "holding" : armed ? "armed" : "idle";
  const filled = holding || confirmed;
  const look = LOOK[tone];
  const texts: Record<Phase, string> = { idle: label, holding: holdLabel, armed: armedLabel, confirmed: confirmedLabel };

  const words = (hidden: boolean) => (
    <span className="inline-grid">
      {PHASES.map((item) => (
        <span
          key={item}
          aria-hidden={hidden || item !== phase ? true : undefined}
          className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none", item === phase ? "opacity-100" : "opacity-0")}
        >
          {item === "idle" ? icon : item === "confirmed" ? <IconCheck /> : null}
          {texts[item]}
        </span>
      ))}
    </span>
  );

  // The fill and the inverted label are clipped by the same shape over the same time, so they move as one.
  const sweep = cn(
    "[transition-property:clip-path] motion-reduce:[transition-timing-function:steps(6,end)]",
    filled ? "[clip-path:inset(0_0_0_0)] [transition-duration:var(--hold)] ease-linear" : "[clip-path:inset(0_100%_0_0)] duration-200 ease-out motion-reduce:duration-0",
  );

  return (
    <>
      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size={BUTTON_SIZE[size]}
        data-slot="hold-to-confirm-button"
        data-phase={phase}
        data-tone={tone}
        disabled={disabled}
        aria-disabled={confirmed || undefined}
        style={{ "--hold": `${duration}ms`, ...style } as CSSProperties}
        className={cn(
          "relative touch-manipulation select-none [-webkit-touch-callout:none]",
          variant === "outline" ? look.outline : look.soft,
          confirmed && "cursor-default",
          className,
        )}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || (event.pointerType === "mouse" && event.button !== 0)) return;
          swallowClick.current = true;
          window.clearTimeout(clickTimer.current);
          begin("pointer");
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          // A touch keeps its target while the finger leaves the button, so the edge is checked by hand.
          if (source.current === "pointer" && !inside(event)) stop();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          settleClick();
          if (source.current !== "pointer") return;
          if (inside(event)) release();
          else stop();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (event.pointerType !== "mouse") return;
          settleClick();
          if (source.current === "pointer") stop();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          settleClick();
          if (source.current === "pointer") stop();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || (event.key !== " " && event.key !== "Enter")) return;
          // Holding the key is the gesture, so the browser's own click on Enter or Space is not wanted.
          event.preventDefault();
          if (!event.repeat) begin("key");
        }}
        onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
          onKeyUp?.(event);
          if (event.key !== " " && event.key !== "Enter") return;
          event.preventDefault();
          if (source.current === "key") release();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (source.current === "key") stop();
        }}
        onContextMenu={(event) => {
          onContextMenu?.(event);
          // A long press on a touch screen opens a context menu; that must not eat the hold.
          if (holding) event.preventDefault();
        }}
        // A click with no press before it comes from assistive technology or voice control: it counts as a tap.
        onClick={() => {
          if (swallowClick.current) {
            swallowClick.current = false;
            return;
          }
          tap();
        }}
        {...props}
      >
        {words(false)}
        {/* One step outside the padding box, so the fill covers the border too and no hairline is left between them. */}
        <span aria-hidden="true" className="pointer-events-none absolute -inset-px overflow-hidden rounded-[inherit]">
          <span className={cn("absolute inset-0", look.fill, sweep)} />
          <span className={cn("absolute inset-0 inline-flex items-center justify-center", look.inverted, sweep)}>{words(true)}</span>
        </span>
      </Button>
    </>
  );
}
