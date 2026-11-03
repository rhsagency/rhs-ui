"use client";

import { useId, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconAlertCircle, IconHeart, IconUsers } from "@rhs-ui/icons";
import { countText, fill, LABELS, moneyText, percentText, plural, type DonationHeroLabels } from "@rhs-ui/marketing/donation-hero/format";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { CurrencyInput } from "@rhs-ui/primitives/currency-input";
import { Label } from "@rhs-ui/primitives/label";
import { Meter } from "@rhs-ui/primitives/meter";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type { DonationHeroLabels } from "@rhs-ui/marketing/donation-hero/format";

/** How often the gift is made. */
export type DonationFrequency = "one-off" | "monthly";

/** What the visitor chose, handed to you when they press Give. Payment is yours. */
export interface DonationGift {
  /** The gift in minor units, hundredths of the currency's unit: 2500 is 25.00. */
  amount: number;
  frequency: DonationFrequency;
  /** The ISO 4217 code of the currency the amount is in. */
  currency: string;
}

export interface DonationCampaign {
  /** What has been raised so far, in minor units. */
  raised: number;
  /** What the campaign hopes to raise, in minor units. */
  goal: number;
  /** How many people have given. */
  donors: number;
  /** The name over the bar, kept short so it fits beside the figures on a phone: "Winter appeal". Default "Raised so far". */
  label?: string;
}

export interface DonationImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What it shows. Leave it empty when the picture only decorates, which is the usual case: the amount and what it pays for are written over it. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface DonationHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** A small line over the title: the campaign or the season. */
  eyebrow?: string;
  /** The ask, in a line: "Warm meals for every winter night". */
  title: string;
  /** One or two sentences under the title on who is helped and how. */
  description?: string;
  /** The suggested amounts, in minor units, in the order they are shown. Four is the design. */
  amounts?: readonly number[];
  /** The amount chosen at the start, in minor units. One that is not among `amounts` opens in the own-amount field; null starts with nothing chosen. Default: the second of `amounts`. */
  defaultAmount?: number | null;
  /** Default "one-off". */
  defaultFrequency?: DonationFrequency;
  /** The lowest amount allowed in the own-amount field, in minor units. Anything lower is explained in words and cannot be given. Without it only amounts above zero are allowed. */
  minimum?: number;
  /** The ISO 4217 code of the currency. Default "EUR". */
  currency?: string;
  /** The language of the amounts and the decimal sign. Default "en-US". */
  locale?: string;
  /** What a gift pays for, as the end of a sentence: "pays for a week of meals". It is written over the picture under the amount and changes with every choice; return null for an amount you have nothing to say about. The frequency is passed too, so a monthly gift can say "every month". It must be a pure function of its arguments. Leave it out for a picture with no sentence. A function cannot be passed from a Server Component: use the hero inside a Client Component. */
  impactFor?: (amount: number, frequency: DonationFrequency) => string | null | undefined;
  /** The campaign meter: a bar and its numbers in words. Leave it out when there is no goal to show. */
  campaign?: DonationCampaign;
  /** The picture of the cause, on the left of the card. */
  image: DonationImage;
  /** A line under the button: how the money is handled, whether it is tax-deductible. */
  note?: ReactNode;
  /** Called when the visitor presses Give with a valid amount. Payment is yours: this only hands you the choice. If it returns a promise, the button shows it is busy until the promise settles; handle errors inside it. */
  onDonate: (gift: DonationGift) => void | Promise<void>;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DonationHeroLabels>;
}

type Choice = { kind: "preset"; amount: number | null } | { kind: "custom"; amount: number | null };

/** Written out whole: Tailwind only generates the classes it can read in the source. */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-3",
  6: "grid-cols-3",
};
const MANY_COLUMNS = "grid-cols-3 sm:grid-cols-4";

/**
 * A nonprofit's opening with the gift on the first screen: a short centred
 * headline over one wide card. The left half is a picture of the cause with
 * the amount and what it pays for written over it, changing as the visitor
 * chooses. The right half is the form: a campaign meter whose figures are in
 * words as well as a bar, a one-off or monthly choice, four amounts in a
 * toggle group, a field for any other amount, a live summary ("You give
 * $25 every month") and a Give button that always says the amount and how
 * often. An own amount under the minimum is explained in words and cannot be
 * given. Payment is not in here: the hero hands your app the choice.
 */
export function DonationHero({
  titleAs: Title = "h2",
  eyebrow,
  title,
  description,
  amounts = [1000, 2500, 5000, 10000],
  defaultAmount,
  defaultFrequency = "one-off",
  minimum,
  currency = "EUR",
  locale = "en-US",
  impactFor,
  campaign,
  image,
  note,
  onDonate,
  labels,
  className,
  ...props
}: DonationHeroProps) {
  const words = { ...LABELS, ...labels, donors: { ...LABELS.donors, ...labels?.donors } };
  const id = useId();
  // Anything below this cannot be given: the minimum, or one minor unit when there is none.
  const floor = Math.max(minimum ?? 1, 1);
  const start = defaultAmount === undefined ? (amounts[1] ?? amounts[0] ?? null) : defaultAmount;
  const [frequency, setFrequency] = useState<DonationFrequency>(defaultFrequency);
  const [choice, setChoice] = useState<Choice>(() => (start === null || amounts.includes(start) ? { kind: "preset", amount: start } : { kind: "custom", amount: start }));
  // Whether the "too low" message is showing. It waits for the field to be left, so typing "2" on the way to "25" is never told off.
  const [flagged, setFlagged] = useState(() => start !== null && !amounts.includes(start) && start < floor);
  const [busy, setBusy] = useState(false);

  const amount = choice.amount;
  const valid = amount !== null && amount >= floor;
  const tooLow = choice.kind === "custom" && amount !== null && amount < floor;
  const message = tooLow && flagged ? (minimum !== undefined && amount < minimum ? fill(words.minimum, { minimum: moneyText(floor, currency, locale) }) : words.positive) : null;
  const money = (minor: number) => moneyText(minor, currency, locale);
  const monthly = frequency === "monthly";
  const impact = valid && impactFor ? impactFor(amount, frequency) : null;
  const count = amounts.length;

  const summary = valid ? fill(monthly ? words.summaryMonthly : words.summaryOneOff, { amount: money(amount) }) : words.summaryEmpty;
  const give = valid ? fill(monthly ? words.giveMonthly : words.giveOneOff, { amount: money(amount) }) : words.giveEmpty;

  function typeAmount(next: number | null) {
    setChoice({ kind: "custom", amount: next });
    // A message that is showing follows the typing and goes once the amount is enough.
    if (next !== null && next >= floor) setFlagged(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || busy) return;
    const result: unknown = onDonate({ amount, frequency, currency });
    if (result instanceof Promise) {
      setBusy(true);
      result.then(
        () => setBusy(false),
        () => setBusy(false),
      );
    }
  }

  const share = campaign && campaign.goal > 0 ? (campaign.raised >= campaign.goal ? 1 : Math.min(99, Math.floor((campaign.raised * 100) / campaign.goal)) / 100) : 0;

  return (
    <section data-slot="donation-hero" aria-labelledby={`${id}-title`} className={cn("py-14 sm:py-20", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
        <Title id={`${id}-title`} className={cn("text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl", eyebrow && "mt-3")}>
          {title}
        </Title>
        {description ? <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
      </header>

      <div data-slot="donation-hero-card" className="mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm sm:mt-12 lg:grid-cols-2">
        {/* Tall on a phone, so the words over the picture leave most of it showing; stretched to the form's height from lg. */}
        <div data-slot="donation-hero-visual" className="relative aspect-[5/6] min-w-0 bg-muted sm:aspect-[16/10] lg:aspect-auto">
          {image.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${image.blurDataUrl}")` }} /> : null}
          {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI */}
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            srcSet={image.srcSet}
            sizes={image.sizes ?? "(min-width: 1024px) 32rem, 100vw"}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background p-4 text-foreground shadow-sm sm:inset-x-6 sm:bottom-6 sm:p-5">
            <div key={`${frequency}-${valid ? amount : "none"}`} className="motion-safe:animate-rhs-donation-in">
              {valid ? (
                <>
                  <p className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    {words.yourGift}
                    <Badge variant="secondary">{monthly ? words.monthly : words.oneOff}</Badge>
                  </p>
                  <p className="mt-1.5 text-3xl leading-none font-medium tracking-[-0.04em] tabular-nums sm:text-4xl">{money(amount)}</p>
                  {impact ? <p className="mt-2 text-[0.9375rem] leading-snug text-pretty sm:text-base">{impact}</p> : null}
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">{words.impactEmpty}</p>
              )}
            </div>
          </div>
        </div>

        <form aria-label={words.form} noValidate onSubmit={submit} className="flex min-w-0 flex-col gap-6 p-6 sm:p-8 lg:p-10">
          {campaign ? (
            // On the narrowest phones the box is tighter and each figure drops to its own line, instead of the words of one being split across two.
            <div data-slot="donation-hero-campaign" className="rounded-xl bg-muted/60 p-4 max-[22rem]:p-3">
              <Meter
                label={campaign.label ?? words.campaign}
                value={Math.min(campaign.raised, campaign.goal)}
                max={campaign.goal}
                valueText={fill(words.raised, { raised: money(campaign.raised), goal: money(campaign.goal) })}
                className="[&>div:first-child]:flex-wrap [&>div:first-child]:gap-y-0.5"
              />
              <p className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1.5">
                  <IconUsers className="size-4 shrink-0" />
                  {fill(plural(words.donors, campaign.donors, locale), { count: countText(campaign.donors, locale) })}
                </span>
                <span>{fill(words.percentOfGoal, { percent: percentText(share, locale) })}</span>
              </p>
            </div>
          ) : null}

          <SegmentedControl
            label={words.frequency}
            value={frequency}
            onValueChange={(next) => setFrequency(next as DonationFrequency)}
            options={[
              { value: "one-off", label: words.oneOff },
              { value: "monthly", label: words.monthly },
            ]}
            className="w-full [&>button]:flex-1 [&>button]:py-2.5"
          />

          {count ? (
            <div>
              <p id={`${id}-amount`} className="text-sm font-medium">
                {words.chooseAmount}
              </p>
              <ToggleGroup
                type="single"
                variant="outline"
                aria-labelledby={`${id}-amount`}
                value={choice.kind === "preset" && choice.amount !== null ? String(choice.amount) : ""}
                onValueChange={(next) => {
                  // A pressed chip cannot be pressed off: choosing is not a switch.
                  if (!next) return;
                  setChoice({ kind: "preset", amount: Number(next) });
                  setFlagged(false);
                }}
                className={cn("mt-2.5 grid w-full gap-2 data-[variant=outline]:shadow-none", COLUMNS[count] ?? MANY_COLUMNS)}
              >
                {amounts.map((preset) => (
                  <ToggleGroupItem key={preset} value={String(preset)} className="h-12 rounded-lg border-l text-base tabular-nums first:rounded-lg last:rounded-lg">
                    {money(preset)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : null}

          <div>
            <Label htmlFor={`${id}-other`}>{words.otherAmount}</Label>
            <CurrencyInput
              id={`${id}-other`}
              value={choice.kind === "custom" ? choice.amount : null}
              onValueChange={typeAmount}
              onBlur={() => setFlagged(tooLow)}
              onKeyDown={(event) => {
                // Enter submits the form, but the Give button is disabled while the amount is too low and the press would do nothing: say why now instead of waiting for the field to be left.
                if (event.key === "Enter" && tooLow) setFlagged(true);
              }}
              currency={currency}
              locale={locale}
              aria-invalid={message ? true : undefined}
              aria-describedby={message ? `${id}-error` : undefined}
              className={cn(
                "mt-2.5 h-12 rounded-lg px-4 text-base has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/25",
                choice.kind === "custom" && valid && "border-foreground",
              )}
            />
            {message ? (
              <p id={`${id}-error`} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
                <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
                {message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 lg:mt-auto">
            <p role="status" className="text-base font-medium tracking-[-0.01em] text-pretty tabular-nums">
              {summary}
            </p>
            <Button type="submit" size="lg" loading={busy} disabled={!valid} className="h-12 w-full text-base">
              {busy ? null : <IconHeart />}
              {give}
            </Button>
            {note ? <p className="text-center text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
          </div>
        </form>
      </div>
    </section>
  );
}
