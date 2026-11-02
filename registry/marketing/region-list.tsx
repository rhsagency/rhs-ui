"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

/** available: you can choose it today. beta: you can, and it is still being proven. planned: it is not live yet. */
export type RegionStatus = "available" | "beta" | "planned";

export interface Region {
  /** The region's code as it appears in your API and your config: "fra1". It is set in monospace and keys the row, so it must be unique. */
  code: string;
  /** The city: "Frankfurt". */
  city: string;
  /** The country: "Germany". */
  country: string;
  /** The continent the region is grouped under: "Europe". Groups follow the order in which the continents first appear in `regions`. */
  continent: string;
  /** Whether it can be chosen. It is said in words and drawn with a shape of its own, never by colour alone. */
  status: RegionStatus;
  /** The typical round trip in milliseconds, measured from `latencyFrom`. Leave it out for a planned region: it has no latency yet, and the row says so. */
  latencyMs?: number;
  /** What the region is bound to or certified for, as short tags: "EU only", "GDPR", "HIPAA". They are also the chips that filter the list. */
  tags?: readonly string[];
}

export interface RegionListLabels {
  /** The first chip, which shows every region. */
  all: string;
  /** The word for one region, used in the counts. */
  noun: string;
  /** The word for any other number of regions. */
  nouns: string;
  /** Said, politely, when a chip narrows the list. {shown}, {total} and {noun} stand for the two counts and the word. */
  showing: string;
  /** Said when nothing narrows the list. {total} and {noun} stand for the count and the word. */
  showingAll: string;
  /** Names the row of chips for assistive technology: "Filter regions by compliance". */
  filter: string;
  /** The table's name, read out by screen readers. */
  caption: string;
  /** Column head for the region code. */
  code: string;
  /** Column head for the city and country. */
  location: string;
  /** Column head for the status. */
  status: string;
  /** Column head for the latency. */
  latency: string;
  /** The line under the latency head, saying where it is measured from. {origin} stands for `latencyFrom`. */
  latencyFrom: string;
  /** Said in full on a phone and to a screen reader. {ms}, the number of milliseconds, and {origin} stand for the measurement. */
  latencySentence: string;
  /** The unit written after a latency in the table. */
  ms: string;
  /** Column head for the compliance tags. */
  tags: string;
  /** The link's text when `selectHref` is set. A screen reader also hears the city. */
  select: string;
  /** The word for an available region. */
  available: string;
  /** The word for a region in beta. */
  beta: string;
  /** The word for a region that is not live yet. */
  planned: string;
  /** Said in the latency place of a planned region, which has no latency yet. */
  noLatency: string;
  /** Said in the latency place of a live region that has not been measured. */
  unmeasured: string;
  /** Said when there are no regions to list. */
  empty: string;
}

export interface RegionListProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The small line over the heading: "Data residency". */
  eyebrow?: string;
  /** The heading: "Choose where your data lives". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Every region, grouped by continent in the order the continents first appear. */
  regions: readonly Region[];
  /** The place the latency is measured from: "Amsterdam". The header and every phone row say it, so a number never floats free of its origin. */
  latencyFrom: string;
  /** Where choosing a region goes. {code} stands for the region's code: "/signup?region={code}". Leave it out and the rows have no link; a planned region never has one. */
  selectHref?: string;
  /** The tag shown at first, by its text. All regions when left out, or when no region has that tag. */
  defaultTag?: string;
  /** The tag shown, by its text, when you control the list. "all" stands for the first chip. */
  tag?: string;
  /** Called with the tag after a chip is chosen. "all" stands for the first chip. */
  onTagChange?: (tag: string) => void;
  /** A line under the list: how the latency is measured, and when. */
  footnote?: ReactNode;
  /** The level of the heading: 2 by default. The name of each continent sits one level below (on a phone, where it is a heading). */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RegionListLabels>;
  /** Locale for the numbers. */
  locale?: string;
}

const LABELS: RegionListLabels = {
  all: "All regions",
  noun: "region",
  nouns: "regions",
  showing: "Showing {shown} of {total} {noun}",
  showingAll: "Showing all {total} {noun}",
  filter: "Filter regions by compliance",
  caption: "Regions, grouped by continent",
  code: "Region",
  location: "Location",
  status: "Status",
  latency: "Latency",
  latencyFrom: "from {origin}",
  latencySentence: "about {ms} ms from {origin}",
  ms: "ms",
  tags: "Compliance",
  select: "Select",
  available: "Available",
  beta: "Beta",
  planned: "Planned",
  noLatency: "Not live yet",
  unmeasured: "Not measured",
  empty: "There are no regions to show yet.",
};

const ALL = "all";

/** Each status has a shape as well as its word: a solid dot, a ring, a dashed ring. */
const DOT: Record<RegionStatus, string> = {
  available: "bg-foreground",
  beta: "border-2 border-foreground",
  planned: "border border-dashed border-muted-foreground",
};

/**
 * The chips are separate pills, not the joined bar a ToggleGroup draws by default. The chosen one is filled; in
 * forced colours, where fills are dropped, it gets an outline as well.
 */
const CHIP =
  "h-8 gap-2 rounded-full border-l px-3.5 text-[0.8125rem] first:rounded-full last:rounded-full forced-colors:data-[state=on]:outline-2 forced-colors:data-[state=on]:-outline-offset-2 forced-colors:data-[state=on]:outline-solid";

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium whitespace-nowrap text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

function Code({ children }: { children: string }): React.JSX.Element {
  return <code className="inline-block rounded-md border border-border bg-background px-2 py-1 font-mono text-[0.8125rem] leading-none tracking-[-0.01em]">{children}</code>;
}

function Status({ status, word }: { status: RegionStatus; word: string }): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", DOT[status])} />
      {word}
    </span>
  );
}

/**
 * Where your data can live, as a ruled list rather than a map: regions grouped by continent, each with its code in
 * monospace, the city and country, a status in words (Available, Beta, Planned), a typical latency to a stated
 * origin and the compliance tags it carries (EU only, GDPR, HIPAA). A map would look nicer and tell a buyer less about
 * data residency than one row does. Chips filter by tag, show how many regions each holds and say, politely, how
 * many are on screen; the tag you filter by is marked in every row it appears in. A planned region has no latency and
 * says so instead of showing a dash. On a wide block the list is a real table with headers and a caption; on a
 * narrow one each region is a card under its continent, with the latency written out as a sentence ("about 12 ms from
 * Amsterdam"). A region can link to wherever choosing it goes. Words are translated through labels.
 */
export function RegionList({
  eyebrow,
  title,
  description,
  regions,
  latencyFrom,
  selectHref,
  defaultTag,
  tag,
  onTagChange,
  footnote,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  className,
  ...props
}: RegionListProps) {
  const labels = { ...LABELS, ...custom };
  const Continent = `h${headingLevel + 1}` as "h3" | "h4";
  // Only tags that some region carries, in the order they first appear, and never one that would shadow the All chip.
  const tags = [...new Set(regions.flatMap((region) => region.tags ?? []))].filter((name) => name !== ALL);
  const known = (name: string | undefined): name is string => name === ALL || (name !== undefined && tags.includes(name));
  const [own, setOwn] = useState(known(defaultTag) ? defaultTag : ALL);
  const requested = tag ?? own;
  const current = known(requested) ? requested : ALL;

  const numbers = new Intl.NumberFormat(locale);
  const shown = current === ALL ? regions : regions.filter((region) => region.tags?.includes(current));
  const groups = [...new Set(regions.map((region) => region.continent))]
    .map((continent) => ({ continent, regions: shown.filter((region) => region.continent === continent) }))
    .filter((group) => group.regions.length > 0);
  const noun = (count: number) => (count === 1 ? labels.noun : labels.nouns);
  const message = (shown.length === regions.length ? labels.showingAll : labels.showing)
    .replace("{shown}", String(shown.length))
    .replace("{total}", String(regions.length))
    .replace("{noun}", noun(regions.length));
  const columns = 5 + (selectHref ? 1 : 0);

  const choose = (next: string) => {
    // Pressing the chosen chip again would clear a single choice; the list always has one.
    if (!known(next) || next === current) return;
    if (tag === undefined) setOwn(next);
    onTagChange?.(next);
  };

  // The count is a shade lighter than the chip's word, but not by much: at 80% it still clears 4.5:1 on a light chip.
  const chipCount = (total: number) => (
    <>
      <span aria-hidden="true" className="tabular-nums opacity-80">
        {total}
      </span>
      <span className="sr-only">
        , {total} {noun(total)}
      </span>
    </>
  );

  const word = (status: RegionStatus) => labels[status];
  const hrefOf = (region: Region) => (selectHref && region.status !== "planned" ? selectHref.replace("{code}", encodeURIComponent(region.code)) : undefined);
  const sentence = (region: Region) => labels.latencySentence.replace("{ms}", numbers.format(region.latencyMs ?? 0)).replace("{origin}", latencyFrom);
  /** What stands in the latency place: the number, or the reason there is none. */
  const hasLatency = (region: Region) => region.status !== "planned" && region.latencyMs !== undefined;
  const missing = (region: Region) => (region.status === "planned" ? labels.noLatency : labels.unmeasured);

  const tagList = (region: Region) =>
    region.tags?.length ? (
      <ul role="list" className="flex flex-wrap gap-1.5">
        {region.tags.map((name) => (
          <li key={name}>
            <Badge variant={name === current ? "secondary" : "outline"} className="h-6 px-2.5 text-[0.8125rem] font-normal">
              {name}
            </Badge>
          </li>
        ))}
      </ul>
    ) : null;

  const selectLink = (region: Region) => {
    const href = hrefOf(region);
    return href ? (
      <a href={href} className={LINK}>
        <span>
          {labels.select}
          <span className="sr-only"> {region.city}</span>
        </span>
        <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
      </a>
    ) : null;
  };

  return (
    <section data-slot="region-list" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {tags.length ? (
        <div className="mt-10 flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-8 @3xl:mt-12">
          <ToggleGroup type="single" size="sm" aria-label={labels.filter} value={current} onValueChange={choose} className="flex w-full flex-wrap gap-2 rounded-none data-[variant=outline]:shadow-none @2xl:w-auto">
            <ToggleGroupItem value={ALL} className={CHIP}>
              {labels.all}
              {chipCount(regions.length)}
            </ToggleGroupItem>
            {tags.map((name) => (
              <ToggleGroupItem key={name} value={name} className={CHIP}>
                {name}
                {chipCount(regions.filter((region) => region.tags?.includes(name)).length)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p role="status" aria-live="polite" className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {message}
          </p>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <p className={cn("rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground", tags.length ? "mt-8" : "mt-10 @3xl:mt-12")}>{labels.empty}</p>
      ) : (
        <>
          <div className={cn("hidden overflow-hidden rounded-xl border border-border bg-card @4xl:block", tags.length ? "mt-8" : "mt-10 @3xl:mt-12")}>
            <Table>
              <TableCaption className="sr-only">{labels.caption}</TableCaption>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead scope="col" className="w-24 pl-5">
                    {labels.code}
                  </TableHead>
                  {/* Every column but Compliance has a width of its own. Two columns left to share the room by their content moved about whenever a chip left a few rows; now Compliance alone takes what is left, and the others hold their places. */}
                  <TableHead scope="col" className="w-[22%]">
                    {labels.location}
                  </TableHead>
                  <TableHead scope="col" className="w-36">
                    {labels.status}
                  </TableHead>
                  <TableHead scope="col" className="w-32 text-right">
                    {labels.latency}
                    <span className="block text-xs leading-snug font-normal">{labels.latencyFrom.replace("{origin}", latencyFrom)}</span>
                  </TableHead>
                  <TableHead scope="col" className={selectHref ? undefined : "pr-5"}>
                    {labels.tags}
                  </TableHead>
                  {selectHref ? (
                    <TableHead scope="col" className="w-24 pr-5 text-right">
                      <span className="sr-only">{labels.select}</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              {groups.map((group) => (
                <TableBody key={group.continent}>
                  <TableRow className="border-t border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead scope="rowgroup" colSpan={columns} className="h-auto py-2.5 pr-5 pl-5 text-sm text-foreground">
                      <span className="flex items-baseline justify-between gap-4">
                        {group.continent}
                        <span className="text-xs font-normal text-muted-foreground tabular-nums">
                          {group.regions.length} {noun(group.regions.length)}
                        </span>
                      </span>
                    </TableHead>
                  </TableRow>
                  {group.regions.map((region) => (
                    <TableRow key={`${region.code}-${region.city}`} className="hover:bg-transparent">
                      <TableCell className="py-3.5 pl-5">
                        <Code>{region.code}</Code>
                      </TableCell>
                      <TableHead scope="row" className="h-auto py-3.5 font-normal whitespace-normal text-foreground">
                        <span className={cn("font-medium", region.status === "planned" && "text-muted-foreground")}>{region.city}</span>
                        <span className="text-muted-foreground">, {region.country}</span>
                      </TableHead>
                      <TableCell className={cn("py-3.5", region.status === "planned" && "text-muted-foreground")}>
                        <Status status={region.status} word={word(region.status)} />
                      </TableCell>
                      <TableCell className="py-3.5 text-right tabular-nums">
                        {hasLatency(region) ? (
                          <>
                            <span aria-hidden="true">
                              ~{numbers.format(region.latencyMs ?? 0)} {labels.ms}
                            </span>
                            <span className="sr-only">{sentence(region)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{missing(region)}</span>
                        )}
                      </TableCell>
                      <TableCell className={cn("py-3.5", !selectHref && "pr-5")}>{tagList(region)}</TableCell>
                      {selectHref ? <TableCell className="py-3.5 pr-5 text-right">{selectLink(region)}</TableCell> : null}
                    </TableRow>
                  ))}
                </TableBody>
              ))}
            </Table>
          </div>

          <div className={cn("grid gap-10 @4xl:hidden", tags.length ? "mt-8" : "mt-10 @3xl:mt-12")}>
            {groups.map((group) => (
              <div key={group.continent}>
                <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
                  <Continent className="min-w-0 text-lg leading-snug font-medium tracking-[-0.02em]">{group.continent}</Continent>
                  <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {group.regions.length} {noun(group.regions.length)}
                  </p>
                </div>
                <ul role="list" className="mt-4 grid gap-3">
                  {group.regions.map((region) => (
                    <li key={`${region.code}-${region.city}`} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 leading-snug">
                          <span className={cn("font-medium", region.status === "planned" && "text-muted-foreground")}>{region.city}</span>
                          <span className="block text-sm text-muted-foreground">{region.country}</span>
                        </p>
                        <Code>{region.code}</Code>
                      </div>
                      <p className={cn("mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", region.status === "planned" && "text-muted-foreground")}>
                        <Status status={region.status} word={word(region.status)} />
                        <span className="text-muted-foreground tabular-nums">{hasLatency(region) ? sentence(region) : missing(region)}</span>
                      </p>
                      {region.tags?.length || hrefOf(region) ? (
                        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                          {tagList(region)}
                          {selectLink(region)}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {footnote ? (
        <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{footnote}</span>
        </p>
      ) : null}
    </section>
  );
}
