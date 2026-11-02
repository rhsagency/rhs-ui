"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface RouteFieldOption {
  /** What is sent to onSubmit: "11-50". */
  value: string;
  /** What the reader picks: "11 to 50 people". */
  label: string;
}

export interface RouteField {
  /** The key of the answer in `values`. Unique within its topic, and never "name", "email" or "message". */
  name: string;
  /** The label above the control: "Order or account ID". */
  label: string;
  /** The kind of control. "text" by default. A "select" needs `options`. */
  type?: "text" | "email" | "tel" | "url" | "date" | "select" | "textarea";
  /** The choices of a "select" field. */
  options?: readonly RouteFieldOption[];
  /** The form cannot be sent without an answer. Fields that are not required say so in their label. */
  required?: boolean;
  /** Grey text in an empty control: "NW-48213". */
  placeholder?: string;
  /** One quiet line under the control: "Printed on your invoice." */
  hint?: string;
  /** The browser's autofill hint for the control: "organization". */
  autoComplete?: string;
}

export interface ContactRoute {
  /** A stable key, sent back in onSubmit and used as the value of the topic card: "support". */
  id: string;
  /** The name on the topic card: "Support". */
  label: string;
  /** What the topic is for, one short line on its card: "Something is not working". */
  description: string;
  /** The extra questions this topic asks. Name, email and message are asked for every topic. */
  fields?: readonly RouteField[];
  /** Who answers and how fast, said under the button and changing with the topic: "A support engineer replies within 4 working hours." */
  promise: string;
  /** A small icon on the card: a 16px glyph from @rhs-ui/icons. */
  icon?: ReactNode;
  /** What the message field says while it is empty for this topic: "What happened, and what did you expect?" */
  messagePlaceholder?: string;
}

/** What onSubmit receives. */
export interface ContactSubmission {
  /** The `id` of the chosen topic. */
  route: string;
  /** Every answer, trimmed: name, email and message, then the fields of the chosen topic by their `name`. */
  values: Record<string, string>;
}

export interface ContactFormRoutedLabels {
  /** The label of the group of topic cards. */
  topic: string;
  /** The label of the name field. */
  name: string;
  /** The label of the email field. */
  email: string;
  /** The label of the message field. */
  message: string;
  /** What the message field says before anyone types, when the topic has no placeholder of its own. */
  messagePlaceholder: string;
  /** What a select field says before a choice. */
  choose: string;
  /** Added to the label of a field that is not required. */
  optional: string;
  /** The name of the group of questions that belong to the chosen topic, for a screen reader. {route} stands for its label. */
  routeDetails: string;
  /** The sentence about your details, before the link to the privacy policy. */
  privacy: string;
  /** The text of the link to the privacy policy. */
  privacyLink: string;
  /** The button. {route} stands for the label of the chosen topic. */
  send: string;
  /** Said when the name is empty. */
  nameRequired: string;
  /** Said when the email is empty. */
  emailRequired: string;
  /** Said when the email is not an address. */
  emailInvalid: string;
  /** Said when the message is empty. */
  messageRequired: string;
  /** Said when the message is too short. {min} stands for the number of characters. */
  messageShort: string;
  /** Said when a required field of the topic is empty. {field} stands for its label. */
  fieldRequired: string;
  /** Said when a required select field has no choice. {field} stands for its label. */
  choiceRequired: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** The success headline. */
  doneTitle: string;
  /** The success message. {name} stands for the first name, {email} for the address that will be answered and {route} for the topic. */
  done: string;
  /** The button that leads back to an empty form. */
  another: string;
}

const LABELS: ContactFormRoutedLabels = {
  topic: "What can we help with?",
  name: "Name",
  email: "Email",
  message: "Message",
  messagePlaceholder: "Tell us what you need, and anything that helps us answer well.",
  choose: "Choose one",
  optional: "optional",
  routeDetails: "{route} details",
  privacy: "We use your details only to answer this message.",
  privacyLink: "Privacy policy",
  send: "Send to {route}",
  nameRequired: "Enter your name so we know who we are writing back to.",
  emailRequired: "Enter your email address so we can reply.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  messageRequired: "Write a few words about what you need.",
  messageShort: "Add a little more detail, at least {min} characters.",
  fieldRequired: "Add the {field} so the right person can answer.",
  choiceRequired: "Choose the {field}.",
  failed: "Your message did not go through. Nothing is lost: it is all still here, so try again.",
  doneTitle: "Message sent",
  done: "Thanks, {name}. {route} will reply to {email}.",
  another: "Send another message",
};

export interface ContactFormRoutedProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /** The topics, usually three to five. Each one brings its own questions and its own promise. */
  routes: readonly ContactRoute[];
  /** Called with the chosen topic and the checked, trimmed answers. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (submission: ContactSubmission) => Promise<void> | void;
  /** The heading: "Talk to the right team". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Controlled: the `id` of the chosen topic. */
  route?: string;
  /** Uncontrolled: the topic chosen at the start. The first one by default. */
  defaultRoute?: string;
  /** Called when the reader chooses another topic. */
  onRouteChange?: (id: string) => void;
  /** What you already know about the reader, by field name: `{ name, email }` of someone who is signed in, or an answer of a topic. */
  defaultValues?: Record<string, string>;
  /** Your privacy policy. It becomes the link under the button. */
  privacyHref?: string;
  /** How many characters a message needs at least. 10 by default. */
  minMessage?: number;
  /**
   * Where the form starts. "idle" by default. The others show a state for a page that already knows it:
   * "invalid" shows the mistakes as after a first attempt, "error" the failure message with everything kept,
   * and "done" the confirmation, which repeats the name and address in defaultValues.
   */
  defaultStatus?: "idle" | "invalid" | "error" | "done";
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<ContactFormRoutedLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Name, email and message belong to every topic and keep what was typed when the topic changes; a topic's own fields are kept per topic. */
const keyOf = (routeId: string, field: string): string => (field === "name" || field === "email" || field === "message" ? field : `${routeId}\u0000${field}`);

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** "Order or account ID" reads in a sentence as "order or account ID"; "ID card" and "VAT number" keep their capitals. */
const inSentence = (label: string): string => (/^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label);

function initialValues(routes: readonly ContactRoute[], defaults: Record<string, string> = {}): Record<string, string> {
  const values: Record<string, string> = { name: defaults.name ?? "", email: defaults.email ?? "", message: defaults.message ?? "" };
  for (const route of routes) {
    for (const field of route.fields ?? []) {
      const given = defaults[field.name];
      if (given !== undefined) values[keyOf(route.id, field.name)] = given;
    }
  }
  return values;
}

/**
 * One form for every inbox: the reader picks what the message is about on a row of topic cards (Sales, Support,
 * Billing, Press), and the form below adapts. Support asks for an order or account ID, Sales for the size of the
 * company, Press for the deadline and the outlet, and the line under the button says who answers and how fast for
 * that topic. Name, email and message are shared, so nothing typed is lost when the topic changes, and what a
 * topic asked is still there when the reader comes back to it. The topic cards are a real radio group, so arrow
 * keys move and choose and focus stays on the card the reader used while the fields change beneath it. Mistakes
 * are said in words next to their field, only once the reader has been there or tried to send, and the first one
 * takes focus. Sending keeps the button's label, a failure keeps everything typed, and success replaces the form
 * with a status message that names the topic and repeats the address it will answer.
 */
export function ContactFormRouted({
  routes,
  onSubmit,
  title,
  description,
  route: routeProp,
  defaultRoute,
  onRouteChange,
  defaultValues,
  privacyHref,
  minMessage = 10,
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: ContactFormRoutedProps) {
  const labels = { ...LABELS, ...custom };
  const titleId = useId();
  const Title = `h${headingLevel}` as "h2" | "h3";

  const [ownRoute, setOwnRoute] = useState(defaultRoute ?? routes[0]?.id ?? "");
  const route = routes.find((candidate) => candidate.id === (routeProp ?? ownRoute)) ?? routes[0];
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(routes, defaultValues));
  const [touched, setTouched] = useState<Record<string, true>>({});
  const [submitted, setSubmitted] = useState(defaultStatus !== "idle");
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus === "done" || defaultStatus === "error" ? defaultStatus : "idle");
  const [sent, setSent] = useState<{ route: ContactRoute; name: string; email: string } | null>(() => {
    const first = routes.find((candidate) => candidate.id === (routeProp ?? defaultRoute)) ?? routes[0];
    return defaultStatus === "done" && first ? { route: first, name: (defaultValues?.name ?? "").trim(), email: (defaultValues?.email ?? "").trim() } : null;
  });
  const [epoch, setEpoch] = useState(0);
  // Focus only moves for something the reader did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  const controls = useRef(new Map<string, HTMLElement>());
  const doneRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!acted.current) return;
    if (status === "done") doneRef.current?.focus();
    // The button is disabled while sending, and a disabled button gives up focus. After a failure it is handed back, so a retry is one key press away.
    else if (status === "error" && (!document.activeElement || document.activeElement === document.body || document.activeElement === sendRef.current)) sendRef.current?.focus();
  }, [status]);

  if (!route) return null;

  const fields = route.fields ?? [];
  const get = (key: string): string => values[key] ?? "";
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const touch = (key: string) => setTouched((current) => (current[key] ? current : { ...current, [key]: true }));
  const register = (key: string) => (element: HTMLElement | null) => {
    if (element) controls.current.set(key, element);
    else controls.current.delete(key);
  };

  const order = ["name", "email", ...fields.map((field) => keyOf(route.id, field.name)), "message"];
  const problems: Record<string, string> = {};
  if (!get("name").trim()) problems.name = labels.nameRequired;
  if (!get("email").trim()) problems.email = labels.emailRequired;
  else if (!ADDRESS.test(get("email").trim())) problems.email = labels.emailInvalid;
  for (const field of fields) {
    const key = keyOf(route.id, field.name);
    const value = get(key).trim();
    if (field.required && !value) problems[key] = text(field.type === "select" ? labels.choiceRequired : labels.fieldRequired, { field: inSentence(field.label) });
    else if (value && field.type === "email" && !ADDRESS.test(value)) problems[key] = labels.emailInvalid;
  }
  if (!get("message").trim()) problems.message = labels.messageRequired;
  else if (get("message").trim().length < minMessage) problems.message = text(labels.messageShort, { min: minMessage });
  /** A mistake is only shown once the reader has been in that field or has tried to send. */
  const shown = (key: string): string | undefined => (submitted || touched[key] ? problems[key] : undefined);

  function choose(id: string) {
    if (routeProp === undefined) setOwnRoute(id);
    // The topic changes the questions, so a mistake is not shown for a field the reader has not met yet.
    setSubmitted(false);
    if (status === "error") setStatus("idle");
    onRouteChange?.(id);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy" || !route) return;
    acted.current = true;
    setSubmitted(true);
    const first = order.find((key) => problems[key]);
    if (first) {
      controls.current.get(first)?.focus();
      return;
    }
    const answers: Record<string, string> = { name: get("name").trim(), email: get("email").trim(), message: get("message").trim() };
    for (const field of fields) answers[field.name] = get(keyOf(route.id, field.name)).trim();
    setStatus("busy");
    try {
      await onSubmit({ route: route.id, values: answers });
      setSent({ route, name: answers.name ?? "", email: answers.email ?? "" });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setValues(initialValues(routes));
    setTouched({});
    setSubmitted(false);
    setSent(null);
    setStatus("idle");
    setEpoch((count) => count + 1);
    // The confirmation that had focus is gone and the form is new: start at its first field.
    window.requestAnimationFrame(() => controls.current.get("name")?.focus());
  }

  function renderField(field: RouteField): ReactNode {
    const key = keyOf(route?.id ?? "", field.name);
    const type = field.type ?? "text";
    // One run of text, so a long label and its "(optional)" wrap like a sentence instead of becoming two flex items on two sides of the field.
    const label = (
      <FormLabel className="block leading-snug">
        <span>
          {field.label}
          {field.required ? null : (
            <>
              {" "}
              <span className="font-normal text-muted-foreground">({labels.optional})</span>
            </>
          )}
        </span>
      </FormLabel>
    );
    const hint = field.hint ? <FormDescription>{field.hint}</FormDescription> : null;
    const common = { name: field.name, value: get(key), "aria-required": field.required ? (true as const) : undefined, onBlur: () => touch(key) };
    let control: ReactNode;
    if (type === "select") {
      control = (
        <Select value={get(key)} onValueChange={(value) => { set(key, value); touch(key); }}>
          <FormControl>
            <SelectTrigger ref={register(key)} aria-required={field.required ? true : undefined} onBlur={() => touch(key)}>
              <SelectValue placeholder={field.placeholder ?? labels.choose} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    } else if (type === "textarea") {
      control = (
        <FormControl>
          <Textarea ref={register(key)} {...common} rows={3} placeholder={field.placeholder} onChange={(event) => set(key, event.target.value)} />
        </FormControl>
      );
    } else {
      control = (
        <FormControl>
          <Input
            ref={register(key)}
            {...common}
            type={type}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            autoCapitalize={type === "email" || type === "url" ? "none" : undefined}
            spellCheck={type === "email" || type === "url" ? false : undefined}
            // A date control is laid out wrongly inside a flex Input (the calendar icon floats mid-field), so it is a block.
            className={type === "date" ? "block dark:scheme-dark" : undefined}
            onChange={(event) => set(key, event.target.value)}
          />
        </FormControl>
      );
    }
    return (
      <FormField key={key} described={Boolean(field.hint)} error={shown(key)} className={cn("content-start", type === "textarea" ? "@lg:col-span-2" : "@lg:odd:last:col-span-2")}>
        {label}
        {control}
        {hint}
      </FormField>
    );
  }

  const link = privacyHref ? (
    <a href={privacyHref} className="rounded-sm whitespace-nowrap text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
      {labels.privacyLink}
    </a>
  ) : null;

  return (
    <section data-slot="contact-form-routed" aria-labelledby={titleId} className={cn("@container mx-auto w-full max-w-3xl break-words", className)} {...props}>
      <div className="text-center">
        <Title id={titleId} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Title>
        {description ? <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-xs @2xl:p-8">
        {status === "done" && sent ? (
          <div ref={doneRef} tabIndex={-1} role="status" className="flex flex-col items-center py-4 text-center outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
            <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
              <IconCheck size={22} strokeWidth={2.25} />
            </span>
            <p className="mt-5 text-xl leading-snug font-semibold tracking-[-0.02em]">{labels.doneTitle}</p>
            <p className="mt-2 max-w-sm text-base leading-relaxed text-muted-foreground">
              {fill(labels.done, { name: sent.name.split(/\s+/)[0] ?? "", route: sent.route.label, email: <strong className="font-medium break-words text-foreground">{sent.email}</strong> })}
            </p>
            <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">{sent.route.promise}</p>
            <Button type="button" variant="outline" onClick={again} className="mt-6">
              {labels.another}
            </Button>
          </div>
        ) : (
          <form key={epoch} noValidate onSubmit={submit} aria-busy={status === "busy" || undefined} className="grid gap-7">
            <div>
              <p aria-hidden="true" className="mb-3 text-sm font-medium">
                {labels.topic}
              </p>
              {/* Two by two; an odd last card takes the whole row instead of hugging the left. Selected by type, because each card in a form is followed by Radix's hidden input and the card is never the last child. */}
              <RadioCards
                label={labels.topic}
                value={route.id}
                onValueChange={choose}
                className="@xl:grid-cols-2 @xl:[&>button:last-of-type:nth-of-type(odd)]:col-span-2"
                options={routes.map((candidate) => ({ value: candidate.id, title: candidate.label, description: candidate.description, icon: candidate.icon }))}
              />
            </div>

            <div className="grid gap-5 border-t border-border pt-7">
              <div className="grid gap-5 @lg:grid-cols-2">
                <FormField className="content-start" error={shown("name")}>
                  <FormLabel>{labels.name}</FormLabel>
                  <FormControl>
                    <Input ref={register("name")} name="name" autoComplete="name" aria-required="true" value={get("name")} onChange={(event) => set("name", event.target.value)} onBlur={() => touch("name")} />
                  </FormControl>
                </FormField>
                <FormField className="content-start" error={shown("email")}>
                  <FormLabel>{labels.email}</FormLabel>
                  <FormControl>
                    <Input ref={register("email")} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} aria-required="true" value={get("email")} onChange={(event) => set("email", event.target.value)} onBlur={() => touch("email")} />
                  </FormControl>
                </FormField>
              </div>

              {/* The questions of the chosen topic, in a tinted group that says whose they are. Keyed by topic, so each topic's group arrives as new, while name, email and message stay mounted and keep their place. */}
              {fields.length ? (
                <div
                  key={route.id}
                  role="group"
                  aria-labelledby={`${titleId}-route`}
                  className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0 @lg:p-5"
                >
                  <p id={`${titleId}-route`} className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase [&_svg]:size-3.5 [&_svg]:shrink-0">
                    {route.icon}
                    {text(labels.routeDetails, { route: route.label })}
                  </p>
                  <div className="grid gap-5 @lg:grid-cols-2">{fields.map((field) => renderField(field))}</div>
                </div>
              ) : null}

              <FormField className="content-start" error={shown("message")}>
                <FormLabel>{labels.message}</FormLabel>
                <FormControl>
                  <Textarea ref={register("message")} name="message" rows={5} aria-required="true" placeholder={route.messagePlaceholder ?? labels.messagePlaceholder} value={get("message")} onChange={(event) => set("message", event.target.value)} onBlur={() => touch("message")} />
                </FormControl>
              </FormField>
            </div>

            {status === "error" ? (
              <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {labels.failed}
              </p>
            ) : null}

            <div className="grid gap-3">
              <Button ref={sendRef} type="submit" size="lg" loading={status === "busy"} className="w-full">
                {text(labels.send, { route: route.label })}
              </Button>
              {/* Said politely whenever the topic changes, so a screen reader hears who will answer. */}
              <p aria-live="polite" className="text-center text-sm leading-snug text-pretty text-muted-foreground">
                <IconClock aria-hidden="true" className="mr-2 inline-block size-4 align-[-0.2em]" />
                {route.promise}
              </p>
              <p className="text-center text-xs leading-relaxed text-pretty text-muted-foreground">
                {labels.privacy}
                {link ? <> {link}</> : null}
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
