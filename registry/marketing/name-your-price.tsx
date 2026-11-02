"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { CurrencyInput } from "@rhs-ui/primitives/currency-input";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface NameYourPriceImpact {
  /** The smallest amount this line is true for, in minor units: 1200 for 12.00. */
  from: number;
  /** What such an amount does, as the end of a sentence that starts with the amount: "pays for a month of updates." */
  text: string;
}

export interface NameYourPriceLabels {
  /** The name of the group of preset amounts for assistive technology. */
  amounts: string;
  /** The small tag on the suggested amount. */
  suggested: string;
  /** The label of the custom amount field. */
  custom: string;
  /** The line under the custom field. {min} stands for the smallest amount, written with its currency. */
  minimum: string;
  /** Said when the custom amount is under the minimum. {min} stands for the smallest amount. */
  belowMin: string;
  /** Said when no amount is chosen or typed. */
  amountRequired: string;
  /** The line under the amounts, about the chosen one. {amount} stands for the amount and {text} for the line of the impact. */
  impact: string;
  /** The label of the monthly switch. */
  monthly: string;
  /** The line under the label of the monthly switch. */
  monthlyHint: string;
  /** The button. {amount} stands for the chosen amount, written with its currency. */
  pay: string;
  /** The button when the switch is on. {amount} stands for the chosen amount. */
  payMonthly: string;
  /** The button while no amount is chosen. */
  choose: string;
  /** Said when onSubmit fails. What was chosen stays as it is. */
  failed: string;
  /** The headline after sending. */
  doneTitle: string;
  /** The line after sending. {amount} stands for the amount. */
  done: string;
  /** The line after sending a monthly amount. {amount} stands for the amount. */
  doneMonthly: string;
  /** The button that leads back to the amounts. */
  change: string;
}

const LABELS: NameYourPriceLabels = {
  amounts: "Choose an amount",
  suggested: "Suggested",
  custom: "Or enter your own amount",
  minimum: "Minimum {min}",
  belowMin: "That is under the minimum. Enter {min} or more.",
  amountRequired: "Choose an amount above or enter your own.",
  impact: "{amount} {text}",
  monthly: "Give this every month",
  monthlyHint: "It repeats monthly until you stop it.",
  pay: "Pay {amount}",
  payMonthly: "Pay {amount} every month",
  choose: "Choose an amount",
  failed: "That did not go through. Nothing was charged: your amount is still here, so try again.",
  doneTitle: "Thank you",
  done: "You gave {amount}.",
  doneMonthly: "You give {amount} every month.",
  change: "Change the amount",
};

export interface NameYourPriceProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /** The heading: "Pay what feels right". */
  title: string;
  /** One or two sentences under the heading: what the buyer gets and where the money goes. */
  description?: string;
  /** The preset amounts in minor units, usually three: [500, 1200, 2500] for 5, 12 and 25. Two to four share one row (four go two by two on a narrow card); more wrap three across. */
  presets: readonly number[];
  /** The preset that is chosen at the start and carries the tag. A suggested amount anchors the choice, so say one. It should be one of the presets. */
  suggested?: number;
  /** The smallest amount accepted, in minor units: 300 for 3.00. It is said under the custom field and in the mistake. */
  min: number;
  /** The ISO 4217 currency. "EUR" by default. */
  currency?: string;
  /** The language the amounts are written in. "en-US" by default. */
  locale?: string;
  /**
   * What an amount does, as lines with the smallest amount each is true for. The line of the highest `from` that the
   * chosen amount reaches is said under the amounts, for a preset and for a custom amount alike.
   */
  impact?: readonly NameYourPriceImpact[];
  /** Offer the switch that repeats the amount every month. Off by default: only turn it on when your checkout can bill monthly. */
  monthly?: boolean;
  /** Whether the monthly switch is on at the start. */
  defaultMonthly?: boolean;
  /** Called with the amount in minor units and whether it repeats. Resolve to confirm; reject to show the error and keep the choice. */
  onSubmit: (amount: number, recurring: boolean) => Promise<void> | void;
  /** Called whenever the chosen amount changes, in minor units, or with null while the field is empty. Use it for analytics or to show the amount elsewhere. */
  onValueChange?: (amount: number | null) => void;
  /** The amount at the start, in minor units. A preset chooses its card; any other amount goes in the custom field. The suggested amount by default. */
  defaultAmount?: number;
  /**
   * Where the panel starts. "idle" by default. The others show a state for a page that already knows it:
   * "invalid" shows the mistake as after a first attempt, "error" the failure message, and "done" the thanks.
   */
  defaultStatus?: "idle" | "invalid" | "error" | "done";
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<NameYourPriceLabels>;
}

const text = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => values[key] ?? marker);

/** Columns by how many presets there are, written out so Tailwind sees every class: no tile is left alone on a row, and four go two by two until the card is wide enough to hold four across. */
const COLUMNS = ["grid-cols-1", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-2 @[22rem]:grid-cols-4", "grid-cols-3", "grid-cols-3"];

/** How wide an amount is written, in digit widths: a digit, a letter or a currency sign counts one, a separator or a space less. */
const widthOf = (written: string): number => [...written].reduce((sum, char) => sum + (/[\p{L}\p{N}\p{Sc}]/u.test(char) ? 1 : 0.4), 0);

/**
 * Pay what you want, with honest anchors: preset amounts as tiles (three is usual), one of them suggested, a custom
 * amount with its minimum said out loud, an optional switch to give it every month, and a button that follows the
 * choice (Pay €12). The presets are a real radio group: arrow keys move and choose, and the choice is outlined and
 * checked, not just shaded. The tiles share the row by how many there are, and every amount is set in one size, the
 * largest that lets the longest of them fit its tile, so a big amount never spills out of its tile on a phone.
 * Under the tiles one line says what the chosen amount does, for a preset and for a custom amount, and a screen
 * reader hears it change. An amount under the minimum is said in plain words next to the field and what was typed
 * stays; pressing the button then takes the reader back to the field. Sending keeps the label, a failure keeps the
 * choice, and success thanks the reader with what they gave; changing the amount afterwards puts focus back on the
 * chosen tile, so a keyboard is never thrown back to the top of the page.
 */
export function NameYourPrice({
  title,
  description,
  presets,
  suggested,
  min,
  currency = "EUR",
  locale = "en-US",
  impact,
  monthly = false,
  defaultMonthly = false,
  onSubmit,
  onValueChange,
  defaultAmount,
  defaultStatus = "idle",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: NameYourPriceProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const start = defaultAmount ?? suggested ?? presets[0] ?? null;
  const [preset, setPreset] = useState(start !== null && presets.includes(start) ? String(start) : "");
  const [typed, setTyped] = useState<number | null>(start !== null && !presets.includes(start) ? start : null);
  const [recurring, setRecurring] = useState(monthly && defaultMonthly);
  const [touched, setTouched] = useState(defaultStatus !== "idle");
  const [submitted, setSubmitted] = useState(defaultStatus !== "idle");
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus === "done" || defaultStatus === "error" ? defaultStatus : "idle");
  const [given, setGiven] = useState<{ amount: number; recurring: boolean } | null>(() => (defaultStatus === "done" && start !== null ? { amount: start, recurring: monthly && defaultMonthly } : null));
  // Focus only moves for something the reader did, never on the first render of a panel that starts in a state.
  const acted = useRef(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const customRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const payRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!acted.current) return;
    if (status === "done") doneRef.current?.focus();
    // The button is disabled while sending, and a disabled button gives up focus. After a failure it is handed back, so a retry is one key press away.
    else if (status === "error" && (!document.activeElement || document.activeElement === document.body || document.activeElement === payRef.current)) payRef.current?.focus();
  }, [status]);

  const amount = preset ? Number(preset) : typed;
  const valid = amount !== null && amount >= min;
  const money = (minor: number): string => {
    const whole = minor % 100 === 0;
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(minor / 100);
  };
  // One size for every tile, so the row of amounts is even: 1.5rem, or less when the longest amount would not fit the tile (0.6 of the size is a generous width for one digit).
  const widest = Math.max(1, ...presets.map((value) => widthOf(money(value))));
  const amountSize = `min(1.5rem, ${(100 / (0.6 * widest)).toFixed(1)}cqi)`;
  const finished = status === "done" && given !== null;

  // A preset never has a mistake; only what the reader typed can be missing or too small.
  let problem: string | undefined;
  if (!preset) {
    if (typed === null) problem = submitted ? labels.amountRequired : undefined;
    else if (typed < min && (touched || submitted)) problem = text(labels.belowMin, { min: money(min) });
  }

  const line = amount !== null && valid && impact ? [...impact].sort((a, b) => b.from - a.from).find((entry) => amount >= entry.from) : undefined;

  function choosePreset(value: string) {
    setPreset(value);
    // A chosen card replaces whatever was typed, so the button never pays an amount the reader cannot see.
    setTyped(null);
    setTouched(false);
    setSubmitted(false);
    if (status === "error") setStatus("idle");
    onValueChange?.(Number(value));
  }

  function type(minor: number | null) {
    setPreset("");
    setTyped(minor);
    if (status === "error") setStatus("idle");
    onValueChange?.(minor);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy") return;
    acted.current = true;
    setSubmitted(true);
    if (amount === null || amount < min) {
      customRef.current?.focus();
      return;
    }
    setStatus("busy");
    try {
      await onSubmit(amount, recurring);
      setGiven({ amount, recurring });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setGiven(null);
    setStatus("idle");
    // The button that had focus goes with the thanks and the amounts come back: start at the chosen tile, or at the field when the amount was typed.
    window.requestAnimationFrame(() => (groupRef.current?.querySelector<HTMLElement>("[role=radio][data-state=checked]") ?? customRef.current)?.focus());
  }

  const label = valid && amount !== null ? text(recurring ? labels.payMonthly : labels.pay, { amount: money(amount) }) : labels.choose;

  return (
    <section data-slot="name-your-price" aria-labelledby={`${id}-title`} className={cn("@container w-full max-w-md rounded-2xl border border-border bg-card p-6 break-words shadow-xs sm:p-8", className)} {...props}>
      <Heading id={`${id}-title`} className="text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance">
        {title}
      </Heading>
      {/* Once the thanks are in, "choose an amount" would contradict them: the intro goes with the choice. */}
      {description && !finished ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

      {finished ? (
        <div ref={doneRef} tabIndex={-1} role="status" className="mt-8 flex flex-col items-center py-4 text-center outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <IconCheck size={22} strokeWidth={2.25} />
          </span>
          <p className="mt-5 text-xl leading-snug font-semibold tracking-[-0.02em]">{labels.doneTitle}</p>
          <p className="mt-2 max-w-xs text-base leading-relaxed text-muted-foreground tabular-nums">{text(given.recurring ? labels.doneMonthly : labels.done, { amount: money(given.amount) })}</p>
          <Button type="button" variant="outline" onClick={again} className="mt-6">
            {labels.change}
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} aria-busy={status === "busy" || undefined} className="mt-7 grid gap-6">
          <RadioGroupPrimitive.Root ref={groupRef} aria-label={labels.amounts} value={preset} onValueChange={choosePreset} className={cn("grid gap-2.5 pt-1.5", COLUMNS[Math.min(presets.length, 6)])}>
            {presets.map((value) => (
              <RadioGroupPrimitive.Item
                key={value}
                value={String(value)}
                className={cn(
                  "group/tile relative grid h-[4.75rem] place-items-center rounded-xl border border-border bg-background px-2 text-center shadow-xs outline-none",
                  "transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
                  "hover:border-foreground/40 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40",
                  "data-[state=checked]:border-foreground data-[state=checked]:bg-muted/50 data-[state=checked]:outline-1 data-[state=checked]:outline-foreground",
                )}
              >
                {/* The space inside the tile is a container: the amount is sized from it, whatever the card or the screen. */}
                <span className="@container grid w-full place-items-center">
                  <span style={{ fontSize: amountSize }} className="leading-none font-medium tracking-[-0.045em] whitespace-nowrap tabular-nums">
                    {money(value)}
                  </span>
                </span>
                {value === suggested ? <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 text-[0.6875rem]">{labels.suggested}</Badge> : null}
                {/* In the bottom corner, so the check never meets the tag on top of the tile, however narrow the tile is. */}
                <RadioGroupPrimitive.Indicator aria-hidden="true" className="absolute right-2 bottom-2 grid size-4 place-items-center rounded-full bg-foreground text-background">
                  <IconCheck size={10} strokeWidth={3} />
                </RadioGroupPrimitive.Indicator>
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>

          {/* What the chosen amount does. Said politely when it changes, so the choice is answered where the reader is looking. */}
          <p aria-live="polite" className="-mt-2 min-h-5 text-sm leading-snug text-pretty text-muted-foreground tabular-nums">
            {line && amount !== null ? <>{text(labels.impact, { amount: money(amount), text: line.text })}</> : null}
          </p>

          <FormField described={!problem} error={problem} className="content-start">
            <FormLabel>{labels.custom}</FormLabel>
            <FormControl>
              <CurrencyInput
                ref={customRef}
                value={preset ? null : typed}
                onValueChange={type}
                onBlur={() => setTouched(true)}
                currency={currency}
                locale={locale}
                className="has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:focus-within:ring-destructive/30"
              />
            </FormControl>
            {problem ? null : <FormDescription className="tabular-nums">{text(labels.minimum, { min: money(min) })}</FormDescription>}
          </FormField>

          {monthly ? (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="min-w-0">
                <label htmlFor={`${id}-monthly`} className="block text-sm leading-snug font-medium">
                  {labels.monthly}
                </label>
                <p id={`${id}-monthly-hint`} className="mt-1 text-xs leading-snug text-muted-foreground">
                  {labels.monthlyHint}
                </p>
              </div>
              <Switch id={`${id}-monthly`} checked={recurring} onCheckedChange={setRecurring} aria-describedby={`${id}-monthly-hint`} className="mt-0.5" />
            </div>
          ) : null}

          {status === "error" ? (
            <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {labels.failed}
            </p>
          ) : null}

          <Button ref={payRef} type="submit" size="lg" loading={status === "busy"} className="w-full tabular-nums">
            {label}
          </Button>
        </form>
      )}
    </section>
  );
}
