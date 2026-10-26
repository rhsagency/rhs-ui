import type { ComponentProps, ReactNode } from "react";

import { IconAlertCircle, IconBadgeCheck, IconCalendar, IconCheck, IconClose, IconPackage, IconReturn, IconSend } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { STEP_ORDER, failedIndexOf, isLate, reachedIndex, stateOf, writeDay, type RefundMoment, type RefundStepId, type StepState } from "@rhs-ui/commerce/refund-tracker/refund";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export type { RefundMoment, RefundStepId } from "@rhs-ui/commerce/refund-tracker/refund";

/** Why a refund is not simply on its way, and what the customer can do about it. */
export interface RefundIssue {
  /** "failed": the money could not be sent. "partial": less than the whole amount is being refunded. */
  kind: "failed" | "partial";
  /** Why, in a sentence the customer can act on: "Your card has been closed." */
  reason: string;
  /** What to do next: "Send us the IBAN of your bank account and we will pay it there." */
  action?: string;
  /** For a partial refund: how much is refunded, in minor units. The rest is explained by `reason`. */
  refunded?: number;
}

export interface Refund {
  /** What was asked for, in minor units: 12900 is 129.00. */
  amount: number;
  /** Where the money goes: "Card ending 4242", "Your original payment method". */
  method: string;
  /** When each step was reached, as an ISO date or date-time. A step without a date has not happened. The latest step with a date is the current one. */
  steps: Partial<Record<RefundStepId, RefundMoment>>;
  /** When the money should arrive, as an ISO date. It is only shown once the refund is approved, and a promise is never made before that. */
  expectedBy?: RefundMoment;
  /** Set when the refund failed or is only partial. */
  issue?: RefundIssue;
}

export interface RefundTrackerLabels {
  /** The name of the list of steps for a screen reader. */
  progress?: string;
  /** Above the amount. */
  heading?: string;
  /** Under the amount. `{method}`. */
  to?: string;
  /** After a partial amount. `{total}` is what was asked for. */
  partOf?: string;
  /** The badge for each stage of the refund. */
  stages?: Partial<Record<RefundStepId | "waiting" | "failed" | "partial", string>>;
  /** The title of each step and what happens next while it is the current one. `{method}`. */
  steps?: Partial<Record<RefundStepId, { title?: string; next?: string }>>;
  /** The marker on the current step. */
  current?: string;
  /** Said to a screen reader after the title of a step that has happened. */
  done?: string;
  /** Said to a screen reader after the title of a step that has not happened yet. */
  notYet?: string;
  /** Replaces the title of the step a failed refund stopped at. */
  failedTitle?: string;
  /** Said to a screen reader after the title of that step. */
  failed?: string;
  /** The expected arrival once the refund is approved. `{date}`. */
  expected?: string;
  /** The same, when no date is known. */
  usually?: string;
  /** When the date has passed. */
  late?: string;
  /** The title of the note for a failed refund. */
  failedNote?: string;
  /** The title of the note for a partial refund. `{refunded}` and `{amount}`. */
  partialNote?: string;
  /** In front of the reason. */
  why?: string;
  /** In front of what the customer can do. */
  whatToDo?: string;
}

const STAGES = {
  requested: "Requested",
  received: "Received",
  approved: "Approved",
  paid: "On its way",
  waiting: "Not started",
  failed: "Failed",
  partial: "Partial",
} satisfies Record<RefundStepId | "waiting" | "failed" | "partial", string>;

const STEPS = {
  requested: { title: "Return requested", next: "Send the parcel back with your return label. We start the refund as soon as it arrives." },
  received: { title: "Parcel received", next: "We are checking the items. This usually takes one or two working days." },
  approved: { title: "Refund approved", next: "We are sending the money to {method}." },
  paid: { title: "Money on its way", next: "Your bank may need a few days to show it. You do not have to do anything." },
} satisfies Record<RefundStepId, { title: string; next: string }>;

const WORDS = {
  progress: "Refund progress",
  heading: "Refund",
  to: "To {method}",
  partOf: "of {total}",
  current: "Current step",
  done: "done",
  notYet: "not yet",
  failedTitle: "Refund could not be sent",
  failed: "failed",
  expected: "Expected by {date}",
  usually: "Usually 3 to 5 working days after approval",
  late: "Later than expected. Check with your bank first, then contact us.",
  failedNote: "What went wrong",
  partialNote: "Partial refund: {refunded} of {amount}",
  why: "Why",
  whatToDo: "What to do",
};

const STAGE_LOOK = {
  requested: { variant: "outline", icon: IconReturn },
  received: { variant: "outline", icon: IconPackage },
  approved: { variant: "secondary", icon: IconBadgeCheck },
  paid: { variant: "default", icon: IconSend },
  waiting: { variant: "muted", icon: IconReturn },
  failed: { variant: "outline", icon: IconAlertCircle },
  partial: { variant: "outline", icon: IconAlertCircle },
} as const;

export interface RefundTrackerProps extends Omit<ComponentProps<"div">, "children"> {
  /** The refund: what, where to, which steps have happened, when the money is expected and any issue. */
  refund: Refund;
  /** The moment to measure from. Pass it from the server: only then can a date that has passed be called late, and a cached page never claims what it cannot know. */
  now?: RefundMoment;
  /** ISO 4217 code of the amount. */
  currency?: string;
  /** Always pass your application locale, so amounts and dates are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone date-times are written in. A bare date such as "2026-10-24" is a calendar day and ignores it. */
  timeZone?: string;
  /** The words, for another language. */
  labels?: RefundTrackerLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const MARKERS: Record<StepState, string> = {
  done: "bg-foreground text-background",
  current: "border-2 border-foreground bg-card",
  pending: "border border-muted-foreground/45 bg-card",
  failed: "bg-destructive text-destructive-foreground",
};

function Marker({ state }: { state: StepState }): ReactNode {
  return (
    <span aria-hidden="true" className={cn("absolute top-0 left-0 grid size-6 place-items-center rounded-full", MARKERS[state])}>
      {state === "done" ? <IconCheck className="size-3.5" /> : state === "failed" ? <IconClose className="size-3.5" /> : state === "current" ? <span className="size-2 rounded-full bg-foreground" /> : null}
    </span>
  );
}

/**
 * Where a refund is, after a return: requested, received, approved and money on its way, each with the day it was
 * reached and, on the current step, a line about what happens next. The current step is marked in words, not only by
 * its marker, and every step says "done" or "not yet" to a screen reader. The arrival ("Usually 3 to 5 working days
 * after approval", or a date) appears only once the refund is approved, so no promise is made before there is
 * one. A failed refund stops at its step and says why and what to do; a partial one says how much is refunded and
 * why. Pass `now` and a date that has passed is called late.
 */
export function RefundTracker({ refund, now, currency = "EUR", locale = "en-US", timeZone = "UTC", labels, className, ...props }: RefundTrackerProps) {
  const words = { ...WORDS, ...labels };
  const stages = { ...STAGES, ...labels?.stages };
  const reached = reachedIndex(refund.steps);
  const failed = refund.issue?.kind === "failed";
  const partial = refund.issue?.kind === "partial";
  const failedAt = failed ? failedIndexOf(reached) : undefined;
  const stage = failed ? "failed" : partial ? "partial" : reached < 0 ? "waiting" : (STEP_ORDER[reached] ?? "waiting");
  const Look = STAGE_LOOK[stage];

  const total = formatMoney({ amount: refund.amount, currency }, locale);
  const shown = partial && refund.issue?.refunded !== undefined ? formatMoney({ amount: refund.issue.refunded, currency }, locale) : total;
  const approved = reached >= STEP_ORDER.indexOf("approved") && !failed;
  const expectedDay = approved && refund.expectedBy !== undefined ? writeDay(refund.expectedBy, locale, timeZone, { weekday: "long", day: "numeric", month: "long" }) : undefined;
  const overdue = approved && refund.expectedBy !== undefined && isLate(refund.expectedBy, now);

  const stepWords = (id: RefundStepId) => ({ ...STEPS[id], ...labels?.steps?.[id] });
  const current = reached >= 0 ? stepWords(STEP_ORDER[reached] ?? "requested").title : undefined;
  const sentence = [failed ? words.failedTitle : current, approved ? (expectedDay ? fill(words.expected, { date: expectedDay.text }) : words.usually) : undefined].filter(Boolean).join(". ");

  return (
    <div data-slot="refund-tracker" data-stage={stage} className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{words.heading}</p>
          <p className="mt-1 text-[1.75rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">
            {shown}
            {partial && refund.issue?.refunded !== undefined ? <span className="ml-2 text-sm font-normal tracking-normal text-muted-foreground">{fill(words.partOf, { total })}</span> : null}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{fill(words.to, { method: refund.method })}</p>
        </div>
        <Badge variant={Look.variant} className={cn("shrink-0 gap-1", stage === "failed" && "border-destructive/50 text-destructive")}>
          <Look.icon />
          {stages[stage]}
        </Badge>
      </div>

      <ol aria-label={words.progress} className="border-t border-border px-5 py-5">
        {STEP_ORDER.map((id, index) => {
          const state = stateOf(index, reached, failedAt);
          const text = stepWords(id);
          const day = refund.steps[id] === undefined ? undefined : writeDay(refund.steps[id], locale, timeZone, { weekday: "short", day: "numeric", month: "short" });
          const last = index === STEP_ORDER.length - 1;
          const solid = !last && state === "done";
          const showNext = state === "current";
          return (
            <li key={id} data-state={state} aria-current={state === "current" || state === "failed" ? "step" : undefined} className={cn("relative pl-10", !last && "pb-6")}>
              <Marker state={state} />
              {last ? null : <span aria-hidden="true" className={cn("absolute top-[1.875rem] bottom-[0.375rem] left-[0.7rem] w-0 border-l", solid ? "border-foreground" : "border-dashed border-muted-foreground/40")} />}
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.9375rem] leading-6">
                  <span className={cn("font-medium", state === "pending" && "text-muted-foreground", state === "current" && "font-semibold", state === "failed" && "font-semibold text-destructive")}>{state === "failed" ? words.failedTitle : text.title}</span>
                  {state === "current" ? <Badge variant="secondary">{words.current}</Badge> : null}
                  <span className="sr-only">{state === "done" || state === "current" ? words.done : state === "failed" ? words.failed : words.notYet}</span>
                </p>
                {day ? (
                  <time dateTime={day.iso} className="text-xs text-muted-foreground tabular-nums">
                    {day.text}
                  </time>
                ) : null}
              </div>
              {showNext ? <p className="mt-1 text-sm leading-snug text-pretty text-muted-foreground">{fill(text.next, { method: refund.method })}</p> : null}
              {state === "failed" && refund.issue ? (
                <div className="mt-2.5 grid gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3.5 text-sm leading-snug">
                  <p className="flex items-center gap-2 font-semibold">
                    <IconAlertCircle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
                    {words.failedNote}
                  </p>
                  <p>
                    <span className="font-medium">{words.why}: </span>
                    {refund.issue.reason}
                  </p>
                  {refund.issue.action ? (
                    <p>
                      <span className="font-medium">{words.whatToDo}: </span>
                      {refund.issue.action}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {partial && refund.issue ? (
        <div className="mx-5 mb-5 grid gap-1.5 rounded-lg border border-border bg-muted/50 p-3.5 text-sm leading-snug">
          <p className="flex items-center gap-2 font-semibold">
            <IconAlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {refund.issue.refunded === undefined ? stages.partial : fill(words.partialNote, { refunded: shown, amount: total })}
          </p>
          <p>
            <span className="font-medium">{words.why}: </span>
            {refund.issue.reason}
          </p>
          {refund.issue.action ? (
            <p>
              <span className="font-medium">{words.whatToDo}: </span>
              {refund.issue.action}
            </p>
          ) : null}
        </div>
      ) : null}

      {approved ? (
        <div className="flex items-start gap-3 border-t border-border bg-muted/40 px-5 py-4 text-sm leading-snug">
          <IconCalendar aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="grid gap-0.5">
            <p className="font-medium">
              {expectedDay ? <time dateTime={expectedDay.iso}>{fill(words.expected, { date: expectedDay.text })}</time> : words.usually}
            </p>
            {overdue ? <p className="text-destructive">{words.late}</p> : null}
          </div>
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {sentence}
      </p>
    </div>
  );
}
