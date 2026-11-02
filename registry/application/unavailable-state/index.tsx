"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconBan, IconCheckCircle, IconClock, IconFileX, IconHourglass } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Why the link no longer works: it timed out, it was spent, someone took it back, or what it led to is gone. */
export type UnavailableReason = "expired" | "used" | "revoked" | "removed";

/** The words the state uses, for translation. `{subject}`, `{date}`, `{time}` are filled in. */
export interface UnavailableStateLabels {
  /** Default "This {subject} has expired". */
  expiredTitle?: string;
  /** Default "For your security, it stops working after a while. Ask for a new one and it will arrive right away." */
  expiredText?: string;
  /** Default "This {subject} was already used". */
  usedTitle?: string;
  /** Default "It works once, and this one has been used. If that was you, sign in. If not, ask for a new one." */
  usedText?: string;
  /** Default "This {subject} was withdrawn". */
  revokedTitle?: string;
  /** Default "Whoever sent it has taken it back, so it no longer works. Ask them for a new one if you still need it." */
  revokedText?: string;
  /** Default "This {subject} is no longer available". */
  removedTitle?: string;
  /** Default "It has been removed, and there is nothing more to see here." */
  removedText?: string;
  /** The line with the date, one per reason. Default "Expired {date}". */
  expiredOn?: string;
  /** Default "Used {date}". */
  usedOn?: string;
  /** Default "Withdrawn {date}". */
  revokedOn?: string;
  /** Default "Removed {date}". */
  removedOn?: string;
  /** The button that asks for a new one. Default "Request a new {subject}". */
  request?: string;
  /** The same button during the cooldown, with the seconds left. Default "Send again in {time}". */
  resendIn?: string;
  /** And once the cooldown is over. Default "Send again". */
  resend?: string;
  /** The link to sign in. Default "Sign in". */
  signIn?: string;
  /** The link home. Default "Go to the homepage". */
  home?: string;
  /** Under the buttons once a new one was asked for. Default "Requested. A new {subject} is on its way." */
  sent?: string;
  /** Said once the cooldown is over. Default "You can ask for another {subject} now." */
  ready?: string;
  /** Said when asking failed. Default "We could not send a new {subject}. Please try again in a moment." */
  failed?: string;
}

export interface UnavailableStateProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** What happened to the link: it decides the icon, the words and which action fits. */
  reason: UnavailableReason;
  /** What the link was, in one or two words: "invite", "reset link", "download link". Default "link". */
  subject?: string;
  /** When it happened. Written in the locale and the zone, with the zone's name. A date-only string such as "2026-10-14" is a day on the calendar and is written without a time. */
  occurredAt?: Date | string | number;
  /** Asks for a new link: shown as the main action for an expired link, and for a used one when there is no `signInHref`. It may return a promise: the button shows a spinner until it settles, then waits out the cooldown before it can be pressed again. */
  onRequestNew?: () => void | Promise<void>;
  /** Where signing in happens: the main action for a link that was already used. */
  signInHref?: string;
  /** Where "Go to the homepage" leads. It is the way out when asking again makes no sense. */
  homeHref?: string;
  /** How many seconds before a new link can be requested again. Default 30. */
  cooldownSeconds?: number;
  /** Anything more under the actions: a line on who to write to, a link to help. */
  children?: ReactNode;
  /** Heading level of the title. Default 2; use 1 when the state is the whole page. */
  headingLevel?: 1 | 2 | 3 | 4;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the state uses, for translation. */
  labels?: UnavailableStateLabels;
}

const DEFAULT_LABELS = {
  expiredTitle: "This {subject} has expired",
  expiredText: "For your security, it stops working after a while. Ask for a new one and it will arrive right away.",
  usedTitle: "This {subject} was already used",
  usedText: "It works once, and this one has been used. If that was you, sign in. If not, ask for a new one.",
  revokedTitle: "This {subject} was withdrawn",
  revokedText: "Whoever sent it has taken it back, so it no longer works. Ask them for a new one if you still need it.",
  removedTitle: "This {subject} is no longer available",
  removedText: "It has been removed, and there is nothing more to see here.",
  expiredOn: "Expired {date}",
  usedOn: "Used {date}",
  revokedOn: "Withdrawn {date}",
  removedOn: "Removed {date}",
  request: "Request a new {subject}",
  resendIn: "Send again in {time}",
  resend: "Send again",
  signIn: "Sign in",
  home: "Go to the homepage",
  sent: "Requested. A new {subject} is on its way.",
  ready: "You can ask for another {subject} now.",
  failed: "We could not send a new {subject}. Please try again in a moment.",
} satisfies Required<UnavailableStateLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A moment written in the locale and the zone, with the zone's name, and as an ISO string for a time element; a day on the calendar is written without a time. Null when the input is not a date. */
function momentIn(input: Date | string | number, locale: string, timeZone: string): { text: string; iso: string } | null {
  const calendar = typeof input === "string" && DATE_ONLY.test(input);
  const at = new Date(calendar ? `${input}T00:00:00Z` : input).getTime();
  if (Number.isNaN(at)) return null;
  const options: Intl.DateTimeFormatOptions = calendar ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" };
  const zone = calendar ? "UTC" : timeZone;
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone: zone }).format(at);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return { text: text.replace(/\s/g, " "), iso: new Date(at).toISOString() };
}

/** The icon says what kind of ending it is, before a word is read: time ran out, it was spent, it was taken back, it is gone. */
const ICONS: Record<UnavailableReason, React.JSX.Element> = {
  expired: <IconHourglass className="size-6" />,
  used: <IconCheckCircle className="size-6" />,
  revoked: <IconBan className="size-6" />,
  removed: <IconFileX className="size-6" />,
};

/** The time left as "24 s", or "1:05" from a minute up. */
function remaining(seconds: number): string {
  return seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : `${seconds} s`;
}

/**
 * For a link that no longer works: an invite that expired, a reset link that
 * was already used, a share that was withdrawn, a page that was removed. The
 * icon and the words differ per reason, so people know whether to wait, ask or
 * give up, and the date it happened is written when you pass one. The action
 * fits the reason: ask for a new link (then a cooldown with the seconds left,
 * so it cannot be pressed in a row), sign in, or go home. It never shows a
 * technical code, and the result of asking is said politely, on a line that
 * has its room from the start so the card does not grow when it is said. The
 * title is a heading of the level you choose (2 unless you set `headingLevel`).
 */
export function UnavailableState({ reason, subject = "link", occurredAt, onRequestNew, signInHref, homeHref, cooldownSeconds = 30, children, headingLevel = 2, locale = "en-US", timeZone = "UTC", labels, className, ...props }: UnavailableStateProps) {
  const text: Required<UnavailableStateLabels> = { ...DEFAULT_LABELS, ...labels };
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const words = { subject };
  const titles: Record<UnavailableReason, string> = { expired: text.expiredTitle, used: text.usedTitle, revoked: text.revokedTitle, removed: text.removedTitle };
  const bodies: Record<UnavailableReason, string> = { expired: text.expiredText, used: text.usedText, revoked: text.revokedText, removed: text.removedText };
  const dates: Record<UnavailableReason, string> = { expired: text.expiredOn, used: text.usedOn, revoked: text.revokedOn, removed: text.removedOn };

  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [left, setLeft] = useState(0);
  const [said, setSaid] = useState("");
  const wasCooling = useRef(false);

  // One second at a time, so the count follows the clock and stops the moment the component goes.
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  // The end of the cooldown is said once, when the button comes back.
  useEffect(() => {
    if (left > 0) {
      wasCooling.current = true;
    } else if (wasCooling.current) {
      wasCooling.current = false;
      setSaid(fill(text.ready, words));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the end of the cooldown is announced
  }, [left]);

  async function request() {
    setPhase("sending");
    setSaid("");
    try {
      await onRequestNew?.();
      setPhase("sent");
      setLeft(Math.max(0, Math.round(cooldownSeconds)));
      setSaid(fill(text.sent, words));
    } catch {
      setPhase("failed");
      setSaid(fill(text.failed, words));
    }
  }

  const cooling = left > 0;
  // What fits the reason, best first. The first available is the main action and the second sits beside it, quieter.
  const order: Record<UnavailableReason, ("ask" | "signin" | "home")[]> = {
    expired: ["ask", "home"],
    used: ["signin", "ask", "home"],
    revoked: ["home"],
    removed: ["home"],
  };
  const available = { ask: Boolean(onRequestNew), signin: Boolean(signInHref), home: Boolean(homeHref) };
  const actions = order[reason].filter((action) => available[action]).slice(0, 2);
  const when = occurredAt === undefined ? null : momentIn(occurredAt, locale, timeZone);

  return (
    <div
      data-slot="unavailable-state"
      data-reason={reason}
      className={cn("flex w-full flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 text-center text-card-foreground shadow-xs", className)}
      {...props}
    >
      <div aria-hidden="true" className="mb-6 grid size-14 place-items-center rounded-xl border border-border bg-muted">
        {ICONS[reason]}
      </div>
      <Heading className="text-lg font-medium tracking-tight">{fill(titles[reason], words)}</Heading>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{fill(bodies[reason], words)}</p>
      <div className="mt-6 grid justify-items-center gap-5">
        {when ? (
          <p className="flex items-center gap-1.5 text-xs leading-5 text-muted-foreground tabular-nums">
            <IconClock className="size-3.5 shrink-0" />
            <time dateTime={when.iso}>{fill(dates[reason], { date: when.text })}</time>
          </p>
        ) : null}
        {actions.length ? (
          <div className="grid justify-items-center gap-2.5">
            <div className="flex flex-wrap justify-center gap-2.5">
              {actions.map((action, index) => {
                const variant = index === 0 ? "default" : "outline";
                if (action === "ask") {
                  return (
                    <Button key={action} type="button" variant={variant} loading={phase === "sending"} disabled={cooling} onClick={() => void request()}>
                      {cooling ? fill(text.resendIn, { time: remaining(left) }) : phase === "sent" ? text.resend : fill(text.request, words)}
                    </Button>
                  );
                }
                return (
                  <Button key={action} asChild variant={variant}>
                    <a href={action === "signin" ? signInHref : homeHref}>{action === "signin" ? text.signIn : text.home}</a>
                  </Button>
                );
              })}
            </div>
            {/* What asking led to is said on a line that has its room before it has words: a card that grew by a line when the request went through would push everything under it down. */}
            {actions.includes("ask") ? (
              <p className={cn("min-h-5 max-w-md text-xs leading-5", phase === "failed" ? "text-destructive" : "text-muted-foreground")}>
                {phase === "sent" ? fill(text.sent, words) : phase === "failed" ? fill(text.failed, words) : null}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
