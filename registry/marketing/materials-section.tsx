import type { ComponentProps, ReactNode } from "react";

import { IconBadgeCheck, IconPin } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Progress } from "@rhs-ui/primitives/progress";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface Material {
  /** What it is: "Organic cotton". It keys the row, so every name must be unique. */
  name: string;
  /** Its share of the whole, in percent: 62. The shares of all the materials add up to 100; while you develop, a warning says so when they do not. */
  share: number;
  /** Where it comes from, as a plain place: "Aegean region, Türkiye". */
  origin: string;
  /** What backs it, in a few words: "GOTS organic". Leave it out for a material that nobody certifies. */
  certification?: string;
  /** The tone of the material as a CSS colour: "#e7dfd0". It is drawn as a plain block, with no texture. */
  swatch: string;
}

export interface MaterialsSectionLabels {
  /** The title of the list of materials. */
  composition: string;
  /** The title of the care list. */
  care: string;
  /** Read out before a share. */
  share: string;
  /** Read out before an origin. */
  origin: string;
  /** Read out before a certification. */
  certification: string;
}

export interface MaterialsSectionProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Materials". */
  eyebrow?: string;
  /** The heading: "Made slowly, from fibres we can name". */
  title: string;
  /** The story behind the materials, in a short paragraph or two. Plain text, or your own markup for several paragraphs. */
  story: ReactNode;
  /** The materials, largest share first. */
  materials: readonly Material[];
  /** How to look after it, as a short list: "Wash at 30 °C", "Line dry in the shade". */
  care?: readonly string[];
  /** The level of the heading: 2 by default. The titles of the two lists sit one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<MaterialsSectionLabels>;
  /** Locale for the shares. */
  locale?: string;
}

const LABELS: MaterialsSectionLabels = {
  composition: "Made of",
  care: "Care",
  share: "Share",
  origin: "Origin",
  certification: "Certified",
};

/**
 * What it is made of and where it comes from, for products that have to prove it: fashion, food, furniture and
 * cosmetics, where the label is part of the pitch. On the left a short story and a care list; on the right a ruled
 * list of materials, each with a swatch in the material's own tone, its name, its share, the place it comes from and
 * what certifies it. The share is written as text first and the thin bar under it is decoration, hidden from
 * assistive technology; origins are plain places and a certification is a word, not a seal. The shares should add up
 * to 100, and while you develop the block warns you in the console when they do not. No state, no script: it renders
 * on the server. The two halves sit side by side by the width of the block, not of the screen.
 */
export function MaterialsSection({ eyebrow, title, story, materials, care, headingLevel = 2, labels: custom, locale = "en-US", className, ...props }: MaterialsSectionProps) {
  const labels = { ...LABELS, ...custom };
  const ListTitle = `h${headingLevel + 1}` as "h3" | "h4";
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  if (process.env.NODE_ENV !== "production") {
    const total = materials.reduce((sum, material) => sum + material.share, 0);
    if (Math.abs(total - 100) > 0.5) console.warn(`MaterialsSection: the shares add up to ${Math.round(total * 10) / 10}, not 100.`);
  }

  return (
    <section data-slot="materials-section" className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-12 @4xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @4xl:grid-rows-[auto_1fr] @4xl:items-start @4xl:gap-x-16 @4xl:gap-y-0">
        {/* The story, then the materials, then the care: the order a phone reads them in. Side by side, the care sits under the story and the materials run down the other column. */}
        <div className="min-w-0 @4xl:col-start-1 @4xl:row-start-1">
          <SectionHeading eyebrow={eyebrow} title={title} as={headingLevel === 3 ? "h3" : "h2"} />
          <div className="mt-6 max-w-prose space-y-4 text-base leading-relaxed text-pretty text-muted-foreground">{story}</div>
        </div>

        <div className="min-w-0 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1">
          <ListTitle className="pb-4 text-sm leading-snug font-medium">{labels.composition}</ListTitle>
          <ul role="list" className="border-b border-border">
            {materials.map((material) => (
              <li key={material.name} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-t border-border py-5 @lg:grid-cols-[3.25rem_minmax(0,1fr)] @lg:gap-x-5">
                {/* The swatch runs the height of the row, like a paint chip: the one place a colour that is not a token is allowed, because it is the material's own. */}
                <span aria-hidden="true" style={{ backgroundColor: material.swatch }} className="min-h-14 self-stretch rounded-lg ring-1 ring-foreground/10 ring-inset" />
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="min-w-0 text-base leading-snug font-medium tracking-[-0.01em]">{material.name}</p>
                    <p className="shrink-0 text-xl leading-none font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums">
                      <span className="sr-only">{labels.share}: </span>
                      {percent.format(material.share / 100)}
                    </p>
                  </div>
                  <Progress value={material.share} aria-hidden="true" className="mt-3 h-1.5" />
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <IconPin aria-hidden="true" className="size-3.5 shrink-0" />
                      <span>
                        <span className="sr-only">{labels.origin}: </span>
                        {material.origin}
                      </span>
                    </p>
                    {material.certification ? (
                      <Badge variant="outline" className="h-6 px-2.5 text-[0.8125rem] font-normal text-foreground">
                        <IconBadgeCheck aria-hidden="true" />
                        <span className="sr-only">{labels.certification}: </span>
                        {material.certification}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {care?.length ? (
          <div className="min-w-0 @4xl:col-start-1 @4xl:row-start-2 @4xl:mt-10 @4xl:border-t @4xl:border-border @4xl:pt-6">
            <ListTitle className="text-sm leading-snug font-medium">{labels.care}</ListTitle>
            <ul role="list" className="mt-4 grid gap-2.5">
              {care.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-foreground/50" />
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
