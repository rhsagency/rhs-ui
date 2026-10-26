"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { TextareaCounter } from "@rhs-ui/primitives/textarea-counter";
import { cn } from "@/lib/utils";

export interface ContactTopic {
  /** What is sent to onSubmit: "sales". */
  value: string;
  /** What the reader picks: "Talk to sales". */
  label: string;
  /** A second line in the list: "Pricing, demos and quotes". */
  description?: string;
}

export interface ContactFormValues {
  /** What the reader typed as a name, trimmed. */
  name: string;
  /** The address to answer, trimmed. */
  email: string;
  /** The `value` of the chosen topic. */
  topic: string;
  /** The message, trimmed. */
  message: string;
}

export interface ContactFormLabels {
  /** The label of the name field. */
  name: string;
  /** The label of the email field. */
  email: string;
  /** The label of the topic field. */
  topic: string;
  /** What the topic field says before a choice. */
  topicPlaceholder: string;
  /** The label of the message field. */
  message: string;
  /** What the message field says before anyone types. */
  messagePlaceholder: string;
  /** The consent line, in front of the link to the privacy policy. */
  consent: string;
  /** The text of the link to the privacy policy. */
  privacyLink: string;
  /** The button. */
  send: string;
  /** Said when the name is empty. */
  nameRequired: string;
  /** Said when the email is empty. */
  emailRequired: string;
  /** Said when the email is not an address. */
  emailInvalid: string;
  /** Said when no topic is chosen. */
  topicRequired: string;
  /** Said when the message is empty. */
  messageRequired: string;
  /** Said when the message is too short. {min} stands for the number of characters. */
  messageShort: string;
  /** Said when the consent box is not ticked. */
  consentRequired: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** The success headline. */
  doneTitle: string;
  /** The success message. {name} stands for the name and {email} for the address that will be answered. */
  done: string;
  /** The button that leads back to an empty form. */
  another: string;
}

const LABELS: ContactFormLabels = {
  name: "Name",
  email: "Email",
  topic: "Topic",
  topicPlaceholder: "Choose a topic",
  message: "Message",
  messagePlaceholder: "Tell us what you need, and anything that helps us answer well.",
  consent: "I agree that my details are used to answer this message.",
  privacyLink: "Privacy policy",
  send: "Send message",
  nameRequired: "Enter your name so we know who we are writing back to.",
  emailRequired: "Enter your email address so we can reply.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  topicRequired: "Choose what your message is about.",
  messageRequired: "Write a few words about what you need.",
  messageShort: "Add a little more detail, at least {min} characters.",
  consentRequired: "Tick the box so we are allowed to reply.",
  failed: "Your message did not go through. Nothing is lost: it is all still here, so try again.",
  doneTitle: "Message sent",
  done: "Thanks, {name}. We will reply to {email}.",
  another: "Send another message",
};

export interface ContactFormCenteredProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** The topics to choose from. */
  topics: readonly ContactTopic[];
  /** Called with the checked, trimmed values. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (values: ContactFormValues) => Promise<void> | void;
  /** The heading: "Get in touch". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** When you answer, under the button: "We reply within one working day." Repeated in the confirmation. */
  promise?: string;
  /** Your privacy policy. It becomes the link in the consent line. */
  privacyHref?: string;
  /** How many characters the message may have. 1000 by default. */
  messageLimit?: number;
  /** What you already know about the reader, such as the name and address of someone who is signed in. */
  defaultValues?: Partial<ContactFormValues> & { consent?: boolean };
  /**
   * Where the form starts. "idle" by default. The others show a state for a page that already knows it:
   * "invalid" shows the mistakes as after a first attempt, "error" the failure message with everything kept,
   * and "done" the confirmation, which repeats the address in defaultValues.
   */
  defaultStatus?: "idle" | "invalid" | "error" | "done";
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<ContactFormLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 10;

interface Values {
  name: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
}
type Field = keyof Values;
const EMPTY: Values = { name: "", email: "", topic: "", message: "", consent: false };
const ORDER: readonly Field[] = ["name", "email", "topic", "message", "consent"];

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/**
 * The plain, default contact page: a narrow centred column with a heading,
 * four fields, a consent line, one button, and a promise of when you will
 * answer. No channels column, no map, no fuss. Mistakes are shown inline and
 * in words, next to the field and only once the reader has been there or
 * tried to send; the first one takes focus. Sending disables the button but
 * keeps its label. A failure keeps everything typed and hands focus back to
 * the button. Success replaces the form with a status message that repeats
 * the address it will answer, and takes focus so a screen reader reads it;
 * starting again puts focus in the first field.
 */
export function ContactFormCentered({
  topics,
  onSubmit,
  title,
  description,
  promise,
  privacyHref,
  messageLimit = 1000,
  defaultValues,
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: ContactFormCenteredProps) {
  const labels = { ...LABELS, ...custom };
  const [values, setValues] = useState<Values>({ ...EMPTY, ...defaultValues });
  const [touched, setTouched] = useState<Partial<Record<Field, true>>>({});
  const [submitted, setSubmitted] = useState(defaultStatus !== "idle");
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus === "done" || defaultStatus === "error" ? defaultStatus : "idle");
  const [sent, setSent] = useState<ContactFormValues | null>(() =>
    defaultStatus === "done" ? { name: (defaultValues?.name ?? "").trim(), email: (defaultValues?.email ?? "").trim(), topic: defaultValues?.topic ?? "", message: (defaultValues?.message ?? "").trim() } : null,
  );
  // Focus only moves for something the reader did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  const titleId = useId();
  const [epoch, setEpoch] = useState(0);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    topic: useRef<HTMLButtonElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
    consent: useRef<HTMLButtonElement>(null),
  };
  const doneRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const Title = `h${headingLevel}` as "h2" | "h3";

  const problems: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) problems.name = labels.nameRequired;
  if (!values.email.trim()) problems.email = labels.emailRequired;
  else if (!ADDRESS.test(values.email.trim())) problems.email = labels.emailInvalid;
  if (!values.topic) problems.topic = labels.topicRequired;
  if (!values.message.trim()) problems.message = labels.messageRequired;
  else if (values.message.trim().length < MIN_MESSAGE) problems.message = labels.messageShort.replace("{min}", String(MIN_MESSAGE));
  if (!values.consent) problems.consent = labels.consentRequired;
  /** A mistake is only shown once the reader has been in that field or has tried to send. */
  const shown = (field: Field): string | undefined => (submitted || touched[field] ? problems[field] : undefined);

  const set = <K extends Field>(field: K, value: Values[K]) => setValues((current) => ({ ...current, [field]: value }));
  const touch = (field: Field) => setTouched((current) => (current[field] ? current : { ...current, [field]: true }));

  // TextareaCounter keeps its own aria-invalid and aria-describedby (the count), so the field's mistake is attached to the element from here.
  const messageError = shown("message");
  useEffect(() => {
    const area = refs.message.current;
    if (!area) return;
    const note = area.closest('[data-slot="form-field"]')?.querySelector<HTMLElement>('[role="status"]');
    const ids = (area.getAttribute("aria-describedby") ?? "").split(" ").filter((id) => id && id !== note?.id);
    if (messageError && note?.id) ids.push(note.id);
    area.setAttribute("aria-describedby", ids.join(" "));
    if (messageError) area.setAttribute("aria-invalid", "true");
    else area.removeAttribute("aria-invalid");
  });

  useEffect(() => {
    if (!acted.current) return;
    if (status === "done") doneRef.current?.focus();
    // The button is disabled while sending, and a disabled button gives up focus. After a failure it is handed back, so a retry is one key press away.
    else if (status === "error" && (!document.activeElement || document.activeElement === document.body || document.activeElement === sendRef.current)) sendRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy") return;
    acted.current = true;
    setSubmitted(true);
    const first = ORDER.find((field) => problems[field]);
    if (first) {
      refs[first].current?.focus();
      return;
    }
    const clean: ContactFormValues = { name: values.name.trim(), email: values.email.trim(), topic: values.topic, message: values.message.trim() };
    setStatus("busy");
    try {
      await onSubmit(clean);
      setSent(clean);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setValues(EMPTY);
    setTouched({});
    setSubmitted(false);
    setSent(null);
    setStatus("idle");
    setEpoch((count) => count + 1);
    // The confirmation that had focus is gone and the form is new: start at its first field.
    window.requestAnimationFrame(() => refs.name.current?.focus());
  }

  const consent = (
    <>
      {labels.consent}
      {privacyHref ? (
        <>
          {" "}
          <a href={privacyHref} className="rounded-sm whitespace-nowrap text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
            {labels.privacyLink}
          </a>
        </>
      ) : null}
    </>
  );

  return (
    <section data-slot="contact-form-centered" aria-labelledby={titleId} className={cn("mx-auto w-full max-w-xl", className)} {...props}>
      <div className="text-center">
        <Title id={titleId} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{title}</Title>
        {description ? <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-8">
        {status === "done" && sent ? (
          <div ref={doneRef} tabIndex={-1} role="status" className="flex flex-col items-center py-4 text-center outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
              <IconCheck size={22} strokeWidth={2.25} />
            </span>
            <p className="mt-5 text-xl leading-snug font-semibold tracking-[-0.02em]">{labels.doneTitle}</p>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-muted-foreground">
              {fill(labels.done, { name: sent.name.split(/\s+/)[0], email: <strong className="font-medium break-words text-foreground">{sent.email}</strong> })}
            </p>
            {promise ? <p className="mt-1 text-sm text-muted-foreground">{promise}</p> : null}
            <Button type="button" variant="outline" onClick={again} className="mt-6">
              {labels.another}
            </Button>
          </div>
        ) : (
          <form key={epoch} noValidate onSubmit={submit} aria-busy={status === "busy" || undefined} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField className="content-start" error={shown("name")}>
                <FormLabel>{labels.name}</FormLabel>
                <FormControl>
                  <Input ref={refs.name} name="name" autoComplete="name" aria-required="true" value={values.name} onChange={(event) => set("name", event.target.value)} onBlur={() => touch("name")} />
                </FormControl>
              </FormField>
              <FormField className="content-start" error={shown("email")}>
                <FormLabel>{labels.email}</FormLabel>
                <FormControl>
                  <Input ref={refs.email} name="email" type="email" inputMode="email" aria-required="true" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} onChange={(event) => set("email", event.target.value)} onBlur={() => touch("email")} />
                </FormControl>
              </FormField>
            </div>
            <FormField className="content-start" error={shown("topic")}>
              <FormLabel>{labels.topic}</FormLabel>
              <Select value={values.topic} onValueChange={(value) => { set("topic", value); touch("topic"); }}>
                <FormControl>
                  <SelectTrigger ref={refs.topic} aria-required="true" onBlur={() => touch("topic")}>
                    <SelectValue placeholder={labels.topicPlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.value} value={topic.value} description={topic.description}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField className="content-start" error={messageError}>
              <FormLabel>{labels.message}</FormLabel>
              <FormControl>
                <TextareaCounter ref={refs.message} name="message" aria-required="true" rows={5} limit={messageLimit} placeholder={labels.messagePlaceholder} value={values.message} onChange={(event) => set("message", event.target.value)} onBlur={() => touch("message")} />
              </FormControl>
            </FormField>
            <FormField className="content-start" error={shown("consent")}>
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox ref={refs.consent} name="consent" aria-required="true" checked={values.consent} onCheckedChange={(checked) => { set("consent", checked === true); touch("consent"); }} className="mt-px" />
                </FormControl>
                <FormLabel className="block text-sm leading-snug font-normal text-muted-foreground">{consent}</FormLabel>
              </div>
            </FormField>

            {status === "error" ? (
              <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {labels.failed}
              </p>
            ) : null}
            <div className="grid gap-3">
              <Button ref={sendRef} type="submit" size="lg" loading={status === "busy"} className="w-full">
                {labels.send}
              </Button>
              {promise ? (
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <IconClock aria-hidden="true" className="size-4 shrink-0" />
                  {promise}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
