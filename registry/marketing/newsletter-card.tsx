"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconMail } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export type NewsletterStatus = "idle" | "busy" | "success" | "error";

export interface NewsletterCardLabels {
  /** The field's visible label. */
  email: string;
  /** The field's placeholder. */
  placeholder: string;
  /** Said under the field when the address is empty or is not an address. */
  invalid: string;
  /** Said when onSubmit fails. The typed address stays where it is. */
  failed: string;
  /** The button's text after a failure. */
  retry: string;
  /** The headline of the success message. */
  doneTitle: string;
  /** What happens next. {email} stands for the address that was entered. */
  done: string;
  /** The button under the success message that goes back to the form. */
  another: string;
  /** The privacy line. {link} stands for the link to the policy; without a privacyHref it is left out. */
  privacy: string;
  /** The text of the link to the policy. */
  privacyLink: string;
}

const LABELS: NewsletterCardLabels = {
  email: "Email address",
  placeholder: "you@company.com",
  invalid: "Enter an email address like name@company.com.",
  failed: "We could not subscribe you just now. Your address is still here, so try again.",
  retry: "Try again",
  doneTitle: "Check your inbox",
  done: "We sent a confirmation link to {email}. Open it to confirm your address, and the next issue is yours.",
  another: "Use a different address",
  privacy: "We use your address for this email only. {link}",
  privacyLink: "Privacy policy",
};

export interface NewsletterCardProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /** What the newsletter is called: "The Friday brief". It names the card. */
  title: string;
  /** One sentence on what arrives and how often. Left out in the compact card. */
  description?: string;
  /** Called with the address the reader entered. Resolve to confirm it; reject to show the error and keep the address for a retry. */
  onSubmit: (email: string) => Promise<void> | void;
  /** The promise under the button: when it comes and how to leave. "Every Friday at 8:00. Leave with one click." */
  promise?: string;
  /** The button's text. Subscribe by default. */
  cta?: string;
  /** Your privacy policy. It becomes the link in the privacy line. */
  privacyHref?: string;
  /** For narrow places such as a footer column: no icon and no description, only the name, the field and the promise. */
  compact?: boolean;
  /** Controlled: the address in the field. */
  value?: string;
  /** Uncontrolled: the address the field starts with. */
  defaultValue?: string;
  /** Called with the address on every keystroke. */
  onValueChange?: (value: string) => void;
  /** Where an uncontrolled card starts. "idle" by default; "success" or "error" show that state, for a page that already knows the result. */
  defaultStatus?: NewsletterStatus;
  /** The level of the title: 3 by default. */
  headingLevel?: 2 | 3 | 4;
  /** The icon in the tile above the title. A mail icon by default. */
  icon?: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<NewsletterCardLabels>;
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
 * A small sign-up card for a blog sidebar, a footer column or the end of an
 * article: an icon, the name of the newsletter, a sentence on what arrives, one
 * field with a visible label, one button, and a line on how often and how to
 * leave. It is 20rem wide in a sidebar and lays out in two columns when it has
 * the room. The address is checked in words before anything is sent; a failure
 * keeps what was typed and turns the button into a retry; and success replaces
 * the form with a message that says what happens next, which takes focus so a
 * screen reader reads it.
 */
export function NewsletterCard({
  title,
  description,
  onSubmit,
  promise,
  cta = "Subscribe",
  privacyHref,
  compact = false,
  value,
  defaultValue = "",
  onValueChange,
  defaultStatus = "idle",
  headingLevel = 3,
  icon,
  labels: custom,
  className,
  ...props
}: NewsletterCardProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [status, setStatus] = useState<NewsletterStatus>(defaultStatus);
  const [own, setOwn] = useState(defaultValue);
  const [problem, setProblem] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  // Focus only moves for something the reader did, never on the first render of a card that starts in a state.
  const acted = useRef(false);
  const email = value ?? own;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const fieldId = `${id}-email`;
  const problemId = `${id}-problem`;
  const failedId = `${id}-failed`;
  const promiseId = `${id}-promise`;

  useEffect(() => {
    if (!acted.current) return;
    if (status === "success") doneRef.current?.focus();
    // A disabled button gives up focus while it is busy; hand it back so a retry is one key press away.
    else if (status === "error" && (!document.activeElement || document.activeElement === document.body)) buttonRef.current?.focus();
  }, [status]);

  function edit(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
    if (problem) setProblem(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy") return;
    const address = email.trim();
    if (!ADDRESS.test(address)) {
      setProblem(true);
      inputRef.current?.focus();
      return;
    }
    acted.current = true;
    setProblem(false);
    setStatus("busy");
    try {
      await onSubmit(address);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    edit("");
    setStatus("idle");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  // Only an address that is not an address is invalid. After a failure the address is fine, so the field stays neutral and the failure is tied to it as a description.
  const describedBy = [problem ? problemId : null, status === "error" ? failedId : null, promise && status !== "success" ? promiseId : null].filter(Boolean).join(" ") || undefined;
  const privacy = privacyHref ? (
    <a href={privacyHref} className="rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
      {labels.privacyLink}
    </a>
  ) : null;

  return (
    <section data-slot="newsletter-card" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className={cn("grid gap-5 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] @2xl:items-center @2xl:gap-10 @2xl:p-6", compact ? "gap-4 p-4" : "p-5")}>
        <div className="min-w-0">
          {compact ? null : (
            <span aria-hidden="true" className="mb-4 grid size-10 place-items-center rounded-lg border border-border bg-muted/60 text-foreground [&_svg]:size-[1.125rem]">
              {icon ?? <IconMail />}
            </span>
          )}
          <Heading id={`${id}-title`} className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance @2xl:text-lg">
            {title}
          </Heading>
          {description && !compact ? <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </div>

        {status === "success" ? (
          <div ref={doneRef} tabIndex={-1} role="status" className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4 outline-none transition-[opacity,translate] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
            <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <IconCheck size={14} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-6 font-medium">{labels.doneTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {fill(labels.done, { email: <strong className="font-medium break-words text-foreground">{email.trim()}</strong> })}
              </p>
              <Button type="button" variant="link" onClick={again} className="mt-2 h-auto rounded-sm p-0 text-[0.8125rem] underline decoration-foreground/40 hover:decoration-current">
                {labels.another}
              </Button>
            </div>
          </div>
        ) : (
          <form noValidate aria-busy={status === "busy" || undefined} onSubmit={submit} className="grid min-w-0 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={fieldId}>{labels.email}</Label>
              <div className="flex flex-col gap-2 @md:flex-row @md:items-start">
                {/* The message about the address sits directly under the field, in the stacked card and beside the button alike. */}
                <div className="grid min-w-0 gap-2 @md:flex-1">
                  <Input
                    ref={inputRef}
                    id={fieldId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={labels.placeholder}
                    value={email}
                    onChange={(event) => edit(event.target.value)}
                    aria-invalid={problem || undefined}
                    aria-describedby={describedBy}
                  />
                  {problem ? (
                    <p id={problemId} role="alert" className="text-xs leading-snug font-medium text-destructive">
                      {labels.invalid}
                    </p>
                  ) : null}
                </div>
                <Button ref={buttonRef} type="submit" loading={status === "busy"} className="w-full @md:w-auto @md:shrink-0">
                  {status === "error" ? labels.retry : cta}
                </Button>
              </div>
            </div>
            {status === "error" ? (
              <p id={failedId} role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {labels.failed}
              </p>
            ) : null}
            {promise ? (
              <p id={promiseId} className="text-xs leading-relaxed text-pretty text-muted-foreground">
                {promise}
              </p>
            ) : null}
            <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{fill(labels.privacy, { link: privacy })}</p>
          </form>
        )}
      </div>
    </section>
  );
}
