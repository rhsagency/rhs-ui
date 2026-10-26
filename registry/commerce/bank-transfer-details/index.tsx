import { useId, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconClock, IconLandmark } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { compactBic, compactIban, groupIban, hasLapsed, plainAmount, toMillis, type TransferMoment } from "@rhs-ui/commerce/bank-transfer-details/transfer";
import { Badge } from "@rhs-ui/primitives/badge";
import { Card, CardDescription, CardTitle } from "@rhs-ui/primitives/card";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { cn } from "@/lib/utils";

export type { TransferMoment } from "@rhs-ui/commerce/bank-transfer-details/transfer";

/** The account the customer pays into, and what to pay. */
export interface BankTransferAccount {
  /** Who receives the money: "Northwind Goods B.V.". */
  beneficiary: string;
  /** The IBAN, with or without spaces. It is shown in groups of four and copied without spaces. */
  iban: string;
  /** The BIC or SWIFT code. Leave it out where a transfer does not need one. */
  bic?: string;
  /** What to pay, in minor units: 12900 is 129.00. */
  amount: number;
  /** What the customer must write in the description of the transfer. It is how you match the payment to the order. */
  reference: string;
}

/** The rows that can be copied. */
export type BankTransferField = "beneficiary" | "iban" | "bic" | "amount" | "reference";

export interface BankTransferLabels {
  /** The heading of the card. */
  title?: string;
  /** Under the title. `{amount}` is what to pay. */
  lead?: string;
  /** The name of the beneficiary row. */
  beneficiary?: string;
  /** The name of the IBAN row. */
  iban?: string;
  /** The name of the BIC row. */
  bic?: string;
  /** The name of the amount row. */
  amount?: string;
  /** The name of the reference row. */
  reference?: string;
  /** The flag on the reference. */
  exact?: string;
  /** Under the reference. */
  referenceNote?: string;
  /** The copy button. */
  copy?: string;
  /** The copy button for a moment after it has copied. */
  copied?: string;
  /** The deadline line. `{date}` is the day and time. */
  deadline?: string;
  /** The deadline line once it has passed. `{date}`. */
  lapsed?: string;
}

const WORDS = {
  title: "Pay by bank transfer",
  lead: "Send {amount} to the account below. Your order is confirmed as soon as the payment arrives.",
  beneficiary: "Beneficiary",
  iban: "IBAN",
  bic: "BIC",
  amount: "Amount",
  reference: "Payment reference",
  exact: "Must match exactly",
  referenceNote: "Type it exactly as shown. It is how we match your payment to this order.",
  copy: "Copy",
  copied: "Copied",
  deadline: "Pay by {date}. After that the order lapses.",
  lapsed: "The payment window ended on {date}. This order has lapsed.",
} satisfies Required<BankTransferLabels>;

export interface BankTransferDetailsProps extends Omit<ComponentProps<"div">, "children" | "onCopy"> {
  /** The account and the amount. */
  details: BankTransferAccount;
  /** When the order lapses if it is still unpaid: an ISO date-time, a number of milliseconds or a Date. Leave it out when there is no deadline. */
  deadline?: TransferMoment;
  /** The moment to measure the deadline from. Pass it from the server; without it nothing is ever shown as lapsed, so a cached page never claims what it cannot know. Once it is past the deadline the copy buttons are off. */
  now?: TransferMoment;
  /** ISO 4217 code of the amount. */
  currency?: string;
  /** Always pass your application locale, so the amount and the deadline are written the same on the server and in the browser. */
  locale?: string;
  /** The time zone the deadline is written in. Use the shop's. */
  timeZone?: string;
  /** Called with the row and the exact text that reached the clipboard, for example `"iban"` and `"NL65MRDN0417164300"`. */
  onCopy?: (field: BankTransferField, value: string) => void;
  /** The words, for another language. */
  labels?: BankTransferLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

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

interface RowProps {
  id: string;
  field: BankTransferField;
  label: string;
  /** What lands on the clipboard. */
  copy: string;
  /** How the value is set: the default, large figures, the mono face for codes, or mono groups that only ever break between groups (an IBAN). */
  look?: "text" | "figure" | "code" | "groups";
  /** Beside the label: a flag. */
  flag?: ReactNode;
  /** Under the value. */
  note?: ReactNode;
  words: { copy: string; copied: string };
  disabled: boolean;
  onCopy: BankTransferDetailsProps["onCopy"];
  children: ReactNode;
}

const LOOKS = {
  text: "text-balance [overflow-wrap:anywhere] text-[0.9375rem] font-medium",
  figure: "text-balance [overflow-wrap:anywhere] text-xl leading-tight font-semibold tracking-[-0.02em] tabular-nums",
  code: "text-balance [overflow-wrap:anywhere] font-mono text-sm font-medium @max-[18rem]:text-[0.8125rem] @min-[26rem]:text-[0.9375rem]",
  groups: "text-balance font-mono text-sm font-medium @max-[18rem]:text-[0.8125rem] @min-[26rem]:text-[0.9375rem]",
} as const;

/**
 * One line of the details: what it is, its value as plain selectable text (one click selects all of it) and a copy
 * button. The button reads "Copy" and is named "Copy IBAN" for a screen reader, by pointing at its own text and at
 * the label of the row. In a card narrower than 26rem the button is only its icon, so an account number keeps the room
 * it needs; both buttons are in the row and the card's width decides which one is shown.
 */
function Row({ id, field, label, copy, look = "text", flag, note, words, disabled, onCopy, children }: RowProps) {
  const labelId = `${id}-${field}-label`;
  const buttonId = `${id}-${field}-copy`;
  const copyProps = {
    value: copy,
    label: words.copy,
    copiedLabel: words.copied,
    size: "sm",
    variant: "outline",
    disabled,
    onCopy: onCopy ? (value: string) => onCopy(field, value) : undefined,
  } as const;
  return (
    <div className="grid gap-1.5 px-4 py-3.5 sm:px-5">
      <dt className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span id={labelId}>{label}</span>
        {flag}
      </dt>
      <dd className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className={cn("min-w-0 flex-1 text-foreground select-all", LOOKS[look])}>{children}</span>
          <CopyButton id={buttonId} aria-labelledby={`${buttonId} ${labelId}`} className="hidden shrink-0 @min-[26rem]:inline-flex" {...copyProps} />
          <CopyButton id={`${buttonId}-icon`} aria-labelledby={`${buttonId}-icon ${labelId}`} iconOnly className="shrink-0 @min-[26rem]:hidden" {...copyProps} />
        </div>
        {note ? <p className="text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
      </dd>
    </div>
  );
}

/**
 * The card shown after someone chooses to pay by bank transfer: who to pay, the IBAN in groups of four, the BIC, the
 * exact amount and the payment reference, each on a row with its own copy button. A copy says "Copied" on the
 * button and in a polite status. The IBAN is copied without its spaces, the amount without a currency symbol, the
 * reference exactly as written; every value is plain text on the page, so it can also be selected by hand. The
 * reference is set apart and flagged as the one thing that has to be exact, and a deadline line says when the order
 * lapses. Pass `now` and a deadline that has passed turns the copy buttons off and says the order has lapsed.
 */
export function BankTransferDetails({ details, deadline, now, currency = "EUR", locale = "en-US", timeZone = "UTC", onCopy, labels, className, ...props }: BankTransferDetailsProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const lapsed = deadline !== undefined && hasLapsed(deadline, now);
  const amount = formatMoney({ amount: details.amount, currency }, locale);

  const moment = deadline === undefined ? Number.NaN : toMillis(deadline);
  const when = Number.isFinite(moment)
    ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short", timeZone }).format(moment)
    : undefined;
  const date = when === undefined ? null : <time dateTime={new Date(moment).toISOString()}>{when}</time>;

  const shared = { id, words, disabled: lapsed, onCopy } as const;

  return (
    <Card data-slot="bank-transfer-details" data-lapsed={lapsed || undefined} role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="grid gap-3 px-4 pt-5 pb-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
            <IconLandmark className="size-[1.125rem]" />
          </span>
          <CardTitle id={`${id}-title`} className="text-base tracking-[-0.02em]">
            {words.title}
          </CardTitle>
        </div>
        {lapsed && date ? (
          <p className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{withDate(words.lapsed, date)}</span>
          </p>
        ) : (
          <CardDescription className="text-pretty">{fill(words.lead, { amount })}</CardDescription>
        )}
      </div>

      <dl className="divide-y divide-border border-t border-border">
        <Row {...shared} field="beneficiary" label={words.beneficiary} copy={details.beneficiary}>
          {details.beneficiary}
        </Row>
        <Row {...shared} field="iban" label={words.iban} copy={compactIban(details.iban)} look="groups">
          {groupIban(details.iban)}
        </Row>
        {details.bic ? (
          <Row {...shared} field="bic" label={words.bic} copy={compactBic(details.bic)} look="code">
            {compactBic(details.bic)}
          </Row>
        ) : null}
        <Row {...shared} field="amount" label={words.amount} copy={plainAmount(details.amount, locale)} look="figure">
          {amount}
        </Row>
      </dl>

      <dl className="border-t border-border bg-muted/50">
        <Row
          {...shared}
          field="reference"
          label={words.reference}
          copy={details.reference}
          look="code"
          flag={
            <Badge variant="default" className="h-5 gap-1 px-2 text-[0.6875rem]">
              <IconAlertCircle />
              {words.exact}
            </Badge>
          }
          note={words.referenceNote}
        >
          {details.reference}
        </Row>
      </dl>

      {date && !lapsed ? (
        <p className="flex items-start gap-2.5 border-t border-border px-4 py-4 text-sm leading-snug text-muted-foreground sm:px-5">
          <IconClock aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span>{withDate(words.deadline, date)}</span>
        </p>
      ) : null}
    </Card>
  );
}
