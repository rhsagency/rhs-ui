import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowDown, IconCheck, IconClock, IconListChecks, IconUsers } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TakeawayJump {
  /** The section's name as the reader knows it: "Pricing". */
  label: string;
  /** An anchor on the same page: "#pricing". */
  href: string;
}

export interface KeyTakeawaysLabels {
  /** The reading time. {minutes} stands for the number: "{minutes} min read". */
  minutes: string;
  /** The words before who it is for: "Written for". */
  audience: string;
  /** The words before the jump links, and the accessible name of that list: "Jump to". */
  jump: string;
}

export interface KeyTakeawaysProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small label above the points: "Key takeaways" by default. It names the region too. */
  title?: string;
  /** Three to five takeaways. Short enough to read in ten seconds; each is one sentence or less. */
  points: readonly ReactNode[];
  /** How long the whole piece takes to read, in minutes. */
  minutes?: number;
  /** Who it is for, as a short phrase: "operations leads at growing teams". */
  audience?: string;
  /** Up to three links to sections further down the page. More are ignored: a list of jumps is a table of contents. */
  jumps?: readonly TakeawayJump[];
  /** The level of the label: 2 by default, one below the article's title. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<KeyTakeawaysLabels>;
  /** Locale for the number of minutes. */
  locale?: string;
}

const LABELS: KeyTakeawaysLabels = {
  minutes: "{minutes} min read",
  audience: "Written for",
  jump: "Jump to",
};

/** Puts values into a sentence: {minutes} becomes the number. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const JUMP =
  "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** A link you can tell from the words around it, and bold, for the markup a caller puts in a point. Written out whole, because Tailwind only generates the classes it can read in the source. */
const INLINE_LINK =
  "[&_a]:rounded-sm [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a]:transition-colors [&_a]:duration-150 [&_a]:motion-reduce:transition-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40 [&_strong]:font-semibold";

/**
 * The summary box at the top of a long article: what you will learn, in
 * three to five short points, with a footer that says how long the piece
 * takes, who it is written for and where to jump. Most people decide on the
 * first screen whether to read on, and this is what they decide on. It is a
 * labelled region rather than a Callout, so assistive technology can list it
 * among the landmarks and skip straight to it, or past it. For long guides,
 * reports and explainers.
 */
export function KeyTakeaways({ title = "Key takeaways", points, minutes, audience, jumps = [], headingLevel = 2, labels: custom, locale = "en-US", className, ...props }: KeyTakeawaysProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const links = jumps.slice(0, 3);
  const hasFooter = minutes !== undefined || Boolean(audience) || links.length > 0;
  return (
    <section data-slot="key-takeaways" aria-labelledby={id} className={cn("w-full overflow-hidden rounded-xl border border-border bg-card break-words", className)} {...props}>
      <div className="p-5 sm:p-6">
        <Heading id={id} className="flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          <IconListChecks aria-hidden="true" className="size-4" />
          {title}
        </Heading>
        <ul role="list" className="mt-5 grid gap-3.5">
          {points.map((point, index) => (
            <li key={index} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3.5">
              <span aria-hidden="true" className="mt-0.5 grid size-5 place-items-center rounded-full bg-foreground text-background forced-colors:border">
                <IconCheck size={12} strokeWidth={2.5} />
              </span>
              <span className={cn("text-base leading-[1.45] font-medium tracking-[-0.005em] text-pretty sm:text-[1.0625rem]", INLINE_LINK)}>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      {hasFooter ? (
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border bg-muted/40 px-5 py-4 text-sm sm:px-6">
          {minutes !== undefined || audience ? (
            <ul role="list" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
              {minutes !== undefined ? (
                <li className="flex items-start gap-2">
                  <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span className="tabular-nums">{fill(labels.minutes, { minutes: new Intl.NumberFormat(locale).format(minutes) })}</span>
                </li>
              ) : null}
              {audience ? (
                <li className="flex items-start gap-2">
                  <IconUsers aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {labels.audience} <span className="font-medium text-foreground">{audience}</span>
                  </span>
                </li>
              ) : null}
            </ul>
          ) : null}
          {links.length ? (
            <nav aria-label={labels.jump} className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span aria-hidden="true" className="text-muted-foreground">
                {labels.jump}
              </span>
              <ul role="list" className="flex flex-wrap gap-2">
                {links.map((jump) => (
                  <li key={`${jump.label}-${jump.href}`}>
                    <a href={jump.href} className={JUMP}>
                      {jump.label}
                      <IconArrowDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
