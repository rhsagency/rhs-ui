"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface NextStep {
  /** What happens, in a few words: "Confirmation email". */
  label: string;
  /** One sentence that makes it concrete: "It has the address, the entrance and what to bring." */
  detail?: string;
  /** When, in the reader's words: "Now", "Wednesday at 14:00", "In 5 minutes". */
  when: string;
}

export interface ThankYouNextStepsLabels {
  /** The small line above the steps. */
  next: string;
  /** In front of the reference. */
  reference: string;
  /** The copy button. */
  copy: string;
  /** The copy button for a moment after copying. */
  copied: string;
  /** Said to a screen reader after copying. */
  copiedAnnouncement: string;
  /** Said when the browser refuses to copy. */
  copyFailed: string;
}

const LABELS: ThankYouNextStepsLabels = {
  next: "What happens next",
  reference: "Reference",
  copy: "Copy",
  copied: "Copied",
  copiedAnnouncement: "Reference copied to the clipboard.",
  copyFailed: "Could not copy. Select the reference and copy it by hand.",
};

export interface ThankYouNextStepsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The headline, repeating what was done: "You are booked for Thursday at 14:00". */
  title: string;
  /** One or two sentences with the detail that matters: where the confirmation went. It is announced when the page loads. */
  summary?: string;
  /** What happens next, in order, usually three. */
  steps: readonly NextStep[];
  /** One or two follow-ups to do while waiting: a Button to add to a calendar, a link to a guide. */
  actions?: ReactNode;
  /** A booking or order number. It is selectable and has a copy button. Name it with `labels.reference`. */
  reference?: string;
  /** The level of the headline: 2 by default. Use 1 when this block is the main content of the thank-you page. */
  headingLevel?: 1 | 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ThankYouNextStepsLabels>;
}

/**
 * The page after a conversion, written to continue the relationship instead
 * of ending it: a check mark, a headline that repeats what was done, a
 * reference the reader can select or copy, what happens next in order with when
 * each thing happens, and a follow-up or two for the time in between. A
 * thank-you page that only says thanks wastes the moment people are most sure
 * of you. The headline and summary are announced once when the page loads,
 * through a polite status region that is filled after mount, because a region
 * that is already full when the page arrives is not read.
 */
export function ThankYouNextSteps({ title, summary, steps, actions, reference, headingLevel = 2, labels: custom, className, ...props }: ThankYouNextStepsProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [announcement, setAnnouncement] = useState("");
  const [copy, setCopy] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4";

  useEffect(() => {
    setAnnouncement([title, summary].filter(Boolean).join(". "));
  }, [title, summary]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copyReference() {
    if (!reference) return;
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(reference);
      setCopy("copied");
    } catch {
      setCopy("error");
    }
    timer.current = setTimeout(() => setCopy("idle"), 2200);
  }

  return (
    <section data-slot="thank-you-next-steps" aria-labelledby={`${id}-title`} className={cn("@container mx-auto w-full max-w-2xl break-words", className)} {...props}>
      <div className="text-center">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ring-8 ring-muted">
          <IconCheck size={26} strokeWidth={2.25} />
        </span>
        <Heading id={`${id}-title`} className="mx-auto mt-7 max-w-xl text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {summary ? <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-balance text-muted-foreground">{summary}</p> : null}

        {reference ? (
          <div role="group" aria-labelledby={`${id}-reference`} className="mt-7 flex flex-col items-center gap-2.5">
            <p id={`${id}-reference`} className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {labels.reference}
            </p>
            <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border bg-card py-1.5 pr-1.5 pl-4 shadow-xs">
              <code className="min-w-0 truncate font-mono text-sm font-medium tracking-wide select-all">{reference}</code>
              <Button type="button" variant="ghost" size="sm" onClick={copyReference} className="h-7 shrink-0 px-2.5 text-xs">
                {copy === "copied" ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
                {copy === "copied" ? labels.copied : labels.copy}
              </Button>
            </div>
          </div>
        ) : null}
        {copy === "error" ? <p className="mt-3 text-xs text-destructive">{labels.copyFailed}</p> : null}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-xs @sm:p-8">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.next}</p>
        <ol role="list" className="mt-6">
          {steps.map((step, index) => {
            const last = index === steps.length - 1;
            return (
              <li key={`${step.when}-${step.label}`} className="relative flex gap-4">
                <div aria-hidden="true" className="flex flex-col items-center">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-medium tabular-nums">{index + 1}</span>
                  {last ? null : <span className="my-1.5 w-px flex-1 bg-border" />}
                </div>
                <div className={cn("min-w-0 flex-1 @sm:flex @sm:items-start @sm:justify-between @sm:gap-6", !last && "pb-7")}>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm leading-snug font-medium">{step.label}</p>
                    {step.detail ? <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{step.detail}</p> : null}
                  </div>
                  <p className="mt-2 inline-flex w-fit shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums whitespace-nowrap @sm:mt-0.5">{step.when}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {actions ? <div className="mt-8 flex flex-col items-stretch justify-center gap-3 @sm:flex-row @sm:items-center">{actions}</div> : null}

      {/* Read once when the page arrives, and once more when a copy works or fails: these are the only things announced. */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <p role="status" className="sr-only">
        {copy === "copied" ? labels.copiedAnnouncement : copy === "error" ? labels.copyFailed : ""}
      </p>
    </section>
  );
}
