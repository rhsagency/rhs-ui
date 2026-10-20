"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";

import { IconAlertCircle, IconArrowRight, IconBell, IconCheck, IconClock, IconPhone, IconPhoneCall, IconWarning } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { Label } from "@rhs-ui/primitives/label";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { durationWords, knownZone, shiftTime, telHref, toMs, zoneName, type MomentInput } from "@rhs-ui/dashboard/on-call-card/rota";
import { cn } from "@/lib/utils";

export interface OnCallPerson {
  /** Handed back to `onPage` with the person. */
  id?: string;
  /** The person's full name. It is on the card and on the Page button. */
  name: string;
  /** What they cover: "Backend, primary". */
  role?: string;
  /** A photo. Without one, or until it loads, the initials are drawn. */
  image?: string;
}

export interface OnCallShift extends OnCallPerson {
  /** When the shift starts. Shown for the person who is next. */
  start?: MomentInput;
  /** When the shift ends. Shown for the person on call now, and when it is near it flags the handover. */
  end?: MomentInput;
}

export interface OnCallEscalation extends OnCallPerson {
  /** A phone number, shown as a link that calls it on a phone. */
  phone?: string;
}

export interface OnCallCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** Who is on call now. `null` or nothing says "Nobody is on call". */
  current?: OnCallShift | null;
  /** Who takes over. */
  next?: OnCallShift | null;
  /** Who to go to when the person on call does not answer. */
  escalation?: OnCallEscalation | null;
  /** The moment to measure from. Pass it from the server for a first render that matches the browser's; without it the card reads the clock and ticks once a minute. */
  now?: MomentInput;
  /** IANA zone every time is shown in. The zone is named on the card. */
  timeZone?: string;
  /** BCP 47 locale for the times. */
  locale?: string;
  /** Sends the page. It is called with the person and the reason once the reason is typed; reject to show that it failed. Without it the card has no Page button. */
  onPage?: (person: OnCallPerson, reason: string) => void | Promise<void>;
  /** Quick reasons to tap instead of typing. */
  reasons?: readonly string[];
  /** Where the whole rota lives. */
  scheduleHref?: string;
}

/** The clock, once a minute, unless a moment was passed in. */
function useClock(controlled: MomentInput | undefined): number {
  const [clock, setClock] = useState<number | null>(null);
  const external = controlled === undefined ? Number.NaN : toMs(controlled);
  const given = Number.isFinite(external);
  useEffect(() => {
    if (given) return;
    const sync = (): void => setClock(Date.now());
    sync();
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        sync();
        interval = setInterval(sync, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    // A sleeping tab misses its timers: catch up when it is looked at again.
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [given]);
  return given ? external : (clock ?? Date.now());
}

function Face({ person, size }: { person: OnCallPerson; size?: "sm" | "default" | "lg" }) {
  return (
    <Avatar size={size} aria-hidden="true">
      {person.image ? <AvatarImage src={person.image} alt="" /> : null}
      <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
    </Avatar>
  );
}

/** One time of day, as a `<time>` element, with the zone said to screen readers. */
function Moment({ at, now, locale, zone, volatile }: { at: number; now: number; locale: string; zone: string; volatile: boolean }) {
  return (
    <>
      <time dateTime={new Date(at).toISOString()} className="tabular-nums whitespace-nowrap" suppressHydrationWarning={volatile}>
        {shiftTime(at, now, locale, zone)}
      </time>
      <span className="sr-only"> {zoneName(at, locale, zone)}</span>
    </>
  );
}

/** The Page button and the panel that asks for a reason before anything is sent. */
function PageAction({
  person,
  reasons,
  onPage,
  onSent,
}: {
  person: OnCallPerson;
  reasons: readonly string[];
  onPage: NonNullable<OnCallCardProps["onPage"]>;
  onSent: (person: OnCallPerson) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const send = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const text = reason.trim();
    if (!text) {
      setError(`Add a reason so ${person.name} knows what to expect.`);
      field.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onPage(person, text);
      setOpen(false);
      setReason("");
      onSent(person);
    } catch {
      setError("The page was not sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  // A very long name gives way with an ellipsis instead of pushing the button out of the card; the full name stays in the button's text for screen readers and in the panel's heading.
  return (
    <Popover open={open} onOpenChange={(next) => (busy ? undefined : setOpen(next))}>
      <PopoverTrigger asChild>
        <Button type="button" className="max-w-full min-w-0 flex-1 sm:flex-none">
          <IconBell />
          <span className="truncate">Page {person.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-labelledby={`${id}-title`} className="w-[min(22rem,calc(100vw-1.5rem))] p-4">
        <form onSubmit={(event) => void send(event)} noValidate className="grid gap-4">
          <div>
            <h4 id={`${id}-title`} className="text-sm font-medium">
              Page {person.name}
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">They are alerted straight away. Say what is wrong so they know what to open first.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-reason`}>Reason</Label>
            <Textarea
              ref={field}
              id={`${id}-reason`}
              value={reason}
              readOnly={busy}
              rows={3}
              placeholder="Checkout is returning errors for EU customers"
              aria-invalid={error && !reason.trim() ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
            />
            {reasons.length ? (
              <div className="flex flex-wrap gap-1.5">
                {reasons.map((text) => (
                  <button
                    key={text}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setReason(text);
                      setError(null);
                      field.current?.focus();
                    }}
                    className="h-7 rounded-full border border-border px-2.5 text-xs transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 motion-reduce:transition-none"
                  >
                    {text}
                  </button>
                ))}
              </div>
            ) : null}
            {error ? (
              <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={busy}>
              Send page
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Who has the pager: the person on call now with the time their shift ends,
 * the person after them, and the escalation contact. Every time is shown in
 * the zone you pass, and the zone is named. A handover within the hour is
 * flagged in words ("Handover to Tom de Vries in 35 minutes"). With nobody on
 * call the card says so as a warning, in an icon, weight and words, and
 * offers the escalation contact instead. Paging is a button named with the
 * person; it opens a small panel that asks for a reason, then waits for
 * `onPage` to finish before it confirms.
 */
export function OnCallCard({ current, next, escalation, now, timeZone = "UTC", locale = "en-US", onPage, reasons = [], scheduleHref, className, ...props }: OnCallCardProps) {
  const headingId = useId();
  const clock = useClock(now);
  const zone = knownZone(timeZone);
  const volatile = now === undefined;
  const [paged, setPaged] = useState<{ name: string; at: number } | null>(null);

  const ends = current?.end === undefined ? Number.NaN : toMs(current.end);
  const starts = next?.start === undefined ? Number.NaN : toMs(next.start);
  const nextEnds = next?.end === undefined ? Number.NaN : toMs(next.end);
  const minutesLeft = Math.ceil((ends - clock) / 60_000);
  const handover = current && Number.isFinite(ends) ? (minutesLeft <= 0 ? "ended" : minutesLeft <= 60 ? "soon" : null) : null;
  const pageTarget: OnCallPerson | null = current ?? escalation ?? null;
  const moment = (at: number) => <Moment at={at} now={clock} locale={locale} zone={zone} volatile={volatile} />;

  return (
    <Card role="region" aria-labelledby={headingId} data-slot="on-call-card" className={cn("w-full gap-0 py-0", className)} {...props}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h3 id={headingId} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <IconPhoneCall aria-hidden="true" className="size-4" />
          On call
        </h3>
        <span className="text-xs text-muted-foreground" suppressHydrationWarning={volatile}>
          Times in {zoneName(clock, locale, zone)}
        </span>
      </div>

      <div className="border-t border-border px-5 py-4">
        {current ? (
          <>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
              On call now
            </p>
            <div className="mt-3 flex items-start gap-3.5">
              <Face person={current} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base leading-snug font-medium tracking-[-0.02em]">{current.name}</p>
                {current.role ? <p className="text-sm text-muted-foreground">{current.role}</p> : null}
                {Number.isFinite(ends) ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm">
                    <IconClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <span className="whitespace-nowrap">Until {moment(ends)}</span>
                  </p>
                ) : null}
              </div>
            </div>
            {handover ? (
              <p
                className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted px-3 py-2 text-[0.8125rem] leading-snug font-medium text-pretty"
                suppressHydrationWarning={volatile}
              >
                <IconArrowRight aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                {handover === "ended"
                  ? "This shift has ended. Check that the handover happened."
                  : `Handover${next ? ` to ${next.name}` : ""} in ${durationWords(minutesLeft, locale)}`}
              </p>
            ) : null}
          </>
        ) : (
          <div role="status" className="rounded-lg border border-dashed border-foreground/40 bg-muted/50 p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <IconWarning aria-hidden="true" className="size-4 shrink-0" />
              Nobody is on call
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No one holds the pager right now.{escalation ? ` Page ${escalation.name} until the rota is fixed.` : " Check the rota."}
            </p>
          </div>
        )}
      </div>

      {next ? (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">Up next</p>
          <div className="mt-3 flex items-center gap-3">
            <Face person={next} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{next.name}</p>
              <p className="text-sm text-muted-foreground">
                {next.role ? `${next.role}, ` : ""}
                {/* Each half stays whole: a line may break between "from" and "until", never inside one. */}
                {Number.isFinite(starts) ? <span className="whitespace-nowrap">from {moment(starts)}</span> : null}
                {Number.isFinite(starts) && Number.isFinite(nextEnds) ? " " : null}
                {Number.isFinite(nextEnds) ? <span className="whitespace-nowrap">until {moment(nextEnds)}</span> : null}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {escalation ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Escalation</p>
            <p className="mt-1 text-sm">
              <span className="font-medium">{escalation.name}</span>
              {escalation.role ? <span className="text-muted-foreground">, {escalation.role}</span> : null}
            </p>
          </div>
          {escalation.phone ? (
            <Button asChild variant="outline" size="sm">
              <a href={telHref(escalation.phone)}>
                <IconPhone />
                <span className="tabular-nums">{escalation.phone}</span>
                <span className="sr-only"> (call {escalation.name})</span>
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}

      {(onPage && pageTarget) || scheduleHref ? (
        <div className="border-t border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {onPage && pageTarget ? (
              <PageAction
                key={pageTarget.id ?? pageTarget.name}
                person={pageTarget}
                reasons={reasons}
                onPage={onPage}
                onSent={(person) => setPaged({ name: person.name, at: clock })}
              />
            ) : null}
            {scheduleHref ? (
              <Button asChild variant="ghost" className="w-full sm:ml-auto sm:w-auto">
                <a href={scheduleHref}>
                  Open schedule
                  <IconArrowRight />
                </a>
              </Button>
            ) : null}
          </div>
          <p role="status" className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", paged ? "mt-3" : "sr-only")}>
            {paged ? (
              <>
                <IconCheck aria-hidden="true" className="size-3.5 text-foreground" />
                Paged {paged.name} at {shiftTime(paged.at, paged.at, locale, zone)}.
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
