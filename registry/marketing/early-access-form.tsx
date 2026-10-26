"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconAlertCircle, IconCheck, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface EarlyAccessOption {
  /** What is sent to onSubmit: "product". */
  value: string;
  /** What the reader picks: "Product manager". */
  label: string;
}

export interface EarlyAccessApplication {
  /** The trimmed work email. */
  email: string;
  /** The `value` of the chosen role. */
  role: string;
  /** The `value` of the chosen team size. */
  teamSize: string;
  /** What they would use it for. Empty when they skipped it. */
  usage: string;
  /** The invite code, when one was entered. */
  inviteCode?: string;
}

export interface EarlyAccessLabels {
  /** The label of the email field. */
  email: string;
  /** The placeholder of the email field. */
  emailPlaceholder: string;
  /** The label of the role select. */
  role: string;
  /** The placeholder of the role select, while nothing is chosen. */
  rolePlaceholder: string;
  /** The label of the team size control. */
  teamSize: string;
  /** The label of the usage field. */
  usage: string;
  /** Under the usage field. */
  usageHint: string;
  /** The placeholder of the usage field. */
  usagePlaceholder: string;
  /** The link that reveals the invite code field. */
  haveCode: string;
  /** The link that hides it again. */
  noCode: string;
  /** The label of the invite code field. */
  code: string;
  /** The placeholder of the invite code field. */
  codePlaceholder: string;
  /** The button. */
  submit: string;
  /** Said under the email field when it is empty. */
  emailRequired: string;
  /** Said under the email field when it is not an address. */
  emailInvalid: string;
  /** Said under the role select when nothing is chosen. */
  roleRequired: string;
  /** Said under the team size control when nothing is chosen. */
  sizeRequired: string;
  /** Said when the invite code does not work. The rest of the form stays as it is. */
  codeInvalid: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** The headline of the confirmation. */
  doneTitle: string;
  /** What happens next. {email} stands for the address that will be written to. */
  done: string;
  /** The headline when a valid invite code skipped the queue. */
  invitedTitle: string;
  /** What happens next with a valid code. {email} stands for the address. */
  invited: string;
}

const LABELS: EarlyAccessLabels = {
  email: "Work email",
  emailPlaceholder: "you@company.com",
  role: "Your role",
  rolePlaceholder: "Choose your role",
  teamSize: "Team size",
  usage: "What would you use it for?",
  usageHint: "Optional. One or two sentences is plenty.",
  usagePlaceholder: "We want to move our roadmap and release notes out of spreadsheets.",
  haveCode: "I have an invite code",
  noCode: "I do not have a code",
  code: "Invite code",
  codePlaceholder: "HAL-4821",
  submit: "Request early access",
  emailRequired: "Enter your work email so we know where to write.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  roleRequired: "Choose the role closest to yours.",
  sizeRequired: "Choose how big your team is.",
  codeInvalid: "We did not recognise that invite code. Check it for typos, or remove it to apply without one.",
  failed: "Your application did not go through. Nothing is lost: it is all still here, so try again.",
  doneTitle: "Application received",
  done: "Thanks. We will email {email} once we have looked at it.",
  invitedTitle: "You are in",
  invited: "Your invite code works. We sent your access link to {email}.",
};

export interface EarlyAccessFormProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** Called with the checked application. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (application: EarlyAccessApplication) => Promise<void> | void;
  /** The roles to choose from, in the house select. */
  roles: readonly EarlyAccessOption[];
  /** The team sizes to choose from, as a segmented control: three to five short labels such as "1-10". */
  sizes: readonly EarlyAccessOption[];
  /** The heading: "Get early access". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** When people hear back, under the button and in the confirmation: "We review applications every Friday." */
  reviewTime?: string;
  /**
   * Checks an invite code on the way out. Resolve true to accept it, false to show the "not recognised" message
   * and keep the form open. Without it the code is passed to onSubmit as typed and your server decides.
   */
  checkInviteCode?: (code: string) => Promise<boolean> | boolean;
  /** What you already know about the reader. */
  defaultValues?: Partial<EarlyAccessApplication>;
  /** Where the form starts. "idle" by default; "done" and "invited" show a confirmation, which repeats the address in defaultValues. */
  defaultStatus?: "idle" | "done" | "invited";
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<EarlyAccessLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Values {
  email: string;
  role: string;
  size: string;
  usage: string;
  code: string;
}
type Field = "email" | "role" | "size";
const ORDER: readonly Field[] = ["email", "role", "size"];

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

const TEXT_BUTTON =
  "w-fit rounded-sm text-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A beta application that sorts the waitlist by fit: a work email, a role in
 * the house select, a team size as a segmented control and one optional
 * sentence on what they would use it for, with an invite code behind a link for
 * the people who already have one. A one-field waitlist cannot tell you who to
 * invite first, and a long survey is not finished; four short fields take under
 * a minute. Mistakes are said in words beside their field once the reader has
 * been there or tried to send, and the first one takes focus. An invite code
 * is checked on the way out and its failure is a sentence under the field, not
 * a failed application. The confirmation says what happens next and when.
 */
export function EarlyAccessForm({
  onSubmit,
  roles,
  sizes,
  title,
  description,
  reviewTime,
  checkInviteCode,
  defaultValues,
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: EarlyAccessFormProps) {
  const labels = { ...LABELS, ...custom };
  const [values, setValues] = useState<Values>({
    email: defaultValues?.email ?? "",
    role: defaultValues?.role ?? "",
    size: defaultValues?.teamSize ?? "",
    usage: defaultValues?.usage ?? "",
    code: defaultValues?.inviteCode ?? "",
  });
  const [showCode, setShowCode] = useState(Boolean(defaultValues?.inviteCode));
  const [touched, setTouched] = useState<Partial<Record<Field, true>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [codeProblem, setCodeProblem] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done" | "invited">(defaultStatus);
  const [sentTo, setSentTo] = useState((defaultValues?.email ?? "").trim());
  // Focus only moves for something the reader did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  const titleId = useId();
  const sizeLabelId = useId();
  const errorId = useId();
  const refs = {
    email: useRef<HTMLInputElement>(null),
    role: useRef<HTMLButtonElement>(null),
    code: useRef<HTMLInputElement>(null),
    haveCode: useRef<HTMLButtonElement>(null),
    submit: useRef<HTMLButtonElement>(null),
  };
  const sizeRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const finished = status === "done" || status === "invited";

  const problems: Partial<Record<Field, string>> = {};
  if (!values.email.trim()) problems.email = labels.emailRequired;
  else if (!ADDRESS.test(values.email.trim())) problems.email = labels.emailInvalid;
  if (!values.role) problems.role = labels.roleRequired;
  if (!values.size) problems.size = labels.sizeRequired;
  /** A mistake is only shown once the reader has been in that field or has tried to send. */
  const shown = (field: Field): string | undefined => (submitted || touched[field] ? problems[field] : undefined);

  const set = <K extends keyof Values>(field: K, value: Values[K]) => setValues((current) => ({ ...current, [field]: value }));
  const touch = (field: Field) => setTouched((current) => (current[field] ? current : { ...current, [field]: true }));

  useEffect(() => {
    if (finished && acted.current) doneRef.current?.focus();
  }, [finished]);
  useEffect(() => {
    // Opening the field moves focus into it, and closing it moves focus back to the link that opens it: the button the reader
    // just pressed is gone, and focus must not fall to the page.
    if (!acted.current) return;
    if (showCode) refs.code.current?.focus();
    else refs.haveCode.current?.focus();
  }, [showCode]);
  useEffect(() => {
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the reader lands on it.
    if (status === "error" && acted.current) refs.submit.current?.focus();
  }, [status]);

  function focusFirst(field: Field) {
    if (field === "size") sizeRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
    else refs[field].current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy") return;
    acted.current = true;
    setSubmitted(true);
    const first = ORDER.find((field) => problems[field]);
    if (first) {
      focusFirst(first);
      return;
    }
    const code = showCode ? values.code.trim() : "";
    setStatus("busy");
    let invited = false;
    if (code && checkInviteCode) {
      try {
        invited = await checkInviteCode(code);
      } catch {
        setStatus("error");
        return;
      }
      if (!invited) {
        setCodeProblem(true);
        setStatus("idle");
        refs.code.current?.focus();
        return;
      }
    }
    const application: EarlyAccessApplication = { email: values.email.trim(), role: values.role, teamSize: values.size, usage: values.usage.trim(), ...(code ? { inviteCode: code } : {}) };
    try {
      await onSubmit(application);
      setSentTo(application.email);
      setStatus(invited ? "invited" : "done");
    } catch {
      setStatus("error");
    }
  }

  function reveal(next: boolean) {
    acted.current = true;
    setShowCode(next);
    if (!next) {
      set("code", "");
      setCodeProblem(false);
    }
  }

  return (
    <section data-slot="early-access-form" data-status={status} aria-labelledby={titleId} className={cn("@container mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xs break-words sm:p-8", className)} {...props}>
      {finished ? (
        <div ref={doneRef} tabIndex={-1} role="status" className="flex flex-col items-center py-6 text-center outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
          <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-muted">
            <IconCheck size={22} strokeWidth={2.25} />
          </span>
          <Heading id={titleId} className="mt-6 text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">
            {status === "invited" ? labels.invitedTitle : labels.doneTitle}
          </Heading>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-pretty text-muted-foreground">
            {fill(status === "invited" ? labels.invited : labels.done, { email: <strong className="font-medium break-words text-foreground">{sentTo}</strong> })}
          </p>
          {reviewTime && status !== "invited" ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <IconClock aria-hidden="true" className="size-4 shrink-0" />
              {reviewTime}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <Heading id={titleId} className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">
            {title}
          </Heading>
          {description ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          <form noValidate onSubmit={submit} aria-busy={status === "busy" || undefined} className="mt-6 grid gap-5">
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
                  onChange={(event) => set("email", event.target.value)}
                  onBlur={() => touch("email")}
                />
              </FormControl>
            </FormField>

            <FormField className="content-start" error={shown("role")}>
              <FormLabel>{labels.role}</FormLabel>
              <Select
                value={values.role}
                onValueChange={(value) => {
                  set("role", value);
                  touch("role");
                }}
              >
                <FormControl>
                  <SelectTrigger ref={refs.role} aria-required="true" onBlur={() => touch("role")}>
                    <SelectValue placeholder={labels.rolePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField className="content-start" error={shown("size")}>
              {/* A group is not a form control, so its label names it with aria-labelledby and points no `for` at it. */}
              <FormLabel id={sizeLabelId} htmlFor={undefined}>
                {labels.teamSize}
              </FormLabel>
              {/* The control is a row of buttons, not one field, so the group carries what a field carries: its name, that it is invalid, and the sentence that says why. */}
              <FormControl>
                <div ref={sizeRef} role="group" aria-labelledby={sizeLabelId}>
                  <SegmentedControl
                    label={labels.teamSize}
                    options={sizes}
                    value={values.size}
                    onValueChange={(value) => {
                      set("size", value);
                      touch("size");
                    }}
                    className={cn("flex w-full [&>button]:flex-1 [&>button]:px-2", shown("size") && "border-destructive")}
                  />
                </div>
              </FormControl>
            </FormField>

            <FormField described className="content-start">
              <FormLabel>{labels.usage}</FormLabel>
              <FormControl>
                <Textarea name="usage" rows={3} placeholder={labels.usagePlaceholder} value={values.usage} onChange={(event) => set("usage", event.target.value)} />
              </FormControl>
              <FormDescription>{labels.usageHint}</FormDescription>
            </FormField>

            {showCode ? (
              <FormField className="content-start" error={codeProblem ? labels.codeInvalid : null}>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>{labels.code}</FormLabel>
                  <button type="button" onClick={() => reveal(false)} className={cn(TEXT_BUTTON, "text-[0.8125rem] font-normal text-muted-foreground")}>
                    {labels.noCode}
                  </button>
                </div>
                <FormControl>
                  <Input
                    ref={refs.code}
                    name="inviteCode"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder={labels.codePlaceholder}
                    value={values.code}
                    onChange={(event) => {
                      set("code", event.target.value);
                      if (codeProblem) setCodeProblem(false);
                    }}
                    className="font-mono tracking-wide"
                  />
                </FormControl>
              </FormField>
            ) : (
              <button ref={refs.haveCode} type="button" onClick={() => reveal(true)} className={TEXT_BUTTON}>
                {labels.haveCode}
              </button>
            )}

            {status === "error" ? (
              <p id={errorId} role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {labels.failed}
              </p>
            ) : null}
            <div className="grid gap-3">
              <Button ref={refs.submit} type="submit" size="lg" loading={status === "busy"} aria-describedby={status === "error" ? errorId : undefined} className="w-full">
                {labels.submit}
              </Button>
              {reviewTime ? (
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <IconClock aria-hidden="true" className="size-4 shrink-0" />
                  {reviewTime}
                </p>
              ) : null}
            </div>
          </form>
        </>
      )}
    </section>
  );
}
