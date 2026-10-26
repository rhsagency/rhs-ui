"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { IconAlertCircle, IconArrowRight, IconGift } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface WelcomeOffer {
  /** The offer in a few words, set large: "10% off your first order". */
  title: string;
  /** One or two sentences: who the offer is for and what comes with signing up. */
  description?: string;
  /** The conditions, a line each: "Minimum spend €25", "Valid for 30 days". Shown under the form and again with the code. */
  terms?: readonly string[];
}

/** What onSubmit resolves with: the code, or the code and whether this address had signed up before. */
export type WelcomeOfferResult = string | { code: string; returning?: boolean };

export interface WelcomeOfferAction {
  /** The button's text. "Start shopping" by default. */
  label?: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface WelcomeOfferSignupLabels {
  /** The small tag over the offer. */
  eyebrow: string;
  /** The label of the email field. */
  email: string;
  /** The placeholder of the email field. */
  emailPlaceholder: string;
  /** The button that sends the address. */
  submit: string;
  /** Said under the field when it is empty. */
  emailRequired: string;
  /** Said under the field when it is not an address. */
  emailInvalid: string;
  /** Said when onSubmit fails. The typed address stays where it is. */
  failed: string;
  /** The small line over the conditions next to the code. */
  terms: string;
  /** The headline of a new code. */
  revealTitle: string;
  /** The sentence under it. */
  revealText: string;
  /** The headline of a code that goes to someone who signed up before. */
  returningTitle: string;
  /** The sentence under it. {email} stands for the address. */
  returningText: string;
  /** The name of the copy button, for a screen reader. */
  copy: string;
  /** The button's text when the action has no label. */
  start: string;
}

const LABELS: WelcomeOfferSignupLabels = {
  eyebrow: "Welcome offer",
  email: "Email address",
  emailPlaceholder: "you@company.com",
  submit: "Get my code",
  emailRequired: "Enter your email address and we show your code.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  failed: "We could not create your code just now. Your address is still here, so try again.",
  terms: "The small print",
  revealTitle: "Your code is ready",
  revealText: "Copy it and paste it at checkout.",
  returningTitle: "Welcome back",
  returningText: "You already signed up with {email}, so here is your code again.",
  copy: "Copy discount code",
  start: "Start shopping",
};

export interface WelcomeOfferSignupProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** The offer: its headline, a sentence and its conditions. */
  offer: WelcomeOffer;
  /**
   * Called with the checked address. Resolve with the code, or with the code and `returning: true` when this address
   * signed up before; reject to show the error and keep the address. The code is not in the page until it arrives.
   */
  onSubmit: (email: string) => Promise<WelcomeOfferResult> | WelcomeOfferResult;
  /** The button under the code, such as one that goes to the shop. */
  action: WelcomeOfferAction;
  /** What the address is used for and how to leave: it sits beside the button, and it may hold a link. Marketing email needs it. */
  consent: ReactNode;
  /**
   * Starts on the code instead of the form, for a visitor who already has it. The code is then in the page, so pass
   * it only to someone who is meant to see it. Leave it out and no code exists in the page until the address is sent.
   */
  defaultResult?: { email: string; code: string; returning?: boolean };
  /** The level of the offer's headline: 2 by default. The code's headline sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<WelcomeOfferSignupLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/**
 * Trade an email for a first-order discount, and show the code right there. A split section: the offer on one side,
 * and on the other one email field and a button with the consent line beside it. On submit the form gives way to
 * the code in a copy field that says Copied in words, the conditions as a short list and a Start shopping button.
 * The code is never in the page before the address is sent: it arrives with the response, so a crawler or a view
 * source gets nothing. When the response says the address signed up before, the same path reads Welcome back
 * and hands the code over again. The result takes focus so a screen reader reads it. For shops and
 * direct-to-consumer brands.
 */
export function WelcomeOfferSignup({ offer, onSubmit, action, consent, defaultResult, headingLevel = 2, labels: custom, className, ...props }: WelcomeOfferSignupProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [email, setEmail] = useState(defaultResult?.email ?? "");
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultResult ? "done" : "idle");
  const [issued, setIssued] = useState<{ email: string; code: string; returning: boolean } | null>(
    defaultResult ? { email: defaultResult.email.trim(), code: defaultResult.code, returning: Boolean(defaultResult.returning) } : null,
  );
  // Focus only moves for something the visitor did, never on the first render of a section that starts on the code.
  const acted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const busy = status === "busy";
  const terms = offer.terms ?? [];

  useEffect(() => {
    if (status === "done" && acted.current) revealRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the visitor lands on it.
    else if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    acted.current = true;
    const address = email.trim();
    const mistake = !address ? labels.emailRequired : !ADDRESS.test(address) ? labels.emailInvalid : null;
    setProblem(mistake);
    if (mistake) {
      inputRef.current?.focus();
      return;
    }
    setStatus("busy");
    try {
      const result = await onSubmit(address);
      const code = (typeof result === "string" ? result : result.code).trim();
      if (!code) throw new Error("No code came back");
      setIssued({ email: address, code, returning: typeof result === "string" ? false : Boolean(result.returning) });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const startLabel = action.label ?? labels.start;
  const arrow = <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />;

  return (
    <section
      data-slot="welcome-offer-signup"
      data-status={status}
      aria-labelledby={`${id}-title`}
      className={cn("@container w-full overflow-hidden rounded-3xl border border-border bg-card break-words", className)}
      {...props}
    >
      <div className="grid h-full @4xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div className="flex min-w-0 flex-col justify-center p-7 @2xl:p-10 @4xl:p-14">
          <Badge variant="outline" className="w-fit">
            <IconGift aria-hidden="true" />
            {labels.eyebrow}
          </Badge>
          <Heading id={`${id}-title`} className="mt-5 text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance @2xl:text-5xl">
            {offer.title}
          </Heading>
          {offer.description ? <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{offer.description}</p> : null}
        </div>

        <div className="flex min-w-0 flex-col justify-center border-t border-border bg-muted/30 p-7 @2xl:p-10 @4xl:border-t-0 @4xl:border-l">
          {status === "done" && issued ? (
            // One column that may shrink below its content (minmax(0,1fr)): an address or a code with no spaces then wraps inside the card instead of widening it past the edge.
            <div className="grid w-full max-w-xl grid-cols-[minmax(0,1fr)] gap-6">
              <div ref={revealRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
                <SubHeading className="text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">{issued.returning ? labels.returningTitle : labels.revealTitle}</SubHeading>
                <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {issued.returning ? fill(labels.returningText, { email: <strong className="font-medium text-foreground [overflow-wrap:anywhere]">{issued.email}</strong> }) : labels.revealText}
                </p>
              </div>
              {/* The field keeps a line under it for "Copied to clipboard."; pulling it up 1rem leaves the status line clear of the next block and keeps the gaps even. */}
              <CopyField value={issued.code} label={labels.copy} className="-mb-4" />
              {terms.length ? (
                <div>
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.terms}</p>
                  <ul role="list" className="mt-3 divide-y divide-border rounded-xl border border-border bg-background text-sm">
                    {terms.map((term, index) => (
                      <li key={`${index}-${term}`} className="px-4 py-2.5 leading-snug">
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {action.href ? (
                <Button asChild size="lg" className="w-full">
                  <a href={action.href} onClick={action.onClick}>
                    {startLabel}
                    {arrow}
                  </a>
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={action.onClick} className="w-full">
                  {startLabel}
                  {arrow}
                </Button>
              )}
            </div>
          ) : (
            <form noValidate onSubmit={submit} aria-labelledby={`${id}-title`} aria-busy={busy || undefined} className="grid w-full max-w-xl gap-4">
              <FormField className="content-start" error={problem}>
                <FormLabel>{labels.email}</FormLabel>
                <FormControl>
                  <Input
                    ref={inputRef}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-required="true"
                    placeholder={labels.emailPlaceholder}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (problem) setProblem(null);
                    }}
                    className="h-11"
                  />
                </FormControl>
              </FormField>
              {status === "error" ? (
                <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {labels.failed}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {/* The minimum width holds the room of the spinner (1rem and a gap), so the button does not grow and reflow the consent text when it turns busy. */}
                <Button ref={submitRef} type="submit" size="lg" loading={busy} className="w-full min-w-41 @md:w-auto">
                  {labels.submit}
                </Button>
                <p className="min-w-40 flex-1 text-xs leading-snug text-pretty text-muted-foreground">{consent}</p>
              </div>
              {terms.length ? <p className="border-t border-border pt-4 text-xs leading-relaxed text-pretty text-muted-foreground">{terms.join(" · ")}</p> : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
