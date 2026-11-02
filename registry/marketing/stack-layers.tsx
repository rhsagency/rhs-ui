import type { ComponentProps, ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface StackMetric {
  /** The figure, as plain text: "38 ms", "99.99%", "11 nines". It is set in tabular figures and never split across lines. */
  value: string;
  /** What it measures, in a few words: "median to first byte". */
  label?: string;
}

export interface StackLayer {
  /** A stable id for the layer. It keys the band, so it must be unique. */
  id: string;
  /** What the layer is called: "Edge", "API", "Compute", "Storage". */
  name: string;
  /** The technologies that do the work in this layer, shown as chips: "Anycast network", "TLS 1.3". */
  technologies?: readonly string[];
  /** What the layer promises, in one line a buyer could hold you to: "Requests are answered within 50 ms of the visitor." */
  promise: string;
  /** One number that backs the promise. It sits at the right of the band, and under the promise on a phone. */
  metric?: StackMetric;
}

export interface StackLayersLabels {
  /** The name of the list for assistive technology: "The path of a request, from the first layer to the last". */
  path: string;
  /** The name of the chips in a layer for assistive technology: "Technologies". */
  technologies: string;
}

export interface StackLayersProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Architecture". */
  eyebrow?: string;
  /** The heading: "Four layers between a visitor and your data". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The layers, in the order a request meets them: the first one is the top of the stack. */
  layers: readonly StackLayer[];
  /** A line under the stack: where the figures come from, and how recent they are. */
  footnote?: ReactNode;
  /** The level of the heading: 2 by default. The name of each layer sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<StackLayersLabels>;
}

const LABELS: StackLayersLabels = {
  path: "The path of a request, from the first layer to the last",
  technologies: "Technologies",
};

/**
 * Your architecture as horizontal layers, top to bottom in the order a request meets them: edge, API, compute and
 * storage. Each band has the layer's name, the technologies that do the work as chips, a one-line promise and a
 * small metric at the right, with hairlines between the bands and a thin rail down the left that marks the path a
 * request takes. For infrastructure and security-minded buyers who want to see the engine: the point is the
 * layers, not a movement through them, so nothing animates. It is an ordered list read from top to bottom, and the
 * metric is plain text. On a narrow block each band becomes a card, and a short line between the cards keeps the
 * path. No state, no script: it renders on the server.
 */
export function StackLayers({ eyebrow, title, description, layers, footnote, headingLevel = 2, labels: custom, className, ...props }: StackLayersProps) {
  const labels = { ...LABELS, ...custom };
  const LayerName = `h${headingLevel + 1}` as "h3" | "h4";
  // The metric column has one width for every band, so the promises line up down the stack; with no metric at all it is left out.
  const hasMetric = layers.some((layer) => layer.metric);

  return (
    <section data-slot="stack-layers" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <ol
        role="list"
        aria-label={labels.path}
        className="mt-10 grid gap-4 @3xl:mt-12 @3xl:gap-0 @3xl:overflow-hidden @3xl:rounded-xl @3xl:border @3xl:border-border @3xl:bg-card"
      >
        {layers.map((layer) => (
          <li
            key={layer.id}
            className={cn(
              "group/layer relative rounded-xl border border-border bg-card p-5 @3xl:grid @3xl:items-start @3xl:gap-x-8 @3xl:rounded-none @3xl:border-x-0 @3xl:border-b-0 @3xl:bg-transparent @3xl:py-6 @3xl:pr-7 @3xl:pl-16 @3xl:first:border-t-0",
              hasMetric ? "@3xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_9.5rem]" : "@3xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
            )}
          >
            {/* The path a request takes. On a wide block it is a rail down the left with a node on every layer; on a narrow one it is a short line in the gap between two cards. */}
            <span aria-hidden="true" className="absolute top-full left-1/2 h-4 w-px -translate-x-1/2 bg-border group-last/layer:hidden @3xl:hidden" />
            <span aria-hidden="true" className="absolute top-0 left-6 hidden h-[2.375rem] w-px -translate-x-1/2 bg-border @3xl:block @3xl:group-first/layer:hidden" />
            <span aria-hidden="true" className="absolute top-[2.375rem] bottom-0 left-6 hidden w-px -translate-x-1/2 bg-border @3xl:block @3xl:group-last/layer:hidden" />
            <span aria-hidden="true" className="absolute top-[2.375rem] left-6 hidden size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-card @3xl:block" />

            <div className="min-w-0">
              <LayerName className="text-lg leading-7 font-medium tracking-[-0.02em]">{layer.name}</LayerName>
              {layer.technologies?.length ? (
                <ul role="list" aria-label={labels.technologies} className="mt-3 flex flex-wrap gap-1.5">
                  {layer.technologies.map((technology) => (
                    <li key={technology}>
                      <Badge variant="outline" className="h-6 px-2.5 text-[0.8125rem] font-normal">
                        {technology}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="mt-4 text-[0.9375rem] leading-6 text-pretty @3xl:mt-0.5">{layer.promise}</p>

            {layer.metric ? (
              <p className="mt-4 flex items-baseline gap-x-3 border-t border-border pt-4 @3xl:mt-0 @3xl:flex-col @3xl:items-end @3xl:gap-x-0 @3xl:border-t-0 @3xl:pt-0 @3xl:text-right">
                <span className="text-2xl leading-7 font-medium tracking-[-0.03em] whitespace-nowrap tabular-nums">{layer.metric.value}</span>
                {layer.metric.label ? <span className="text-xs leading-snug text-balance text-muted-foreground @3xl:mt-1">{layer.metric.label}</span> : null}
              </p>
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
