import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconArrowUpRight, IconClock, IconUpload } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface ImportSource {
  /** A stable id for the tile. It keys the tile, so it must be unique. */
  id: string;
  /** The tool people are moving from: "Brightdesk". */
  name: string;
  /** The tool's mark, drawn at 24px: a logo you have the right to show. Without one the tile shows the first letter of the name. */
  mark?: ReactNode;
  /** What comes across, as short names: "Contacts", "Ticket history", "Attachments". List only what the importer really moves. */
  imports: readonly string[];
  /** How long it takes, as people say it: "About 10 minutes". */
  estimate: string;
  /** The import guide for this tool. The whole tile is the link. */
  guideHref: string;
}

export interface ImportCsv {
  /** The tile's title: "Upload a CSV". */
  label: string;
  /** One line on what a CSV import needs: "Export a spreadsheet from any tool and map its columns to ours." */
  description?: string;
  /** The page or the upload flow it opens. */
  href: string;
}

export interface ImportHelp {
  /** The line before the link: "Your tool is not on the list?". Falls back to labels.helpText. */
  text?: string;
  /** The link's text: "Ask us to add it". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface ImportSourcesLabels {
  /** The small label over each tile's chips. */
  imports: string;
  /** Read out before the time estimate: "Time: About 10 minutes". */
  time: string;
  /** Read out after the tool's name, because the tile is a link to its guide: "Brightdesk, import guide". */
  guide: string;
  /** The line before the help link when `help.text` is left out. */
  helpText: string;
}

export interface ImportSourcesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Switching". */
  eyebrow?: string;
  /** The heading: "Bring your data with you". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The tools you can import from, in the order you want them shown. */
  sources: readonly ImportSource[];
  /** The last tile, for everything that can export a spreadsheet. */
  csv?: ImportCsv;
  /** A line after the grid for the reader whose tool is not there. */
  help?: ImportHelp;
  /** The level of the heading: 2 by default. The name of each tile sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ImportSourcesLabels>;
}

const LABELS: ImportSourcesLabels = {
  imports: "Comes across",
  time: "Time",
  guide: "import guide",
  helpText: "Your tool is not on the list?",
};

/** The tile is one click target: its title link stretches over it, and the focus ring is drawn on the whole tile. */
const STRETCH = "outline-none after:absolute after:inset-0 after:rounded-xl after:ring-ring/40 focus-visible:after:ring-[3px]";

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** The first letter of a name, for a tile with no mark. */
const initial = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? "";

/**
 * The reader's switching worry, answered with specifics: a grid of the tools
 * you can import from, each tile with its name (and a mark if you have one),
 * what comes across as short chips, how long it takes in plain words and a link
 * to its guide. The whole tile is the link, named by the tool and "import
 * guide", so a list of eight does not read as eight identical words. The chips
 * and the estimate claim nothing beyond what you pass in. The grid ends in a
 * dashed tile for a CSV upload, which every tool can feed, and an optional help
 * line for the reader whose tool is not on the list. It needs no script and no
 * state, so it renders on the server. For migration pages and the footer of a
 * comparison, where the question is never whether but how painful.
 */
export function ImportSources({ eyebrow, title, description, sources, csv, help, headingLevel = 2, labels: custom, className, ...props }: ImportSourcesProps) {
  const labels = { ...LABELS, ...custom };
  const Name = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="import-sources" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <ul role="list" className="mt-10 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @3xl:mt-12">
        {sources.map((source) => (
          <li
            key={source.id}
            className="group/tile relative flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 transition-[background-color,border-color] duration-150 hover:border-foreground/25 hover:bg-muted/40 motion-reduce:transition-none"
          >
            <div className="flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-lg font-semibold tracking-[-0.02em] text-foreground [&_img]:size-6 [&_svg]:size-6"
              >
                {source.mark ?? initial(source.name)}
              </span>
              <Name className="min-w-0 flex-1 text-[1.0625rem] leading-snug font-medium tracking-[-0.02em] text-balance">
                <a href={source.guideHref} className={STRETCH}>
                  {source.name}
                  <span className="sr-only">, {labels.guide}</span>
                </a>
              </Name>
              <IconArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-[opacity,translate] duration-150 group-focus-within/tile:translate-x-0 group-focus-within/tile:translate-y-0 group-focus-within/tile:opacity-100 group-hover/tile:translate-x-0 group-hover/tile:translate-y-0 group-hover/tile:opacity-100 motion-reduce:transition-none [@media(hover:none)]:translate-x-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-60"
              />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">{labels.imports}</p>
              <ul role="list" className="mt-2 flex flex-wrap gap-1.5">
                {source.imports.map((item) => (
                  <li key={item} className="min-w-0 max-w-full">
                    <Badge variant="outline" className="max-w-full truncate">
                      {item}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-auto flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <IconClock aria-hidden="true" className="size-4 shrink-0" />
              <span>
                <span className="sr-only">{labels.time}: </span>
                {source.estimate}
              </span>
            </p>
          </li>
        ))}

        {csv ? (
          <li className="group/tile relative flex min-w-0 flex-col gap-5 rounded-xl border border-dashed border-border bg-muted/30 p-5 transition-[background-color,border-color] duration-150 hover:border-foreground/30 hover:bg-muted/60 motion-reduce:transition-none">
            <div className="flex items-center gap-3.5">
              <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
                <IconUpload size={22} />
              </span>
              <Name className="min-w-0 flex-1 text-[1.0625rem] leading-snug font-medium tracking-[-0.02em] text-balance">
                <a href={csv.href} className={STRETCH}>
                  {csv.label}
                </a>
              </Name>
              <IconArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-[opacity,translate] duration-150 group-focus-within/tile:translate-x-0 group-focus-within/tile:translate-y-0 group-focus-within/tile:opacity-100 group-hover/tile:translate-x-0 group-hover/tile:translate-y-0 group-hover/tile:opacity-100 motion-reduce:transition-none [@media(hover:none)]:translate-x-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-60"
              />
            </div>
            {csv.description ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{csv.description}</p> : null}
          </li>
        ) : null}
      </ul>

      {help ? (
        <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6 text-[0.9375rem]">
          <span className="text-muted-foreground">{help.text ?? labels.helpText}</span>
          <a href={help.href} className={LINK}>
            {help.label}
            <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
          </a>
        </p>
      ) : null}
    </section>
  );
}
