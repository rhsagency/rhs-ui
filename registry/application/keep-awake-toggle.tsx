"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { IconSunMoonAnimated } from "@rhs-ui/icons/animated/sun-moon";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

/** A held screen wake lock: release it to let the screen sleep again. */
export interface WakeLockSentinelLike {
  /** Lets the screen sleep again. */
  release(): Promise<void>;
  /** Optional: tells when the browser let go by itself, for example when the tab was hidden. */
  addEventListener?(type: "release", listener: () => void): void;
}

/** The part of `navigator.wakeLock` this switch uses. Pass your own for a native shell or to try every outcome. */
export interface WakeLockLike {
  /** Asks for the lock. It rejects, usually with a NotAllowedError, when the browser refuses. */
  request(type: "screen"): Promise<WakeLockSentinelLike>;
}

export interface KeepAwakeToggleProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** Controlled: whether the screen is kept on. Pair it with `onChange`; a refused request calls `onChange(false)`. */
  on?: boolean;
  /**
   * Where an uncontrolled switch starts. Default false. Nothing is requested on load: a switch that starts on
   * (here or through `on`) asks for the lock at the first touch or key press, because a wake lock is a promise
   * to a person who is there.
   */
  defaultOn?: boolean;
  /** Called with the new state when the switch is turned, and with false when the browser refuses or drops the request. */
  onChange?: (on: boolean) => void;
  /** The switch's label. Default "Keep screen on". */
  label?: string;
  /** A line under the label on why you would: "Stops the screen from dimming while you cook." */
  description?: ReactNode;
  /** The size of the row and its switch. Default "default". */
  size?: "sm" | "default";
  /** Disables the switch. */
  disabled?: boolean;
  /** Where wake locks come from. Defaults to `navigator.wakeLock`. */
  wakeLock?: WakeLockLike;
}

const SIZES = {
  sm: { tile: "size-8 [&_svg]:size-4", label: "h-5", switch: "h-5 w-9 [&>span]:size-3.5 [&>span[data-state=checked]]:translate-x-4", text: "text-[0.8125rem]" },
  default: { tile: "size-9 [&_svg]:size-[1.125rem]", label: "h-6", switch: "", text: "text-sm" },
} as const;

/** Why the browser said no, in a line a person can act on. */
function refusal(reason: unknown): string {
  const name = reason instanceof Error ? reason.name : "";
  return name === "NotAllowedError" ? "Could not keep the screen on. Battery saver or a low battery may be blocking it." : "Could not keep the screen on in this browser.";
}

/**
 * A switch that keeps the screen on for recipes, scripts and slides, using the
 * Wake Lock API. It asks for the lock when turned on, asks again when the tab
 * comes back (browsers let go of it while a tab is hidden), lets go when it is
 * turned off or the page goes, and if the browser refuses, such as on a low
 * battery or under a permissions policy, the switch returns to off with one
 * line saying why. Where the API does not exist it renders nothing, so a page
 * never shows a switch that cannot work. The state is `aria-checked` on a real
 * switch, a polite message confirms "Screen will stay on", and nothing is
 * requested on load.
 */
export function KeepAwakeToggle({
  on: controlled,
  defaultOn = false,
  onChange,
  label = "Keep screen on",
  description,
  size = "default",
  disabled = false,
  wakeLock,
  className,
  ...props
}: KeepAwakeToggleProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultOn);
  // Rendered first, so the server and the browser agree; a browser without the API takes it away right after.
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const lease = useRef<WakeLockSentinelLike | null>(null);
  const wanted = useRef(false);
  const activated = useRef(false);
  const alive = useRef(true);
  const source = useRef(wakeLock);
  const latest = useRef({ controlled, onChange });

  const on = controlled ?? own;
  useEffect(() => {
    source.current = wakeLock;
    latest.current = { controlled, onChange };
  });

  // `navigator.wakeLock` is typed here, because older TypeScript libs do not know it.
  const api = (): WakeLockLike | undefined => source.current ?? (typeof navigator !== "undefined" ? (navigator as unknown as { wakeLock?: WakeLockLike }).wakeLock : undefined);

  async function acquire(): Promise<void> {
    const wake = api();
    if (!wake) throw new Error("No Wake Lock API.");
    const held = await wake.request("screen");
    // They may have changed their mind, or left, while the browser was thinking.
    if (!alive.current || !wanted.current) {
      void held.release().catch(() => undefined);
      return;
    }
    lease.current = held;
    held.addEventListener?.("release", () => {
      if (lease.current === held) lease.current = null;
    });
  }

  async function release(): Promise<void> {
    const held = lease.current;
    lease.current = null;
    await held?.release().catch(() => undefined);
  }

  function refused(reason: unknown): void {
    wanted.current = false;
    lease.current = null;
    setError(refusal(reason));
    setAnnouncement(refusal(reason));
    if (latest.current.controlled === undefined) setOwn(false);
    latest.current.onChange?.(false);
  }

  useEffect(() => {
    setSupported(Boolean(wakeLock) || (typeof navigator !== "undefined" && "wakeLock" in navigator));
  }, [wakeLock]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      wanted.current = false;
      void release();
    };
  }, []);

  // Whether the person has done anything on this page yet. A lock is only ever asked for after that.
  const touched = (): boolean => activated.current || (typeof navigator !== "undefined" && (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive === true);

  // The switch is the truth: whenever it is on, a lock is held or being asked for; whenever it is off, none is.
  useEffect(() => {
    wanted.current = on;
    if (!on) {
      void release();
      return;
    }
    let current = true;
    const ask = () => {
      acquire().then(
        () => {
          if (!current || !wanted.current) return;
          setError(null);
          setAnnouncement("Screen will stay on.");
        },
        (reason: unknown) => {
          if (current) refused(reason);
        },
      );
    };
    if (touched()) {
      ask();
      return () => {
        current = false;
      };
    }
    // A page that opens with the switch already on waits for the first touch or key press: nothing is requested on load.
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const off = () => events.forEach((name) => window.removeEventListener(name, first, true));
    function first() {
      off();
      activated.current = true;
      if (current && wanted.current) ask();
    }
    events.forEach((name) => window.addEventListener(name, first, { capture: true, passive: true }));
    return () => {
      current = false;
      off();
    };
  }, [on]);

  useEffect(() => {
    const back = () => {
      if (document.visibilityState !== "visible" || !wanted.current || lease.current || !touched()) return;
      acquire().catch((reason: unknown) => refused(reason));
    };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, []);

  if (!supported) return null;

  const look = SIZES[size];
  return (
    // With words under the label the tile sits at the top beside them; with only the label, everything shares the tile's centre line.
    <div data-slot="keep-awake-toggle" data-on={on} className={cn("flex gap-3.5", description || error ? "items-start" : "items-center", className)} {...props}>
      <span
        aria-hidden="true"
        className={cn(
          "relative grid shrink-0 place-items-center rounded-lg border transition-colors duration-200 motion-reduce:transition-none",
          look.tile,
          on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/60 text-muted-foreground",
        )}
      >
        {/* The sun draws in its rays and turns into the moon: lit while the screen is kept on, a moon while it may sleep. */}
        <IconSunMoonAnimated active={!on} />
      </span>
      <div className="min-w-0 flex-1">
        <div className={cn("flex items-center", look.label)}>
          <Label htmlFor={id} className={look.text}>
            {label}
          </Label>
        </div>
        {description ? (
          <p id={`${id}-description`} className="mt-1 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug font-medium text-destructive">
            <IconAlertCircle className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={on}
        disabled={disabled}
        aria-describedby={description ? `${id}-description` : undefined}
        onCheckedChange={(next) => {
          activated.current = true;
          setError(null);
          if (controlled === undefined) setOwn(next);
          onChange?.(next);
          if (!next) setAnnouncement("Screen can sleep again.");
        }}
        className={look.switch}
      />
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
