"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconRefresh, IconWifi, IconWifiOff } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the state uses, for translation. `{date}` is filled in. */
export interface OfflineStateLabels {
  /** The heading while the connection is down. Default "You are offline". */
  title?: string;
  /** What is safe, under the heading. Default "Your work is saved on this device and will sync as soon as you are back online." */
  description?: string;
  /** The line with the moment of the last save, shown when you pass `cachedAt`. Default "Last saved {date}". */
  cached?: string;
  /** The heading above what you pass as children. Default "Still works offline". */
  stillWorks?: string;
  /** The button. Default "Try again". */
  retry?: string;
  /** Said under the button when a try did not get you back online. Default "Still offline. We will try again by ourselves when the connection returns." */
  stillOffline?: string;
  /** The heading for the moment after the connection came back. Default "Back online". */
  backTitle?: string;
  /** Under that heading. Default "You are connected again. Syncing your changes now." */
  backDescription?: string;
}

export interface OfflineStateProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Overrides what the browser says: `false` shows the state, `true` hides it. Leave it out to follow the browser's own online and offline events, for a page that has no better test of the connection. */
  online?: boolean;
  /** Called once when the connection returns, and each time Try again is pressed. It may return a promise: the button shows a spinner until it settles. Refetch what the page needs here. */
  onRetry?: () => void | Promise<void>;
  /** When the copy kept on the device was last updated. Written in the locale and the zone, with the zone's name. */
  cachedAt?: Date | string | number;
  /** What still works offline, as a list: "Read your saved projects", "Edit notes (they sync later)". A plain `<ul>` with `<li>` items is spaced for you. */
  children?: ReactNode;
  /** Heading level of the title. Default 2; use 1 when the state is the whole page. */
  headingLevel?: 1 | 2 | 3 | 4;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the state uses, for translation. */
  labels?: OfflineStateLabels;
}

const DEFAULT_LABELS = {
  title: "You are offline",
  description: "Your work is saved on this device and will sync as soon as you are back online.",
  cached: "Last saved {date}",
  stillWorks: "Still works offline",
  retry: "Try again",
  stillOffline: "Still offline. We will try again by ourselves when the connection returns.",
  backTitle: "Back online",
  backDescription: "You are connected again. Syncing your changes now.",
} satisfies Required<OfflineStateLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** How long "Back online" stays before the state steps aside. */
const RESTORED_MS = 2600;

/** A try always takes this long to show, so a click is never answered by a flicker. */
const MIN_TRY_MS = 700;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function momentIn(input: Date | string | number, locale: string, timeZone: string): string | null {
  const at = new Date(input).getTime();
  if (Number.isNaN(at)) return null;
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" };
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

/** The icon, the heading, a line under it and what goes with it. The heading is the item's own, so its level is yours to set. */
function Notice({ level, title, description, icon, children }: { level: 1 | 2 | 3 | 4; title: string; description: string; icon: ReactNode; children?: ReactNode }) {
  const Heading = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <div className="flex w-full max-w-lg flex-col items-center text-center">
      <div aria-hidden="true" className="mb-6 grid size-14 place-items-center rounded-xl border border-border bg-muted">
        {icon}
      </div>
      <Heading className="text-lg font-medium tracking-tight">{title}</Heading>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

/**
 * The page-sized "you are offline" state. While the connection is down it
 * replaces the page with a wifi-off icon, "You are offline", a line on what is
 * safe on the device, what still works (your children) and a Try again button.
 * It follows the browser's online and offline events, or your own `online`.
 * When the connection returns it says "Back online" for a moment, calls
 * `onRetry` once so the page can refetch, and steps aside. It stays out of the
 * way while the browser already knows it is online, including the first paint,
 * and the change is announced politely instead of stealing focus. The title is
 * a heading of the level you choose (2 unless you set `headingLevel`), and the
 * "Still offline" line under the button has its room from the start, so
 * pressing Try again never moves the button.
 */
export function OfflineState({ online, onRetry, cachedAt, children, headingLevel = 2, locale = "en-US", timeZone = "UTC", labels, className, ...props }: OfflineStateProps) {
  const text: Required<OfflineStateLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  // The server and the first paint assume the browser is online, so the state never flashes for a visitor who is.
  const browser = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const connected = online ?? browser;

  // A connection that comes back is a moment: "Back online" shows, onRetry runs once, and the state steps aside. Worked out while rendering, from what it saw last.
  const [seen, setSeen] = useState(connected);
  const [restored, setRestored] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  if (connected !== seen) {
    setSeen(connected);
    setRestored(connected);
    setFailed(false);
  }

  const handedOver = useRef(false);
  useEffect(() => {
    if (!restored) {
      handedOver.current = false;
      return;
    }
    if (!handedOver.current) {
      handedOver.current = true;
      void onRetry?.();
    }
    const timer = setTimeout(() => setRestored(false), RESTORED_MS);
    return () => clearTimeout(timer);
    // onRetry runs once per return of the connection, not each time its identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restored]);

  const latest = useRef(connected);
  useEffect(() => {
    latest.current = connected;
  });

  async function retry() {
    const started = Date.now();
    setRetrying(true);
    setFailed(false);
    try {
      await onRetry?.();
    } catch {
      // The page's own error handling decides what a failed refetch means; here it is only a try that did not work.
    }
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_TRY_MS - (Date.now() - started))));
    setRetrying(false);
    if (!latest.current) setFailed(true);
  }

  const phase = !connected ? "offline" : restored ? "restored" : "online";
  const saved = cachedAt === undefined ? null : momentIn(cachedAt, locale, timeZone);
  const savedAt = cachedAt === undefined || saved === null ? undefined : new Date(cachedAt).toISOString();
  const announcement = phase === "offline" ? `${text.title}. ${text.description}` : phase === "restored" ? `${text.backTitle}. ${text.backDescription}` : "";

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {phase === "online" ? null : (
        <section data-slot="offline-state" data-state={phase} aria-label={phase === "offline" ? text.title : text.backTitle} className={cn("flex min-h-96 w-full items-center justify-center px-4 py-10", className)} {...props}>
          {phase === "offline" ? (
            <Notice level={headingLevel} title={text.title} description={text.description} icon={<IconWifiOff className="size-6" />}>
              <div className="grid justify-items-center gap-5">
                {saved && savedAt ? (
                  <p className="text-xs leading-5 text-muted-foreground tabular-nums">
                    <time dateTime={savedAt}>{fill(text.cached, { date: saved })}</time>
                  </p>
                ) : null}
                {children ? (
                  <div role="group" aria-labelledby={`${id}-works`} className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-xs">
                    <p id={`${id}-works`} className="text-xs leading-4 font-medium tracking-[0.02em] text-muted-foreground uppercase">
                      {text.stillWorks}
                    </p>
                    <div className="mt-3 text-sm leading-5 [&_li]:flex [&_li]:items-center [&_li]:gap-2.5 [&_ul]:grid [&_ul]:gap-2.5">{children}</div>
                  </div>
                ) : null}
                <div className="grid justify-items-center gap-2.5">
                  <Button type="button" loading={retrying} onClick={() => void retry()}>
                    {retrying ? null : <IconRefresh />}
                    {text.retry}
                  </Button>
                  {/* The line has its room before it has words, so saying "still offline" moves nothing: the state is centred, and a line that grew into the page would lift the button from under the finger that just pressed it. It is no wider than the list above it, so its words do not widen that card either. It is a live region for the same reason: one that is in the page before it speaks is always read. */}
                  <div role="status" className="min-h-10 max-w-64 text-xs leading-5 text-muted-foreground">
                    {failed ? text.stillOffline : null}
                  </div>
                </div>
              </div>
            </Notice>
          ) : (
            <Notice level={headingLevel} title={text.backTitle} description={text.backDescription} icon={<IconWifi className="size-6" />} />
          )}
        </section>
      )}
    </>
  );
}
