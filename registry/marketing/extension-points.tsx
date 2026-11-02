import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface ExtensionLevel {
  /** The id that points name in `level`. It keys the level, so it must be unique. */
  id: string;
  /** The level as people say it: "No-code", "Low-code", "Code". It is written out on every row, never left to a shape. */
  label: string;
  /** One line on what it takes: "Click it together in the settings. No engineer needed." When any level has one, a key above the ladder shows them. */
  description?: string;
}

export interface ExtensionPoint {
  /** A stable id for the mechanism. It keys the row, so it must be unique. */
  id: string;
  /** What the mechanism is called: "Webhooks". */
  name: string;
  /** The id of its level, from `levels`. */
  level: string;
  /** One or two sentences on what it lets you change. */
  description: string;
  /** What people do with it, in a few words each: "Add a field", "Send to Slack". They are shown as chips. */
  examples?: readonly string[];
  /** The guide for this mechanism. The row gets a link to it. */
  href?: string;
  /** The link's text on this row. Falls back to labels.guide. A screen reader also hears the mechanism's name. */
  linkLabel?: string;
}

export interface ExtensionPointsLabels {
  /** The link's text on a row that gives no linkLabel: "Read the guide". */
  guide: string;
  /** Read out before a row's level: "Level". */
  level: string;
  /** The name of the ladder for assistive technology: "From least to most technical". */
  ladder: string;
  /** The name of the chips on a row for assistive technology: "What you can change". */
  examples: string;
}

export interface ExtensionPointsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Extending Halcyon". */
  eyebrow?: string;
  /** The heading: "Bend it to fit, without forking it". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /**
   * The levels, from the least technical to the most. They set the order of the ladder: the rows are sorted by their
   * level in this order, and keep the order you gave within a level. A point whose level is not listed goes last.
   */
  levels: readonly ExtensionLevel[];
  /** The mechanisms, four or five of them. Each is a row of the ladder. */
  points: readonly ExtensionPoint[];
  /** A line under the ladder, for the promise that answers the fear of lock-in: "Everything you build stays yours. Export it whenever you like." */
  footnote?: ReactNode;
  /** The level of the heading: 2 by default. The name of each mechanism sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ExtensionPointsLabels>;
}

const LABELS: ExtensionPointsLabels = {
  guide: "Read the guide",
  level: "Level",
  ladder: "From least to most technical",
  examples: "What you can change",
};

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium whitespace-nowrap text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The columns of the key above the ladder, from the number of levels. They are whole literal classes, and the levels
 * always sit side by side in equal columns or stack in one: never two and a third alone on a row of its own.
 */
function keyColumns(count: number): string {
  if (count === 2) return "@xl:grid-cols-2";
  if (count === 4) return "@xl:grid-cols-2 @4xl:grid-cols-4";
  return "@2xl:grid-cols-3";
}

/**
 * The step marker: a few bars that grow from left to right, one more lit on every row, so the rows read as a climb.
 * It never carries meaning of its own (the level is written out beside the name), so it is hidden from assistive
 * technology.
 */
function Steps({ lit, bars }: { lit: number; bars: number }): React.JSX.Element {
  return (
    <span aria-hidden="true" className="flex h-6 items-end gap-[3px]">
      {Array.from({ length: bars }, (_, bar) => (
        <span key={bar} style={{ height: `${((bar + 1) / bars) * 100}%` }} className={cn("w-1 rounded-[1px]", bar < lit ? "bg-foreground" : "bg-foreground/20")} />
      ))}
    </span>
  );
}

/**
 * How far you can bend the product, from no-code to code: a ladder of four or five mechanisms (custom fields,
 * automation rules, webhooks, plugins, the API), least technical first. Each row has the mechanism's name, its
 * level written out, a sentence on what it lets you change, example chips ("Add a field", "Send to Slack") and a
 * link to its guide. A step marker on the left grows by one bar on every row, so the list reads as a climb; it is
 * decoration, because the level is a word and the list is an ordered list. The levels you pass set the order, so a
 * ladder can never be shown upside down, and a key above it says what each level takes when you describe them. It
 * answers "can it do what we need" for buyers who fear being locked in. No state, no script: it renders on the
 * server. The link moves under the chips on a narrow block.
 */
export function ExtensionPoints({ eyebrow, title, description, levels, points, footnote, headingLevel = 2, labels: custom, className, ...props }: ExtensionPointsProps) {
  const labels = { ...LABELS, ...custom };
  const PointName = `h${headingLevel + 1}` as "h3" | "h4";
  const rank = (id: string) => {
    const at = levels.findIndex((level) => level.id === id);
    return at === -1 ? levels.length : at;
  };
  // Least technical first, whatever order the points came in; equal levels keep their order.
  const ladder = points
    .map((point, index) => ({ point, index }))
    .sort((a, b) => rank(a.point.level) - rank(b.point.level) || a.index - b.index)
    .map((entry) => entry.point);
  const bars = Math.min(Math.max(ladder.length, 1), 5);
  const levelLabel = (id: string) => levels.find((level) => level.id === id)?.label ?? id;
  const keyed = levels.some((level) => level.description);

  return (
    <section data-slot="extension-points" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {keyed ? (
        <dl className={cn("mt-10 grid gap-x-10 gap-y-5 @3xl:mt-12", keyColumns(levels.length))}>
          {levels.map((level) => (
            <div key={level.id} className="min-w-0 border-t border-foreground pt-3">
              <dt className="text-sm font-medium">{level.label}</dt>
              {level.description ? <dd className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{level.description}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}

      <ol role="list" aria-label={labels.ladder} className={cn("border-b border-border", keyed ? "mt-8 @3xl:mt-10" : "mt-10 @3xl:mt-12")}>
        {ladder.map((point, index) => (
          <li key={point.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-t border-border py-6 @3xl:grid-cols-[2.5rem_minmax(0,1fr)_auto] @3xl:gap-x-6 @3xl:py-7">
            <div className="pt-0.5">
              <Steps lit={Math.ceil(((index + 1) / ladder.length) * bars)} bars={bars} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <PointName className="text-lg leading-7 font-medium tracking-[-0.02em]">{point.name}</PointName>
                <Badge variant="outline" className="h-6 px-2.5 text-[0.8125rem]">
                  <span className="sr-only">{labels.level}: </span>
                  {levelLabel(point.level)}
                </Badge>
              </div>
              <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-pretty text-muted-foreground">{point.description}</p>
              {point.examples?.length ? (
                <ul role="list" aria-label={labels.examples} className="mt-4 flex flex-wrap gap-2">
                  {point.examples.map((example) => (
                    <li key={example} className="rounded-md bg-muted px-2.5 py-1 text-[0.8125rem] leading-5">
                      {example}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {point.href ? (
              <div className="col-start-2 mt-5 @3xl:col-start-auto @3xl:mt-0 @3xl:pt-0.5">
                <a href={point.href} className={LINK}>
                  <span>
                    {point.linkLabel ?? labels.guide}
                    <span className="sr-only"> ({point.name})</span>
                  </span>
                  <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {footnote ? (
        <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{footnote}</span>
        </p>
      ) : null}
    </section>
  );
}
