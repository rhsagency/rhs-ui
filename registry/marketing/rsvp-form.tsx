"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";

import { IconAlertCircle, IconCalendar, IconCalendarPlus, IconCheck, IconClock, IconClose, IconPin } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CheckboxGroup } from "@rhs-ui/primitives/checkbox-group";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface RsvpEvent {
  /** What the invitation is for, which is the heading: "Maria and Daan's wedding". */
  name: string;
  /** When it starts, as an ISO 8601 time with its offset or a Z: "2027-06-12T13:00:00Z". */
  startsAt: string;
  /** The IANA time zone of the place: "Europe/Amsterdam". The date and the time are written in it. */
  timeZone: string;
  /** Where it happens: "Villa Rozenhof, Wassenaar". */
  place: string;
}

export interface RsvpDietaryOption {
  /** What is sent to onSubmit: "vegetarian". */
  value: string;
  /** What the reader ticks: "Vegetarian". */
  label: string;
}

export interface RsvpResponse {
  /** The trimmed name. */
  name: string;
  /** Whether they are coming. */
  attending: boolean;
  /** How many guests they bring, not counting themselves. 0 when they are not coming. */
  guests: number;
  /** The `value` of every dietary need they ticked. Empty when they are not coming. */
  dietary: string[];
  /** The trimmed message. Empty when they left it out. */
  message: string;
}

export interface RsvpFormLabels {
  /** The small line above the heading. */
  eyebrow: string;
  /** The deadline. {date} stands for the day. */
  replyBy: string;
  /** The label of the name field. */
  name: string;
  /** The placeholder of the name field. */
  namePlaceholder: string;
  /** The question, and the name of the group of two answers. */
  attending: string;
  /** The title of the yes card. */
  yes: string;
  /** Under the title of the yes card. */
  yesHint: string;
  /** The title of the no card. */
  no: string;
  /** Under the title of the no card. */
  noHint: string;
  /** The label of the guest count. */
  guests: string;
  /** Under the guest count. {max} stands for the most one reply can bring. */
  guestsHint: string;
  /** The legend of the dietary needs. */
  dietary: string;
  /** Under the dietary needs. */
  dietaryHint: string;
  /** The label of the message. */
  message: string;
  /** Under the message. */
  messageHint: string;
  /** The placeholder of the message. */
  messagePlaceholder: string;
  /** The button. */
  submit: string;
  /** Said under the name field when it is empty. */
  nameRequired: string;
  /** Said under the question when neither card is chosen. */
  attendingRequired: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** The headline of the confirmation for someone who is coming. */
  yesTitle: string;
  /** The headline of the confirmation for someone who is not. */
  noTitle: string;
  /** The answer repeated in words. {name} stands for the name. */
  yesDone: string;
  /** The answer repeated in words, with guests. {name} stands for the name and {guests} for "2 guests". */
  yesDoneGuests: string;
  /** The answer repeated in words, for someone who cannot come. {name} stands for the name. */
  noDone: string;
  /** One guest. {count} stands for the number. */
  guestOne: string;
  /** Several guests. {count} stands for the number. */
  guestOther: string;
  /** The dietary needs repeated. {needs} stands for the list. */
  dietaryDone: string;
  /** The button that reopens the form. */
  change: string;
  /** The link that adds the event to a calendar. */
  calendar: string;
}

const LABELS: RsvpFormLabels = {
  eyebrow: "You are invited",
  replyBy: "Please reply by {date}",
  name: "Your name",
  namePlaceholder: "Maria Janssen",
  attending: "Will you be there?",
  yes: "Yes, I will be there",
  yesHint: "We will save you a seat.",
  no: "Sorry, I cannot make it",
  noHint: "We will miss you.",
  guests: "Guests you are bringing",
  guestsHint: "Not counting you. Up to {max}.",
  dietary: "Dietary needs",
  dietaryHint: "For you and your guests. Add anything else in your message.",
  message: "A message for the hosts",
  messageHint: "Optional.",
  messagePlaceholder: "Anything we should know?",
  submit: "Send my reply",
  nameRequired: "Tell us your name so we know who replied.",
  attendingRequired: "Choose yes or no.",
  failed: "Your reply did not go through. Nothing is lost: it is all still here, so try again.",
  yesTitle: "You are coming",
  noTitle: "Thank you for letting us know",
  yesDone: "{name}, we have you down as coming.",
  yesDoneGuests: "{name}, we have you down as coming with {guests}.",
  noDone: "{name}, we have you down as not able to come. We will miss you.",
  guestOne: "{count} guest",
  guestOther: "{count} guests",
  dietaryDone: "We noted: {needs}.",
  change: "Change my answer",
  calendar: "Add to calendar",
};

export interface RsvpFormProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** The invitation: what it is, when and where. */
  event: RsvpEvent;
  /** Called with the checked reply. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (response: RsvpResponse) => Promise<void> | void;
  /** The most guests one reply can bring, not counting the person who replies. 2 by default; 0 leaves the guest count out. */
  maxGuests?: number;
  /** The dietary needs to tick. Leave it out for no dietary question. */
  dietary?: readonly RsvpDietaryOption[];
  /** The day the hosts need the answer by, as an ISO 8601 time. It is written as a day in the event's time zone. */
  deadline?: string;
  /** The calendar file, supplied by you: a data URL ("data:text/calendar;charset=utf-8,BEGIN%3AVCALENDAR...") or a link to an .ics file. The confirmation offers it to people who are coming. */
  calendarHref?: string;
  /** The name the calendar file is saved under when it is a data URL. "invitation.ics" by default. */
  calendarFileName?: string;
  /** What you already know about the reader, such as an invitation addressed to them. */
  defaultValues?: Partial<RsvpResponse>;
  /** Where the form starts. "idle" by default; "done" shows the confirmation, which repeats defaultValues. */
  defaultStatus?: "idle" | "done";
  /** The language dates and numbers are written in. "en-US" by default. */
  locale?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<RsvpFormLabels>;
}

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** The hour as the locale writes it: two digits on a 24-hour clock ("08:00"), one on a 12-hour clock ("8:00 AM"). */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

const fact = "flex items-start gap-3 [&_svg]:mt-[0.2em] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

const TEXT_BUTTON =
  "w-fit rounded-sm text-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The reply to an invitation, for weddings, parties, open days and company events: the event, its day, its place and
 * the day the hosts need an answer by, then the form. The reader gives a name, chooses yes or no on two large cards
 * and, when the answer is yes, says how many guests they bring (a number with a limit) and ticks any dietary needs.
 * Choosing no takes the guest and dietary questions away, so nobody answers what does not apply. A message to the
 * hosts is optional. Mistakes are said in words beside their field once the reader has been there or tried to send,
 * and the first one takes focus. The confirmation repeats the answer in words, lists what was noted, offers Add to
 * calendar to people who are coming, and has a Change my answer that reopens the form with everything as it was.
 */
export function RsvpForm({
  event,
  onSubmit,
  maxGuests = 2,
  dietary,
  deadline,
  calendarHref,
  calendarFileName = "invitation.ics",
  defaultValues,
  defaultStatus = "idle",
  locale = "en-US",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: RsvpFormProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const guestsId = useId();
  const guestsHintId = useId();
  const errorId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [attending, setAttending] = useState<"yes" | "no" | "">(defaultValues?.attending === undefined ? "" : defaultValues.attending ? "yes" : "no");
  const [guests, setGuests] = useState(Math.min(defaultValues?.guests ?? 0, Math.max(0, maxGuests)));
  const [needs, setNeeds] = useState<string[]>(defaultValues?.dietary ?? []);
  const [message, setMessage] = useState(defaultValues?.message ?? "");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  // What was sent, so the confirmation repeats the answer even while the form behind it changes.
  const [sent, setSent] = useState<RsvpResponse | null>(
    defaultStatus === "done"
      ? { name: (defaultValues?.name ?? "").trim(), attending: defaultValues?.attending ?? true, guests: defaultValues?.guests ?? 0, dietary: defaultValues?.dietary ?? [], message: defaultValues?.message ?? "" }
      : null,
  );
  // Focus only moves for something the reader did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const done = status === "done";
  const coming = attending === "yes";
  const askGuests = coming && maxGuests > 0;
  const askDietary = coming && dietary !== undefined && dietary.length > 0;

  const problems = { name: name.trim() ? undefined : labels.nameRequired, attending: attending ? undefined : labels.attendingRequired };
  /** A mistake is only shown once the reader has been in that field or has tried to send. */
  const shownName = submitted || touched ? problems.name : undefined;
  const shownAttending = submitted ? problems.attending : undefined;

  const day = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: event.timeZone });
  const clock = new Intl.DateTimeFormat(locale, { ...clockOptions(locale), timeZone: event.timeZone });
  const start = new Date(event.startsAt);
  const replyBy = deadline ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: event.timeZone }).format(new Date(deadline)) : null;

  useEffect(() => {
    if (done && acted.current) doneRef.current?.focus();
  }, [done]);
  useEffect(() => {
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the reader lands on it.
    if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  async function submit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    if (status === "busy") return;
    acted.current = true;
    setSubmitted(true);
    if (problems.name) {
      nameRef.current?.focus();
      return;
    }
    if (problems.attending) {
      answerRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
      return;
    }
    const response: RsvpResponse = {
      name: name.trim(),
      attending: coming,
      guests: askGuests ? guests : 0,
      dietary: askDietary ? needs : [],
      message: message.trim(),
    };
    setStatus("busy");
    try {
      await onSubmit(response);
      setSent(response);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function reopen() {
    acted.current = true;
    setStatus("idle");
    // The form is back with every answer as it was; the first field is where a change most likely starts.
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  const guestWords = (count: number) => text(count === 1 ? labels.guestOne : labels.guestOther, { count });
  const noted = sent && sent.attending && sent.dietary.length > 0 && dietary ? new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(sent.dietary.map((value) => (dietary.find((option) => option.value === value)?.label ?? value).toLowerCase())) : null;

  return (
    <section data-slot="rsvp-form" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 break-words shadow-xs @md:p-8", className)} {...props}>
      <header className="border-b border-border pb-6">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{labels.eyebrow}</p>
        <Heading id={`${id}-title`} className="mt-3 text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance @md:text-3xl">
          {event.name}
        </Heading>
        <div className="mt-5 grid gap-2.5 text-[0.9375rem] leading-snug">
          <p className={fact}>
            <IconCalendar aria-hidden="true" />
            <time dateTime={event.startsAt}>
              <span className="font-medium">{day.format(start)}</span>
              <span className="text-muted-foreground tabular-nums">, {clock.format(start)}</span>
            </time>
          </p>
          <p className={fact}>
            <IconPin aria-hidden="true" />
            <span className="min-w-0 text-pretty">{event.place}</span>
          </p>
          {replyBy ? (
            <p className={cn(fact, "text-muted-foreground")}>
              <IconClock aria-hidden="true" />
              <span>{text(labels.replyBy, { date: replyBy })}</span>
            </p>
          ) : null}
        </div>
      </header>

      {done && sent ? (
        <div ref={doneRef} tabIndex={-1} role="status" className="pt-8 text-center outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
          <span aria-hidden="true" className={cn("mx-auto grid size-12 place-items-center rounded-full ring-8 ring-muted", sent.attending ? "bg-primary text-primary-foreground" : "border border-border bg-background")}>
            {sent.attending ? <IconCheck size={22} strokeWidth={2.25} /> : <IconClose size={20} strokeWidth={2} />}
          </span>
          <h3 className="mt-6 text-xl leading-tight font-medium tracking-[-0.03em] text-balance">{sent.attending ? labels.yesTitle : labels.noTitle}</h3>
          <p className="mx-auto mt-2.5 max-w-sm text-base leading-relaxed text-pretty text-muted-foreground">
            {sent.attending
              ? sent.guests > 0
                ? text(labels.yesDoneGuests, { name: sent.name, guests: guestWords(sent.guests) })
                : text(labels.yesDone, { name: sent.name })
              : text(labels.noDone, { name: sent.name })}
          </p>
          {noted ? <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">{text(labels.dietaryDone, { needs: noted })}</p> : null}
          <div className="mt-7 flex flex-col items-center gap-4">
            {sent.attending && calendarHref ? (
              <Button asChild variant="outline" size="lg" className="w-full @sm:w-auto">
                <a href={calendarHref} download={calendarHref.startsWith("data:") ? calendarFileName : undefined}>
                  <IconCalendarPlus />
                  {labels.calendar}
                </a>
              </Button>
            ) : null}
            <button type="button" onClick={reopen} className={TEXT_BUTTON}>
              {labels.change}
            </button>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={submit} aria-busy={status === "busy" || undefined} className="mt-8 grid gap-6">
          <FormField className="content-start" error={shownName}>
            <FormLabel>{labels.name}</FormLabel>
            <FormControl>
              <Input
                ref={nameRef}
                name="name"
                autoComplete="name"
                aria-required="true"
                placeholder={labels.namePlaceholder}
                className="text-base @md:text-sm"
                value={name}
                onChange={(change) => setName(change.target.value)}
                onBlur={() => setTouched(true)}
              />
            </FormControl>
          </FormField>

          <FormField className="content-start" error={shownAttending}>
            <p aria-hidden="true" className="text-sm leading-none font-medium">
              {labels.attending}
            </p>
            <div ref={answerRef}>
              {/* One above the other until the form is wide enough for two cards to hold their words; a form that is not that wide never squeezes them side by side. */}
              <RadioCards
                label={labels.attending}
                columns={1}
                className="@xl:grid-cols-2"
                value={attending}
                onValueChange={(value) => setAttending(value === "yes" ? "yes" : "no")}
                options={[
                  { value: "yes", title: labels.yes, description: labels.yesHint, icon: <IconCheck /> },
                  { value: "no", title: labels.no, description: labels.noHint, icon: <IconClose /> },
                ]}
              />
            </div>
          </FormField>

          {askGuests ? (
            <div className="grid gap-2 transition-[opacity,translate] duration-200 motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0">
              <Label htmlFor={guestsId}>{labels.guests}</Label>
              <NumberInput id={guestsId} aria-describedby={guestsHintId} value={guests} onValueChange={setGuests} min={0} max={maxGuests} locale={locale} />
              <p id={guestsHintId} className="text-xs text-muted-foreground">
                {text(labels.guestsHint, { max: maxGuests })}
              </p>
            </div>
          ) : null}

          {askDietary && dietary ? (
            <div className="grid gap-2 transition-[opacity,translate] duration-200 motion-reduce:transition-none starting:-translate-y-1 starting:opacity-0">
              <CheckboxGroup legend={labels.dietary} options={dietary} value={needs} onValueChange={setNeeds} className="@sm:grid-cols-2" />
              <p className="text-xs text-muted-foreground">{labels.dietaryHint}</p>
            </div>
          ) : null}

          <FormField described className="content-start">
            <FormLabel>{labels.message}</FormLabel>
            <FormControl>
              <Textarea name="message" rows={3} placeholder={labels.messagePlaceholder} className="text-base @md:text-sm" value={message} onChange={(change) => setMessage(change.target.value)} />
            </FormControl>
            <FormDescription>{labels.messageHint}</FormDescription>
          </FormField>

          {status === "error" ? (
            <p id={errorId} role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {labels.failed}
            </p>
          ) : null}
          <Button ref={submitRef} type="submit" size="lg" loading={status === "busy"} aria-describedby={status === "error" ? errorId : undefined} className="w-full">
            {labels.submit}
          </Button>
        </form>
      )}
    </section>
  );
}
