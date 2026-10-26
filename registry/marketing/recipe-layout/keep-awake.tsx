"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

/** The part of a held screen wake lock this switch uses. */
interface WakeLockHold {
  release(): Promise<void>;
  addEventListener(type: "release", listener: () => void): void;
}

interface WakeLockSource {
  request(type: "screen"): Promise<WakeLockHold>;
}

export interface KeepAwakeProps {
  /** The switch's label: "Keep screen awake". */
  label: string;
  /** A line under it on why you would. */
  hint?: string;
  /** Said when the browser refuses the lock: "Your browser would not keep the screen on." */
  refusal?: string;
  className?: string;
}

/**
 * A switch that keeps the screen on while you cook, using the Wake Lock API.
 * It exists only where the browser has the API: the server and the first
 * render show nothing, and a browser without it never shows a switch that
 * cannot work. It asks for the lock when turned on, asks again when the tab
 * comes back (browsers let go of it while a tab is hidden), and lets go when
 * turned off or when the page goes. If the browser refuses, for example on a
 * low battery, the switch goes back to off.
 */
export function KeepAwake({ label, hint, refusal = "Your browser would not keep the screen on. Battery saver can block it.", className }: KeepAwakeProps) {
  const id = useId();
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [refused, setRefused] = useState(false);
  const hold = useRef<WakeLockHold | null>(null);
  const wanted = useRef(false);

  const source = (): WakeLockSource | undefined => (navigator as unknown as { wakeLock?: WakeLockSource }).wakeLock;

  async function acquire() {
    try {
      const held = await source()?.request("screen");
      if (!held) throw new Error("No Wake Lock API.");
      // The cook may have switched it off, or left, while the browser was thinking.
      if (!wanted.current) {
        void held.release().catch(() => undefined);
        return;
      }
      hold.current = held;
      held.addEventListener("release", () => {
        if (hold.current === held) hold.current = null;
      });
    } catch {
      wanted.current = false;
      setOn(false);
      setRefused(true);
    }
  }

  async function release() {
    const held = hold.current;
    hold.current = null;
    await held?.release().catch(() => undefined);
  }

  useEffect(() => {
    setSupported(Boolean(source()));
    const back = () => {
      if (document.visibilityState === "visible" && wanted.current && !hold.current) void acquire();
    };
    document.addEventListener("visibilitychange", back);
    return () => {
      document.removeEventListener("visibilitychange", back);
      wanted.current = false;
      void release();
    };
  }, []);

  if (!supported) return null;

  return (
    <div data-slot="keep-awake" className={cn("flex items-start gap-3", className)}>
      <Switch
        id={id}
        checked={on}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onCheckedChange={(next) => {
          setRefused(false);
          setOn(next);
          wanted.current = next;
          if (next) void acquire();
          else void release();
        }}
      />
      <div className="min-w-0">
        <Label htmlFor={id} className="h-6 text-sm">
          {label}
        </Label>
        {hint ? (
          <p id={`${id}-hint`} className="text-xs leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
        <p role="status" className={cn("text-xs leading-snug font-medium text-destructive", refused ? "mt-1" : "sr-only")}>
          {refused ? refusal : ""}
        </p>
      </div>
    </div>
  );
}
