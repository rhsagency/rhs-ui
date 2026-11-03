"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCalendar, IconCheck, IconSparkle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FeatureBadge } from "@rhs-ui/primitives/feature-badge";
import { cn } from "@/lib/utils";

/** The words the panel uses, for translation. `{expected}` and `{title}` are filled in. */
export interface ComingSoonStateLabels {
  /** The expected window, when you pass `expected`. Default "Planned for {expected}". */
  planned?: string;
  /** The button. Default "Notify me". */
  notify?: string;
  /** The button's name for a screen reader, so several panels on a page stay apart. Default "Notify me when {title} launches". */
  notifyLabel?: string;
  /** What replaces the button once the person is on the list. Default "We will email you". */
  confirmed?: string;
  /** Under the button when `onNotify` threw and had no message of its own. Default "We could not save that. Try again.". */
  failed?: string;
  /** Said when the sign-up was saved. Default "Done. We will email you when {title} launches.". */
  confirmedSpoken?: string;
}

export interface ComingSoonStateProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The feature's name: "Scheduled reports". It gets the Soon badge. */
  title: string;
  /** What it will do, in a sentence or two. Say the benefit, not the build. */
  description: string;
  /** Roughly when, in a few words: "Q1", "early 2027". The panel says "Planned for Q1". Leave it out and it promises no window. */
  expected?: string;
  /** Called when Notify me is pressed. Return the promise of the sign-up: a rejection shows its message and the button comes back, so nobody is told "we will email you" when nothing was saved. */
  onNotify?: () => unknown;
  /** The person is already on your list (you know it from your server): the panel shows "We will email you" and no button. */
  notified?: boolean;
  /** Where this device remembers the sign-up, in localStorage, so the button does not come back on the next visit. Default one per title. */
  storageKey?: string;
  /** An icon in the tile above the title, as an element: `<IconRocket />`. Default a sparkle. */
  icon?: ReactNode;
  /** The level of the title: 3 by default. */
  titleAs?: "h2" | "h3" | "h4";
  /** The words the panel uses, for translation. */
  labels?: ComingSoonStateLabels;
}

const DEFAULT_LABELS = {
  planned: "Planned for {expected}",
  notify: "Notify me",
  notifyLabel: "Notify me when {title} launches",
  confirmed: "We will email you",
  failed: "We could not save that. Try again.",
  confirmedSpoken: "Done. We will email you when {title} launches.",
} satisfies Required<ComingSoonStateLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

function keyFor(title: string): string {
  return `rhs-ui-coming-soon:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function remembered(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Storage can be blocked: the button then shows every time, which is the safe way to be wrong.
    return false;
  }
}

function remember(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Nothing to remember it with: the sign-up is still saved by `onNotify`.
  }
}

/**
 * A placeholder for a feature that is not ready: a calm panel with the Soon
 * badge, the feature's name, a sentence or two on what it will do, and
 * "Planned for Q1" when you want to say roughly when. Notify me asks your app
 * to save the sign-up and, once that has worked, turns into "We will email
 * you", and the device remembers it so the button does not come back and
 * nobody signs up twice; if saving fails the panel says so in words instead of
 * pretending. The focus, which the button loses while it saves, goes to the
 * confirmation or back to the button. There is no countdown and no urgency,
 * only honest copy. It fits a tab, a settings page or a sidebar slot, and
 * keeps the button out of the first paint until the device has been asked
 * whether it was already pressed, so a returning visitor never sees it flash.
 */
export function ComingSoonState({ title, description, expected, onNotify, notified = false, storageKey, icon, titleAs: Title = "h3", labels, className, ...props }: ComingSoonStateProps) {
  const text: Required<ComingSoonStateLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const key = storageKey ?? keyFor(title);

  // null until this device has been asked: the server and the first paint draw the same, empty, action area.
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState("");

  useEffect(() => {
    setSaved(remembered(key));
  }, [key]);

  const on = notified || saved === true;
  const ready = notified || saved !== null;

  // A disabled button cannot keep the focus, so the browser lets go of it while the save runs. Once it is over the focus goes to what the button has become: the button again after a failure, the confirmation after a success. Not when the person has moved on in the meantime.
  const button = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (busy || !refocus.current) return;
    refocus.current = false;
    if (!document.activeElement || document.activeElement === document.body) (on ? confirmation : button).current?.focus({ preventScroll: true });
  }, [busy, on]);

  async function notify() {
    if (busy) return;
    refocus.current = document.activeElement === button.current;
    setBusy(true);
    setProblem("");
    try {
      await onNotify?.();
    } catch (reason) {
      setProblem(reason instanceof Error && reason.message ? reason.message : text.failed);
      setBusy(false);
      return;
    }
    remember(key);
    setSaved(true);
    setSaid(fill(text.confirmedSpoken, { title }));
    setBusy(false);
  }

  return (
    <section
      data-slot="coming-soon-state"
      data-notified={on || undefined}
      aria-labelledby={`${id}-title`}
      className={cn("flex w-full flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center", className)}
      {...props}
    >
      <span aria-hidden="true" className="mb-5 grid size-12 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-5">
        {icon ?? <IconSparkle />}
      </span>
      <Title id={`${id}-title`} className="text-lg leading-snug font-medium tracking-[-0.02em] text-balance">
        <FeatureBadge kind="soon">{title}</FeatureBadge>
      </Title>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p>
      {expected ? (
        <p className="mt-5 inline-flex items-center gap-2 text-[0.8125rem] leading-5 text-muted-foreground">
          <IconCalendar aria-hidden="true" className="size-4 shrink-0" />
          {fill(text.planned, { expected })}
        </p>
      ) : null}

      <div className={cn("mt-6 grid min-h-9 justify-items-center gap-2.5 transition-opacity duration-200 motion-reduce:transition-none", ready ? "opacity-100" : "opacity-0")}>
        {on ? (
          <p ref={confirmation} tabIndex={-1} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 py-1.5 pr-3.5 pl-3 text-sm font-medium outline-none">
            <IconCheck aria-hidden="true" className="size-4 shrink-0" />
            {text.confirmed}
          </p>
        ) : (
          <Button ref={button} type="button" loading={busy} disabled={!ready} aria-label={fill(text.notifyLabel, { title })} onClick={() => void notify()}>
            {text.notify}
          </Button>
        )}
        {problem ? (
          <p role="alert" className="max-w-xs text-[0.8125rem] leading-snug text-destructive">
            {problem}
          </p>
        ) : null}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  );
}
