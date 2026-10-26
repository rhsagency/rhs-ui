"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconIdea } from "@rhs-ui/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface ContactFaq {
  /** The question as a customer would ask it: "Where is my order?". */
  question: string;
  /** The answer, as text or markup. */
  answer: ReactNode;
  /**
   * Other words that mean the same question, for the hint under the message: ["tracking", "parcel", "shipped"].
   * A keyword of several words ("money back") counts only when the message has all of them, so "back" alone does not
   * point at a refund.
   */
  keywords?: readonly string[];
}

export interface ContactFaqMessage {
  /** The trimmed name. */
  name: string;
  /** The trimmed address to answer. */
  email: string;
  /** The trimmed message. */
  message: string;
}

export interface ContactFaqSplitLabels {
  /** The small line over the questions. */
  faqHeading: string;
  /** The heading over the form. */
  formHeading: string;
  /** The label of the name field. */
  name: string;
  /** The label of the email field. */
  email: string;
  /** The label of the message field. */
  message: string;
  /** What the message field says before anyone types. */
  messagePlaceholder: string;
  /** The button. */
  send: string;
  /** Said under the name field when it is empty. */
  nameRequired: string;
  /** Said under the email field when it is empty. */
  emailRequired: string;
  /** Said under the email field when it is not an address. */
  emailInvalid: string;
  /** Said under the message field when it is empty. */
  messageRequired: string;
  /** Said under the message field when it is too short. {min} stands for the number of characters. */
  messageShort: string;
  /** Said when onSubmit fails. Everything typed stays where it is. */
  failed: string;
  /** In front of the question that might answer what is being typed. The question follows as a button. */
  hint: string;
  /** The headline of the confirmation. */
  doneTitle: string;
  /** The confirmation. {name} stands for the first name and {email} for the address that will be answered. */
  done: string;
  /** The button that leads back to an empty form. */
  another: string;
}

const LABELS: ContactFaqSplitLabels = {
  faqHeading: "Common questions",
  formHeading: "Did not find it? Ask us",
  name: "Name",
  email: "Email",
  message: "Message",
  messagePlaceholder: "Tell us what you need, and anything that helps us answer well.",
  send: "Send message",
  nameRequired: "Enter your name so we know who we are writing back to.",
  emailRequired: "Enter your email address so we can reply.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  messageRequired: "Write a few words about what you need.",
  messageShort: "Add a little more detail, at least {min} characters.",
  failed: "Your message did not go through. Nothing is lost: it is all still here, so try again.",
  hint: "This might answer it:",
  doneTitle: "Message sent",
  done: "Thanks, {name}. We will reply to {email}.",
  another: "Send another message",
};

export interface ContactFaqSplitProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** The questions that fill your inbox, five or six, in the order you want them read. */
  faqs: readonly ContactFaq[];
  /** Called with the checked, trimmed message. Resolve to confirm; reject to show the error and keep everything typed. */
  onSubmit: (message: ContactFaqMessage) => Promise<void> | void;
  /** The heading of the section: "How can we help?". */
  title: string;
  /** One or two sentences under it. */
  description?: string;
  /** When you answer, under the form heading and in the confirmation: "We reply within one working day." */
  promise?: string;
  /**
   * Words that carry no meaning in your language, which the hint skips when it reads the message. English by
   * default; pass your own list for another language. Words under three letters are always skipped.
   */
  stopWords?: readonly string[];
  /** The index of the question that starts open, or null for none. The first one by default. */
  defaultOpen?: number | null;
  /** What you already know about the visitor, or a message to start from. */
  defaultValues?: Partial<ContactFaqMessage>;
  /** Where the form starts. "idle" by default; "done" shows the confirmation, which repeats the values in defaultValues. */
  defaultStatus?: "idle" | "done";
  /** The level of the section heading: 2 by default. The form's heading sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<ContactFaqSplitLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE = 10;
/** How long the visitor stops typing before the hint looks at the message. */
const HINT_DELAY = 450;

const STOP_WORDS = [
  "about", "after", "again", "all", "also", "and", "any", "are", "because", "been", "but", "can", "could", "did", "does", "for", "from", "get", "got",
  "had", "has", "have", "hello", "help", "her", "his", "how", "into", "its", "just", "like", "may", "might", "need", "not", "now", "one", "our", "out",
  "please", "see", "she", "should", "still", "than", "thank", "thanks", "that", "the", "their", "them", "then", "there", "these", "they", "this", "too",
  "use", "want", "was", "way", "were", "what", "when", "where", "which", "who", "why", "will", "with", "would", "yet", "you", "your",
];

/** The roots of the words in a text: lower case, without accents, long words cut to five letters so "refund" meets "refunded". */
function rootsOf(text: string, stop: ReadonlySet<string>): string[] {
  const words = text.toLowerCase().normalize("NFD").replace(/\p{M}+/gu, "").match(/[\p{L}\p{N}]+/gu) ?? [];
  const roots = new Set<string>();
  for (const word of words) {
    if (word.length < 3 || stop.has(word)) continue;
    roots.add(word.length <= 4 ? word.replace(/s$/, "") : word.slice(0, 5));
  }
  return [...roots];
}

/** What the hint reads in a question: its own words, and the keywords of several words, which only count whole. */
interface Reading {
  /** The roots of the question and of its keywords of one word. */
  words: readonly string[];
  /** The roots of each keyword of several words ("money back"). One matches only when the message has every one of them. */
  phrases: readonly (readonly string[])[];
}

function readingOf(faq: ContactFaq, stop: ReadonlySet<string>): Reading {
  const words = new Set(rootsOf(faq.question, stop));
  const phrases: string[][] = [];
  for (const keyword of faq.keywords ?? []) {
    const roots = rootsOf(keyword, stop);
    if (roots.length > 1) phrases.push(roots);
    else for (const root of roots) words.add(root);
  }
  return { words: [...words], phrases };
}

/** A matched word on its own is a thin reason to say "this might answer it": it must be a longer word, and one that no other question uses. */
const MIN_LONE_ROOT = 5;

/**
 * The question that shares the most words with the message, or null when none shares enough. A word that many
 * questions use ("order", "change") counts for less than one only a single question uses ("password"), so the
 * hint points at the most telling match. A keyword of several words ("money back") matches as a phrase, with all of
 * its words, because "back" alone could be about anything. A question that matches on one word only counts when that
 * word has at least five letters and belongs to that question alone; two matched words always count. A tie goes to
 * the earlier question.
 */
function closestQuestion(message: string, faqs: readonly ContactFaq[], stop: ReadonlySet<string>): number | null {
  if (message.trim().length < 8) return null;
  const typed = new Set(rootsOf(message, stop));
  if (typed.size === 0) return null;
  const readings = faqs.map((faq) => readingOf(faq, stop));
  // How many questions use each root, in their words or in one of their phrases.
  const spread = new Map<string, number>();
  for (const { words, phrases } of readings) {
    const used = new Set(words);
    for (const phrase of phrases) for (const root of phrase) used.add(root);
    for (const root of used) spread.set(root, (spread.get(root) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestScore = 0;
  for (let index = 0; index < readings.length; index += 1) {
    const { words, phrases } = readings[index] ?? { words: [], phrases: [] };
    const matched = new Set<string>();
    for (const root of words) if (typed.has(root)) matched.add(root);
    for (const phrase of phrases) if (phrase.every((root) => typed.has(root))) for (const root of phrase) matched.add(root);
    if (matched.size === 1) {
      const [only = ""] = matched;
      if (only.length < MIN_LONE_ROOT || (spread.get(only) ?? 1) > 1) continue;
    }
    let score = 0;
    for (const root of matched) score += 1 / (spread.get(root) ?? 1);
    if (score > bestScore + 1e-9) {
      bestScore = score;
      best = index;
    }
  }
  return best;
}

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

type Field = "name" | "email" | "message";
const ORDER: readonly Field[] = ["name", "email", "message"];
const itemValue = (index: number) => `faq-${index}`;

/**
 * A support page that answers before it asks: the handful of questions that fill your inbox in an accordion, and
 * beside it a short form under "Did not find it? Ask us" with the time you answer in. While a message is typed, a
 * quiet hint offers the question that looks closest ("This might answer it: Where is my order?") by reading
 * the words of the message against the questions and their keywords; one shared word is not enough unless it is a
 * longer word that only that question uses, so the hint stays quiet rather than point at the wrong answer. It is a
 * button that opens that answer, it appears after the visitor pauses, it is announced politely, and it never
 * stands between the visitor and the send button. Mistakes are said in words beside their field once the visitor has been there or tried to send,
 * and the first one takes focus. The confirmation replaces the form and takes focus so a screen reader reads it.
 * It deflects honestly instead of hiding the form.
 */
export function ContactFaqSplit({
  faqs,
  onSubmit,
  title,
  description,
  promise,
  stopWords,
  defaultOpen = 0,
  defaultValues,
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: ContactFaqSplitProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [values, setValues] = useState({ name: defaultValues?.name ?? "", email: defaultValues?.email ?? "", message: defaultValues?.message ?? "" });
  const [touched, setTouched] = useState<Partial<Record<Field, true>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  const [sent, setSent] = useState({ name: (defaultValues?.name ?? "").trim(), email: (defaultValues?.email ?? "").trim() });
  const [open, setOpen] = useState(defaultOpen === null || !faqs[defaultOpen] ? "" : itemValue(defaultOpen));
  // The message the hint was last worked out from: it follows the typing after a pause, so the hint never flickers.
  const [settled, setSettled] = useState(values.message);
  // The question the visitor already followed from the hint: it is not offered again until the message points elsewhere.
  const [seen, setSeen] = useState<number | null>(null);
  // Focus only moves for something the visitor did, never on the first render of a block that starts in a state.
  const acted = useRef(false);
  // While the send button is held down: pressing it blurs the field that had focus, and a mistake shown on that blur
  // pushes the button away before the press is over, so the click would be lost. A press counts as a send, not as leaving.
  const pressing = useRef(false);
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) };
  const listRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const busy = status === "busy";

  const stop = useMemo(() => new Set((stopWords ?? STOP_WORDS).map((word) => word.toLowerCase())), [stopWords]);
  const closest = useMemo(() => closestQuestion(settled, faqs, stop), [settled, faqs, stop]);
  const hintIndex = closest !== null && closest !== seen ? closest : null;
  const hinted = hintIndex === null ? undefined : faqs[hintIndex];

  useEffect(() => {
    if (settled === values.message) return;
    const timer = window.setTimeout(() => setSettled(values.message), HINT_DELAY);
    return () => window.clearTimeout(timer);
  }, [values.message, settled]);
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

  const problems: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) problems.name = labels.nameRequired;
  if (!values.email.trim()) problems.email = labels.emailRequired;
  else if (!ADDRESS.test(values.email.trim())) problems.email = labels.emailInvalid;
  if (!values.message.trim()) problems.message = labels.messageRequired;
  else if (values.message.trim().length < MIN_MESSAGE) problems.message = labels.messageShort.replace("{min}", String(MIN_MESSAGE));
  /** A mistake is only shown once the visitor has been in that field or has tried to send. */
  const shown = (field: Field): string | undefined => (submitted || touched[field] ? problems[field] : undefined);
  const set = (field: Field, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const touch = (field: Field) => {
    if (pressing.current) return;
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  };

  useEffect(() => {
    if (status === "done" && acted.current) doneRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the visitor lands on it.
    else if (status === "error" && acted.current) sendRef.current?.focus();
  }, [status]);

  /** Opens the answer the hint pointed at and moves focus to its question, which scrolls it into view. */
  function reveal(index: number) {
    acted.current = true;
    setSeen(index);
    setOpen(itemValue(index));
    window.requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-faq="${index}"] button`)?.focus());
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
    const message: ContactFaqMessage = { name: values.name.trim(), email: values.email.trim(), message: values.message.trim() };
    setStatus("busy");
    try {
      await onSubmit(message);
      setSent({ name: message.name, email: message.email });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setValues({ name: "", email: "", message: "" });
    setSettled("");
    setSeen(null);
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
    // The confirmation that had focus is gone and the form is new: start at its first field.
    window.requestAnimationFrame(() => refs.name.current?.focus());
  }

  return (
    <section data-slot="contact-faq-split" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <header className="max-w-2xl">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>

      <div className="mt-10 grid gap-x-16 gap-y-10 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] @4xl:items-start">
        <div ref={listRef} role="group" aria-labelledby={`${id}-faq`} className="min-w-0">
          <p id={`${id}-faq`} className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {labels.faqHeading}
          </p>
          <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="mt-4 border-t border-border">
            {faqs.map((faq, index) => (
              <AccordionItem key={`${index}-${faq.question}`} value={itemValue(index)} data-faq={index}>
                <AccordionTrigger className="text-[0.9375rem] leading-snug data-[state=open]:pb-3">{faq.question}</AccordionTrigger>
                <AccordionContent className="max-w-xl text-pretty">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
          {status === "done" ? (
            <div ref={doneRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
                <IconCheck size={22} strokeWidth={2.25} />
              </span>
              <SubHeading className="mt-5 text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">{labels.doneTitle}</SubHeading>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                {fill(labels.done, { name: sent.name.split(/\s+/)[0] ?? "", email: <strong className="font-medium break-words text-foreground">{sent.email}</strong> })}
              </p>
              {promise ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <IconClock aria-hidden="true" className="size-4 shrink-0" />
                  {promise}
                </p>
              ) : null}
              <Button type="button" variant="outline" onClick={again} className="mt-6">
                {labels.another}
              </Button>
            </div>
          ) : (
            <>
              <SubHeading id={`${id}-form`} className="text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">
                {labels.formHeading}
              </SubHeading>
              {promise ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <IconClock aria-hidden="true" className="size-4 shrink-0" />
                  {promise}
                </p>
              ) : null}
              <form noValidate onSubmit={submit} aria-labelledby={`${id}-form`} aria-busy={busy || undefined} className="mt-6 grid gap-5">
                <FormField className="content-start" error={shown("name")}>
                  <FormLabel>{labels.name}</FormLabel>
                  <FormControl>
                    <Input ref={refs.name} name="name" autoComplete="name" aria-required="true" value={values.name} onChange={(event) => set("name", event.target.value)} onBlur={() => touch("name")} />
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
                      value={values.email}
                      onChange={(event) => set("email", event.target.value)}
                      onBlur={() => touch("email")}
                    />
                  </FormControl>
                </FormField>
                <FormField className="content-start" error={shown("message")}>
                  <FormLabel>{labels.message}</FormLabel>
                  <div>
                    <FormControl>
                      <Textarea
                        ref={refs.message}
                        name="message"
                        rows={4}
                        aria-required="true"
                        placeholder={labels.messagePlaceholder}
                        value={values.message}
                        onChange={(event) => set("message", event.target.value)}
                        onBlur={() => touch("message")}
                      />
                    </FormControl>
                    {/* The region is always there, so a screen reader hears the hint when it arrives; it is polite and sits below the field, never between the visitor and the button. */}
                    <div role="status">
                      {hintIndex !== null && hinted ? (
                        <p className="mt-2 flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm leading-snug">
                          <IconIdea aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span>
                            {labels.hint}{" "}
                            <button
                              type="button"
                              onClick={() => reveal(hintIndex)}
                              className="rounded-sm text-left font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                            >
                              {hinted.question}
                            </button>
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </FormField>

                {status === "error" ? (
                  <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                    <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {labels.failed}
                  </p>
                ) : null}
                <Button
                  ref={sendRef}
                  type="submit"
                  size="lg"
                  loading={busy}
                  onPointerDown={() => {
                    pressing.current = true;
                  }}
                  className="w-full"
                >
                  {labels.send}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
