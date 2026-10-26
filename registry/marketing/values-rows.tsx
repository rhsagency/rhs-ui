import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowRight, IconCheck, IconClose } from "@rhs-ui/icons";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface CompanyValue {
  /** The value in a word or a short phrase: "Own the outcome". It is set large, so keep it short. */
  name: string;
  /** What it means, in one sentence. */
  meaning: string;
  /** One behaviour that fits the value and that someone could check in a day at work. */
  does: ReactNode;
  /** One behaviour that breaks it, just as checkable. */
  doesNot: ReactNode;
  /** Links the row to a page that says more, such as how you hire for it. */
  href?: string;
}

export interface ValuesRowsLabels {
  /** The label above what the value looks like in practice. */
  does: string;
  /** The label above what it rules out. */
  doesNot: string;
  /** The text of a row's link. The value's name follows it in the link's accessible name. */
  more: string;
}

export interface ValuesRowsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** A small line above the title: "How we work". */
  eyebrow?: string;
  /** The section's title: "Four things we hold ourselves to". */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The values, in the order they appear. Three to six work best: more than that is a list nobody remembers. */
  values: readonly CompanyValue[];
  /** The level of the title: 2 by default. The value names sit one level below it. */
  headingLevel?: 2 | 3;
  /** Renders the row links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ValuesRowsLabels>;
}

const LABELS: ValuesRowsLabels = { does: "We do", doesNot: "We do not", more: "Read more" };

const LINK =
  "group/link inline-flex items-center gap-2 rounded-sm text-sm font-medium underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** A link you can tell from the words around it, and bold, for the markup a caller puts in `does` and `doesNot`. Written out whole, because Tailwind only generates the classes it can read in the source. */
const INLINE_LINK =
  "[&_a]:rounded-sm [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a]:transition-colors [&_a]:duration-150 [&_a]:motion-reduce:transition-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40 [&_strong]:font-semibold";

/**
 * The type steps down with the section's heading level, so a value's name never outshouts the title above it
 * and a section one level lower reads as a smaller one. Written out whole, because Tailwind only generates the
 * classes it can read in the source.
 */
const SIZES = {
  2: { name: "text-2xl @lg:text-3xl", index: "@4xl:pt-2", meaning: "text-lg @2xl:text-xl" },
  3: { name: "text-xl @lg:text-2xl", index: "@4xl:pt-1.5", meaning: "text-base @2xl:text-lg" },
} as const;

/**
 * Company values as rows on a hairline grid: an index, the value's name set
 * large, and beside it a one-sentence meaning above two short columns, We do
 * and We do not, each holding a single behaviour that someone could check in
 * a day at work. The pairs are what separate real values from posters, so the
 * component asks for them instead of accepting a bare list. Each column has
 * its own icon and its own words, so neither depends on colour. Rows stack on
 * a phone with the name first. Three to six values work best.
 */
export function ValuesRows({ eyebrow, title, description, values, headingLevel = 2, linkAs: Link = "a", labels: custom, className, ...props }: ValuesRowsProps) {
  const labels = { ...LABELS, ...custom };
  const Name = `h${headingLevel + 1}` as "h3" | "h4";
  const size = SIZES[headingLevel];
  return (
    <section data-slot="values-rows" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 2 ? "h2" : "h3"} />
      <ol role="list" className="mt-12 border-t border-foreground @2xl:mt-16">
        {values.map((value, index) => (
          <li
            key={value.name}
            // The layout follows the width of the section, not the screen: one column, then name beside its meaning, then index, name and meaning in three columns with the pair side by side.
            className="grid grid-cols-1 gap-x-10 gap-y-6 border-b border-border py-9 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] @2xl:py-12 @4xl:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.6fr)] @4xl:gap-x-12"
          >
            <p aria-hidden="true" className={cn("text-sm leading-none tabular-nums text-muted-foreground @2xl:col-start-1 @2xl:row-start-1", size.index)}>
              {String(index + 1).padStart(2, "0")}
            </p>
            <Name className={cn("-mt-2 leading-[1.05] font-medium tracking-[-0.04em] text-balance @2xl:col-start-1 @2xl:row-start-2 @4xl:col-start-2 @4xl:row-start-1 @4xl:mt-0", size.name)}>{value.name}</Name>
            <div className="min-w-0 @2xl:col-start-2 @2xl:row-span-3 @2xl:row-start-1 @4xl:col-start-3 @4xl:row-span-1">
              <p className={cn("max-w-xl leading-[1.45] text-pretty @2xl:leading-[1.4]", size.meaning)}>{value.meaning}</p>
              <div className="mt-7 grid gap-y-6 border-t border-border pt-7 @4xl:grid-cols-2 @4xl:gap-y-0 @4xl:divide-x @4xl:divide-border">
                <div className="@4xl:pr-8">
                  <p className="flex items-center gap-2.5 text-xs font-medium tracking-[0.14em] uppercase">
                    <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background forced-colors:border">
                      <IconCheck size={12} strokeWidth={2.5} />
                    </span>
                    {labels.does}
                  </p>
                  <p className={cn("mt-3 text-[0.9375rem] leading-relaxed text-pretty", INLINE_LINK)}>{value.does}</p>
                </div>
                <div className="@4xl:pl-8">
                  <p className="flex items-center gap-2.5 text-xs font-medium tracking-[0.14em] uppercase">
                    <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border border-foreground text-foreground">
                      <IconClose size={11} strokeWidth={2.5} />
                    </span>
                    {labels.doesNot}
                  </p>
                  <p className={cn("mt-3 text-[0.9375rem] leading-relaxed text-pretty", INLINE_LINK)}>{value.doesNot}</p>
                </div>
              </div>
              {value.href ? (
                <Link href={value.href} aria-label={`${labels.more}: ${value.name}`} className={cn(LINK, "mt-7")}>
                  {labels.more}
                  <IconArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
