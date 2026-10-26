"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import {
  checkBirthdate,
  fill,
  orderFor,
  todayIn,
  wordsOf,
  type AgeGateLabels,
  type AgeMoment,
  type BirthdateParts,
  type BirthdateProblem,
  type DatePart,
} from "@rhs-ui/commerce/age-verification-gate/age";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export type { AgeGateLabels, AgeMoment } from "@rhs-ui/commerce/age-verification-gate/age";

interface AgeVerificationGateBase extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The age a visitor must have reached, in years. It is in the text and in the ring above the heading. Defaults to 18. */
  minimumAge?: number;
  /** "birthdate": three fields for the day, the month and the year, checked against the minimum age. "confirm": two buttons, "I am 18 or older" and "I am under 18". Defaults to "birthdate". */
  mode?: "birthdate" | "confirm";
  /** "dialog": a modal over the page that cannot be dismissed, with focus kept inside and the page behind it out of reach once it has opened in the browser; the server does not send it, so the HTML has no gate in it. "page": the gate as a whole page, for when you render it instead of the shop, and the one to use when the gate has to be in the HTML. Defaults to "dialog". */
  presentation?: "dialog" | "page";
  /** Whether the dialog is open. Without it the dialog is open until the visitor passes. A page gate that is not open renders nothing. */
  open?: boolean;
  /** Called when the visitor passes. It receives the date of birth as yyyy-mm-dd (in "confirm" mode there is none) and whether "remember" was ticked. Remembering the visitor, with a cookie or otherwise, is up to you. */
  onVerify?: (birthdate: string | undefined, remember: boolean) => void;
  /** The words next to a "remember me" checkbox. Without them there is no checkbox. */
  rememberLabel?: string;
  /** A link to your age policy, under the buttons: "Why do we ask?". */
  helpHref?: string;
  /** What the gate protects: "This shop sells alcohol". */
  title?: string;
  /** The line under the heading. Without it the gate says what it asks for and the minimum age. */
  description?: string;
  /** Your wordmark or logo, small, above the heading. */
  brand?: ReactNode;
  /** Small print under everything: what you do with a date of birth, for instance. */
  note?: ReactNode;
  /** Start on the message that says the visitor is too young, for a visitor who has said so already (a cookie you set in `onDecline`, say). */
  defaultDeclined?: boolean;
  /** Whether focus moves to the first field when the gate appears. Defaults to true; turn it off when the gate is one of several things on a page. */
  autoFocus?: boolean;
  /** The moment the age is measured at. Defaults to the browser's clock when the visitor presses the button. */
  now?: AgeMoment;
  /** The shop's time zone: it decides which calendar day today is. Defaults to "UTC". */
  timeZone?: string;
  /** Always pass your application locale. It decides the order of the three fields. */
  locale?: string;
  /** The heading of a page gate: "h2" by default, "h1" when the gate is the whole page. A dialog is named by its own title. */
  headingAs?: "h1" | "h2";
  /** The words, for another language. */
  labels?: AgeGateLabels;
}

/**
 * The way out for a visitor who is too young. At least one of the two is required, so the message that turns a
 * visitor away is never a dead end: it always ends in somewhere to go.
 */
type AgeGateWayOut =
  | {
      /** Called by "Leave this site" on the message that tells a visitor they are too young: send them somewhere kind, such as a search page or another site. Required unless you pass `leaveHref`. */
      onDecline: () => void;
      /** Where "Leave this site" goes. It is drawn as a link, so it works without a script; `onDecline`, when you pass it too, is called as the link is followed. */
      leaveHref?: string;
    }
  | {
      onDecline?: undefined;
      /** Where "Leave this site" goes. It is drawn as a link, so it works without a script. Required unless you pass `onDecline`. */
      leaveHref: string;
    };

export type AgeVerificationGateProps = AgeVerificationGateBase & AgeGateWayOut;

const MAX_LENGTH: Record<DatePart, number> = { day: 2, month: 2, year: 4 };
const AUTOCOMPLETE: Record<DatePart, string> = { day: "bday-day", month: "bday-month", year: "bday-year" };

const prevent = (event: Event): void => event.preventDefault();

/**
 * A gate for shops that sell what only adults may buy. It says what it protects ("This shop sells alcohol"), then
 * either asks for a date of birth in three number fields, in the order of the visitor's locale and refusing dates
 * that do not exist, or asks the plain question with two buttons. A visitor who passes calls `onVerify` and you
 * decide how long to remember them; a visitor who does not gets a calm message and a way out (`onDecline` or
 * `leaveHref`, one of them is required), never an error and never a dead end. As a dialog it is named, keeps focus
 * inside, leaves nothing behind it reachable until it is answered and gives focus back to what had it before; the
 * server does not send the dialog, so it is there once the page has loaded in the browser and not before. Use the
 * page presentation, which stands in for the shop, when the gate has to be in the HTML.
 */
export function AgeVerificationGate({
  minimumAge = 18,
  mode = "birthdate",
  presentation = "dialog",
  open,
  onVerify,
  onDecline,
  leaveHref,
  rememberLabel,
  helpHref,
  title,
  description,
  brand,
  note,
  defaultDeclined = false,
  autoFocus = true,
  now,
  timeZone = "UTC",
  locale = "en-US",
  headingAs: Title = "h2",
  labels,
  className,
  ...props
}: AgeVerificationGateProps) {
  const words = wordsOf(labels);
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `${base}-title`;
  const problemId = `${base}-problem`;
  const age = new Intl.NumberFormat(locale).format(minimumAge);
  const order = orderFor(locale);
  const [parts, setParts] = useState<BirthdateParts>({ day: "", month: "", year: "" });
  const [remember, setRemember] = useState(false);
  const [problem, setProblem] = useState<{ reason: BirthdateProblem; fields: readonly DatePart[] } | null>(null);
  const [declined, setDeclined] = useState(defaultDeclined);
  const [passed, setPassed] = useState(false);
  const [focusNext, setFocusNext] = useState<"first" | "heading" | DatePart | null>(null);
  const fields = useRef<Record<DatePart, HTMLInputElement | null>>({ day: null, month: null, year: null });
  const answer = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // What had focus before the dialog opened: the gate has no trigger of its own, so Radix has nothing to give focus back to.
  const before = useRef<HTMLElement | null>(null);

  const visible = open ?? !passed;
  const placeholders: Record<DatePart, string> = { day: words.dayPlaceholder, month: words.monthPlaceholder, year: words.yearPlaceholder };
  const names: Record<DatePart, string> = { day: words.day, month: words.month, year: words.year };

  function focusFirst() {
    if (mode === "birthdate") fields.current[order[0] ?? "day"]?.focus();
    else answer.current?.focus();
  }

  // Focus goes where the news is: the first field when the gate appears or starts over, the field that is wrong, the message that says the visitor is too young.
  useEffect(() => {
    if (focusNext === null) return;
    if (focusNext === "first") focusFirst();
    else if (focusNext === "heading") heading.current?.focus();
    else fields.current[focusNext]?.focus();
    setFocusNext(null);
    // focusFirst reads refs and props that only matter at the moment of the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNext]);

  useEffect(() => {
    if (presentation === "page" && autoFocus && visible) setFocusNext("first");
    // Only when the gate appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function change(part: DatePart, raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, MAX_LENGTH[part]);
    setParts((current) => ({ ...current, [part]: digits }));
    if (problem) setProblem(null);
    const next = order[order.indexOf(part) + 1];
    if (digits.length === MAX_LENGTH[part] && next) fields.current[next]?.focus();
  }

  function keyDown(part: DatePart, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      verify();
    } else if (event.key === "Backspace" && event.currentTarget.value === "") {
      const before = order[order.indexOf(part) - 1];
      if (before) {
        event.preventDefault();
        fields.current[before]?.focus();
      }
    }
  }

  function pass(birthdate: string | undefined) {
    onVerify?.(birthdate, remember);
    setPassed(true);
  }

  function verify() {
    const result = checkBirthdate(parts, todayIn(now ?? Date.now(), timeZone) ?? "", minimumAge);
    if (!result.ok) {
      setProblem({ reason: result.reason, fields: result.fields });
      const wrong = order.find((part) => result.fields.includes(part));
      if (wrong) setFocusNext(wrong);
      return;
    }
    setProblem(null);
    if (result.adult) pass(result.iso);
    else {
      setDeclined(true);
      setFocusNext("heading");
    }
  }

  function startOver() {
    setDeclined(false);
    setProblem(null);
    setParts({ day: "", month: "", year: "" });
    setFocusNext("first");
  }

  const dialog = presentation === "dialog";
  const headingClass = "text-2xl leading-tight font-medium tracking-[-0.035em] text-balance outline-none";
  // In the dialog, Radix names it from its own title and description ids, so they are left alone; the page names itself with ours.
  const heads = (text: string): ReactNode =>
    dialog ? (
      <DialogTitle ref={heading} tabIndex={-1} className={headingClass}>
        {text}
      </DialogTitle>
    ) : (
      <Title ref={heading} id={titleId} tabIndex={-1} className={headingClass}>
        {text}
      </Title>
    );
  const says = (text: string): ReactNode =>
    dialog ? (
      <DialogDescription className="text-base text-pretty">{text}</DialogDescription>
    ) : (
      <p className="text-base text-pretty text-muted-foreground">{text}</p>
    );

  const mark = (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-16 place-items-center rounded-full border-2 text-xl font-semibold tracking-[-0.04em] tabular-nums transition-colors duration-200 motion-reduce:transition-none",
        declined ? "border-muted-foreground/50 text-muted-foreground" : "border-foreground",
      )}
    >
      {age}+
    </span>
  );

  const more = (
    <>
      {helpHref ? (
        <a href={helpHref} className="rounded-sm text-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {words.help}
        </a>
      ) : null}
      {note ? <p className="max-w-sm text-xs leading-relaxed text-pretty text-muted-foreground">{note}</p> : null}
    </>
  );

  const body = declined ? (
    <div data-state="declined" className="grid justify-items-center gap-6 text-center">
      {mark}
      <div className="grid gap-2.5">
        {heads(words.declinedTitle)}
        {says(fill(words.declinedMessage, { age }))}
      </div>
      <div className="grid w-full gap-2.5">
        {/* The way out is never missing: a link when there is somewhere to go, a button when the page decides where. */}
        {leaveHref ? (
          <Button asChild size="lg" className="h-auto min-h-11 w-full py-2.5 whitespace-normal">
            <a href={leaveHref} onClick={onDecline}>
              {words.leave}
            </a>
          </Button>
        ) : onDecline ? (
          <Button type="button" size="lg" onClick={onDecline} className="h-auto min-h-11 w-full py-2.5 whitespace-normal">
            {words.leave}
          </Button>
        ) : null}
        {mode === "birthdate" ? (
          <Button type="button" variant="ghost" onClick={startOver} className="h-auto min-h-9 w-full py-2 whitespace-normal">
            {words.retry}
          </Button>
        ) : null}
      </div>
      {more}
    </div>
  ) : (
    <div data-state="asking" className="grid justify-items-center gap-6 text-center">
      {mark}
      <div className="grid justify-items-center gap-2.5">
        {brand ? <div className="text-sm font-medium tracking-[-0.01em] text-muted-foreground">{brand}</div> : null}
        {heads(title ?? words.title)}
        {says(description ?? fill(mode === "birthdate" ? words.description : words.descriptionConfirm, { age }))}
      </div>

      {mode === "birthdate" ? (
        <div className="grid w-full gap-5">
          <fieldset className="grid min-w-0 gap-2.5" aria-describedby={problem ? problemId : undefined}>
            <legend className="mb-1.5 w-full text-center text-sm font-medium">{words.legend}</legend>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: order.map((part) => (part === "year" ? "1.5fr" : "1fr")).join(" ") }}>
              {order.map((part) => (
                <div key={part} className="grid min-w-0 gap-1.5">
                  <Label htmlFor={`${base}-${part}`} className="justify-center text-xs font-normal text-muted-foreground">
                    {names[part]}
                  </Label>
                  <Input
                    id={`${base}-${part}`}
                    ref={(node) => {
                      fields.current[part] = node;
                    }}
                    inputMode="numeric"
                    autoComplete={AUTOCOMPLETE[part]}
                    maxLength={MAX_LENGTH[part]}
                    placeholder={placeholders[part]}
                    value={parts[part]}
                    aria-invalid={problem?.fields.includes(part) || undefined}
                    onChange={(event) => change(part, event.target.value)}
                    onKeyDown={(event) => keyDown(part, event)}
                    className="h-12 px-1 text-center text-lg tabular-nums"
                  />
                </div>
              ))}
            </div>
            <p id={problemId} role="alert" className="flex items-start justify-center gap-2 text-left text-sm font-medium text-destructive empty:hidden">
              {problem ? (
                <>
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {words.errors[problem.reason]}
                </>
              ) : null}
            </p>
          </fieldset>
          <Button type="button" size="lg" onClick={verify} className="h-auto min-h-11 w-full py-2.5 whitespace-normal">
            {words.submit}
          </Button>
        </div>
      ) : (
        <div className="grid w-full gap-2.5">
          <Button ref={answer} type="button" size="lg" onClick={() => pass(undefined)} className="h-auto min-h-11 w-full py-2.5 whitespace-normal">
            {fill(words.confirm, { age })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setDeclined(true);
              setFocusNext("heading");
            }}
            className="h-auto min-h-11 w-full py-2.5 whitespace-normal"
          >
            {fill(words.under, { age })}
          </Button>
        </div>
      )}

      {rememberLabel ? (
        <div className="flex items-center gap-3 text-left">
          <Checkbox id={`${base}-remember`} checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
          <Label htmlFor={`${base}-remember`} className="text-sm leading-snug font-normal">
            {rememberLabel}
          </Label>
        </div>
      ) : null}
      {more}
    </div>
  );

  if (dialog) {
    return (
      <Dialog open={visible}>
        <DialogContent
          data-slot="age-verification-gate"
          data-presentation="dialog"
          showCloseButton={false}
          onEscapeKeyDown={prevent}
          onPointerDownOutside={prevent}
          onInteractOutside={prevent}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const active = document.activeElement;
            before.current = active instanceof HTMLElement && active !== document.body ? active : null;
            if (autoFocus) focusFirst();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // Radix also calls this once too early in development, while the dialog is still on the page.
            if (event.target instanceof Node && event.target.isConnected) return;
            const back = before.current;
            before.current = null;
            // Give focus back to what had it before the gate opened, unless the page has already put it somewhere.
            if (back?.isConnected && (document.activeElement === null || document.activeElement === document.body)) back.focus();
          }}
          className={cn("max-w-[calc(100%-2rem)] gap-0 p-6 sm:max-w-md sm:p-9", className)}
          {...props}
        >
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  if (!visible) return null;
  // A page that stands in for the shop is a section of it, not a dialog: it traps nothing and makes nothing inert, so it does not claim to.
  return (
    <section
      data-slot="age-verification-gate"
      data-presentation="page"
      aria-labelledby={titleId}
      className={cn("grid min-h-svh grid-cols-[minmax(0,1fr)] place-items-center bg-muted/30 px-4 py-10", className)}
      {...props}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xs sm:p-9">{body}</div>
    </section>
  );
}
