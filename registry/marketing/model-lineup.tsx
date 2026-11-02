import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface LineupModel {
  /** The model's id as it appears in an API call: "kestrel-core". It keys the row, so it must be unique. */
  id: string;
  /** What the model is called: "Kestrel Core". */
  name: string;
  /** Where it sits in the family, in a word: "Flagship", "Balanced", "Compact". */
  tier?: string;
  /** What it is good at, finishing the line "Best for ...": "everyday product features and agents". */
  bestFor: string;
  /** The context window in tokens: 200000. It is written in compact notation, "200K". */
  context: number;
  /** How fast it answers, from 1 (Fast) to 3 (Fastest). It is drawn as a small meter and always written as a word. */
  speed: 1 | 2 | 3;
  /** The price of a million input tokens, in `currency`: 3. */
  priceIn: number;
  /** The price of a million output tokens, in `currency`: 15. */
  priceOut: number;
  /** Marks the model you would pick first, in words and with a soft fill. One is enough. */
  recommended?: boolean;
  /** Where to read more about the model, or to try it. */
  href?: string;
  /** The link's text on this row. Falls back to labels.learnMore. A screen reader also hears the model's name. */
  linkLabel?: string;
}

export interface ModelLineupLabels {
  /** Column head for the model. */
  model: string;
  /** Column head and card label for the context window. */
  context: string;
  /** The unit under the context window's head, and after it on a card. */
  tokens: string;
  /** Column head and card label for the speed. */
  speed: string;
  /** Column head and card label for the input price. */
  input: string;
  /** Column head and card label for the output price. */
  output: string;
  /** The unit under a price's head, and after it on a card. */
  perMillion: string;
  /** The words before what a model is best for on a card, and the head of that column in the table. */
  bestFor: string;
  /** The word on the model you would pick first. */
  recommended: string;
  /** The word for speed 1. */
  fast: string;
  /** The word for speed 2. */
  faster: string;
  /** The word for speed 3. */
  fastest: string;
  /** The link's text on a row that gives no linkLabel. */
  learnMore: string;
  /** The table's name, read out by screen readers. */
  caption: string;
}

export interface ModelLineupProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Models". */
  eyebrow?: string;
  /** The heading: "Pick the model that fits the job". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Three to five models, in the order you want them shown. */
  models: readonly LineupModel[];
  /** The ISO 4217 code the prices are written in: "USD" by default. */
  currency?: string;
  /** A line under the table: how billing works, what a batch costs, when prices change. */
  note?: ReactNode;
  /** The level of the heading: 2 by default. The name of each model sits one level below on a card; in the table it is the row header. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ModelLineupLabels>;
  /** Locale for the numbers and the prices. */
  locale?: string;
}

const LABELS: ModelLineupLabels = {
  model: "Model",
  context: "Context window",
  tokens: "tokens",
  speed: "Speed",
  input: "Input",
  output: "Output",
  perMillion: "per 1M tokens",
  bestFor: "Best for",
  recommended: "Recommended",
  fast: "Fast",
  faster: "Faster",
  fastest: "Fastest",
  learnMore: "Learn more",
  caption: "Models compared on context window, speed and price",
};

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium whitespace-nowrap text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** Three segments, as many lit as the speed. The word beside it carries the meaning, so the segments are hidden from assistive technology. */
function Speed({ speed, word }: { speed: 1 | 2 | 3; word: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className="flex h-1.5 w-11 gap-0.5">
        {[1, 2, 3].map((step) => (
          <span key={step} className={cn("flex-1 rounded-full", step <= speed ? "bg-foreground" : "bg-foreground/20")} />
        ))}
      </span>
      {word}
    </span>
  );
}

/**
 * A model family compared on what matters: what each model is best for, its context window, its speed and what a
 * million tokens cost going in and coming out. Three to five models are the rows of a ruled table, with the tier
 * beside the name and one model marked Recommended in words and with a soft fill, because picking the right model
 * is the first decision a buyer makes. What a model is best for has a column of its own, so the row header is the
 * name alone and a screen reader does not read a sentence with it. Speed is a three-segment meter with a word beside
 * it (Fast, Faster, Fastest), never the meter alone. Numbers are tabular and context is written compactly ("200K");
 * prices follow `currency` and `locale`. On a narrow block each model is a card with the same facts and the same
 * labels. Both shapes are real markup, the table with a caption and header cells, and no state or script is needed:
 * it renders on the server.
 */
export function ModelLineup({ eyebrow, title, description, models, currency = "USD", note, headingLevel = 2, labels: custom, locale = "en-US", className, ...props }: ModelLineupProps) {
  const labels = { ...LABELS, ...custom };
  const ModelName = `h${headingLevel + 1}` as "h3" | "h4";
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  // A price keeps its currency's usual decimals ($3.00, ¥300) and shows a third one only when the price needs it ($0.075).
  const decimals = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().minimumFractionDigits ?? 2;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: Math.max(decimals, 3) });
  const words: Record<1 | 2 | 3, string> = { 1: labels.fast, 2: labels.faster, 3: labels.fastest };
  // The table keeps a column for the links only when some model has one; with none, the last column is the price.
  const hasLinks = models.some((model) => model.href);

  /** The name, the tier and the mark of the recommended model: the first thing in a row or a card. */
  const heading = (model: LineupModel, Name: "h3" | "h4" | "span") => (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <Name className="text-base leading-6 font-medium tracking-[-0.02em]">{model.name}</Name>
      {model.tier ? (
        <Badge variant="outline" className="h-6 px-2.5 text-[0.8125rem]">
          {model.tier}
        </Badge>
      ) : null}
      {model.recommended ? <Badge className="h-6 px-2.5 text-[0.8125rem]">{labels.recommended}</Badge> : null}
    </div>
  );

  const bestFor = (model: LineupModel) => (
    <>
      <span className="text-muted-foreground">{labels.bestFor}</span> {model.bestFor}
    </>
  );

  const link = (model: LineupModel) =>
    model.href ? (
      <a href={model.href} className={LINK}>
        <span>
          {model.linkLabel ?? labels.learnMore}
          <span className="sr-only"> ({model.name})</span>
        </span>
        <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
      </a>
    ) : null;

  return (
    <section data-slot="model-lineup" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {/* Seven columns need about 64rem: below that the models are cards, which keep the same facts and labels. */}
      <div className="mt-10 hidden overflow-hidden rounded-xl border border-border bg-card @5xl:mt-12 @5xl:block">
        <Table>
          <TableCaption className="sr-only">{labels.caption}</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead scope="col" className="h-auto min-w-[13.75rem] py-3 pl-6 align-top">
                {labels.model}
              </TableHead>
              <TableHead scope="col" className="h-auto min-w-[12rem] py-3 align-top">
                {labels.bestFor}
              </TableHead>
              <TableHead scope="col" className="h-auto w-28 py-3 text-right align-top">
                {labels.context}
                <span className="block text-xs leading-snug font-normal">{labels.tokens}</span>
              </TableHead>
              <TableHead scope="col" className="h-auto w-32 py-3 align-top">
                {labels.speed}
              </TableHead>
              <TableHead scope="col" className="h-auto w-24 py-3 text-right align-top">
                {labels.input}
                <span className="block text-xs leading-snug font-normal">{labels.perMillion}</span>
              </TableHead>
              <TableHead scope="col" className={cn("h-auto w-24 py-3 text-right align-top", !hasLinks && "pr-6")}>
                {labels.output}
                <span className="block text-xs leading-snug font-normal">{labels.perMillion}</span>
              </TableHead>
              {hasLinks ? (
                <TableHead scope="col" className="h-auto w-32 py-3 pr-6 text-right align-top">
                  <span className="sr-only">{labels.learnMore}</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id} className={cn("hover:bg-transparent", model.recommended && "bg-muted/40 hover:bg-muted/40")}>
                {/* The row header is the name, the tier and the mark of the recommended model, and nothing else: a screen reader reads it again with every cell. */}
                <TableHead
                  scope="row"
                  className={cn("relative h-auto py-5 pl-6 align-top font-normal whitespace-normal text-foreground", model.recommended && "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-foreground")}
                >
                  {heading(model, "span")}
                </TableHead>
                <TableCell className="py-5 align-top text-sm leading-6 text-pretty">{model.bestFor}</TableCell>
                <TableCell className="py-5 text-right align-top text-[0.9375rem] leading-6 tabular-nums">{compact.format(model.context)}</TableCell>
                <TableCell className="py-5 align-top text-[0.9375rem] leading-6">
                  <Speed speed={model.speed} word={words[model.speed]} />
                </TableCell>
                <TableCell className="py-5 text-right align-top text-[0.9375rem] leading-6 tabular-nums">{money.format(model.priceIn)}</TableCell>
                <TableCell className={cn("py-5 text-right align-top text-[0.9375rem] leading-6 tabular-nums", !hasLinks && "pr-6")}>{money.format(model.priceOut)}</TableCell>
                {hasLinks ? <TableCell className="py-5 pr-6 text-right align-top leading-6">{link(model)}</TableCell> : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul role="list" className="mt-10 grid gap-4 @2xl:grid-cols-2 @5xl:hidden">
        {models.map((model) => (
          <li key={model.id} className={cn("flex flex-col rounded-xl border bg-card p-5", model.recommended ? "border-foreground" : "border-border")}>
            {heading(model, ModelName)}
            <p className="mt-2 text-sm leading-relaxed text-pretty">{bestFor(model)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 text-sm">
              <div>
                <dt className="text-muted-foreground">{labels.context}</dt>
                <dd className="mt-1 text-[0.9375rem] leading-snug font-medium tabular-nums">
                  {compact.format(model.context)}
                  <span className="block text-xs font-normal text-muted-foreground">{labels.tokens}</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{labels.speed}</dt>
                <dd className="mt-1 text-[0.9375rem] leading-snug font-medium">
                  <Speed speed={model.speed} word={words[model.speed]} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{labels.input}</dt>
                <dd className="mt-1 text-[0.9375rem] leading-snug font-medium tabular-nums">
                  {money.format(model.priceIn)}
                  <span className="block text-xs font-normal text-muted-foreground">{labels.perMillion}</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{labels.output}</dt>
                <dd className="mt-1 text-[0.9375rem] leading-snug font-medium tabular-nums">
                  {money.format(model.priceOut)}
                  <span className="block text-xs font-normal text-muted-foreground">{labels.perMillion}</span>
                </dd>
              </div>
            </dl>
            {model.href ? <div className="mt-auto pt-5">{link(model)}</div> : null}
          </li>
        ))}
      </ul>

      {note ? (
        <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{note}</span>
        </p>
      ) : null}
    </section>
  );
}
