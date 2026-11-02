"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { ageText, dateIn, fill, type DateInput } from "@rhs-ui/application/invitation-card/format";
import { IconAlertCircle, IconArrowRight, IconCheck, IconCheckCircle, IconClock, IconClose, IconSpinner } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Where the invitation stands. Each has its own word, glyph and sentence, so none depends on colour. */
export type InvitationState = "pending" | "accepted" | "declined" | "expired";

/** Who sent it. */
export interface InvitationInviter {
  /** Their name: "Ana Costa". */
  name: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
}

/** What you are invited to. */
export interface InvitationTarget {
  /** Its name: "Northwind Studio". */
  name: string;
  /** What kind of thing it is, in lower case: "workspace", "project", "team", "board". It is written into the words of the card ("Open workspace"). */
  type: string;
  /** Its logo, as an image address. Without one the tile shows the initials of the name. */
  image?: string;
  /** Where it lives. Once the invitation is accepted the card links to it ("Open workspace"). */
  href?: string;
}

/** The words the card uses, for translation. `{inviter}`, `{role}`, `{target}`, `{type}`, `{when}` and `{date}` are filled in. */
export interface InvitationCardLabels {
  /** The line above the name; `{type}` is capitalised. Default "{type} invitation". */
  eyebrow?: string;
  /** The line under it; the inviter is set in bold and the role becomes a chip. Default "{inviter} invited you as {role}". */
  invited?: string;
  /** While the clock is not known yet, and in the server HTML. Default "Valid until {date}". */
  validUntil?: string;
  /** How long is left; `{when}` is a phrase such as "in 5 days" or "tomorrow". Default "Expires {when}". */
  expires?: string;
  /** The button that accepts. Default "Accept". */
  accept?: string;
  /** The button that declines. Default "Decline". */
  decline?: string;
  /** While accepting. Default "Accepting…". */
  accepting?: string;
  /** While declining. Default "Declining…". */
  declining?: string;
  /** The sentence once it is accepted. Default "You joined {target} as {role}.". */
  acceptedBody?: string;
  /** The link to the target once it is accepted. Default "Open {type}". */
  open?: string;
  /** The sentence once it is declined. Default "You declined the invitation to {target}.". */
  declinedBody?: string;
  /** Under it, once the time to undo has passed. Default "{inviter} can send you a new one if you change your mind.". */
  declinedLater?: string;
  /** The button that takes a decline back. Default "Undo". */
  undo?: string;
  /** The sentence when it has expired. Default "This invitation to {target} expired on {date}. {inviter} can send you a new one.". */
  expiredBody?: string;
  /** The same, when there is no date to say. Default "This invitation to {target} is no longer valid. {inviter} can send you a new one.". */
  expiredBodyUndated?: string;
  /** The button on an expired invitation. Default "Ask for a new invite". */
  requestNew?: string;
  /** While asking. Default "Asking…". */
  requesting?: string;
  /** Once asked. Default "We asked {inviter} to send you a new invitation.". */
  requested?: string;
  /** When a callback rejected. Default "Something went wrong. Nothing was changed, so you can try again.". */
  failed?: string;
  /** The words of the badge on a decided or expired invitation. */
  states?: Partial<Record<Exclude<InvitationState, "pending">, string>>;
  /** What a time under a minute away is called. Default "just now". */
  justNow?: string;
}

export interface InvitationCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** Who sent it. */
  inviter: InvitationInviter;
  /** What you are invited to. */
  target: InvitationTarget;
  /** The role you are invited as, in words: "Editor". */
  role: string;
  /** What the inviter wrote to you. Shown as a quote. */
  message?: string;
  /** When the invitation stops working: a Date, a timestamp or an ISO string. Once it has passed the card shows itself expired, whatever `state` says. */
  expiresAt?: DateInput;
  /** Where it stands, controlled. The card moves itself to accepted and declined once your callbacks resolve and tells you through `onStateChange`; with `state` you keep that in your own hands. */
  state?: InvitationState;
  /** Where it starts when you do not control `state`. Default "pending". */
  defaultState?: InvitationState;
  /** The card wants to be in another state: after Accept, Decline or Undo resolved. */
  onStateChange?: (state: InvitationState) => void;
  /**
   * Accept was pressed. While the promise runs both buttons stop answering (they are aria-disabled, not disabled, so the keyboard stays on the one that was
   * pressed) and Accept shows a busy state; if it rejects the card stays pending and says so. Once it resolves, the keyboard moves to the outcome.
   */
  onAccept?: () => void | Promise<void>;
  /** Decline was pressed, with the same busy state. */
  onDecline?: () => void | Promise<void>;
  /** Undo was pressed in the window after a decline. Take the decline back. */
  onUndo?: () => void | Promise<void>;
  /** How long the Undo button stays after a decline, in seconds. 0 turns the undo off. Default 10. */
  undoSeconds?: number;
  /** "Ask for a new invite" was pressed on an expired invitation. Leave it out and the button is not shown. */
  onRequestNew?: () => void | Promise<void>;
  /** Heading level of the target's name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the expiry is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are counted, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: InvitationCardLabels;
}

const DEFAULT_LABELS = {
  eyebrow: "{type} invitation",
  invited: "{inviter} invited you as {role}",
  validUntil: "Valid until {date}",
  expires: "Expires {when}",
  accept: "Accept",
  decline: "Decline",
  accepting: "Accepting…",
  declining: "Declining…",
  acceptedBody: "You joined {target} as {role}.",
  open: "Open {type}",
  declinedBody: "You declined the invitation to {target}.",
  declinedLater: "{inviter} can send you a new one if you change your mind.",
  undo: "Undo",
  expiredBody: "This invitation to {target} expired on {date}. {inviter} can send you a new one.",
  expiredBodyUndated: "This invitation to {target} is no longer valid. {inviter} can send you a new one.",
  requestNew: "Ask for a new invite",
  requesting: "Asking…",
  requested: "We asked {inviter} to send you a new invitation.",
  failed: "Something went wrong. Nothing was changed, so you can try again.",
  justNow: "just now",
};

const DEFAULT_STATES = { accepted: "Accepted", declined: "Declined", expired: "Expired" };

/** A template with `{name}` slots, the slots filled with elements: the inviter in bold, the role in a chip. */
function compose(template: string, slots: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const slot = /^\{(\w+)\}$/.exec(part)?.[1];
    return slot !== undefined && slot in slots ? <Fragment key={index}>{slots[slot]}</Fragment> : part;
  });
}

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined && !Number.isNaN(new Date(fixed).getTime());
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  return pinned ? new Date(fixed as DateInput).getTime() : tick;
}

type Busy = "accept" | "decline" | "undo" | "request";

/** A button that is busy stays focusable: aria-disabled, never disabled, which would drop the keyboard's focus to the page. */
const INERT = "aria-disabled:pointer-events-none aria-disabled:opacity-50";

/**
 * An invitation you received, as a card: what you are invited to (its logo,
 * its kind and its name), who invited you and as what, their message as a
 * quote, and how long it is good for. Pending shows Accept and Decline as
 * two buttons of the same size and style, so neither is small print; Accept shows a
 * busy state while your promise runs, and a callback that rejects leaves the
 * card as it was and says so. After the decision the card says the outcome
 * in words and in a badge: accepted links to the place ("Open workspace"),
 * declined offers Undo for a few seconds. An expired invitation, or one
 * whose date has passed, explains why and offers "Ask for a new invite".
 * Controlled with `state`, or on its own.
 */
export function InvitationCard({
  inviter,
  target,
  role,
  message,
  expiresAt,
  state: controlled,
  defaultState = "pending",
  onStateChange,
  onAccept,
  onDecline,
  onUndo,
  undoSeconds = 10,
  onRequestNew,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: InvitationCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const states = { ...DEFAULT_STATES, ...labels?.states };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [own, setOwn] = useState<InvitationState>(defaultState);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [failed, setFailed] = useState(false);
  const [undoable, setUndoable] = useState(false);
  const [requested, setRequested] = useState(false);
  const stateOf = controlled ?? own;
  const expiry = expiresAt === undefined ? Number.NaN : new Date(expiresAt).getTime();
  const clock = useNow(now, stateOf === "pending" && !Number.isNaN(expiry));
  const lapsed = stateOf === "pending" && clock !== null && !Number.isNaN(expiry) && expiry <= clock;
  const shown: InvitationState = lapsed ? "expired" : stateOf;

  const outcomeBox = useRef<HTMLDivElement>(null);
  const declineButton = useRef<HTMLButtonElement>(null);
  /** Where the keyboard goes once the button that was pressed has left the card: to the outcome that took its place, or after Undo back to Decline. */
  const handoff = useRef<"outcome" | "decline" | null>(null);

  // The time to undo a decline runs out by itself. The Undo button leaves with it, and a keyboard that is on it goes to the outcome, not to the top of the page.
  useEffect(() => {
    if (!undoable) return;
    const timer = window.setTimeout(() => {
      if (outcomeBox.current?.contains(document.activeElement)) handoff.current = "outcome";
      setUndoable(false);
    }, Math.max(0, undoSeconds) * 1000);
    return () => window.clearTimeout(timer);
  }, [undoable, undoSeconds]);

  // The pressed button leaves with the old state, and a focus that leaves with it falls to the top of the page. So whatever takes its place takes the focus,
  // as soon as it is there (a parent that controls `state` may need a moment), and only if the person has not moved on to something else in the meantime.
  useEffect(() => {
    const target = handoff.current === "outcome" ? outcomeBox.current : handoff.current === "decline" ? declineButton.current : null;
    if (!target) return;
    handoff.current = null;
    const active = document.activeElement;
    if (!active || active === document.body || target.closest("article")?.contains(active)) target.focus();
  });

  async function run(kind: Busy, action: (() => void | Promise<void>) | undefined, next: InvitationState | null) {
    if (busy) return;
    setBusy(kind);
    setFailed(false);
    try {
      await action?.();
      if (kind === "request") setRequested(true);
      if (next) {
        setOwn(next);
        onStateChange?.(next);
      }
      setUndoable(kind === "decline" && undoSeconds > 0);
      handoff.current = kind === "undo" ? "decline" : "outcome";
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  const inviterName = <strong className="font-semibold text-foreground">{inviter.name}</strong>;
  const roleChip = (
    <Badge variant="secondary" className="align-middle">
      {role}
    </Badge>
  );
  const values = { inviter: inviter.name, role, target: target.name, type: target.type };
  const eyebrow = fill(text.eyebrow, { type: target.type.charAt(0).toUpperCase() + target.type.slice(1) });
  const date = Number.isNaN(expiry) ? "" : dateIn(expiry, locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const shortDate = Number.isNaN(expiry) ? "" : dateIn(expiry, locale, timeZone, { weekday: "short", day: "numeric", month: "short" });

  const outcome = (
    icon: ReactNode,
    body: ReactNode,
    action?: ReactNode,
  ) => (
    // The box takes the focus after a decision (tabIndex -1: reachable by script, not by Tab), so a keyboard user lands on the answer and one Tab reaches its action.
    <div ref={outcomeBox} tabIndex={-1} className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-3.5 py-3 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 [overflow-wrap:anywhere]">{body}</p>
        {action ? <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">{action}</div> : null}
      </div>
    </div>
  );

  return (
    <article
      data-slot="invitation-card"
      data-state={shown}
      aria-labelledby={titleId}
      aria-busy={busy ? true : undefined}
      className={cn("@container flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs", shown === "expired" && "bg-muted/40", className)}
      {...props}
    >
      {/* On a narrow card the state badge drops under the name, instead of squeezing the name into a column of one letter. */}
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-2 @sm:grid-cols-[3rem_minmax(0,1fr)_auto]">
        <Avatar size="lg" className="size-12 rounded-lg border border-border bg-background">
          {target.image ? <AvatarImage src={target.image} alt="" className="object-contain p-1.5" /> : null}
          <AvatarFallback className="rounded-lg bg-muted text-sm font-semibold tracking-[-0.02em]">{initialsOf(target.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-4 text-muted-foreground">{eyebrow}</p>
          <Heading id={titleId} className={cn("mt-0.5 text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]", shown === "expired" && "text-muted-foreground")}>
            {target.name}
          </Heading>
        </div>
        {shown !== "pending" ? (
          <Badge variant={shown === "accepted" ? "secondary" : "muted"} className="col-start-2 justify-self-start @sm:col-start-3 @sm:row-start-1">
            {shown === "accepted" ? <IconCheck /> : shown === "declined" ? <IconClose /> : <IconClock />}
            {states[shown]}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-2.5">
        <Avatar size="sm" className="data-[size=sm]:size-7">
          {inviter.image ? <AvatarImage src={inviter.image} alt="" /> : null}
          <AvatarFallback className="text-[0.6875rem]">{initialsOf(inviter.name)}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{compose(text.invited, { inviter: inviterName, role: roleChip })}</p>
      </div>

      {message ? <blockquote className="border-l-2 border-border pl-3.5 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{message}</blockquote> : null}

      {shown === "pending" && !Number.isNaN(expiry) ? (
        <p className="flex items-center gap-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
          <IconClock className="size-3.5 shrink-0" />
          <span className="tabular-nums">{clock === null ? fill(text.validUntil, { date }) : fill(text.expires, { when: ageText(expiry, clock, locale, timeZone, text.justNow) })}</span>
          {clock !== null ? <span className="tabular-nums">· {shortDate}</span> : null}
        </p>
      ) : null}

      {/* One live region for every outcome, so a screen reader hears the card change. */}
      <div role="status" aria-live="polite" className="mt-auto grid gap-3">
        {shown === "pending" ? (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Two buttons of one size and one style: neither answer is made to look like the small print. A glyph each tells them apart. */}
            {/* While one runs, both are aria-disabled and run() ignores the press. Never `disabled`: that drops the keyboard's focus to the page, and with it the way to try again. */}
            <Button type="button" variant="outline" aria-busy={busy === "accept" || undefined} aria-disabled={busy !== null || undefined} className={INERT} onClick={() => void run("accept", onAccept, "accepted")}>
              {busy === "accept" ? <IconSpinner data-slot="button-spinner" /> : <IconCheck />}
              {busy === "accept" ? text.accepting : text.accept}
            </Button>
            <Button ref={declineButton} type="button" variant="outline" aria-busy={busy === "decline" || undefined} aria-disabled={busy !== null || undefined} className={INERT} onClick={() => void run("decline", onDecline, "declined")}>
              {busy === "decline" ? <IconSpinner data-slot="button-spinner" /> : <IconClose />}
              {busy === "decline" ? text.declining : text.decline}
            </Button>
          </div>
        ) : null}

        {shown === "accepted"
          ? outcome(
              <IconCheckCircle />,
              fill(text.acceptedBody, values),
              target.href ? (
                <Button asChild size="sm" variant="outline">
                  <a href={target.href}>
                    {fill(text.open, values)}
                    <IconArrowRight />
                  </a>
                </Button>
              ) : null,
            )
          : null}

        {shown === "declined"
          ? outcome(
              <IconClose />,
              <>
                {fill(text.declinedBody, values)}
                {undoable ? null : <span className="text-muted-foreground"> {fill(text.declinedLater, values)}</span>}
              </>,
              undoable ? (
                <Button type="button" size="sm" variant="outline" aria-busy={busy === "undo" || undefined} aria-disabled={busy !== null || undefined} className={INERT} onClick={() => void run("undo", onUndo, "pending")}>
                  {busy === "undo" ? <IconSpinner data-slot="button-spinner" /> : null}
                  {text.undo}
                </Button>
              ) : null,
            )
          : null}

        {shown === "expired"
          ? outcome(
              <IconClock />,
              requested ? fill(text.requested, values) : fill(Number.isNaN(expiry) ? text.expiredBodyUndated : text.expiredBody, { ...values, date }),
              onRequestNew && !requested ? (
                <Button type="button" size="sm" variant="outline" aria-busy={busy === "request" || undefined} aria-disabled={busy !== null || undefined} className={INERT} onClick={() => void run("request", onRequestNew, null)}>
                  {busy === "request" ? <IconSpinner data-slot="button-spinner" /> : null}
                  {busy === "request" ? text.requesting : text.requestNew}
                </Button>
              ) : null,
            )
          : null}

        {failed ? (
          // The words are darkened toward the foreground so they reach 4.5:1 on the pale expired card; the glyph keeps the plain destructive colour.
          <p role="alert" className="flex items-start gap-2 text-sm leading-5 text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]">
            <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            {text.failed}
          </p>
        ) : null}
      </div>
    </article>
  );
}
