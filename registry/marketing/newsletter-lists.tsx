"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface NewsletterList {
  /** A stable key, sent back in `lists`: "weekly-digest". */
  id: string;
  /** What it is called: "Weekly digest". */
  name: string;
  /** One line on what arrives. */
  description: string;
  /** How often, in words: "Every Friday", "Twice a month". */
  frequency: string;
  /** Checked when the form opens. Leave it off unless the reader already asked for it: consent has to be a choice. */
  defaultChecked?: boolean;
}

export interface NewsletterSubscription {
  /** The trimmed address. */
  email: string;
  /** The `id` of every list the reader chose, in the order the lists are shown. */
  lists: string[];
}

export interface NewsletterListsLabels {
  /** The legend over the lists, read by assistive technology: the heading already says it for everyone else. */
  legend: string;
  /** The field's visible label. */
  email: string;
  /** The field's placeholder. */
  placeholder: string;
  /** Said under the lists while too few are chosen and one is enough. */
  chooseOne: string;
  /** Said while too few are chosen and more than one is needed. {min} stands for the number. */
  chooseMany: string;
  /** Said once enough are chosen, and announced politely each time the count changes. {count} and {total} stand for the numbers. */
  selected: string;
  /** The button before anything is chosen. */
  subscribe: string;
  /** The button with one list chosen. {count} stands for the number. */
  subscribeOne: string;
  /** The button with several lists chosen. {count} stands for the number. */
  subscribeMany: string;
  /** Said under the field when the address is empty or is not an address. */
  invalid: string;
  /** Said when onSubmit fails. The choices and the address stay where they are. */
  failed: string;
  /** The button's text after a failure. */
  retry: string;
  /** The headline of the success message. */
  doneTitle: string;
  /** What happens next, above the chosen lists. {email} stands for the address. */
  done: string;
  /** The button under the success message. */
  another: string;
  /** The privacy line. {link} stands for the link to the policy; without a privacyHref it is left out. */
  privacy: string;
  /** The text of the link to the policy. */
  privacyLink: string;
}

const LABELS: NewsletterListsLabels = {
  legend: "Choose your lists",
  email: "Email address",
  placeholder: "you@company.com",
  chooseOne: "Choose a list to subscribe.",
  chooseMany: "Choose at least {min} lists to subscribe.",
  selected: "{count} of {total} lists selected.",
  subscribe: "Subscribe",
  subscribeOne: "Subscribe to {count} list",
  subscribeMany: "Subscribe to {count} lists",
  invalid: "Enter an email address like name@company.com.",
  failed: "We could not subscribe you just now. Your choices and your address are still here, so try again.",
  retry: "Try again",
  doneTitle: "Check your inbox",
  done: "We sent a confirmation link to {email}. Open it and these lists are yours:",
  another: "Use a different address",
  privacy: "We use your address for these emails only, and every email has an unsubscribe link. {link}",
  privacyLink: "Privacy policy",
};

export interface NewsletterListsProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /** The lists a reader can choose from: three to five read best. */
  lists: readonly NewsletterList[];
  /** Called with the checked address and the chosen list ids. Resolve to confirm; reject to show the error and keep everything. */
  onSubmit: (subscription: NewsletterSubscription) => Promise<void> | void;
  /** The heading: "Choose what you get". */
  title: string;
  /** One sentence under the heading. */
  description?: string;
  /** How many lists must be chosen before the button works. 1 by default. */
  minSelected?: number;
  /** Your privacy policy. It becomes the link in the privacy line. */
  privacyHref?: string;
  /** The address the field starts with. */
  defaultEmail?: string;
  /**
   * Where the form starts. "idle" by default. "error" shows the failure message with the choices and the address kept,
   * and "done" the confirmation, for a page that already knows the result; the lists marked defaultChecked are the chosen ones.
   */
  defaultStatus?: "idle" | "error" | "done";
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<NewsletterListsLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fills {name} markers in a sentence with text or nodes. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/**
 * A newsletter sign-up that lets people choose what they get: several lists
 * as checkbox cards with the name, one line and how often, one email field and
 * one button that says how many lists it will subscribe to. Nothing is checked
 * unless you mark a list as a default, which is what consent rules ask for.
 * With too few chosen the button is off and a hint says why; the count is a
 * polite status, so it is announced as it changes. The address is checked in
 * words, a failure keeps the choices, and success takes the place of the form,
 * repeats the chosen lists and takes focus so a screen reader reads it.
 */
export function NewsletterLists({
  lists,
  onSubmit,
  title,
  description,
  minSelected = 1,
  privacyHref,
  defaultEmail = "",
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: NewsletterListsProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [chosen, setChosen] = useState<readonly string[]>(() => lists.filter((list) => list.defaultChecked).map((list) => list.id));
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  const [problem, setProblem] = useState(false);
  const [sent, setSent] = useState<NewsletterSubscription | null>(() =>
    defaultStatus === "done" ? { email: defaultEmail.trim(), lists: lists.filter((list) => list.defaultChecked).map((list) => list.id) } : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  // Focus only moves for something the reader did, never on the first render of a form that starts in a state.
  const acted = useRef(false);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const min = Math.max(1, minSelected);
  const enough = chosen.length >= min;
  const hintId = `${id}-hint`;
  const fieldId = `${id}-email`;
  const problemId = `${id}-problem`;
  const failedId = `${id}-failed`;

  useEffect(() => {
    if (status === "done" && acted.current) doneRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the reader lands on it.
    if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  const toggle = (listId: string) => setChosen((current) => (current.includes(listId) ? current.filter((item) => item !== listId) : [...current, listId]));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy" || !enough) return;
    const address = email.trim();
    if (!ADDRESS.test(address)) {
      setProblem(true);
      inputRef.current?.focus();
      return;
    }
    acted.current = true;
    setProblem(false);
    setStatus("busy");
    const subscription: NewsletterSubscription = { email: address, lists: lists.filter((list) => chosen.includes(list.id)).map((list) => list.id) };
    try {
      await onSubmit(subscription);
      setSent(subscription);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setEmail("");
    setProblem(false);
    setSent(null);
    setStatus("idle");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  const count = chosen.length;
  const button = status === "error" ? labels.retry : count === 0 ? labels.subscribe : text(count === 1 ? labels.subscribeOne : labels.subscribeMany, { count });
  const hint = enough ? text(labels.selected, { count, total: lists.length }) : min === 1 ? labels.chooseOne : text(labels.chooseMany, { min });
  const chosenLists = sent ? lists.filter((list) => sent.lists.includes(list.id)) : [];
  const privacy = privacyHref ? (
    <a href={privacyHref} className="rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
      {labels.privacyLink}
    </a>
  ) : null;

  return (
    <section data-slot="newsletter-lists" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xs break-words sm:p-8", className)} {...props}>
      {status === "done" && sent ? (
        <div ref={doneRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
          <div className="flex items-center gap-3.5">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <IconCheck size={16} strokeWidth={2.5} />
            </span>
            <Heading id={`${id}-title`} className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">
              {labels.doneTitle}
            </Heading>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">{fill(labels.done, { email: <strong className="font-medium break-words text-foreground">{sent.email}</strong> })}</p>
          <ul role="list" className="mt-5 grid gap-2">
            {chosenLists.map((list) => (
              <li key={list.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
                  <IconCheck aria-hidden="true" className="size-4 shrink-0" />
                  <span className="min-w-0">{list.name}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{list.frequency}</span>
              </li>
            ))}
          </ul>
          <Button type="button" variant="outline" onClick={again} className="mt-5">
            {labels.another}
          </Button>
        </div>
      ) : (
        <>
          <Heading id={`${id}-title`} className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">
            {title}
          </Heading>
          {description ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

          <form noValidate aria-busy={status === "busy" || undefined} onSubmit={submit} className="mt-6 grid gap-6">
            <fieldset aria-describedby={hintId} className="grid min-w-0 gap-3">
              <legend className="sr-only">{labels.legend}</legend>
              <ul role="list" className="grid gap-2.5">
                {lists.map((list) => {
                  const checked = chosen.includes(list.id);
                  return (
                    <li key={list.id}>
                      <label
                        className={cn(
                          "relative flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-colors duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 motion-reduce:transition-none",
                          checked ? "border-foreground bg-muted/40" : "border-border bg-background hover:bg-muted/50",
                        )}
                      >
                        <input type="checkbox" name="lists" value={list.id} checked={checked} onChange={() => toggle(list.id)} className="sr-only" />
                        <span
                          aria-hidden="true"
                          className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-150 motion-reduce:transition-none", checked ? "border-foreground bg-foreground text-background" : "border-input bg-background")}
                        >
                          {checked ? <IconCheck size={14} strokeWidth={2.5} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                            <span className="text-sm leading-snug font-medium">{list.name}</span>
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              {list.frequency}
                            </Badge>
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-pretty text-muted-foreground">{list.description}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p id={hintId} role="status" className={cn("text-xs leading-snug", enough ? "text-muted-foreground" : "font-medium text-foreground")}>
                {hint}
              </p>
            </fieldset>

            <div className="grid gap-2">
              <Label htmlFor={fieldId}>{labels.email}</Label>
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
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (problem) setProblem(false);
                }}
                aria-invalid={problem || undefined}
                aria-describedby={problem ? problemId : undefined}
              />
              {problem ? (
                <p id={problemId} role="alert" className="text-xs leading-snug font-medium text-destructive">
                  {labels.invalid}
                </p>
              ) : null}
            </div>

            {status === "error" ? (
              <p id={failedId} role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {labels.failed}
              </p>
            ) : null}

            <div className="grid gap-3">
              <Button ref={submitRef} type="submit" size="lg" loading={status === "busy"} disabled={!enough} aria-describedby={status === "error" ? `${hintId} ${failedId}` : hintId} className="w-full">
                {button}
              </Button>
              <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{fill(labels.privacy, { link: privacy })}</p>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
