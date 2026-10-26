"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { splitBill, type BillItem, type BillShare } from "@rhs-ui/commerce/bill-splitter/split";
import { formatMoney } from "@rhs-ui/commerce/money";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export type { BillItem, BillShare } from "@rhs-ui/commerce/bill-splitter/split";

export interface BillSplitterLabels {
  /** The heading. */
  title?: string;
  /** Names the choice between splitting equally and by item, for a screen reader. */
  how?: string;
  /** The equal split. */
  equal?: string;
  /** The split by item. */
  byItem?: string;
  /** The caption of the number of people. */
  people?: string;
  /** The name of someone who has none. `{n}` is their number: "Guest 4". It is written in full wherever a short name is needed, so "Guest 2" and "Guest 3" never both read "Guest". */
  guest?: string;
  /** The caption of the tip choices. */
  tip?: string;
  /** The tip choice for no tip. */
  noTip?: string;
  /** The round-up switch. */
  roundUp?: string;
  /** Under the switch, in words. `{unit}` is one whole unit of the currency: "€1". */
  roundUpHint?: string;
  /** The caption above the lines of the bill. */
  items?: string;
  /** Names the buttons that pick people for a line, for a screen reader. `{item}` is the line. */
  whoHad?: string;
  /** Beside a line nobody has been picked for. */
  everyone?: string;
  /** The row for what the lines do not cover, when it is a charge. */
  surcharge?: string;
  /** The row for what the lines do not cover, when it is a discount. */
  discount?: string;
  /** Before the amount of the bill. */
  bill?: string;
  /** The tip row of the summary. `{percent}` is the percentage: "Tip (10%)". */
  tipLine?: string;
  /** The rounding row of the summary. */
  roundingLine?: string;
  /** What the tip adds to one person's share. `{amount}`: "€3.21 tip". */
  tipShare?: string;
  /** What rounding adds to one person's share. `{amount}`: "€0.61 rounded up". */
  roundShare?: string;
  /** The total row. */
  grand?: string;
  /** The pay button. */
  pay?: string;
  /** The pay button's name for a screen reader. `{name}` and `{amount}`. */
  payName?: string;
  /** In place of the button once a share is paid. */
  paid?: string;
  /** Under a share whose payment failed. */
  failed?: string;
  /** Said once someone has paid and the split can no longer change. */
  locked?: string;
  /** The status when everyone pays the same. `{amount}` each, `{all}` in total. */
  statusEqual?: string;
  /** The status when the shares differ. `{from}`, `{to}` and `{all}`. */
  statusRange?: string;
  /** Added to the status once a share is paid. `{paid}`, `{count}` and `{left}`. */
  progress?: string;
  /** Added to the status when everyone has paid. */
  allPaid?: string;
  /** The odd cent, when one person pays it. `{total}`, `{count}`, `{names}`. */
  oddOne?: string;
  /** The odd cent, when two or three people pay it. */
  oddMany?: string;
  /** The odd cent, when more people pay it. `{k}` is how many. */
  oddFirst?: string;
}

const WORDS = {
  title: "Split the bill",
  how: "How to split the bill",
  equal: "Equally",
  byItem: "By item",
  people: "People",
  guest: "Guest {n}",
  tip: "Tip",
  noTip: "No tip",
  roundUp: "Round shares up",
  roundUpHint: "Every share goes up to a whole {unit} and the difference is shown as its own line.",
  items: "Who had what",
  whoHad: "Who had {item}?",
  everyone: "Everyone shares it",
  surcharge: "Service and other charges, shared in proportion",
  discount: "Discount, shared in proportion",
  bill: "Bill",
  tipLine: "Tip ({percent})",
  roundingLine: "Rounded up",
  tipShare: "{amount} tip",
  roundShare: "{amount} rounded up",
  grand: "Everyone pays",
  pay: "Pay",
  payName: "Pay {amount} for {name}",
  paid: "Paid",
  failed: "That payment did not go through. Try again.",
  locked: "Someone has paid, so the split is fixed.",
  statusEqual: "{amount} each, {all} in all.",
  statusRange: "{from} to {to} each, {all} in all.",
  progress: "{paid} of {count} paid, {left} to go.",
  allPaid: "Everyone has paid.",
  oddOne: "{total} does not divide evenly by {count}, so {names} pays one cent more and the shares add up to the bill.",
  oddMany: "{total} does not divide evenly by {count}, so {names} pay one cent more each and the shares add up to the bill.",
  oddFirst: "{total} does not divide evenly by {count}, so the first {k} people pay one cent more each and the shares add up to the bill.",
} satisfies Required<BillSplitterLabels>;

export interface BillSplitterProps extends Omit<ComponentProps<"div">, "children" | "title" | "onChange"> {
  /** The bill in minor units: 9640 is 96.40. Without it, the lines in `items` add up to the bill. */
  total?: number;
  /** The lines of the bill. With them the bill can be split by item as well as equally. The `sharedBy` of a line is where the picking starts; after that the people at the table pick, and a later change of the prop does not undo it. */
  items?: readonly BillItem[];
  /** How many people share the bill, or their names. The count starts here and can be changed on the screen; a later change of the prop does not reset it. Give the component a new `key` to start over. */
  people?: number | readonly string[];
  /** The tip that starts selected, in percent of the bill. Defaults to 10. It is the starting choice only: a later change of the prop does not move it. */
  tipPercent?: number;
  /** The tip choices on offer, in percent. The starting tip is always one of them. */
  tipOptions?: readonly number[];
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Locale for the amounts and the lists of names. Always passed, so server and browser agree. */
  locale?: string;
  /** How the bill is split to begin with. Defaults to equally. */
  defaultMode?: "equal" | "items";
  /** Starts with the shares rounded up to whole units. */
  defaultRoundUp?: boolean;
  /** The most people the count can go up to. Defaults to 12. */
  maxPeople?: number;
  /** Called when a share is paid. Return a promise to show it is working; a rejection leaves the share unpaid and says so. Without it there are no pay buttons and the splitter is a calculator. */
  onPay?: (share: BillShare) => void | Promise<void>;
  /** The people who have paid, as positions in the list (0 is the first). Pass it to control it; without it the splitter keeps track itself. */
  paid?: readonly number[];
  /** A line under the heading: "Table 12, Osteria Marlow". */
  description?: string;
  /** The words, for another language. */
  labels?: BillSplitterLabels;
}

const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/**
 * One short label per person, for the chips under a dish and for the sentence about the odd cent. It is the first
 * name while that is unique at the table, the first name with the initial of the last name ("Anna V.") when two
 * first names collide, and the whole name when even that collides. Someone without a name keeps the label made
 * for them whole, so "Guest 2" and "Guest 3" are never both "Guest".
 */
function shortNamesOf(names: readonly string[], named: number, locale: string): string[] {
  const clashes = (labels: readonly string[]) => labels.map((label) => labels.filter((other) => other.toLocaleLowerCase(locale) === label.toLocaleLowerCase(locale)).length > 1);
  const firsts = names.map((name, position) => (position < named ? firstName(name) : name));
  const firstClashes = clashes(firsts);
  const initials = names.map((name, position) => {
    const first = firsts[position] ?? name;
    if (!firstClashes[position] || position >= named) return first;
    const last = name.trim().split(/\s+/).slice(1).pop();
    const letter = last ? Array.from(last)[0] : undefined;
    return letter ? `${first} ${letter.toLocaleUpperCase(locale)}.` : first;
  });
  const initialClashes = clashes(initials);
  return initials.map((label, position) => (initialClashes[position] ? (names[position] ?? label) : label));
}

/**
 * The pay-at-table helper: the bill split between the people at the table, equally or line by line, with a tip
 * and an option to round every share up. All sums are done in whole minor units and the odd cent is handed out
 * in a fixed order, so the shares always add up to the bill and the screen says in words when one person pays a
 * cent more. Each share can be paid on its own; once someone has paid, the split is fixed. The result is read
 * out politely whenever it changes.
 */
export function BillSplitter({
  total,
  items = [],
  people = 2,
  tipPercent = 10,
  tipOptions = [0, 5, 10, 15],
  currency = "EUR",
  locale = "en-US",
  defaultMode,
  defaultRoundUp = false,
  maxPeople = 12,
  onPay,
  paid,
  description,
  labels,
  className,
  ...props
}: BillSplitterProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const named = typeof people === "number" ? [] : people;
  const [count, setCount] = useState(Math.max(1, typeof people === "number" ? people : people.length));
  const [mode, setMode] = useState<"equal" | "items">(items.length ? (defaultMode ?? "equal") : "equal");
  const [tip, setTip] = useState(tipPercent);
  const [roundUp, setRoundUp] = useState(defaultRoundUp);
  const [picks, setPicks] = useState<Record<string, readonly number[] | undefined>>(() => Object.fromEntries(items.map((item) => [item.id, item.sharedBy])));
  const [ownPaid, setOwnPaid] = useState<readonly number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState<number | null>(null);

  const money = (amount: number) => formatMoney({ amount, currency }, locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const numbers = new Intl.NumberFormat(locale);
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const names = Array.from({ length: count }, (_, position) => named[position] ?? fill(words.guest, { n: numbers.format(position + 1) }));
  // The chips under a dish and the odd-cent sentence cannot afford the whole name, but they cannot afford two people with the same label either.
  const short = shortNamesOf(names, named.length, locale);

  const listed = items.reduce((sum, item) => sum + item.amount, 0);
  const billTotal = total ?? listed;
  const byItem = mode === "items" && items.length > 0;
  const result = splitBill({
    total: billTotal,
    people: count,
    items: byItem ? items.map((item) => ({ amount: item.amount, sharedBy: picks[item.id] })) : undefined,
    tipPercent: tip,
    roundTo: roundUp ? 100 : 0,
  });
  const shares: BillShare[] = names.map((name, index) => ({
    index,
    name,
    subtotal: result.subtotals[index] ?? 0,
    tip: result.tips[index] ?? 0,
    rounding: result.roundings[index] ?? 0,
    total: result.totals[index] ?? 0,
    currency,
  }));

  const paidList = paid ?? ownPaid;
  const locked = paidList.length > 0;
  const left = shares.filter((share) => !paidList.includes(share.index)).reduce((sum, share) => sum + share.total, 0);
  const low = Math.min(...result.totals);
  const high = Math.max(...result.totals);
  const choices = [...new Set([...tipOptions, tipPercent])].sort((a, b) => a - b);
  const unit = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(1);

  // The odd cent of an equal split goes to the first people in line; say so, with names.
  const odd = !byItem && !roundUp && high !== low ? short.filter((_, position) => result.totals[position] === high) : [];
  const note = { total: money(result.grandTotal), count: numbers.format(count), names: list.format(odd), k: numbers.format(odd.length) };
  const oddNote = odd.length === 0 ? null : fill(odd.length === 1 ? words.oddOne : odd.length <= 3 ? words.oddMany : words.oddFirst, note);

  const status = [
    low === high ? fill(words.statusEqual, { amount: money(high), all: money(result.grandTotal) }) : fill(words.statusRange, { from: money(low), to: money(high), all: money(result.grandTotal) }),
    paidList.length === 0 ? "" : left === 0 ? words.allPaid : fill(words.progress, { paid: numbers.format(paidList.length), count: numbers.format(count), left: money(left) }),
  ]
    .filter(Boolean)
    .join(" ");

  const toggle = (line: string, who: number) => {
    if (locked) return;
    setPicks((current) => {
      const now = (current[line] ?? []).filter((position) => position < count);
      return { ...current, [line]: now.includes(who) ? now.filter((position) => position !== who) : [...now, who] };
    });
  };

  const pay = async (share: BillShare) => {
    if (busy !== null || !onPay) return;
    setFailed(null);
    setBusy(share.index);
    try {
      await onPay(share);
      if (paid === undefined) setOwnPaid((current) => (current.includes(share.index) ? current : [...current, share.index]));
    } catch {
      setFailed(share.index);
    } finally {
      setBusy(null);
    }
  };

  const caption = "text-xs font-medium text-muted-foreground";
  const peopleId = `${id}-people`;
  const roundId = `${id}-round`;
  // In a wide card a dish takes one line with its chips beside it, as long as few enough people share the table for the chips to fit there. With more they stay under the dish at every width, where they wrap and the dish keeps its whole line.
  const beside = names.length <= 4;

  return (
    <div data-slot="bill-splitter" role="group" aria-labelledby={`${id}-title`} className={cn("@container w-full min-w-0 rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="text-base leading-snug font-semibold tracking-[-0.01em]">
            {words.title}
          </h3>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-xs text-muted-foreground">{words.bill}</span>
          <span className="block text-2xl leading-tight font-semibold tracking-[-0.03em] tabular-nums">{money(billTotal)}</span>
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 border-t border-border p-5">
        {items.length ? (
          <SegmentedControl
            label={words.how}
            value={mode}
            onValueChange={(next) => !locked && setMode(next === "items" ? "items" : "equal")}
            options={[
              { value: "equal", label: words.equal, disabled: locked },
              { value: "items", label: words.byItem, disabled: locked },
            ]}
            className="w-full [&>button]:flex-1 [&>button]:px-3"
          />
        ) : null}

        <div className="grid gap-4 @[24rem]:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
          <div className="grid content-start gap-2">
            <label htmlFor={peopleId} className={caption}>
              {words.people}
            </label>
            <NumberInput id={peopleId} value={count} onValueChange={(next) => !locked && setCount(next)} min={1} max={maxPeople} disabled={locked} locale={locale} className="h-10 w-full" />
          </div>
          <div className="grid content-start gap-2">
            <p aria-hidden="true" className={caption}>
              {words.tip}
            </p>
            <SegmentedControl
              label={words.tip}
              value={String(tip)}
              onValueChange={(next) => !locked && setTip(Number(next))}
              options={choices.map((choice) => ({ value: String(choice), label: choice === 0 ? words.noTip : percent.format(choice / 100), disabled: locked }))}
              className="w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:px-2 [&>button]:py-1.5"
            />
          </div>
        </div>

        {byItem ? (
          <div className="min-w-0">
            <p className={cn(caption, "mb-2")}>{words.items}</p>
            <ul className="min-w-0 divide-y divide-border overflow-hidden rounded-lg border border-border">
              {items.map((item) => {
                const chosen = (picks[item.id] ?? []).filter((position) => position < count);
                return (
                  <li key={item.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3.5 py-3", beside && "@[36rem]:grid-cols-[minmax(8rem,1fr)_fit-content(60%)_4.25rem]")}>
                    <span className="min-w-0 text-sm font-medium">
                      {item.name}
                      {chosen.length === 0 ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{words.everyone}</span> : null}
                    </span>
                    <span className={cn("col-start-2 row-start-1 text-right text-sm tabular-nums", beside && "@[36rem]:col-start-3")}>{money(item.amount)}</span>
                    <div role="group" aria-label={fill(words.whoHad, { item: item.name })} className={cn("col-span-2 row-start-2 flex min-w-0 flex-wrap items-center gap-1.5", beside && "@[36rem]:col-span-1 @[36rem]:col-start-2 @[36rem]:row-start-1 @[36rem]:justify-end")}>
                      {names.map((name, position) => {
                        const on = chosen.includes(position);
                        const label = short[position] ?? name;
                        return (
                          <button
                            key={position}
                            type="button"
                            aria-pressed={on}
                            aria-label={name.startsWith(label) ? name : label}
                            disabled={locked}
                            onClick={() => toggle(item.id, position)}
                            className={cn(
                              "inline-flex h-7 max-w-full items-center rounded-full border px-2.5 text-xs font-medium outline-none transition-[background-color,border-color,color] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none",
                              on ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <span className="truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
              {billTotal !== listed ? (
                <li className="flex items-baseline justify-between gap-3 bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">
                  <span>{billTotal > listed ? words.surcharge : words.discount}</span>
                  <span className="shrink-0 tabular-nums">{money(billTotal - listed)}</span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor={roundId} className="text-sm font-medium">
              {words.roundUp}
            </label>
            <p id={`${roundId}-hint`} className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {fill(words.roundUpHint, { unit })}
            </p>
          </div>
          <Switch id={roundId} checked={roundUp} onCheckedChange={setRoundUp} disabled={locked} aria-describedby={`${roundId}-hint`} className="mt-0.5" />
        </div>

        {locked ? <p className="text-xs text-muted-foreground">{words.locked}</p> : null}
      </div>

      <ul className="divide-y divide-border border-t border-border">
        {shares.map((share) => {
          const done = paidList.includes(share.index);
          const parts = [money(share.subtotal), share.tip > 0 ? fill(words.tipShare, { amount: money(share.tip) }) : null, share.rounding > 0 ? fill(words.roundShare, { amount: money(share.rounding) }) : null].filter(Boolean);
          return (
            <li key={share.index} className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-4 @[26rem]:gap-x-4", done && "bg-muted/40")}>
              <Avatar className="size-9">
                {/* A guest is the first letter and the whole number, so Guest 1 and Guest 10 are not both "G1". */}
                <AvatarFallback>{share.index >= named.length ? `${Array.from(share.name.trim())[0] ?? ""}${numbers.format(share.index + 1)}` : initialsOf(share.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium [overflow-wrap:anywhere]">{share.name}</p>
                <p className="text-xs leading-relaxed text-muted-foreground tabular-nums">{parts.join(" + ")}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 @[26rem]:flex-row @[26rem]:items-center @[26rem]:gap-4">
                <p className="text-base font-semibold tracking-[-0.01em] tabular-nums">
                  <span className="sr-only">{share.name}: </span>
                  {money(share.total)}
                </p>
                {onPay ? (
                  <div className="flex @[26rem]:w-[4.25rem] @[26rem]:justify-end">
                    {done ? (
                      <p className="inline-flex h-8 items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <IconCheck aria-hidden="true" className="size-4" />
                        {words.paid}
                      </p>
                    ) : (
                      <Button type="button" variant="outline" size="sm" loading={busy === share.index} disabled={busy !== null} aria-label={fill(words.payName, { name: share.name, amount: money(share.total) })} onClick={() => pay(share)} className="min-w-16">
                        {words.pay}
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
              {failed === share.index ? (
                <p role="alert" className="col-span-full flex items-start gap-1.5 text-xs font-medium text-destructive">
                  <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                  {words.failed}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="grid gap-3 rounded-b-xl border-t border-border bg-muted/40 p-5">
        <dl className="grid gap-1.5 text-sm tabular-nums">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{words.bill}</dt>
            <dd>{money(result.billTotal)}</dd>
          </div>
          {result.tipTotal > 0 ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{fill(words.tipLine, { percent: percent.format(tip / 100) })}</dt>
              <dd>{money(result.tipTotal)}</dd>
            </div>
          ) : null}
          {result.roundingTotal > 0 ? (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">{words.roundingLine}</dt>
              <dd>{money(result.roundingTotal)}</dd>
            </div>
          ) : null}
          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-3 text-base font-semibold">
            <dt>{words.grand}</dt>
            <dd className="tracking-[-0.01em]">{money(result.grandTotal)}</dd>
          </div>
        </dl>
        <p role="status" className="text-sm text-foreground">
          {status}
        </p>
        {oddNote ? <p className="text-xs leading-relaxed text-muted-foreground">{oddNote}</p> : null}
      </div>
    </div>
  );
}
