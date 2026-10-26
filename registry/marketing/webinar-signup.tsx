"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconBell, IconCalendar, IconCalendarPlus, IconCheck, IconClock, IconUsers } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface WebinarEvent {
  /** What the session is called, which is the heading: "Shipping a design system your engineers will use". */
  title: string;
  /** When it starts, as an ISO 8601 time with its offset or a Z: "2026-11-18T16:00:00Z". */
  startsAt: string;
  /** How long it runs, in minutes: 45. */
  duration: number;
  /** The IANA time zone the session is announced in: "America/New_York". Its date and time are written in it, with its name. */
  timeZone: string;
}

export interface WebinarSpeaker {
  /** The speaker's name. */
  name: string;
  /** What they do, in a few words: "Design systems lead at Northwind". */
  role: string;
  /** A portrait. Their initials show until it loads, or when there is none. */
  image?: string;
}

export interface WebinarRegistration {
  /** The trimmed name. */
  name: string;
  /** The trimmed email address. */
  email: string;
  /** Whether they asked for the recording. */
  sendRecording: boolean;
}

export interface WebinarSignupLabels {
  /** The small line above the heading. */
  eyebrow: string;
  /** The reader's own time, under the announced one. {time} stands for the session on their clock. */
  local: string;
  /** Between the start and the end of the session: "11:00 to 11:45". */
  to: string;
  /** The heading over what the reader will learn. */
  learn: string;
  /** The heading over the speakers. */
  speakers: string;
  /** The seats that are left. {count} stands for the number. */
  seatsLeft: string;
  /** The seats that are left when there is one. */
  seatsLeftOne: string;
  /** Said when there are none. */
  seatsFull: string;
  /** The heading of the form. */
  form: string;
  /** The label of the name field. */
  name: string;
  /** The placeholder of the name field. */
  namePlaceholder: string;
  /** The label of the email field. */
  email: string;
  /** The placeholder of the email field. */
  emailPlaceholder: string;
  /** The label of the recording checkbox. */
  recording: string;
  /** Under the recording checkbox. */
  recordingHint: string;
  /** The button. */
  submit: string;
  /** The button once the session is full. */
  submitFull: string;
  /** Said under the name field when it is empty. */
  nameRequired: string;
  /** Said under the email field when it is empty. */
  emailRequired: string;
  /** Said under the email field when it is not an address. */
  emailInvalid: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** The headline of the confirmation. */
  doneTitle: string;
  /** What happens next. {email} stands for the address that will be written to. */
  done: string;
  /** The reminders, when you do not pass your own. */
  reminders: string;
  /** Said in the confirmation when the recording was asked for. */
  recordingDone: string;
  /** The link that adds the session to a calendar. */
  calendar: string;
}

const LABELS: WebinarSignupLabels = {
  eyebrow: "Live webinar",
  local: "Your time: {time}",
  to: "to",
  learn: "What you will learn",
  speakers: "Your speakers",
  seatsLeft: "{count} seats left",
  seatsLeftOne: "1 seat left",
  seatsFull: "This session is full",
  form: "Save your seat",
  name: "Name",
  namePlaceholder: "Maria Janssen",
  email: "Work email",
  emailPlaceholder: "you@company.com",
  recording: "Send me the recording",
  recordingHint: "You get it by email afterwards, whether you could join live or not.",
  submit: "Save my seat",
  submitFull: "Fully booked",
  nameRequired: "Enter your name so we know who is coming.",
  emailRequired: "Enter your email so we know where to write.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  failed: "Your registration did not go through. Nothing is lost: it is all still here, so try again.",
  doneTitle: "You are registered",
  done: "We sent the details to {email}.",
  reminders: "We will email a reminder the day before and again an hour before it starts.",
  recordingDone: "The recording will reach you by email afterwards.",
  calendar: "Add to calendar",
};

export interface WebinarSignupProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** The session: its title, start, length and the time zone it is announced in. */
  event: WebinarEvent;
  /** The speakers, with their roles. One to four. */
  speakers: readonly WebinarSpeaker[];
  /** What the reader will learn, a line each. Three read best. */
  points: readonly string[];
  /** Called with the checked registration. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (registration: WebinarRegistration) => Promise<void> | void;
  /** One or two sentences under the heading. */
  description?: string;
  /** How many seats are left, printed as text. Never a countdown. At 0 the form is closed. Leave it out when the number is not limited. */
  seatsLeft?: number;
  /** The calendar file, supplied by you: a data URL ("data:text/calendar;charset=utf-8,BEGIN%3AVCALENDAR...") or a link to an .ics file. The confirmation offers it as Add to calendar. */
  calendarHref?: string;
  /** The name the calendar file is saved under when it is a data URL. "webinar.ics" by default. */
  calendarFileName?: string;
  /** When the reader is reminded, in a sentence. A default stands in when you leave it out: say what you really send. */
  reminders?: string;
  /** A line of small print under the button: what the email is used for. */
  note?: ReactNode;
  /** What you already know about the reader. */
  defaultValues?: Partial<WebinarRegistration>;
  /** Where the form starts. "idle" by default; "done" shows the confirmation, which repeats the address in defaultValues. */
  defaultStatus?: "idle" | "done";
  /** The language dates, times and numbers are written in. "en-US" by default. */
  locale?: string;
  /** The level of the heading: 2 by default. The form's heading sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<WebinarSignupLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** There is nothing to subscribe to: the reader's time zone does not change while the page is open. */
const noSubscription = (): (() => void) => () => undefined;

/** The hour as the locale writes it: two digits on a 24-hour clock ("08:00"), one on a 12-hour clock ("8:00 AM"). */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

/** The name of a zone in the form a clock shows it: "EST", "CET", "GMT+9". */
function zoneLabel(date: Date, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { timeZoneName: "short", timeZone }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/** The start and end of the session on a clock in one zone: "11:00 AM to 11:45 AM EST". */
function sessionTime(start: Date, end: Date, locale: string, timeZone: string, to: string): string {
  const clock = new Intl.DateTimeFormat(locale, { ...clockOptions(locale), timeZone });
  // A no-break space before the zone keeps its name with the time it belongs to when the line wraps.
  return `${clock.format(start)} ${to} ${clock.format(end)}\u00a0${zoneLabel(start, locale, timeZone)}`;
}

const fact = "flex items-start gap-3 [&_svg]:mt-[0.2em] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/**
 * Registration for a live session: on one side what it is, when it happens and what the reader will learn, with the
 * speakers and their roles, and on the other a card with two fields, a recording checkbox and one button. The date is
 * written in the time zone you announce it in, with that zone's name, and once the page is in the browser the
 * reader's own time follows it, so nobody works out the offset in their head; the server writes only the announced
 * time, so the two always agree. Seats left are an optional line of plain text, never a ticking clock. Mistakes are
 * said in words beside their field once the reader has been there or tried to send, and the first one takes focus.
 * The confirmation says what happens next, states when the reminders come and offers Add to calendar as a link to a
 * calendar file you supply. Below 896px the form comes right after the date, before what the reader will learn; from
 * there it takes a column of its own beside them.
 */
export function WebinarSignup({
  event,
  speakers,
  points,
  onSubmit,
  description,
  seatsLeft,
  calendarHref,
  calendarFileName = "webinar.ics",
  reminders,
  note,
  defaultValues,
  defaultStatus = "idle",
  locale = "en-US",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: WebinarSignupProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const recordingId = useId();
  const recordingHintId = useId();
  const errorId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4";

  const [values, setValues] = useState({ name: defaultValues?.name ?? "", email: defaultValues?.email ?? "", recording: defaultValues?.sendRecording ?? true });
  const [touched, setTouched] = useState<{ name?: true; email?: true }>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  const [sentTo, setSentTo] = useState((defaultValues?.email ?? "").trim());
  const [sentRecording, setSentRecording] = useState(defaultValues?.sendRecording ?? true);
  // Focus only moves for something the reader did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const full = seatsLeft !== undefined && seatsLeft <= 0;
  const done = status === "done";

  // The reader's own time zone is known only in the browser: the server snapshot is null, so nothing is written until then.
  const viewerZone = useSyncExternalStore(
    noSubscription,
    () => Intl.DateTimeFormat(locale).resolvedOptions().timeZone,
    () => null,
  );

  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + event.duration * 60_000);
  const dayIn = (zone: string) => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: zone }).format(start);
  const clockIn = (zone: string) => new Intl.DateTimeFormat(locale, { ...clockOptions(locale), timeZone: zone }).format(start);
  const announcedDay = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: event.timeZone }).format(start);
  const announcedTime = sessionTime(start, end, locale, event.timeZone, labels.to);
  // The reader's own time follows only when it says something new: the same day and the same hours in another zone's name are left out.
  const elsewhere = viewerZone !== null && viewerZone !== event.timeZone && (clockIn(viewerZone) !== clockIn(event.timeZone) || dayIn(viewerZone) !== dayIn(event.timeZone));
  let localTime: string | null = null;
  if (elsewhere) {
    const there = sessionTime(start, end, locale, viewerZone, labels.to);
    localTime = dayIn(viewerZone) === dayIn(event.timeZone) ? there : `${dayIn(viewerZone)}, ${there}`;
  }
  const length =
    event.duration % 60 === 0
      ? new Intl.NumberFormat(locale, { style: "unit", unit: "hour", unitDisplay: "long" }).format(event.duration / 60)
      : new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "long" }).format(event.duration);
  const seatsText = seatsLeft === undefined ? null : seatsLeft <= 0 ? labels.seatsFull : seatsLeft === 1 ? labels.seatsLeftOne : text(labels.seatsLeft, { count: new Intl.NumberFormat(locale).format(seatsLeft) });

  const problems: { name?: string; email?: string } = {};
  if (!values.name.trim()) problems.name = labels.nameRequired;
  if (!values.email.trim()) problems.email = labels.emailRequired;
  else if (!ADDRESS.test(values.email.trim())) problems.email = labels.emailInvalid;
  /** A mistake is only shown once the reader has been in that field or has tried to send. */
  const shown = (field: "name" | "email") => (submitted || touched[field] ? problems[field] : undefined);
  const touch = (field: "name" | "email") => setTouched((current) => (current[field] ? current : { ...current, [field]: true }));

  useEffect(() => {
    if (done && acted.current) doneRef.current?.focus();
  }, [done]);
  useEffect(() => {
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the reader lands on it.
    if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  async function submit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    if (status === "busy" || full) return;
    acted.current = true;
    setSubmitted(true);
    if (problems.name) {
      nameRef.current?.focus();
      return;
    }
    if (problems.email) {
      emailRef.current?.focus();
      return;
    }
    const registration: WebinarRegistration = { name: values.name.trim(), email: values.email.trim(), sendRecording: values.recording };
    setStatus("busy");
    try {
      await onSubmit(registration);
      setSentTo(registration.email);
      setSentRecording(registration.sendRecording);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section data-slot="webinar-signup" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-x-14 gap-y-10 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] @4xl:grid-rows-[auto_1fr]">
        <div className="min-w-0 @4xl:col-start-1 @4xl:row-start-1">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{labels.eyebrow}</p>
          <Heading id={`${id}-title`} className="mt-4 text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {event.title}
          </Heading>
          {description ? <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

          <div className="mt-8 grid gap-3.5 text-[0.9375rem] leading-snug">
            <p className={fact}>
              <IconCalendar aria-hidden="true" />
              <time dateTime={event.startsAt} className="font-medium">
                {announcedDay}
              </time>
            </p>
            <div className={fact}>
              <IconClock aria-hidden="true" />
              <div className="min-w-0">
                <p>
                  <span className="font-medium tabular-nums">{announcedTime}</span>
                  <span className="whitespace-nowrap text-muted-foreground"> · {length}</span>
                </p>
                {/* Reserved from the first render, so the line that appears in the browser does not push the rest down. */}
                <p className="mt-1 min-h-5 text-muted-foreground tabular-nums">
                  {localTime ? (
                    <span className="transition-opacity duration-300 motion-reduce:transition-none starting:opacity-0">{text(labels.local, { time: localTime })}</span>
                  ) : null}
                </p>
              </div>
            </div>
            {seatsText ? (
              <p className={fact}>
                <IconUsers aria-hidden="true" />
                <span className={cn(full && "font-medium")}>{seatsText}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* On a phone the form follows the date; from 896px it takes the second column and both rows of the first. Below that the left column would be too narrow for the headline and the speakers. */}
        <div className="min-w-0 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs @2xl:p-7">
            {done ? (
              <div ref={doneRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
                <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-muted">
                  <IconCheck size={22} strokeWidth={2.25} />
                </span>
                <SubHeading className="mt-6 text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">{labels.doneTitle}</SubHeading>
                <p className="mt-2.5 text-base leading-relaxed text-pretty text-muted-foreground">{fill(labels.done, { email: <strong className="font-medium break-words text-foreground">{sentTo}</strong> })}</p>
                <div className="mt-6 grid gap-3 border-t border-border pt-6 text-sm leading-snug">
                  <p className={fact}>
                    <IconBell aria-hidden="true" />
                    <span className="text-pretty">{reminders ?? labels.reminders}</span>
                  </p>
                  {sentRecording ? (
                    <p className={fact}>
                      <IconCheck aria-hidden="true" />
                      <span className="text-pretty">{labels.recordingDone}</span>
                    </p>
                  ) : null}
                </div>
                {calendarHref ? (
                  <Button asChild variant="outline" size="lg" className="mt-6 w-full">
                    <a href={calendarHref} download={calendarHref.startsWith("data:") ? calendarFileName : undefined}>
                      <IconCalendarPlus />
                      {labels.calendar}
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <SubHeading className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">{labels.form}</SubHeading>
                <form noValidate onSubmit={submit} aria-busy={status === "busy" || undefined} className="mt-6 grid gap-5">
                  <FormField className="content-start" error={shown("name")}>
                    <FormLabel>{labels.name}</FormLabel>
                    <FormControl>
                      <Input
                        ref={nameRef}
                        name="name"
                        autoComplete="name"
                        aria-required="true"
                        placeholder={labels.namePlaceholder}
                        className="text-base @md:text-sm"
                        disabled={full}
                        value={values.name}
                        onChange={(change) => setValues((current) => ({ ...current, name: change.target.value }))}
                        onBlur={() => touch("name")}
                      />
                    </FormControl>
                  </FormField>
                  <FormField className="content-start" error={shown("email")}>
                    <FormLabel>{labels.email}</FormLabel>
                    <FormControl>
                      <Input
                        ref={emailRef}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-required="true"
                        placeholder={labels.emailPlaceholder}
                        className="text-base @md:text-sm"
                        disabled={full}
                        value={values.email}
                        onChange={(change) => setValues((current) => ({ ...current, email: change.target.value }))}
                        onBlur={() => touch("email")}
                      />
                    </FormControl>
                  </FormField>

                  <div className="flex items-start gap-3">
                    <Checkbox id={recordingId} name="recording" aria-describedby={recordingHintId} disabled={full} checked={values.recording} onCheckedChange={(checked) => setValues((current) => ({ ...current, recording: checked === true }))} className="mt-0.5" />
                    <div className="grid gap-1">
                      <Label htmlFor={recordingId} className="leading-snug">
                        {labels.recording}
                      </Label>
                      <p id={recordingHintId} className="text-[0.8125rem] leading-snug text-muted-foreground">{labels.recordingHint}</p>
                    </div>
                  </div>

                  {status === "error" ? (
                    <p id={errorId} role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                      <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      {labels.failed}
                    </p>
                  ) : null}
                  <Button ref={submitRef} type="submit" size="lg" disabled={full} loading={status === "busy"} aria-describedby={status === "error" ? errorId : undefined} className="w-full">
                    {full ? labels.submitFull : labels.submit}
                  </Button>
                  {note ? <p className="text-center text-[0.8125rem] leading-snug text-pretty text-muted-foreground">{note}</p> : null}
                </form>
              </>
            )}
          </div>
        </div>

        {/* This column is a container of its own: the speakers go two abreast by the width they really have, not by the width of the whole section. */}
        {points.length > 0 || speakers.length > 0 ? (
          <div className="@container grid min-w-0 gap-10 @4xl:col-start-1 @4xl:row-start-2 @4xl:content-start">
            {points.length > 0 ? (
              <div>
                <SubHeading className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.learn}</SubHeading>
                <ul role="list" className="mt-5 grid gap-3.5">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-base leading-snug">
                      <IconCheck aria-hidden="true" className="mt-[0.2em] size-4 shrink-0" />
                      <span className="min-w-0 text-pretty">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {speakers.length > 0 ? (
              <div>
                <SubHeading className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.speakers}</SubHeading>
                <ul role="list" className="mt-5 grid gap-x-8 gap-y-5 @lg:grid-cols-2">
                  {speakers.map((speaker) => (
                    <li key={speaker.name} className="flex items-center gap-3.5">
                      <Avatar size="lg">
                        {speaker.image ? <AvatarImage src={speaker.image} alt="" /> : null}
                        <AvatarFallback>{initialsOf(speaker.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug font-medium">{speaker.name}</p>
                        <p className="mt-0.5 text-sm leading-snug text-pretty text-muted-foreground">{speaker.role}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
