"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUp, IconCart, IconCheck, IconRuler, IconSpinner } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { estimatePacks, parseDecimal, rectangleArea, type AreaUnit } from "@rhs-ui/commerce/quantity-calculator/calculate";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export type { AreaUnit, PackEstimate } from "@rhs-ui/commerce/quantity-calculator/calculate";

export interface QuantityCalculatorLabels {
  /** The heading. `{packs}` is the plural name of a pack. */
  title?: string;
  /** Under the heading when there is no price. `{pack}`, `{coverage}`. */
  coverage?: string;
  /** Under the heading when there is a price. `{pack}`, `{coverage}`, `{price}`. */
  coveragePrice?: string;
  /** The name of the switch between the two ways of measuring. */
  measureBy?: string;
  byArea?: string;
  bySize?: string;
  area?: string;
  length?: string;
  width?: string;
  /** Under the length and width, once both are known. `{area}`. */
  sizeArea?: string;
  /** Under the length and width before that. */
  sizeHint?: string;
  waste?: string;
  /** Under the waste margin. */
  wasteHint?: string;
  youNeed?: string;
  total?: string;
  /** The result before an area is entered. `{packs}`. */
  empty?: string;
  /** The same, in length times width. `{packs}`. */
  emptySize?: string;
  /** The result when the area is fine and the waste margin is not. `{packs}`. */
  fixWaste?: string;
  /** The bar under the answer: the three parts of what the packs cover. */
  barArea?: string;
  barWaste?: string;
  /** What rounding up to whole packs adds on top of the area and the margin. */
  barExtra?: string;
  /** What the packs cover. `{covered}` and `{spare}`. */
  covers?: string;
  /** The rounding, said out loud. `{exact}`, `{packs}` and `{needed}`. */
  roundedUp?: string;
  /** The same, when the waste margin is 0%. */
  roundedUpNoWaste?: string;
  /** When the need is a whole number of packs. `{count}` and `{packs}`. */
  exact?: string;
  /** The unit price line. `{count}` and `{price}`. */
  each?: string;
  /** The button. `{count}` and `{pack}`, which agrees with the count. */
  add?: string;
  /** The button before there is anything to add. */
  addIdle?: string;
  /** The button once the packs are in the cart. */
  added?: string;
  /** Shown when `onAddToCart` fails. */
  addFailed?: string;
  /** What a screen reader hears once the packs are in the cart. `{count}`, `{pack}`. */
  addedStatus?: string;
  /** What a screen reader hears after the numbers change. `{count}`, `{pack}`, `{covered}`, `{spare}`. */
  status?: string;
  /** Added to the status when there is a price. `{total}`. */
  statusTotal?: string;
  /** A field that is not a number. `{example}`. */
  notNumber?: string;
  notPositive?: string;
  /** A field above the limit. `{max}`. */
  tooLarge?: string;
  /** A waste margin outside the range. `{max}`. */
  wasteRange?: string;
  /** The units, as a screen reader says them. */
  squareMetres?: string;
  squareFeet?: string;
  metres?: string;
  feet?: string;
}

const WORDS = {
  title: "How many {packs} do I need?",
  coverage: "Each {pack} covers {coverage}.",
  coveragePrice: "Each {pack} covers {coverage} and costs {price}.",
  measureBy: "Measure by",
  byArea: "Area",
  bySize: "Length × width",
  area: "Area to cover",
  length: "Length",
  width: "Width",
  sizeArea: "Area: {area}",
  sizeHint: "Measure the space at its longest and widest.",
  waste: "Waste margin",
  wasteHint: "Allows for cuts and breakage. 10% suits most rooms, 15% diagonal layouts.",
  youNeed: "You need",
  total: "Total",
  empty: "Enter the area to cover, and we will work out how many {packs} you need.",
  emptySize: "Enter the length and the width, and we will work out how many {packs} you need.",
  fixWaste: "Fix the waste margin to see how many {packs} you need.",
  barArea: "Your area",
  barWaste: "Waste margin",
  barExtra: "From whole packs",
  covers: "Covers {covered}, with {spare} to spare.",
  roundedUp: "Rounded up from {exact} {packs}: {needed} needed, waste included.",
  roundedUpNoWaste: "Rounded up from {exact} {packs}: {needed} needed.",
  exact: "Exactly {count} {packs}: nothing to round up.",
  each: "{count} × {price}",
  add: "Add {count} {pack} to cart",
  addIdle: "Add to cart",
  added: "Added to cart",
  addFailed: "We could not add this to your cart. Try again.",
  addedStatus: "Added {count} {pack} to your cart.",
  status: "You need {count} {pack}, covering {covered}, {spare} spare.",
  statusTotal: "Total {total}.",
  notNumber: "Enter a number, like {example}.",
  notPositive: "Enter a number greater than 0.",
  tooLarge: "That is more than {max}. Enter a smaller number.",
  wasteRange: "Enter a margin from 0% to {max}%.",
  squareMetres: "square metres",
  squareFeet: "square feet",
  metres: "metres",
  feet: "feet",
} satisfies Required<QuantityCalculatorLabels>;

export interface QuantityCalculatorProps extends Omit<ComponentProps<"div">, "children" | "title" | "defaultValue"> {
  /** How much one pack covers, in `unit`: 1.44 for a pack of four 60 × 60 cm tiles. */
  coveragePerPack: number;
  /** The unit the coverage and every result is in: square metres or square feet. Defaults to "m2". */
  unit?: AreaUnit;
  /** The price of one pack, in minor units: 3890 is 38.90. Leave it out to show no prices. */
  packPrice?: number;
  /** The waste margin to start with, in percent: what cuts and breakage cost. Defaults to 10. A shopper who clears the field gets this margin, which the placeholder shows. */
  wastePercent?: number;
  /** Called with the number of packs when the add button is pressed. Return a promise and the button shows it is working; reject and the shopper is told. Without it there is no add button. */
  onAddToCart?: (quantity: number) => void | Promise<void>;
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same numbers, and so "7,5" and "7.5" are read the way the shopper means them. */
  locale?: string;
  /** The area to start with, in `unit`. */
  defaultArea?: number;
  /** A length and a width to start with, in the unit's length (m or ft). The calculator then opens on "Length × width". */
  defaultSize?: { length: number; width: number };
  /** The largest area, or side, that is believable, in `unit` (and its length). A larger number is refused with a message. Defaults to 10000. */
  maxArea?: number;
  /** What a pack is called: `{ one: "box", other: "boxes" }`. Defaults to pack and packs. */
  packLabel?: { one: string; other: string };
  /** Replaces the heading, which is "How many packs do I need?". */
  title?: string;
  /** Replaces the line under the heading, which says what one pack covers and costs. */
  description?: ReactNode;
  /** The words, for another language. */
  labels?: QuantityCalculatorLabels;
}

type Problem = "format" | "positive" | "large" | "range";

const UNITS = {
  m2: { area: "m²", side: "m" },
  ft2: { area: "ft²", side: "ft" },
} as const;

const MAX_WASTE = 50;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Says a sentence once things settle, so typing a number reads out the answer, not every digit on the way. The first render says nothing. */
function useCalmStatus(text: string, delay = 600): string {
  const [said, setSaid] = useState("");
  const spoken = useRef(text);
  useEffect(() => {
    if (spoken.current === text) return;
    spoken.current = text;
    const timeout = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timeout);
  }, [text, delay]);
  return said;
}

/** What a field holds: nothing yet, a number, or a reason it is not one. A thousandth is the smallest area there is. */
function read(text: string, locale: string, limit: number): { value: number | null; problem: Problem | null } {
  const value = parseDecimal(text, locale);
  if (value === null) return { value: null, problem: text.trim() ? "format" : null };
  if (Math.round(value * 1000) <= 0) return { value: null, problem: "positive" };
  if (value > limit) return { value: null, problem: "large" };
  return { value, problem: null };
}

interface FieldProps {
  label: ReactNode;
  suffix: string;
  value: string;
  placeholder: string;
  error: string | null;
  hint?: ReactNode;
  /** A short field with its hint beside it, for a number that is only a few digits. */
  compact?: boolean;
  onValueChange: (text: string) => void;
  onBlur: () => void;
}

/** A number with its unit after it: a label, the field, a hint and the plain message when it is wrong. */
function Field({ label, suffix, value, placeholder, error, hint, compact = false, onValueChange, onBlur }: FieldProps) {
  const field = (
    <InputGroup className={compact ? "w-28 shrink-0" : undefined}>
      <FormControl>
        <InputGroupInput inputMode="decimal" autoComplete="off" spellCheck={false} placeholder={placeholder} value={value} onChange={(event) => onValueChange(event.target.value)} onBlur={onBlur} className="tabular-nums" />
      </FormControl>
      <InputGroupAddon>{suffix}</InputGroupAddon>
    </InputGroup>
  );
  const note = hint ? <FormDescription className={compact ? "min-w-0 flex-1 basis-44" : undefined}>{hint}</FormDescription> : null;
  return (
    <FormField error={error} described={Boolean(hint)}>
      <FormLabel>{label}</FormLabel>
      {compact ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {field}
          {note}
        </div>
      ) : (
        <>
          {field}
          {note}
        </>
      )}
    </FormField>
  );
}

/**
 * How many packs of tiles, paint, flooring or insulation a job needs. The shopper enters an area (or a length and
 * a width) and a waste margin; the calculator divides by what one pack covers and always rounds up, then says
 * so: "You need 7 packs, covering 8.4 m², 0.9 m² spare". The numbers are counted in whole thousandths, so the
 * answer never depends on floating point, and typing "7,5" or "7.5" means the same. Every field has a plain
 * message for what is wrong with it, the result is a polite status that waits for the shopper to finish
 * typing, and the add button hands the computed quantity to your cart.
 */
export function QuantityCalculator({
  coveragePerPack,
  unit = "m2",
  packPrice,
  wastePercent = 10,
  onAddToCart,
  currency = "EUR",
  locale = "en-US",
  defaultArea,
  defaultSize,
  maxArea = 10_000,
  packLabel = { one: "pack", other: "packs" },
  title,
  description,
  labels,
  className,
  ...props
}: QuantityCalculatorProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const symbols = UNITS[unit];
  const plain = (value: number, digits = 2): string => new Intl.NumberFormat(locale, { maximumFractionDigits: digits, useGrouping: false }).format(value);
  const number = (value: number, digits = 2): string => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  // A figure never splits from its unit at the end of a line: a no-break space joins them.
  const areaText = (value: number): string => `${number(value)}\u00a0${symbols.area}`;
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const nounFor = (count: number): string => (count === 1 ? packLabel.one : packLabel.other);

  const [mode, setMode] = useState<"area" | "size">(defaultSize ? "size" : "area");
  const [area, setArea] = useState(defaultArea === undefined ? "" : plain(defaultArea, 3));
  const [length, setLength] = useState(defaultSize ? plain(defaultSize.length, 3) : "");
  const [width, setWidth] = useState(defaultSize ? plain(defaultSize.width, 3) : "");
  const [waste, setWaste] = useState(plain(wastePercent));
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [outcome, setOutcome] = useState<{ packs: number; kind: "added" | "failed" } | null>(null);
  const [adding, setAdding] = useState(false);
  const touch = (field: string) => setTouched((current) => new Set(current).add(field));

  const areaField = read(area, locale, maxArea);
  const lengthField = read(length, locale, maxArea);
  const widthField = read(width, locale, maxArea);
  const rectangle = lengthField.value !== null && widthField.value !== null ? rectangleArea(lengthField.value, widthField.value) : null;
  const rectangleProblem: Problem | null = rectangle === null ? null : rectangle <= 0 ? "positive" : rectangle > maxArea ? "large" : null;

  const wasteValue = parseDecimal(waste, locale);
  const wasteProblem: Problem | null = !waste.trim() ? null : wasteValue === null ? "format" : wasteValue < 0 || wasteValue > MAX_WASTE ? "range" : null;
  // A blank margin is the margin the calculator starts at, which is what the field's placeholder says.
  const wasteUsed = !waste.trim() ? wastePercent : wasteValue;

  const wanted = mode === "area" ? areaField.value : rectangle !== null && rectangleProblem === null ? rectangle : null;
  const estimate = wanted !== null && wasteUsed !== null && wasteProblem === null && coveragePerPack > 0 ? estimatePacks(wanted, wasteUsed, coveragePerPack) : null;
  // The area is fine and the margin is not: the result says so, instead of asking for an area that is already there.
  const wasteBlocks = wanted !== null && wasteProblem !== null;

  const message = (problem: Problem | null, field: string, limit?: string): string | null => {
    if (!problem || !touched.has(field)) return null;
    if (problem === "format") return fill(words.notNumber, { example: number(12.5, 1) });
    if (problem === "positive") return words.notPositive;
    if (problem === "range") return fill(words.wasteRange, { max: String(MAX_WASTE) });
    return fill(words.tooLarge, { max: limit ?? "" });
  };
  const areaLimit = areaText(maxArea);
  const sideLimit = `${number(maxArea)}\u00a0${symbols.side}`;

  const packs = estimate?.packs ?? 0;
  /** The three parts of what the packs cover; a part with nothing in it is left out. */
  const parts =
    estimate && wanted !== null
      ? [
          { key: "area", label: words.barArea, value: wanted, swatch: "bg-foreground" },
          { key: "waste", label: words.barWaste, value: Math.max(0, estimate.needed - wanted), swatch: "bg-foreground/45" },
          { key: "extra", label: words.barExtra, value: Math.max(0, estimate.covered - estimate.needed), swatch: "bg-foreground/15" },
        ].filter((part) => part.value > 0.0005)
      : [];
  /** The packs before rounding, with enough decimals that 6.996 never reads as "7". */
  const exactText = (exactPacks: number, whole: number): string => {
    for (const digits of [2, 3, 4]) {
      const text = number(exactPacks, digits);
      if (text !== number(whole)) return text;
    }
    return number(exactPacks, 6);
  };
  const shown = outcome && outcome.packs === packs ? outcome : null;
  const added = shown?.kind === "added";
  const total = estimate && packPrice !== undefined ? packs * packPrice : null;
  const priceRow = packPrice !== undefined && estimate ? fill(words.each, { count: number(packs), price: money(packPrice) }) : null;
  const sentence = estimate
    ? [fill(words.status, { count: number(packs), pack: nounFor(packs), covered: areaText(estimate.covered), spare: areaText(estimate.spare) }), total !== null ? fill(words.statusTotal, { total: money(total) }) : null].filter(Boolean).join(" ")
    : "";
  const said = useCalmStatus(sentence);

  useEffect(() => {
    if (outcome?.kind !== "added") return;
    const timeout = window.setTimeout(() => setOutcome(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [outcome]);

  async function add() {
    // The button stays focusable while it works and after it has worked, so it ignores the press instead of being disabled.
    if (!estimate || adding || added || !onAddToCart) return;
    const quantity = estimate.packs;
    setAdding(true);
    setOutcome(null);
    try {
      await onAddToCart(quantity);
      setOutcome({ packs: quantity, kind: "added" });
    } catch {
      setOutcome({ packs: quantity, kind: "failed" });
    } finally {
      setAdding(false);
    }
  }

  if (!(coveragePerPack > 0)) return null;
  const units = { m2: words.squareMetres, ft2: words.squareFeet }[unit];
  const sides = unit === "m2" ? words.metres : words.feet;
  const example = number(12.5, 1);
  const subtitle =
    description ??
    (packPrice === undefined
      ? fill(words.coverage, { pack: packLabel.one, coverage: areaText(coveragePerPack) })
      : fill(words.coveragePrice, { pack: packLabel.one, coverage: areaText(coveragePerPack), price: money(packPrice) }));

  return (
    <div data-slot="quantity-calculator" data-state={estimate ? "result" : "empty"} role="group" aria-labelledby={`${id}-title`} className={cn("grid w-full grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <div className="grid gap-1">
        <h3 id={`${id}-title`} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
          {title ?? fill(words.title, { packs: packLabel.other })}
        </h3>
        <p className="text-sm text-muted-foreground tabular-nums">{subtitle}</p>
      </div>

      <SegmentedControl
        label={words.measureBy}
        value={mode}
        onValueChange={(next) => {
          const to = next === "size" ? "size" : "area";
          // The rectangle has already worked out the area: carry it over instead of making the shopper type it again.
          if (to === "area" && !area.trim() && rectangle !== null && rectangleProblem === null) setArea(plain(rectangle, 3));
          setMode(to);
        }}
        options={[
          { value: "area", label: words.byArea },
          { value: "size", label: words.bySize },
        ]}
        className="w-full [&>button]:flex-1"
      />

      {mode === "area" ? (
        <Field
          label={
            <>
              {words.area}
              <span className="sr-only"> ({units})</span>
            </>
          }
          suffix={symbols.area}
          value={area}
          placeholder={example}
          error={message(areaField.problem, "area", areaLimit)}
          onValueChange={setArea}
          onBlur={() => touch("area")}
        />
      ) : (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 items-start gap-3">
            <Field
              label={
                <>
                  {words.length}
                  <span className="sr-only"> ({sides})</span>
                </>
              }
              suffix={symbols.side}
              value={length}
              placeholder={example}
              error={message(lengthField.problem, "length", sideLimit)}
              onValueChange={setLength}
              onBlur={() => touch("length")}
            />
            <Field
              label={
                <>
                  {words.width}
                  <span className="sr-only"> ({sides})</span>
                </>
              }
              suffix={symbols.side}
              value={width}
              placeholder={example}
              error={message(widthField.problem, "width", sideLimit)}
              onValueChange={setWidth}
              onBlur={() => touch("width")}
            />
          </div>
          <p className={cn("text-xs tabular-nums", rectangleProblem ? "font-medium text-destructive" : "text-muted-foreground")}>
            {rectangle !== null && rectangleProblem === null
              ? fill(words.sizeArea, { area: areaText(rectangle) })
              : rectangleProblem
                ? fill(words.tooLarge, { max: areaLimit })
                : words.sizeHint}
          </p>
        </div>
      )}

      <Field
        label={words.waste}
        suffix="%"
        value={waste}
        placeholder={plain(wastePercent)}
        compact
        hint={words.wasteHint}
        error={message(wasteProblem, "waste")}
        onValueChange={setWaste}
        onBlur={() => touch("waste")}
      />

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        {/* The total drops under the count when the two do not fit side by side, so a longer pack name never runs into it. */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
          <div className="max-w-full shrink-0">
            <p className="text-sm text-muted-foreground">{words.youNeed}</p>
            <p className="mt-2 flex items-baseline gap-1.5 leading-none">
              <span className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">{estimate ? number(packs) : "–"}</span>
              <span className="text-base font-medium text-muted-foreground">{estimate ? nounFor(packs) : packLabel.other}</span>
            </p>
          </div>
          {packPrice !== undefined ? (
            <div className="ml-auto shrink-0 text-right">
              <p className="text-sm text-muted-foreground">{words.total}</p>
              <p className="mt-2 text-xl leading-none font-semibold tracking-[-0.02em] tabular-nums">
                {total !== null ? <AnimatedPrice value={total / 100} currency={currency} locale={locale} /> : "–"}
              </p>
              <p aria-hidden={priceRow ? undefined : true} className="mt-1.5 min-h-4 text-xs text-muted-foreground tabular-nums">
                {priceRow}
              </p>
            </div>
          ) : null}
        </div>
        {estimate && wanted !== null ? (
          <div className="mt-4">
            {/* What the packs cover, in three parts: the area itself, the margin set aside for cuts, and what rounding up to whole packs leaves. The words under it say the same, so the bar is only a picture. */}
            <div aria-hidden="true" className="flex h-2 gap-px overflow-hidden rounded-full bg-muted">
              {parts.map((part) => (
                <span key={part.key} className={cn("h-full min-w-px transition-[width] duration-300 motion-reduce:transition-none", part.swatch)} style={{ width: `${(part.value / estimate.covered) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
              {parts.map((part) => (
                <li key={part.key} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full ring-1 ring-foreground/10 ring-inset", part.swatch)} />
                  {part.label} <span className="font-medium text-foreground">{areaText(part.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-4 min-h-[5.25rem] border-t border-border pt-4 text-sm">
          {estimate ? (
            <ul className="grid gap-2.5 text-pretty">
              <li className="flex items-start gap-2.5">
                <IconRuler aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 tabular-nums">{fill(words.covers, { covered: areaText(estimate.covered), spare: areaText(estimate.spare) })}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <IconArrowUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 tabular-nums">
                  {estimate.exact
                    ? fill(words.exact, { count: number(packs), packs: packLabel.other })
                    : fill(wasteUsed === 0 ? words.roundedUpNoWaste : words.roundedUp, { exact: exactText(estimate.exactPacks, packs), packs: packLabel.other, needed: areaText(estimate.needed) })}
                </span>
              </li>
            </ul>
          ) : (
            <p className="text-muted-foreground">{fill(wasteBlocks ? words.fixWaste : mode === "area" ? words.empty : words.emptySize, { packs: packLabel.other })}</p>
          )}
        </div>
      </div>

      {onAddToCart ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {/* Never `disabled` while it works or once it has worked: a disabled button drops the keyboard's focus to the page. aria-disabled keeps it, and the handler ignores the press. The added state is drawn at full contrast. A long label wraps instead of running out of the card. */}
          <Button
            type="button"
            size="lg"
            variant={added ? "outline" : "default"}
            disabled={!estimate}
            aria-busy={adding || undefined}
            aria-disabled={adding || added || undefined}
            onClick={() => void add()}
            className={cn("h-auto min-h-11 w-full px-4 py-2 text-center text-balance whitespace-normal", (adding || added) && "pointer-events-none")}
          >
            {adding ? <IconSpinner /> : added ? <IconCheck /> : <IconCart />}
            {added ? words.added : estimate ? fill(words.add, { count: number(packs), pack: nounFor(packs) }) : words.addIdle}
          </Button>
          {shown?.kind === "failed" ? (
            <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {words.addFailed}
            </p>
          ) : null}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {said}
      </p>
      <p role="status" className="sr-only">
        {shown?.kind === "added" ? fill(words.addedStatus, { count: number(shown.packs), pack: nounFor(shown.packs) }) : ""}
      </p>
    </div>
  );
}
