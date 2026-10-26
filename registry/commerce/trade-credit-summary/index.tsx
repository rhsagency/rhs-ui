"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconBan, IconCheck, IconCreditCard, IconPlus, IconSpinner, IconWarning } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { dayWords, isoOf, percentUsed, type CreditBlock, type CreditDue, type CreditMoment, type CreditOverdue } from "@rhs-ui/commerce/trade-credit-summary/credit";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { Card } from "@rhs-ui/primitives/card";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { Meter } from "@rhs-ui/primitives/meter";
import { cn } from "@/lib/utils";

export type { CreditBlock, CreditDue, CreditMoment, CreditOverdue } from "@rhs-ui/commerce/trade-credit-summary/credit";

export interface TradeCreditSummaryLabels {
  /** The heading. */
  title?: string;
  /** The five states of the badge beside it. */
  statusGood?: string;
  statusNear?: string;
  statusFull?: string;
  statusOverdue?: string;
  statusHold?: string;
  /** The small title over the big figure. */
  available?: string;
  /** Under it while orders can go through. `{amount}`. */
  availableGood?: string;
  /** Under it when no credit is left. */
  availableNone?: string;
  /** Under it while the account is on hold. */
  availableHold?: string;
  /** The meter's name, and the words beside it. `{used}` and `{limit}`. */
  used?: string;
  usedText?: string;
  /** The warning in words under the meter. `{percent}` of the limit is used and `{amount}` is left. */
  warnNear?: string;
  /** The same once nothing is left. */
  warnFull?: string;
  /** The names of the three rows of facts. */
  rowLimit?: string;
  rowTerms?: string;
  rowNextDue?: string;
  /** In place of the next due date when nothing is due. */
  nothingDue?: string;
  /** The overdue line. `{amount}`. */
  overdue?: string;
  /** Under it. `{count}` invoices, the oldest due `{date}`. */
  overdueInvoicesOne?: string;
  overdueInvoicesOther?: string;
  overdueSince?: string;
  /** The button on the overdue line, and what a screen reader hears on it. `{amount}`. */
  payNow?: string;
  payNowName?: string;
  /** Under the line when the payment could not be started. */
  payFailed?: string;
  /** The heading of the notice for an account that is on hold. */
  blockedTitle?: string;
  /** The line beside the button at the bottom. */
  requestHint?: string;
  /** The button that opens the form. */
  request?: string;
}

const WORDS = {
  title: "Trade credit",
  statusGood: "Good standing",
  statusNear: "Near your limit",
  statusFull: "Limit reached",
  statusOverdue: "Payment overdue",
  statusHold: "On hold",
  available: "Available to spend",
  availableGood: "Orders up to {amount} will go through.",
  availableNone: "There is no credit left. New orders wait until a payment clears.",
  availableHold: "New orders cannot be placed until the hold is lifted.",
  used: "Credit used",
  usedText: "{used} of {limit}",
  warnNear: "You have used {percent} of your credit. An order over {amount} may wait until a payment clears.",
  warnFull: "You have used all of your credit. New orders wait until a payment clears or your limit is raised.",
  rowLimit: "Credit limit",
  rowTerms: "Payment terms",
  rowNextDue: "Next invoice due",
  nothingDue: "Nothing due",
  overdue: "{amount} is overdue",
  overdueInvoicesOne: "{count} invoice",
  overdueInvoicesOther: "{count} invoices",
  overdueSince: "the oldest due {date}",
  payNow: "Pay now",
  payNowName: "Pay now, {amount} overdue",
  payFailed: "We could not start the payment. Try again.",
  blockedTitle: "Your account is on hold",
  requestHint: "Need more room?",
  request: "Request a higher limit",
} satisfies Required<TradeCreditSummaryLabels>;

export interface TradeCreditSummaryProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The credit limit, in minor units: 5000000 is 50,000.00. */
  limit: number;
  /** How much of it is used by open invoices and orders, in minor units. */
  used: number;
  /** The payment terms in words: "30 days net". */
  terms: string;
  /** The next invoice that has to be paid. Leave it out when nothing is due. */
  nextDue?: CreditDue;
  /** What is overdue. The line only appears while there is something, with the amount and a Pay now button. */
  overdue?: CreditOverdue;
  /** Set it when the account cannot order: a notice at the top says so in words, with the reason and who to call. */
  blocked?: CreditBlock;
  /** The customer's company and account number, under the heading: "Fieldwork Kitchens B.V., account 40218". */
  account?: ReactNode;
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Always pass your application locale, so the amounts and dates are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone the due dates are read in. A bare date such as "2026-11-06" is a calendar day and ignores it. */
  timeZone?: string;
  /** From this share of the limit used, the meter and a line of words warn. Defaults to 0.8. */
  warnAt?: number;
  /** Called when Pay now is pressed. Return a promise and the button shows it is working; reject and the line says the payment could not start. */
  onPay?: () => void | Promise<void>;
  /** Called when "Request a higher limit" is pressed to open the form. */
  onRequestIncrease?: () => void;
  /** The form that opens under the button, in a slot of your own. Without it the button only calls `onRequestIncrease`. */
  requestForm?: ReactNode;
  /** Open the form when the card first appears. */
  defaultRequestOpen?: boolean;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: TradeCreditSummaryLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** Each term sits over its value until the card is wide enough to put them side by side. The list's own breakpoint follows the screen; this one follows the card, so it also works in a narrow column on a wide screen. */
const FACTS = "[&>div]:grid-cols-1 [&>div]:gap-1 @sm:[&>div]:grid-cols-[minmax(8rem,1fr)_2fr] @sm:[&>div]:gap-4";

/** A sentence with a node where `{date}` is. */
function withDate(template: string, date: ReactNode): ReactNode {
  const [before = "", after = ""] = template.split("{date}");
  return (
    <>
      {before}
      {date}
      {after}
    </>
  );
}

/**
 * A trade customer's credit at a glance, so they know whether the next order will go through before they build the
 * basket: what is available as the big figure, a meter of what is used that warns in words from 80 percent, the
 * limit, the payment terms and the next invoice due (a `<time>`). Something overdue gets its own line with the
 * amount and a Pay now button, a blocked account says so at the top with the reason and who to call, and a
 * button opens a form of your own to ask for a higher limit. Every amount is in tabular figures, and every state
 * is written as well as drawn.
 */
export function TradeCreditSummary({
  limit,
  used,
  terms,
  nextDue,
  overdue,
  blocked,
  account,
  currency = "EUR",
  locale = "en-US",
  timeZone = "UTC",
  warnAt = 0.8,
  onPay,
  onRequestIncrease,
  requestForm,
  defaultRequestOpen = false,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: TradeCreditSummaryProps) {
  const words: Required<TradeCreditSummaryLabels> = { ...WORDS, ...labels };
  const id = useId();
  const [open, setOpen] = useState(defaultRequestOpen);
  const [paying, setPaying] = useState(false);
  const [payFailed, setPayFailed] = useState(false);

  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const left = Math.max(0, limit - used);
  const percent = percentUsed(used, limit);
  // One source of truth for the zones: the meter, the badge and the words all read the same unrounded numbers, so they never disagree about 79.6 percent or 96 percent.
  const warn = Math.max(0, Math.min(1, warnAt));
  const meterMax = Math.max(limit, 1);
  const meterValue = Math.min(used, meterMax);
  const high = limit * warn;
  const critical = limit * Math.max(warn, 0.95);
  const near = meterValue >= high;
  const full = left === 0;
  // A rounded 100 would say everything is used while something is still left.
  const shownPercent = full ? 100 : Math.min(99, percent);
  const plural = new Intl.PluralRules(locale);
  const numbers = new Intl.NumberFormat(locale);

  const status = blocked
    ? { text: words.statusHold, icon: <IconBan />, variant: "destructive" as const }
    : overdue
      ? { text: words.statusOverdue, icon: <IconAlertCircle />, variant: "destructive" as const }
      : full
        ? { text: words.statusFull, icon: <IconWarning />, variant: "secondary" as const }
        : near
          ? { text: words.statusNear, icon: <IconWarning />, variant: "secondary" as const }
          : { text: words.statusGood, icon: <IconCheck />, variant: "outline" as const };

  const dueWhen = nextDue ? dayWords(nextDue.date, locale, timeZone) : null;
  const dueIso = nextDue ? isoOf(nextDue.date) : null;
  const dueDate =
    dueWhen === null || dueIso === null || !nextDue ? null : (
      <time dateTime={dueIso} title={dayWords(nextDue.date, locale, timeZone, true) ?? undefined} className="whitespace-nowrap">
        {dueWhen}
      </time>
    );

  const facts: DescriptionItem[] = [
    { term: words.rowLimit, value: <span className="tabular-nums">{money(limit)}</span> },
    { term: words.rowTerms, value: terms },
    {
      term: words.rowNextDue,
      value:
        dueDate === null ? (
          <span className="font-normal text-muted-foreground">{words.nothingDue}</span>
        ) : (
          <span className="tabular-nums">
            {dueDate}
            {nextDue?.amount !== undefined ? <span className="font-normal text-muted-foreground">{` · ${money(nextDue.amount)}`}</span> : null}
          </span>
        ),
    },
  ];

  const sinceWhen = overdue?.since === undefined ? null : dayWords(overdue.since, locale, timeZone);
  const sinceIso = overdue?.since === undefined ? null : isoOf(overdue.since);
  const overdueParts: ReactNode[] = [];
  if (overdue?.count !== undefined) overdueParts.push(fill(plural.select(overdue.count) === "one" ? words.overdueInvoicesOne : words.overdueInvoicesOther, { count: numbers.format(overdue.count) }));
  if (sinceWhen !== null && sinceIso !== null) overdueParts.push(withDate(words.overdueSince, <time dateTime={sinceIso}>{sinceWhen}</time>));

  async function pay() {
    if (!onPay || paying) return;
    setPaying(true);
    setPayFailed(false);
    try {
      await onPay();
    } catch {
      setPayFailed(true);
    } finally {
      setPaying(false);
    }
  }

  function request() {
    if (requestForm === undefined) {
      onRequestIncrease?.();
      return;
    }
    setOpen(!open);
    if (!open) onRequestIncrease?.();
  }

  const figure = blocked ? 0 : left;

  return (
    <Card data-slot="trade-credit-summary" data-state={blocked ? "blocked" : full ? "full" : near ? "near" : "good"} role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="flex items-start justify-between gap-x-4 gap-y-2 p-5">
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-base leading-snug font-semibold tracking-[-0.02em]">
            {words.title}
          </Heading>
          {account ? <p className="mt-0.5 text-sm text-muted-foreground [overflow-wrap:anywhere]">{account}</p> : null}
        </div>
        {/* The red word on its pale fill is darkened toward the text colour, so it reaches 4.5:1 at this size. */}
        <Badge variant={status.variant} className={cn("shrink-0", status.variant === "destructive" && "font-semibold text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]")}>
          {status.icon}
          {status.text}
        </Badge>
      </div>

      {blocked || overdue ? (
        <div className="grid gap-3 px-5 pb-5">
          {blocked ? (
            <Callout tone="danger" title={words.blockedTitle}>
              <p>{blocked.reason}</p>
              {blocked.contact ? <p className="mt-1.5 font-medium text-foreground">{blocked.contact}</p> : null}
            </Callout>
          ) : null}
          {overdue ? (
            <div data-slot="trade-credit-overdue" className="grid gap-x-4 gap-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 @md:grid-cols-[minmax(0,1fr)_auto] @md:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug font-semibold tabular-nums">{fill(words.overdue, { amount: money(overdue.amount) })}</p>
                  {overdueParts.length ? (
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {overdueParts.map((part, index) => (
                        <span key={index}>
                          {index > 0 ? ", " : null}
                          {part}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              </div>
              {onPay ? (
                <Button
                  type="button"
                  size="sm"
                  aria-busy={paying || undefined}
                  aria-disabled={paying || undefined}
                  aria-label={fill(words.payNowName, { amount: money(overdue.amount) })}
                  onClick={() => void pay()}
                  className={cn("justify-self-start @md:justify-self-end", paying && "pointer-events-none")}
                >
                  {paying ? <IconSpinner /> : <IconCreditCard />}
                  {words.payNow}
                </Button>
              ) : null}
              {payFailed ? (
                <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive @md:col-span-2">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {words.payFailed}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 border-t border-border p-5">
        <div>
          <p className="text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{words.available}</p>
          <p className={cn("mt-2 text-4xl leading-none font-semibold tracking-[-0.03em] tabular-nums", (blocked || full) && "text-muted-foreground")}>{money(figure)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{blocked ? words.availableHold : full ? words.availableNone : fill(words.availableGood, { amount: money(left) })}</p>
        </div>

        <div className="grid gap-3">
          <Meter
            value={meterValue}
            max={meterMax}
            high={high}
            critical={critical}
            label={words.used}
            valueText={fill(words.usedText, { used: money(used), limit: money(limit) })}
          />
          {near && !blocked ? (
            <p className="flex items-start gap-2 text-sm leading-snug font-medium">
              <IconWarning aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="text-pretty tabular-nums">
                {full ? words.warnFull : fill(words.warnNear, { percent: new Intl.NumberFormat(locale, { style: "percent" }).format(shownPercent / 100), amount: money(left) })}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border p-5">
        <DescriptionList items={facts} className={FACTS} />
      </div>

      {/* The button is only there when something answers it: a form to open, or a callback to run. */}
      {requestForm !== undefined || onRequestIncrease ? (
        <div className="border-t border-border bg-muted/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="text-sm text-muted-foreground">{words.requestHint}</p>
            <Button type="button" variant="outline" size="sm" aria-expanded={requestForm === undefined ? undefined : open} aria-controls={requestForm === undefined ? undefined : `${id}-request`} onClick={request}>
              <IconPlus />
              {words.request}
            </Button>
          </div>
          {requestForm !== undefined && open ? (
            <div id={`${id}-request`} role="group" aria-label={words.request} className="mt-4 rounded-xl border border-border bg-card p-4 transition-[opacity,translate] duration-200 starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none">
              {requestForm}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
