"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface AuditRequest {
  /** The site to look at, as the field shows it after tidying: https added and, unless `keepPath` is set, only the site itself. */
  url: string;
  /** The trimmed work email the report goes to. */
  email: string;
}

export interface FreeAuditFormLabels {
  /** The label of the website field. */
  url: string;
  /** The placeholder of the website field. */
  urlPlaceholder: string;
  /** The label of the email field. */
  email: string;
  /** The placeholder of the email field. */
  emailPlaceholder: string;
  /** The button. */
  submit: string;
  /** Said under the website field when it is empty. */
  urlRequired: string;
  /** Said under the website field when it is not a website address. */
  urlInvalid: string;
  /** Said under the email field when it is empty. */
  emailRequired: string;
  /** Said under the email field when it is not an address. */
  emailInvalid: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** The headline of the confirmation. */
  doneTitle: string;
  /** The sentence above what was received. */
  done: string;
  /** The term for the website in the confirmation. */
  site: string;
  /** The term for the address the report goes to in the confirmation. */
  sentTo: string;
  /** When the report arrives, if you did not pass a turnaround. */
  noTurnaround: string;
  /** The button that leads back to an empty form. */
  another: string;
}

const LABELS: FreeAuditFormLabels = {
  url: "Website address",
  urlPlaceholder: "yourcompany.com",
  email: "Work email",
  emailPlaceholder: "you@company.com",
  submit: "Get my free audit",
  urlRequired: "Enter the address of the site you want us to look at.",
  urlInvalid: "That does not look like a website address. Try yourcompany.com.",
  emailRequired: "Enter your work email so we know where to send the report.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  failed: "Your request did not go through. Nothing is lost: it is all still here, so try again.",
  doneTitle: "Audit requested",
  done: "Thanks, we have your request. This is what we received.",
  site: "Website",
  sentTo: "Report goes to",
  noTurnaround: "We will email the report as soon as it is ready.",
  another: "Request another audit",
};

export interface FreeAuditFormProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** Called with the tidied address and the email. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (request: AuditRequest) => Promise<void> | void;
  /** The heading: "Find out what is holding your site back". */
  title: string;
  /** One or two sentences under the heading: what you look at and what they get. */
  description?: string;
  /** What the audit covers, a line each. They sit under the description, and after the form on a phone. */
  points?: readonly string[];
  /** When the report arrives: "Report within 24 hours". Said under the button and again in the confirmation. */
  turnaround?: string;
  /** The small print under the button: what the email is used for. May hold a link. */
  consent?: ReactNode;
  /** Keep the path the visitor typed ("northwind.co/pricing") instead of reducing the address to the site. Off by default. */
  keepPath?: boolean;
  /** What you already know about the visitor. */
  defaultValues?: Partial<AuditRequest>;
  /** Where the form starts. "idle" by default; "done" shows the confirmation, which repeats the values in defaultValues. */
  defaultStatus?: "idle" | "done";
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<FreeAuditFormLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCHEME = /^([a-z][a-z0-9+.-]*):\/\//i;
/** A host name: dot-separated labels of letters and digits in any script, ending on a top-level domain of letters. */
const HOST = /^(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(?:\p{L}{2,63}|xn--[a-z0-9-]{1,59})$/u;

/**
 * Turns what was typed into an address worth auditing, or null when it cannot be one: https is added when there
 * is no scheme, the host is lower-cased, and everything after it is dropped unless the path is kept.
 */
function tidySite(input: string, keepPath: boolean): { url: string; display: string } | null {
  let rest = input.trim();
  if (!rest || /\s/.test(rest)) return null;
  let protocol = "https";
  const scheme = SCHEME.exec(rest);
  if (scheme) {
    const named = scheme[1]!.toLowerCase();
    if (named !== "http" && named !== "https") return null;
    protocol = named;
    rest = rest.slice(scheme[0].length);
  }
  const cut = rest.search(/[/?#]/);
  const authority = cut === -1 ? rest : rest.slice(0, cut);
  const tail = cut === -1 ? "" : rest.slice(cut);
  if (authority.includes("@")) return null;
  const [host = "", port, ...extra] = authority.split(":");
  if (extra.length > 0 || (port !== undefined && (!/^\d{1,5}$/.test(port) || Number(port) > 65535))) return null;
  const name = host.toLowerCase().replace(/\.$/, "");
  if (!HOST.test(name)) return null;
  const path = keepPath ? tail.replace(/#.*$/, "").replace(/\/+$/, "") : "";
  const base = `${name}${port ? `:${port}` : ""}${path.startsWith("?") ? "/" : ""}${path}`;
  return { url: `${protocol}://${base}`, display: base };
}

type Field = "url" | "email";
const ORDER: readonly Field[] = ["url", "email"];

/**
 * The opening move of an agency that sells on proof: trade a website address for a free review. Two fields (the
 * address and a work email) and one button, beside a heading, a line on what the audit covers and when the report
 * arrives. The address is tidied when the visitor leaves the field: https is added and, unless you keep paths,
 * everything after the site is dropped, so what the field shows is exactly what is sent. A mistake is said in
 * plain words beside its field once the visitor has been there or tried to send, and the first one takes focus.
 * The confirmation replaces the form, says what was received and when the report arrives, and takes focus so a
 * screen reader reads it. For SEO, security, performance and design agencies that open with an audit.
 */
export function FreeAuditForm({
  onSubmit,
  title,
  description,
  points,
  turnaround,
  consent,
  keepPath = false,
  defaultValues,
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: FreeAuditFormProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [values, setValues] = useState({ url: defaultValues?.url ?? "", email: defaultValues?.email ?? "" });
  const [touched, setTouched] = useState<Partial<Record<Field, true>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  const [received, setReceived] = useState<{ site: string; email: string }>(() => ({
    site: tidySite(defaultValues?.url ?? "", keepPath)?.display ?? (defaultValues?.url ?? "").trim(),
    email: (defaultValues?.email ?? "").trim(),
  }));
  // Focus only moves for something the visitor did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  // While the button is held down: pressing it blurs the field that had focus, and a mistake shown on that blur
  // pushes the button away before the press is over, so the click would be lost. A press counts as a send, not as leaving.
  const pressing = useRef(false);
  const refs = { url: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null) };
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const busy = status === "busy";

  const problems: Partial<Record<Field, string>> = {};
  if (!values.url.trim()) problems.url = labels.urlRequired;
  else if (!tidySite(values.url, keepPath)) problems.url = labels.urlInvalid;
  if (!values.email.trim()) problems.email = labels.emailRequired;
  else if (!ADDRESS.test(values.email.trim())) problems.email = labels.emailInvalid;
  /** A mistake is only shown once the visitor has been in that field or has tried to send. */
  const shown = (field: Field): string | undefined => (submitted || touched[field] ? problems[field] : undefined);
  const touch = (field: Field) => {
    if (pressing.current) return;
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  useEffect(() => {
    const release = () => {
      pressing.current = false;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, []);
  useEffect(() => {
    if (status === "done" && acted.current) doneRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the visitor lands on it.
    else if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  /** Tidy the address as the visitor leaves the field, so they see what will be sent. */
  function leaveUrl() {
    touch("url");
    const site = tidySite(values.url, keepPath);
    if (site && site.url !== values.url) setValues((current) => ({ ...current, url: site.url }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    acted.current = true;
    setSubmitted(true);
    const first = ORDER.find((field) => problems[field]);
    if (first) {
      refs[first].current?.focus();
      return;
    }
    const site = tidySite(values.url, keepPath);
    if (!site) return;
    const request: AuditRequest = { url: site.url, email: values.email.trim() };
    setValues({ url: request.url, email: request.email });
    setStatus("busy");
    try {
      await onSubmit(request);
      setReceived({ site: site.display, email: request.email });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setValues({ url: "", email: "" });
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
    // The confirmation that had focus is gone and the form is new: start at its first field.
    window.requestAnimationFrame(() => refs.url.current?.focus());
  }

  return (
    <section data-slot="free-audit-form" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-x-16 gap-y-8 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] @4xl:grid-rows-[auto_1fr] @4xl:items-start">
        <header className="min-w-0 @4xl:col-start-1 @4xl:row-start-1">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </header>

        <div className="w-full max-w-xl min-w-0 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1">
          {status === "done" ? (
            <div ref={doneRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
                <IconCheck size={22} strokeWidth={2.25} />
              </span>
              <SubHeading className="mt-5 text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">{labels.doneTitle}</SubHeading>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{labels.done}</p>
              <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-background">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{labels.site}</dt>
                  <dd className="min-w-0 text-sm font-medium break-all">{received.site}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{labels.sentTo}</dt>
                  <dd className="min-w-0 text-sm font-medium break-all">{received.email}</dd>
                </div>
              </dl>
              <p className="mt-5 flex items-center gap-2 text-sm font-medium">
                <IconClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                {turnaround ?? labels.noTurnaround}
              </p>
              <Button type="button" variant="outline" onClick={again} className="mt-6">
                {labels.another}
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} aria-labelledby={`${id}-title`} aria-busy={busy || undefined} className="grid gap-5">
              <FormField className="content-start" error={shown("url")}>
                <FormLabel>{labels.url}</FormLabel>
                <FormControl>
                  <Input
                    ref={refs.url}
                    name="url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-required="true"
                    placeholder={labels.urlPlaceholder}
                    value={values.url}
                    onChange={(event) => setValues((current) => ({ ...current, url: event.target.value }))}
                    onBlur={leaveUrl}
                    className="h-10"
                  />
                </FormControl>
              </FormField>
              <FormField className="content-start" error={shown("email")}>
                <FormLabel>{labels.email}</FormLabel>
                <FormControl>
                  <Input
                    ref={refs.email}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-required="true"
                    placeholder={labels.emailPlaceholder}
                    value={values.email}
                    onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                    onBlur={() => touch("email")}
                    className="h-10"
                  />
                </FormControl>
              </FormField>

              {status === "error" ? (
                <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {labels.failed}
                </p>
              ) : null}
              <div className="grid gap-3">
                <Button
                  ref={submitRef}
                  type="submit"
                  size="lg"
                  loading={busy}
                  onPointerDown={() => {
                    pressing.current = true;
                  }}
                  className="w-full"
                >
                  {labels.submit}
                </Button>
                {turnaround ? (
                  <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <IconClock aria-hidden="true" className="size-4 shrink-0" />
                    {turnaround}
                  </p>
                ) : null}
              </div>
              {consent ? <p className="text-center text-xs leading-relaxed text-pretty text-muted-foreground">{consent}</p> : null}
            </form>
          )}
        </div>

        {points?.length ? (
          <ul role="list" className="grid min-w-0 gap-3 text-[0.9375rem] leading-snug @4xl:col-start-1 @4xl:row-start-2 @4xl:self-start">
            {points.map((point, index) => (
              <li key={`${index}-${point}`} className="flex items-start gap-3">
                <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
