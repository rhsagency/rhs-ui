"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconHelp, IconPin } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/** The three answers a coverage check can give. `not-yet` means "not covered today, and we may be soon". */
export type CoverageStatus = "available" | "not-yet" | "unknown";

export interface CoverageDetail {
  /** What the fact is: "Next delivery". */
  label: string;
  /** The fact itself: "Tuesday 3 November". */
  value: string;
}

export interface CoverageResult {
  /** The answer. */
  status: CoverageStatus;
  /** Replaces the heading written from the labels for this answer: "Yes, Utrecht is on our route". */
  title?: string;
  /** One or two sentences on what the answer means for this address: "Order before 17:00 and it arrives the next working day." */
  message?: string;
  /** Facts that follow from the answer, as label and value: a delivery day, an install date, a price. */
  details?: readonly CoverageDetail[];
}

export interface CoverageCheckLabels {
  /** The button that checks. */
  check: string;
  /** Said under the field when nothing was typed. {label} stands for the label of the field, in lower case: "postcode". */
  required: string;
  /** Said under the field when the text does not match the pattern. {label} stands for the label of the field, in lower case. */
  invalid: string;
  /** Said when onCheck fails. What was typed stays where it is. */
  failed: string;
  /** The heading of a covered address. {query} stands for the text that was checked. */
  availableTitle: string;
  /** The sentence under it when the result brings no message. */
  availableText: string;
  /** The heading of an address that is not covered yet. {query} stands for the text that was checked. */
  notYetTitle: string;
  /** The sentence under it when the result brings no message. */
  notYetText: string;
  /** The heading of an address that could not be checked. {query} stands for the text that was checked. */
  unknownTitle: string;
  /** The sentence under it when the result brings no message. */
  unknownText: string;
  /** The label of the email field that asks to be told when coverage arrives. */
  notifyLabel: string;
  /** The placeholder of that field. */
  notifyPlaceholder: string;
  /** The button next to it. */
  notify: string;
  /** Said under it when it is empty. */
  notifyRequired: string;
  /** Said under it when it is not an address. */
  notifyInvalid: string;
  /** Said when onNotify fails. The typed address stays where it is. */
  notifyFailed: string;
  /** The confirmation after it. {email} and {query} stand for the address and the text that was checked. */
  notified: string;
  /** The button that goes back to the field. */
  another: string;
}

const LABELS: CoverageCheckLabels = {
  check: "Check",
  required: "Enter your {label} so we can look it up.",
  invalid: "That {label} does not look right. Check it for typing mistakes.",
  failed: "We could not check just now. What you typed is still here, so try again.",
  availableTitle: "Good news, we cover {query}",
  availableText: "We can serve this address.",
  notYetTitle: "We are not in {query} yet",
  notYetText: "We do not reach this address yet.",
  unknownTitle: "We could not confirm {query}",
  unknownText: "We could not match it with our coverage. Check the spelling and try again, or contact us and we will look it up by hand.",
  notifyLabel: "Tell me when you arrive",
  notifyPlaceholder: "you@company.com",
  notify: "Notify me",
  notifyRequired: "Enter your email so we know where to write.",
  notifyInvalid: "That does not look like an email address. Try name@company.com.",
  notifyFailed: "We could not save your email just now. Try again.",
  notified: "Done. We will email {email} when we reach {query}.",
  another: "Check another address",
};

export interface CoverageCheckProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /**
   * Looks the text up and answers. Resolve with the result; reject to show the failure message and keep what was
   * typed. It is called with the trimmed text, once it has passed the pattern.
   */
  onCheck: (query: string) => Promise<CoverageResult> | CoverageResult;
  /**
   * Called with the address and the text that was checked when someone asks to be told once the place is covered.
   * Resolve to confirm; reject to show the failure. Without it a not-yet answer has no email field.
   */
  onNotify?: (email: string, query: string) => Promise<void> | void;
  /** The heading: "Do we deliver to you?". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The visible label of the field. "Postcode" by default. */
  label?: string;
  /** The placeholder of the field: "3511 AB". */
  placeholder?: string;
  /** A line under the field, such as what the text is used for: "We only use this to check where we deliver." */
  hint?: string;
  /** The keyboard a phone shows. "text" by default, because postcodes have letters; use "numeric" for ZIP codes. */
  inputMode?: ComponentProps<"input">["inputMode"];
  /**
   * What the trimmed text must match completely, as a regular expression source like the HTML pattern attribute.
   * A loose postcode shape by default (three to ten letters, digits, spaces and hyphens). For full addresses
   * pass something wider such as ".{5,}".
   */
  pattern?: string;
  /** The autofill hint of the field. "postal-code" by default; "street-address" for an address. */
  autoComplete?: string;
  /** Shown next to "Check another address" when the place is covered, such as a link into the shop. */
  action?: ReactNode;
  /** The text the field starts with. */
  defaultValue?: string;
  /** Starts on this answer instead of the field, for a page that already knows it. It is about `defaultValue`. */
  defaultResult?: CoverageResult;
  /** The level of the heading: 2 by default. The answer's heading sits one level below it. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<CoverageCheckLabels>;
}

/** Three to ten letters, digits, spaces and hyphens, starting and ending on a letter or digit. */
const DEFAULT_PATTERN = "[A-Za-z0-9][A-Za-z0-9 \\-]{1,8}[A-Za-z0-9]";
const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const write = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => values[key] ?? marker);

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

function compile(pattern: string): RegExp | null {
  try {
    return new RegExp(`^(?:${pattern})$`);
  } catch {
    return null;
  }
}

const COPY = {
  available: { title: "availableTitle", text: "availableText" },
  "not-yet": { title: "notYetTitle", text: "notYetText" },
  unknown: { title: "unknownTitle", text: "unknownText" },
} as const satisfies Record<CoverageStatus, { title: keyof CoverageCheckLabels; text: keyof CoverageCheckLabels }>;

/**
 * Each answer has its own icon and its own shape of tile, so the three differ without colour: a solid disc, an
 * outlined one and a dashed one. The lines are drawn against the card, so they stay visible in both themes.
 */
const TONE: Record<CoverageStatus, { tile: string; icon: ReactNode }> = {
  available: { tile: "bg-primary text-primary-foreground", icon: <IconCheck size={20} strokeWidth={2.25} /> },
  "not-yet": { tile: "border border-foreground/30 bg-card text-foreground", icon: <IconClock size={20} /> },
  unknown: { tile: "border border-dashed border-muted-foreground/60 bg-transparent text-foreground", icon: <IconHelp size={20} /> },
};

/**
 * "Do you reach me?" answered in one step: a field for a postcode or an address and one button, and then the
 * answer in place of the form, one of three. Covered says what it means (delivery days, an install date) with
 * facts as label and value; not yet offers an email field to be told when you arrive; unknown asks the visitor to
 * check the address. Every answer has a heading and its own icon, so none leans on colour. The answer is a status
 * message that takes focus, so a screen reader reads it, and Check another address brings focus back to the
 * field with the old text selected. The text is checked against a pattern you can change before anything is sent.
 * For delivery areas, fibre or service coverage, local installers and franchises.
 */
export function CoverageCheck({
  onCheck,
  onNotify,
  title,
  description,
  label = "Postcode",
  placeholder,
  hint,
  inputMode = "text",
  pattern = DEFAULT_PATTERN,
  autoComplete = "postal-code",
  action,
  defaultValue = "",
  defaultResult,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: CoverageCheckProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [asked, setAsked] = useState(defaultResult ? defaultValue.trim() : "");
  const [result, setResult] = useState<CoverageResult | null>(defaultResult ?? null);
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState<"idle" | "busy" | "error" | "done">("idle");
  const [emailProblem, setEmailProblem] = useState<string | null>(null);
  const [notifiedTo, setNotifiedTo] = useState("");
  // Focus only moves for something the visitor did, never on the first render of a block that starts on an answer.
  const acted = useRef(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const checkRef = useRef<HTMLButtonElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const notifyRef = useRef<HTMLButtonElement>(null);
  const notifiedRef = useRef<HTMLDivElement>(null);
  const matcher = useMemo(() => compile(pattern), [pattern]);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const AnswerHeading = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const busy = status === "busy";

  useEffect(() => {
    if (result && acted.current) answerRef.current?.focus();
  }, [result]);
  useEffect(() => {
    if (!acted.current) return;
    if (notify === "done") notifiedRef.current?.focus();
    // A disabled button gives up focus while it is busy; hand it back so a retry is one key press away.
    else if (notify === "error") notifyRef.current?.focus();
  }, [notify]);
  useEffect(() => {
    if (status === "error" && acted.current) checkRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    acted.current = true;
    const query = value.trim();
    // The default sentences name the field by its label, so a block that asks for an address never talks about postcodes.
    // The label is written the way a sentence has it: "Postal Code" becomes "postal code", an acronym such as "ZIP" stays.
    const noun = label.replace(/\p{Lu}(?=\p{Ll})/gu, (letter) => letter.toLowerCase());
    const mistake = !query ? write(labels.required, { label: noun }) : matcher && !matcher.test(query) ? write(labels.invalid, { label: noun }) : null;
    setProblem(mistake);
    if (mistake) {
      fieldRef.current?.focus();
      return;
    }
    setStatus("busy");
    try {
      const answer = await onCheck(query);
      setAsked(query);
      setNotify("idle");
      setEmail("");
      setEmailProblem(null);
      setResult(answer);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function submitNotify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onNotify || notify === "busy") return;
    acted.current = true;
    const address = email.trim();
    const mistake = !address ? labels.notifyRequired : !ADDRESS.test(address) ? labels.notifyInvalid : null;
    setEmailProblem(mistake);
    if (mistake) {
      emailRef.current?.focus();
      return;
    }
    setNotify("busy");
    try {
      await onNotify(address, asked);
      setNotifiedTo(address);
      setNotify("done");
    } catch {
      setNotify("error");
    }
  }

  function again() {
    acted.current = true;
    setResult(null);
    setProblem(null);
    setStatus("idle");
    // The answer that had focus is gone: land on the field, with the old text selected so typing replaces it.
    window.requestAnimationFrame(() => {
      fieldRef.current?.focus();
      fieldRef.current?.select();
    });
  }

  const tone = result ? (TONE[result.status] ?? TONE.unknown) : null;
  const copy = result ? (COPY[result.status] ?? COPY.unknown) : null;

  return (
    <section
      data-slot="coverage-check"
      data-status={result ? result.status : "idle"}
      aria-labelledby={`${id}-title`}
      className={cn("@container mx-auto w-full max-w-xl break-words", className)}
      {...props}
    >
      <div className="text-center">
        <span aria-hidden="true" className="mx-auto mb-5 grid size-12 place-items-center rounded-xl border border-border bg-card shadow-xs">
          <IconPin size={20} />
        </span>
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-7">
        {result && tone && copy ? (
          // One column that may shrink below its content (minmax(0,1fr)): a long address in the confirmation then wraps inside the card instead of widening it.
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <div ref={answerRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-full", tone.tile)}>
                  {tone.icon}
                </span>
                <div className="min-w-0 pt-0.5">
                  <AnswerHeading className="text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">{result.title ?? write(labels[copy.title], { query: asked })}</AnswerHeading>
                  <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{result.message ?? labels[copy.text]}</p>
                </div>
              </div>
              {result.details?.length ? (
                <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-background">
                  {result.details.map((detail, index) => (
                    <div key={`${index}-${detail.label}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 px-4 py-3">
                      <dt className="text-sm text-muted-foreground">{detail.label}</dt>
                      <dd className="text-sm font-medium tabular-nums">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            {result.status === "not-yet" && onNotify ? (
              notify === "done" ? (
                <div ref={notifiedRef} tabIndex={-1} role="status" className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
                  <span aria-hidden="true" className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <IconCheck size={14} strokeWidth={2.5} />
                  </span>
                  <p className="min-w-0 text-sm leading-relaxed text-pretty">
                    {fill(labels.notified, {
                      email: <strong className="font-medium [overflow-wrap:anywhere]">{notifiedTo}</strong>,
                      query: <strong className="font-medium [overflow-wrap:anywhere]">{asked}</strong>,
                    })}
                  </p>
                </div>
              ) : (
                <form noValidate onSubmit={submitNotify} aria-busy={notify === "busy" || undefined} className="rounded-xl border border-border bg-muted/40 p-4">
                  <FormField className="content-start" error={emailProblem}>
                    <FormLabel>{labels.notifyLabel}</FormLabel>
                    <div className="flex flex-col gap-2 @md:flex-row">
                      <FormControl>
                        <Input
                          ref={emailRef}
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder={labels.notifyPlaceholder}
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            if (emailProblem) setEmailProblem(null);
                          }}
                          className="@md:flex-1"
                        />
                      </FormControl>
                      {/* The minimum width holds the room of the spinner (1rem and a gap), so the button does not grow and push the field when it turns busy. */}
                      <Button ref={notifyRef} type="submit" loading={notify === "busy"} className="w-full min-w-31 @md:w-auto @md:shrink-0">
                        {labels.notify}
                      </Button>
                    </div>
                  </FormField>
                  {notify === "error" ? (
                    <p role="alert" className="mt-3 flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                      <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      {labels.notifyFailed}
                    </p>
                  ) : null}
                </form>
              )
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              {result.status === "available" ? action : null}
              <Button type="button" variant="outline" onClick={again}>
                {labels.another}
              </Button>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={submit} aria-busy={busy || undefined} className="grid gap-3">
            <FormField className="content-start" error={problem}>
              <FormLabel>{label}</FormLabel>
              <div className="flex flex-col gap-2 @md:flex-row">
                <FormControl>
                  <Input
                    ref={fieldRef}
                    name="query"
                    inputMode={inputMode}
                    autoComplete={autoComplete}
                    spellCheck={false}
                    aria-required="true"
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      if (problem) setProblem(null);
                    }}
                    className="h-11 @md:flex-1"
                  />
                </FormControl>
                {/* The minimum width holds the room of the spinner (1rem and a gap), so the button does not grow and push the field when it turns busy. */}
                <Button ref={checkRef} type="submit" size="lg" loading={busy} className="w-full min-w-30 @md:w-auto @md:shrink-0">
                  {labels.check}
                </Button>
              </div>
            </FormField>
            {status === "error" ? (
              <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {labels.failed}
              </p>
            ) : null}
            {hint ? <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{hint}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
