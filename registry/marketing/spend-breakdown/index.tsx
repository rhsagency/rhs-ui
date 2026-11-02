import { useId, type ComponentProps, type CSSProperties, type ElementType } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { allocateSquares } from "@rhs-ui/marketing/spend-breakdown/allocate";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface SpendPart {
  /** A stable key for the part: "programmes". */
  id: string;
  /** What the money goes to, in a word or two: "Programmes". */
  label: string;
  /** The part's share of the whole, as a percentage: 82. The shares should add up to 100; if they do not they are read as weights and scaled, so the grid is always full. */
  share: number;
  /** One sentence on what this share pays for, in plain words. */
  description: string;
}

export interface SpendTotal {
  /** The whole, as a number: 4200000. Each square is a hundredth of it, and the legend shows the amount of every part. */
  amount: number;
  /** An ISO 4217 currency when the whole is money: "EUR". Without one the amount is written as a plain number (hours, tonnes, trips). */
  currency?: string;
  /** What the whole is, in words after the amount: "raised in 2025". */
  label?: string;
}

export interface SpendSource {
  /** Who says so: "Halcyon Relief annual report". */
  label: string;
  /** Where to check it. The label becomes a link. */
  href?: string;
  /** The year the figures are for: 2025. */
  year?: number | string;
}

export interface SpendBreakdownLabels {
  /** The heading of the first column of the legend. */
  share: string;
  /** The heading of the second column of the legend. */
  paysFor: string;
  /** The line under the squares. {total} stands for what the whole is, such as "€4.2 million raised in 2025". */
  square: string;
  /** Said in place of {total} when you give no total. */
  whole: string;
  /** Written before the source. */
  source: string;
}

const LABELS: SpendBreakdownLabels = {
  share: "Share",
  paysFor: "What it pays for",
  square: "Each square is 1% of {total}",
  whole: "the whole",
  source: "Source",
};

export interface SpendBreakdownProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Where every €100 you give goes". */
  title: string;
  /** One or two sentences under the heading: who spent what, and over which period. */
  description?: string;
  /** The whole that the squares stand for. Leave it out and the legend shows percentages only. */
  total?: SpendTotal;
  /** Up to six parts, largest first. Each gets a fill of its own, told apart by tone and by pattern. Group the rest as "Other": more fills could not be told apart in greyscale. */
  parts: readonly SpendPart[];
  /** Where the figures come from: an audited report, a filing, a dashboard. It is shown under the legend. */
  source?: SpendSource;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the source link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SpendBreakdownLabels>;
  /** Locale for the numbers. "en-US" by default. */
  locale?: string;
}

/**
 * The fills, told apart by tone and by pattern so that no part depends on colour: a solid, a hatch, dots, a cross
 * hatch, a mid tone with sparse lines the other way and vertical lines. The lines and dots are drawn with currentColor
 * on hard stops, the same ink in both themes, and every fill has an inset ring so even the lightest square keeps its
 * edge. None of them is an empty box: that is how a square with no part would look, so no part may look like it.
 */
const FILLS: readonly { className: string; style?: CSSProperties }[] = [
  { className: "bg-foreground" },
  { className: "text-foreground ring-1 ring-foreground/70 ring-inset", style: { backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 5px)" } },
  { className: "text-foreground ring-1 ring-foreground/45 ring-inset", style: { backgroundImage: "radial-gradient(circle, currentColor 1.3px, transparent 1.7px)", backgroundSize: "6px 6px", backgroundPosition: "center" } },
  {
    className: "text-foreground ring-1 ring-foreground/70 ring-inset",
    style: { backgroundImage: "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 5px), repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 5px)" },
  },
  { className: "bg-foreground/35 text-foreground ring-1 ring-foreground/60 ring-inset", style: { backgroundImage: "repeating-linear-gradient(45deg, currentColor 0 1.5px, transparent 1.5px 9px)" } },
  { className: "text-foreground ring-1 ring-foreground/70 ring-inset", style: { backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 1.5px, transparent 1.5px 4.5px)" } },
];

/** A square that belongs to no part, which only happens when no share has any weight: a faint empty box. */
const EMPTY: { className: string; style?: CSSProperties } = { className: "ring-1 ring-foreground/30 ring-inset" };

/**
 * Hovering a row of the legend keeps its squares at full strength and dims the rest. It needs no script: the section
 * is the group, a row says which part it is with data-legend, and a square keeps itself lit while that row is under
 * the pointer. Written out for six parts so Tailwind sees every class.
 */
const KEEP = [
  "group-has-[[data-legend=a]:hover]/spend:opacity-100!",
  "group-has-[[data-legend=b]:hover]/spend:opacity-100!",
  "group-has-[[data-legend=c]:hover]/spend:opacity-100!",
  "group-has-[[data-legend=d]:hover]/spend:opacity-100!",
  "group-has-[[data-legend=e]:hover]/spend:opacity-100!",
  "group-has-[[data-legend=f]:hover]/spend:opacity-100!",
];
const LEGEND_KEYS = ["a", "b", "c", "d", "e", "f"];

const LINK =
  "inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/**
 * Where the money goes, as one hundred squares: each square is one per cent,
 * filled in proportion to the parts, so "82 of every 100" is something you can
 * count rather than a slice to estimate. Beside the squares a legend table says,
 * for every part, its percentage (and its amount when you give the total), its
 * name and a sentence on what it pays for. The squares are decoration and hidden
 * from assistive technology; the table is the content. The squares are
 * allotted by the largest remainder method, so the grid is always exactly full
 * even when the shares are 33.4, 33.3 and 33.3, and each part has a tone and a
 * pattern of its own, so the chart still reads in greyscale and in print.
 * Hovering a row of the legend lights its squares. For charities, marketplaces,
 * payment providers and public bodies that owe their audience a plain answer to
 * "where does it go?".
 */
export function SpendBreakdown({ title, description, total, parts, source, headingLevel = 2, linkAs: Link = "a", labels: custom, locale = "en-US", className, ...props }: SpendBreakdownProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  // The shares as read: scaled to a hundred, so the percentages in the legend and the squares in the grid agree.
  const weight = parts.reduce((sum, part) => sum + (Number.isFinite(part.share) && part.share > 0 ? part.share : 0), 0);
  const percent = parts.map((part) => (weight > 0 && Number.isFinite(part.share) && part.share > 0 ? (part.share * 100) / weight : 0));
  const squares = allocateSquares(parts.map((part) => part.share));
  const cells = squares.flatMap((count, part) => Array.from({ length: count }, () => part));

  const percentFormat = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  // A whole in the thousands or more is written short (€4.2M, €462K); a small one, such as the €100 of a sale, is written out with its cents.
  // Both ends of the digits are pinned in every branch: left to the engine, the minimum comes from the currency and a compact
  // amount reads "€462.00K" in Node and "€462K" in Chromium, so the server and the browser would disagree and hydration would fail.
  // The unit words of a compact amount can still differ with the locale data a runtime ships (en-GB writes €4.2M in one engine and
  // €4.2m in another), so the text that carries a number is marked suppressHydrationWarning: the server's text stays, the tree is kept.
  const small = total !== undefined && Math.abs(total.amount) < 1000;
  const unit = total?.currency ? { style: "currency" as const, currency: total.currency } : {};
  const wholeFormat = new Intl.NumberFormat(locale, small ? { ...unit, minimumFractionDigits: 0, maximumFractionDigits: 2 } : { ...unit, notation: "compact" as const, minimumFractionDigits: 0, maximumFractionDigits: 1 });
  const partFormat = new Intl.NumberFormat(locale, small ? { ...unit, minimumFractionDigits: total?.currency ? 2 : 0, maximumFractionDigits: 2 } : { ...unit, notation: "compact" as const, minimumFractionDigits: 0, maximumFractionDigits: 2 });
  // "Kestrel Water Fund annual report, 2025": the whole citation is the link.
  const citation = source ? (source.year !== undefined ? `${source.label}, ${source.year}` : source.label) : "";
  const wholeText = total ? [wholeFormat.format(total.amount), total.label].filter(Boolean).join(" ") : labels.whole;

  return (
    <section data-slot="spend-breakdown" aria-labelledby={`${id}-title`} className={cn("group/spend @container w-full break-words", className)} {...props}>
      <header className="max-w-2xl">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>

      <div className="mt-10 grid gap-x-10 gap-y-10 @3xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] @3xl:items-start @4xl:mt-14 @4xl:gap-x-16">
        <figure className="w-full max-w-sm @3xl:max-w-none">
          {/* One hundred squares, filled row by row from the top left in the order of the parts. Decoration: the table beside it is the content. */}
          <div aria-hidden="true" className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, cell) => {
              const part = cells[cell];
              const fill = part === undefined ? EMPTY : FILLS[part % FILLS.length];
              return (
                <span
                  key={cell}
                  style={fill?.style}
                  className={cn("aspect-square rounded-[3px] transition-opacity duration-200 motion-reduce:transition-none group-has-[[data-legend]:hover]/spend:opacity-25", fill?.className, part !== undefined && part < KEEP.length && KEEP[part])}
                />
              );
            })}
          </div>
          <figcaption className="mt-4 flex items-center gap-2.5 text-sm text-muted-foreground">
            {/* The unit: one square of a grid, not an empty box that reads as a checkbox. */}
            <span aria-hidden="true" className="grid size-3.5 shrink-0 grid-cols-2 gap-0.5">
              <span className="rounded-[1.5px] bg-foreground" />
              <span className="rounded-[1.5px] bg-foreground/20" />
              <span className="rounded-[1.5px] bg-foreground/20" />
              <span className="rounded-[1.5px] bg-foreground/20" />
            </span>
            <span suppressHydrationWarning>{text(labels.square, { total: wholeText })}</span>
          </figcaption>
        </figure>

        <div className="min-w-0">
          <Table>
            <TableCaption className="sr-only">{title}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 px-2 text-xs font-medium tracking-[0.14em] uppercase @xs:w-28 @xs:px-3 @5xl:w-40">{labels.share}</TableHead>
                <TableHead className="px-2 text-xs font-medium tracking-[0.14em] uppercase @xs:px-3">{labels.paysFor}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part, index) => {
                const fill = FILLS[index % FILLS.length];
                const each = total ? partFormat.format((total.amount * (percent[index] ?? 0)) / 100) : null;
                return (
                  <TableRow key={part.id} data-legend={LEGEND_KEYS[index]}>
                    {/* The share is the row header: short, and it says which row a sentence belongs to. The label and the sentence are plain cell text, so a screen reader does not read the whole sentence as the name of the row. */}
                    <th scope="row" className="px-2 py-5 text-left align-top font-normal @xs:px-3">
                      <div className="flex items-start gap-2 @xs:gap-3">
                        <span aria-hidden="true" style={fill?.style} className={cn("mt-1.5 size-4 shrink-0 rounded-[3px] @xs:mt-2", fill?.className)} />
                        <div>
                          <p suppressHydrationWarning className="text-xl leading-7 font-medium tracking-[-0.03em] tabular-nums @xs:text-2xl @xs:leading-8">
                            {percentFormat.format((percent[index] ?? 0) / 100)}
                          </p>
                          {each ? (
                            <p suppressHydrationWarning className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                              {each}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </th>
                    <TableCell className="px-2 py-5 align-top @xs:px-3">
                      <span className="block text-base leading-7 font-medium tracking-[-0.01em] @xs:leading-8">{part.label}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-pretty text-muted-foreground">{part.description}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {source ? (
            <p className="mt-6 px-2 text-sm text-muted-foreground @xs:px-3">
              {labels.source}:{" "}
              {source.href ? (
                <Link href={source.href} className={LINK}>
                  <span>{citation}</span>
                  <IconArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              ) : (
                <span className="font-medium text-foreground">{citation}</span>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
