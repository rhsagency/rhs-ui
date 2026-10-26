"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { toast } from "@rhs-ui/primitives/toast";

/** Who did it. */
export interface ActivityActor {
  /** The name as it is written in the toast: "Maya Okafor". */
  name: string;
  /** Their picture. Without one, or while it loads, their initials are drawn. */
  image?: string;
  /** True when the actor is the person looking at the screen: nothing is shown for their own actions. */
  self?: boolean;
}

export interface ActivityToastOptions {
  /** Who did it. */
  actor: ActivityActor;
  /** What they did, in the past tense, without their name or what it was done to: "commented on", "joined the workspace". */
  action: string;
  /** What it was done to: "Pricing page". Written after the action. */
  target?: string;
  /** When it happened, as a timestamp in ms or a Date. Written as a relative time. Default: now. */
  at?: number | Date;
  /** A key for events that belong together: "comments:pricing-page". Events with the same group within `mergeWindow` of each other become one toast whose count updates in place. Without a group, nothing merges. */
  group?: string;
  /** The sentence of a merged toast. {count} is how many, {target} what they are about. Default "{count} new updates on {target}", or "{count} new updates" without a target. */
  mergedLabel?: string;
  /** What a merged toast says after the first two names when more people are in it. {count} is how many are not named. Default "+{count} more". */
  moreLabel?: string;
  /** How long after an event another one with the same group still merges into its toast, in ms. Default 8000. */
  mergeWindow?: number;
  /** Adds a View button. Open what happened here: the page, the thread, the comment. For a merged toast it is the latest event's. */
  onView?: () => void;
  /** The text on that button. Default "View". */
  viewLabel?: string;
  /** How long the toast stays, in ms. Every merged event starts it again. Default 6000. */
  duration?: number;
  /** The locale the time and the list of names follow. Default "en-US". */
  locale?: string;
}

interface Person {
  name: string;
  image?: string;
}

interface Burst {
  id: string;
  group: string | undefined;
  count: number;
  /** Everyone in the burst, the latest first. */
  people: Person[];
  lastAt: number;
}

let counter = 0;
/** The toasts that can still take another event, by group. A toast leaves this list when it is gone from the screen. */
const bursts = new Map<string, Burst>();

const toMs = (moment: number | Date): number => (typeof moment === "number" ? moment : moment.getTime());

/** "now", "2 min. ago", "3 hr. ago", "yesterday": the time since `at`, in the locale. */
function since(at: number, now: number, locale: string): string {
  const seconds = Math.round((at - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  const away = Math.abs(seconds);
  if (away < 45) return format.format(0, "second");
  if (away < 3600) return format.format(Math.round(seconds / 60), "minute");
  if (away < 86400) return format.format(Math.round(seconds / 3600), "hour");
  return format.format(Math.round(seconds / 86400), "day");
}

/** Runs `callback` after the component is really gone. React's strict mode unmounts and mounts a component straight away to check it; that is not gone. */
function useGone(callback: () => void) {
  const latest = useRef(callback);
  const alive = useRef(false);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.setTimeout(() => {
        if (!alive.current) latest.current();
      }, 0);
    };
  }, []);
}

function RelativeTime({ at, locale }: { at: number; locale: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time dateTime={new Date(at).toISOString()} className="whitespace-nowrap">
      {since(at, now, locale)}
    </time>
  );
}

/** Replaces {slots} in a template with elements. */
function fillNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((piece, index) => {
    const key = /^\{(\w+)\}$/.exec(piece)?.[1];
    return key !== undefined && key in nodes ? <Fragment key={index}>{nodes[key]}</Fragment> : piece;
  });
}

interface MessageProps {
  burst: Burst;
  actor: ActivityActor;
  action: string;
  target?: string;
  at: number;
  mergedLabel?: string;
  moreLabel?: string;
  locale: string;
  onGone: () => void;
}

/** Spaces that do not break, so a phrase wraps as one piece. */
const glue = (text: string): string => text.replace(/ /g, "\u00a0");

/**
 * The content of the toast: the avatar, the sentence, and the time. It is the
 * same component for the first event and for every one merged into it, so React
 * keeps it and the toast changes in place.
 */
function ActivityMessage({ burst, actor, action, target, at, mergedLabel, moreLabel, locale, onGone }: MessageProps) {
  useGone(onGone);
  const merged = burst.count > 1;
  const strong = (text: ReactNode) => <span className="font-medium text-foreground">{text}</span>;
  const names = burst.people.map((person) => person.name);
  const listed = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names.slice(0, 2));
  const unnamed = names.length - 2;
  const more = unnamed > 0 ? (moreLabel ?? "+{count} more").replace("{count}", new Intl.NumberFormat(locale).format(unnamed)) : "";
  return (
    <span className="flex items-start gap-3">
      {/* The picture says nothing the words do not: it is left out of what a screen reader is told. */}
      <span aria-hidden="true" className="relative shrink-0">
        <Avatar>
          {actor.image ? <AvatarImage src={actor.image} alt="" /> : null}
          <AvatarFallback>{initialsOf(actor.name)}</AvatarFallback>
        </Avatar>
        {merged ? (
          <span className="absolute -right-1 -bottom-1 grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-primary px-1 text-[0.625rem] leading-none font-semibold text-primary-foreground tabular-nums ring-2 ring-popover">{burst.count}</span>
        ) : null}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5 [overflow-wrap:anywhere]">
        <span className="font-normal text-muted-foreground">
          {merged ? (
            fillNodes(mergedLabel ?? (target ? "{count} new updates on {target}" : "{count} new updates"), { count: strong(burst.count), target: strong(target) })
          ) : (
            <>
              {strong(actor.name)} {action}
              {target ? <> {strong(target)}</> : null}
            </>
          )}
        </span>
        {/* A toast is announced as its text nodes one after the other, with nothing in between: these pauses keep the sentence, the people and the time apart. */}
        <span className="sr-only">, </span>
        <span className="text-xs font-normal text-muted-foreground tabular-nums">
          {merged ? (
            <>
              {/* The overflow, the dot and the time are one piece of glued words: on a narrow toast the line breaks before them, never between them, so the dot never starts a line. */}
              {listed}
              {more ? ` ${glue(more)}` : null}
              <span aria-hidden="true">{"\u00a0·\u00a0"}</span>
              <span className="sr-only">, </span>
            </>
          ) : null}
          <RelativeTime at={at} locale={locale} />
        </span>
        <span className="sr-only">. </span>
      </span>
    </span>
  );
}

/**
 * A toast for what someone else just did: their avatar, "Maya commented on
 * Pricing page", a relative time and a View button, on top of the house
 * `toast()`. Mount the house `Toaster` once. When several events arrive with the
 * same `group` within a few seconds they merge into one toast ("3 new comments
 * on Pricing page") instead of stacking, the count updates in place and the
 * toast starts its time again. It is announced politely once, pauses on hover
 * and focus like every toast, and never shows for the person's own actions
 * (`actor.self`). Use it for collaboration events that deserve a nudge but not a
 * notification badge. It returns the toast's id, or null when nothing was shown.
 *
 *     toastActivity({ actor: { name: "Maya Okafor" }, action: "commented on", target: "Pricing page", group: "comments:pricing", mergedLabel: "{count} new comments on {target}", onView: open });
 */
export function toastActivity(options: ActivityToastOptions): string | null {
  // There is no toast on the server, and the person's own actions are theirs to see already.
  if (typeof window === "undefined" || options.actor.self) return null;
  const now = Date.now();
  const at = options.at === undefined ? now : toMs(options.at);
  const locale = options.locale ?? "en-US";
  let burst = options.group === undefined ? undefined : bursts.get(options.group);
  if (burst && now - burst.lastAt > (options.mergeWindow ?? 8000)) burst = undefined;
  if (!burst) {
    burst = { id: `rhs-activity-${++counter}`, group: options.group, count: 0, people: [], lastAt: now };
    if (options.group !== undefined) bursts.set(options.group, burst);
  }
  burst.count += 1;
  burst.lastAt = now;
  burst.people = [{ name: options.actor.name, image: options.actor.image }, ...burst.people.filter((person) => person.name !== options.actor.name)];
  const own = burst;
  const viewLabel = options.viewLabel ?? "View";
  toast(
    <ActivityMessage
      burst={{ ...own, people: [...own.people] }}
      actor={options.actor}
      action={options.action}
      target={options.target}
      at={at}
      mergedLabel={options.mergedLabel}
      moreLabel={options.moreLabel}
      locale={locale}
      onGone={() => {
        if (own.group !== undefined && bursts.get(own.group) === own) bursts.delete(own.group);
      }}
    />,
    {
      id: own.id,
      // The toast times itself again whenever its duration changes, and a merged event should buy it more time: one more millisecond per event is enough, and nobody sees it.
      duration: (options.duration ?? 6000) + own.count,
      action: options.onView ? { label: viewLabel, altText: `${viewLabel} ${options.target ?? options.action}`, onClick: options.onView } : undefined,
    },
  );
  return own.id;
}
