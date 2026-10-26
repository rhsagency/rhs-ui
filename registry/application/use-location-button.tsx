"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck, IconLocate, IconLock } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** Where the person is, as the browser worked it out. `accuracy` is a radius in metres. */
export interface LocatePosition {
  /** Degrees north of the equator. */
  latitude: number;
  /** Degrees east of Greenwich. */
  longitude: number;
  /** How far off it may be, as a radius in metres. */
  accuracy: number;
}

/** Why a position could not be had: the person (or their settings) said no, the device could not tell, or it took too long. */
export type LocateFailure = "denied" | "unavailable" | "timeout";

/** What the button is showing. */
export type LocateStatus = "idle" | "locating" | "found" | LocateFailure;

/** The part of `navigator.geolocation` this button uses. Pass your own for a native shell (Capacitor, Tauri) or to try every outcome. */
export interface GeolocationLike {
  /** Asks once for the position: `success` gets it, `failure` gets a code (1 blocked, 2 unavailable, 3 timed out). */
  getCurrentPosition(success: (position: { coords: LocatePosition }) => void, failure: (error: { code: number }) => void, options?: PositionOptions): void;
}

export interface LocateLabels {
  /** At rest. Default "Use my location". */
  idle: string;
  /** While the browser works. Default "Finding you…". */
  locating: string;
  /** Once a position came back. Default "Found you". */
  found: string;
  /** How the accuracy reads next to it; `{distance}` is "40 m". Default "about {distance}". */
  accuracy: string;
  /** When location is blocked for the site. Default "Location blocked". */
  denied: string;
  /** One line under it on how to allow it. */
  deniedHint: string;
  /** When the device could not work out where it is. Default "Location unavailable". */
  unavailable: string;
  /** One line under it on what to check. */
  unavailableHint: string;
  /** When it took longer than `timeoutMs`. Default "Timed out". */
  timeout: string;
  /** One line under it on what to try. */
  timeoutHint: string;
}

export interface UseLocationButtonProps extends Omit<ComponentProps<"div">, "children" | "onError"> {
  /** Called with the position once the browser has one. Nothing is sent anywhere else. */
  onLocate?: (position: LocatePosition) => void;
  /** Called when no position could be had, with the reason. */
  onError?: (reason: LocateFailure) => void;
  /** How long to wait for a position, in milliseconds. Default 10000. */
  timeoutMs?: number;
  /** Ask for GPS-grade accuracy. It takes longer and uses more battery. Default false. */
  highAccuracy?: boolean;
  /** The words, for another language or another tone. */
  labels?: Partial<LocateLabels>;
  /** 32, 36 or 44px. Default "default". */
  size?: "sm" | "default" | "lg";
  /** Any Button variant. Outline by default. */
  variant?: ButtonProps["variant"];
  /** Language of the accuracy figure. Default "en-US". */
  locale?: string;
  /** Where positions come from. Defaults to `navigator.geolocation`. */
  geolocation?: GeolocationLike;
}

const WORDS: LocateLabels = {
  idle: "Use my location",
  locating: "Finding you…",
  found: "Found you",
  accuracy: "about {distance}",
  denied: "Location blocked",
  deniedHint: "Allow location for this site in your browser's address bar, then press the button again.",
  unavailable: "Location unavailable",
  unavailableHint: "Your device could not work out where it is. Check that location services are on, then try again.",
  timeout: "Timed out",
  timeoutHint: "Finding you took too long. Try again, or move somewhere with a clearer view of the sky.",
};

/** Round the way a person would say it: to 5 m under 50 m, to 10 m under a kilometre, then to a tenth of a kilometre. */
function distance(accuracy: number, locale: string, long: boolean): string {
  const far = accuracy >= 1000;
  const value = far ? Math.round(accuracy / 100) / 10 : accuracy < 50 ? Math.max(5, Math.round(accuracy / 5) * 5) : Math.round(accuracy / 10) * 10;
  return new Intl.NumberFormat(locale, { style: "unit", unit: far ? "kilometer" : "meter", unitDisplay: long ? "long" : "short", maximumFractionDigits: 1 }).format(value);
}

/**
 * A "Use my location" button that handles every outcome in words. It asks the
 * browser only when pressed, never on load, and then shows what happened:
 * "Finding you…" with a spinner, "Found you" with the accuracy ("about 40 m"),
 * or why it did not work with one line on what to do next: blocked in the
 * address bar, unavailable on this device, or too slow. Where the Permissions
 * API exists it reads it on load, so a site that is already blocked says so
 * before the first press. Every result is announced politely; where the browser
 * has no geolocation at all the button renders nothing. It pairs with store
 * finders and address forms and sends nothing anywhere itself.
 */
export function UseLocationButton({
  onLocate,
  onError,
  timeoutMs = 10_000,
  highAccuracy = false,
  labels,
  size = "default",
  variant = "outline",
  locale = "en-US",
  geolocation,
  className,
  ...props
}: UseLocationButtonProps) {
  const hint = useId();
  const words = { ...WORDS, ...labels };
  const [status, setStatus] = useState<LocateStatus>("idle");
  const [position, setPosition] = useState<LocatePosition | null>(null);
  const [blocked, setBlocked] = useState(false);
  // Rendered first, so the server and the browser agree; a browser with no geolocation takes it away right after.
  const [supported, setSupported] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const turn = useRef(0);
  const timer = useRef<number>(undefined);
  const callbacks = useRef({ onLocate, onError });
  useEffect(() => {
    callbacks.current = { onLocate, onError };
  });

  useEffect(() => {
    if (!geolocation && !("geolocation" in navigator)) {
      setSupported(false);
      return;
    }
    let live = true;
    let permission: PermissionStatus | undefined;
    const sync = () => {
      if (!permission) return;
      setBlocked(permission.state === "denied");
      if (permission.state !== "denied") setStatus((current) => (current === "denied" ? "idle" : current));
    };
    // Not every browser has the Permissions API, or answers for geolocation: then the first press finds out.
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (!live) return;
        permission = result;
        sync();
        result.addEventListener("change", sync);
      })
      .catch(() => undefined);
    return () => {
      live = false;
      turn.current += 1;
      window.clearTimeout(timer.current);
      permission?.removeEventListener("change", sync);
    };
  }, [geolocation]);

  if (!supported) return null;

  const view: LocateStatus = status === "idle" && blocked ? "denied" : status;
  const around = (long: boolean) => (position ? words.accuracy.replace("{distance}", distance(position.accuracy, locale, long)) : "");

  /** The first answer for a press wins: later ones, such as a result that arrives after the wait ran out, are dropped. */
  function settle(mine: number, next: LocateStatus, spoken: string): boolean {
    if (mine !== turn.current) return false;
    turn.current += 1;
    window.clearTimeout(timer.current);
    setStatus(next);
    setAnnouncement(spoken);
    return true;
  }

  function locate(): void {
    if (view === "locating") return;
    const source = geolocation ?? navigator.geolocation;
    const mine = ++turn.current;
    setStatus("locating");
    setAnnouncement("Finding your location.");
    const fail = (reason: LocateFailure) => {
      const title = reason === "denied" ? words.denied : reason === "timeout" ? words.timeout : words.unavailable;
      const next = reason === "denied" ? words.deniedHint : reason === "timeout" ? words.timeoutHint : words.unavailableHint;
      if (settle(mine, reason, `${title}. ${next}`)) callbacks.current.onError?.(reason);
    };
    // Some browsers never answer when the permission prompt is dismissed, so the wait has an end of its own.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fail("timeout"), timeoutMs + 20_000);
    source.getCurrentPosition(
      ({ coords }) => {
        const found = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
        if (!settle(mine, "found", `${words.found}, ${words.accuracy.replace("{distance}", distance(found.accuracy, locale, true))}.`)) return;
        setPosition(found);
        callbacks.current.onLocate?.(found);
      },
      (failure) => fail(failure.code === 1 ? "denied" : failure.code === 3 ? "timeout" : "unavailable"),
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 0 },
    );
  }

  const detail = view === "denied" ? words.deniedHint : view === "unavailable" ? words.unavailableHint : view === "timeout" ? words.timeoutHint : null;
  const failure = view === "unavailable" || view === "timeout";

  return (
    <div data-slot="use-location-button" data-status={view} className={cn("inline-flex max-w-full flex-col items-start gap-2", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-busy={view === "locating" || undefined}
        aria-disabled={view === "locating" || undefined}
        aria-describedby={detail ? hint : undefined}
        onClick={locate}
        className="max-w-full aria-disabled:cursor-progress"
      >
        {view === "locating" ? (
          <Spinner size={16} label="" role="presentation" aria-hidden="true" />
        ) : view === "found" ? (
          <IconCheck />
        ) : view === "denied" ? (
          <IconLock />
        ) : failure ? (
          <IconAlertCircle className="text-destructive" />
        ) : (
          <IconLocate />
        )}
        <span className="min-w-0 truncate">{words[view]}</span>
        {view === "found" ? <span className="min-w-0 truncate font-normal text-muted-foreground">{around(false)}</span> : null}
      </Button>
      {detail ? (
        <p id={hint} className="max-w-xs text-xs leading-snug text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
