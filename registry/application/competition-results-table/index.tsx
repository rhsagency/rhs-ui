"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconBan, IconMinusCircle, IconStar, IconTrendUp, IconTrophy, IconXCircle } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

import { fill, formatGap, formatTime, isOfficial, isoDuration, needsHours, parseSeconds, rankResults, spokenTime, type ResultStatus } from "./results";

export type { ResultStatus } from "./results";

/** A note on a result that is worth a label: a record, or a best for the athlete. */
export type ResultMark = "record" | "personal-best" | "season-best";

export interface CompetitionResult {
  /** The official place, when the timing system gave one. Give it to every finisher and the table trusts it (a photo finish, a penalty); leave it out and places come from the times. */
  place?: number;
  /** The athlete. It is the row's heading, and what `highlightName` and `onSelect` go by. */
  name: string;
  /** The club or team. */
  club?: string;
  /** The race number. */
  bib?: string | number;
  /** The `id` of the category the athlete ran in (see `categories`). */
  category?: string;
  /** The finish time: seconds, or text such as "1:02:45", "20:15.4" or "58.42". */
  time?: number | string | null;
  /** How the entry ended. Default: finished when there is a time, otherwise did not finish. A time on an entry that did not finish is not shown. */
  status?: ResultStatus;
  /** Records and bests, each shown as a labelled mark by the name. */
  marks?: readonly ResultMark[];
  /** A line of its own under the name: "Wheelchair division", "Chip time". */
  note?: string;
}

export interface ResultCategory {
  /** What `CompetitionResult.category` names. Unique. */
  id: string;
  /** The tab: "Women 40+". */
  label: string;
}

/** The words the table says on its own, for another language or your own wording. `{category}`, `{count}` and `{time}` are filled in. */
export interface CompetitionResultsLabels {
  /** The first tab, which shows every entry. Default "All". */
  all: string;
  /** The name of the row of category tabs. Default "Category". */
  categories: string;
  /** The name of the table when there is no `caption`. Default "Results". */
  table: string;
  /** Column heading. Default "Place". */
  place: string;
  /** Column heading. Default "Bib". */
  bib: string;
  /** How the race number is written in the line under the name when the bib column has folded away (below 48rem). `{bib}` is filled in: write "Bib {bib}" or "Lane {bib}" to name it for a reader and a screen reader. Default "#{bib}". */
  bibFolded: string;
  /** Column heading. Default "Athlete". */
  athlete: string;
  /** Column heading. Default "Club". */
  club: string;
  /** Column heading. Default "Category". */
  category: string;
  /** Column heading. Default "Time". */
  time: string;
  /** Column heading, short. Default "Gap". */
  gap: string;
  /** The same heading in full, for a screen reader. Default "Gap to the winner". */
  gapLong: string;
  /** Beside a place that more than one athlete holds. Default "equal". */
  equal: string;
  /** Said for an entry that has no place. Default "No place". */
  noPlace: string;
  /** Said for the empty gap of the winner. Default "Winner". */
  winner: string;
  /** What a screen reader hears for a gap. Default "{time} behind the winner". */
  gapSpoken: string;
  /** The words for an entry that has no time. Default "Did not finish". */
  dnf: string;
  /** Default "Did not start". */
  dns: string;
  /** Default "Disqualified". */
  dsq: string;
  /** The mark for a record. Default "Record". */
  record: string;
  /** The mark for a personal best. Default "Personal best". */
  personalBest: string;
  /** The mark for a season best. Default "Season best". */
  seasonBest: string;
  /** The mark on the highlighted athlete, for the eye and for a screen reader. Default "You". */
  highlighted: string;
  /** Said after the tab changes. Default "{category}: {count} results". */
  showing: string;
  /** The same, for exactly one result. Default "{category}: {count} result". */
  showingOne: string;
  /** The count beside a tab, for a screen reader. Default "{count} results". */
  count: string;
  /** The same, for exactly one result. Default "{count} result". */
  countOne: string;
  /** Said for a bib, a club or a category that was not given. Default "Not given". */
  none: string;
  /** What shows when a category has no entries. Default "No results in this category." */
  empty: string;
}

export interface CompetitionResultsTableProps extends Omit<ComponentProps<"section">, "children" | "onSelect" | "results"> {
  /** The field: one object per athlete, in any order. The table orders it. */
  results: readonly CompetitionResult[];
  /** The categories, as tabs after "All". An athlete belongs to the one that names its `id`. Leave it out for a single table with no tabs. */
  categories?: readonly ResultCategory[];
  /** The category shown, by `id`, or null for everyone, when you control it. */
  category?: string | null;
  /** The category to start on, when you do not control it. Default null: everyone. */
  defaultCategory?: string | null;
  /** Called with the `id` of the tab pressed, or null for "All". */
  onCategoryChange?: (category: string | null) => void;
  /** The `name` of an athlete to find: the row is set on a plate, with a mark that says so in words and so reads out too. */
  highlightName?: string;
  /** Digits after the second: 0 writes 1:02:45, 2 writes 0:58.42. Times equal at this precision are tied. Default 0. */
  precision?: 0 | 1 | 2;
  /** The locale that writes the numbers and the spoken times. Default "en-US". */
  locale?: string;
  /** What the table is, shown above it and read out as its name: "Kestrel Coast Half Marathon, 2026". */
  caption?: ReactNode;
  /** Makes the athlete's name a button and calls this with the result when it is pressed: to open a profile or a split sheet. */
  onSelect?: (result: CompetitionResult) => void;
  /** The words the table says, for translation. */
  labels?: Partial<CompetitionResultsLabels>;
}

const LABELS: CompetitionResultsLabels = {
  all: "All",
  categories: "Category",
  table: "Results",
  place: "Place",
  bib: "Bib",
  bibFolded: "#{bib}",
  athlete: "Athlete",
  club: "Club",
  category: "Category",
  time: "Time",
  gap: "Gap",
  gapLong: "Gap to the winner",
  equal: "equal",
  noPlace: "No place",
  winner: "Winner",
  gapSpoken: "{time} behind the winner",
  dnf: "Did not finish",
  dns: "Did not start",
  dsq: "Disqualified",
  record: "Record",
  personalBest: "Personal best",
  seasonBest: "Season best",
  highlighted: "You",
  showing: "{category}: {count} results",
  showingOne: "{category}: {count} result",
  count: "{count} results",
  countOne: "{count} result",
  none: "Not given",
  empty: "No results in this category.",
};

const ALL = "all";
const tabOf = (id: string | null) => (id === null ? ALL : `category:${id}`);

// Written out whole: Tailwind only generates the classes it can read in the source.
// Up to 48rem of its own width an athlete's club, category and bib fold under the name; from 28rem the gap has a column of its own.
const FROM_MD = "hidden @md:table-cell";
const FROM_3XL = "hidden @3xl:table-cell";

const NO_TIME: Record<Exclude<ResultStatus, "finished">, { icon: typeof IconXCircle; word: "dnf" | "dns" | "dsq" }> = {
  dnf: { icon: IconXCircle, word: "dnf" },
  dns: { icon: IconMinusCircle, word: "dns" },
  dsq: { icon: IconBan, word: "dsq" },
};

const MARKS: Record<ResultMark, { icon: typeof IconTrophy; word: "record" | "personalBest" | "seasonBest" }> = {
  record: { icon: IconTrophy, word: "record" },
  "personal-best": { icon: IconTrendUp, word: "personalBest" },
  "season-best": { icon: IconStar, word: "seasonBest" },
};

/** An empty cell: a short drawn dash for the eye, and a word for a screen reader. */
function Nothing({ children }: { children: ReactNode }) {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden="true" className="inline-block h-px w-3 bg-muted-foreground/70 align-middle" />
      <span className="sr-only">{children}</span>
    </span>
  );
}

/**
 * Results of a race or a competition as one table: place, athlete, club, finish time and the gap to the winner, with a
 * tab for each category. Times are written the way a results sheet does (1:02:45, or 20:15 when nobody took an hour),
 * in tabular digits, and read out as words ("1 hour 2 minutes 45 seconds") instead of a string of colons. The gap is
 * "+0:42". An entry without a time says "Did not finish", "Did not start" or "Disqualified" in words and is kept
 * below the finishers. A category tab narrows the table and the places are counted again inside it, athletes with the
 * same time share a place and are marked "equal", and records and bests get a labelled mark. The athlete you
 * highlight is marked with a word as well as a plate, so it reads out too. Narrower than 48rem the club, category
 * and bib fold under the name, and below 28rem the gap folds under the time.
 */
export function CompetitionResultsTable({
  results,
  categories = [],
  category,
  defaultCategory = null,
  onCategoryChange,
  highlightName,
  precision = 0,
  locale = "en-US",
  caption,
  onSelect,
  labels: custom,
  className,
  ...props
}: CompetitionResultsTableProps) {
  const words = { ...LABELS, ...custom };
  const captionId = useId();
  const numbers = new Intl.NumberFormat(locale);
  const [own, setOwn] = useState<string | null>(defaultCategory);
  const [said, setSaid] = useState("");
  const chosen = category === undefined ? own : category;
  // A category that is not in the list shows everyone, rather than an empty table.
  const active = chosen !== null && categories.some((entry) => entry.id === chosen) ? chosen : null;

  const entries = results.map((result, id) => ({ ...result, id }));
  const official = isOfficial(entries);
  const finishes = entries.flatMap((entry) => ((entry.status ?? "finished") === "finished" ? [parseSeconds(entry.time)] : [])).filter((value): value is number => value !== null);
  // Every time in the table is written with hours once any of them needs them, so the column lines up in every tab.
  const hours = needsHours(finishes);
  const visible = entries.filter((entry) => active === null || entry.category === active);
  // A column nobody has anything for is left out, rather than a column of dashes.
  const has = { bib: entries.some((entry) => entry.bib !== undefined), club: entries.some((entry) => Boolean(entry.club)), category: entries.some((entry) => entry.category !== undefined) };
  const ranked = rankResults(visible, { precision, official, supplied: active === null });
  const gapHours = needsHours(ranked.flatMap((entry) => (entry.gap === null ? [] : [entry.gap])));
  const labelOf = (id: string | undefined) => (id === undefined ? undefined : (categories.find((entry) => entry.id === id)?.label ?? id));
  const countIn = (id: string | null) => (id === null ? entries.length : entries.filter((entry) => entry.category === id).length);
  const says = (count: number, one: string, many: string, values: Record<string, string | number> = {}) => fill(count === 1 ? one : many, { ...values, count: numbers.format(count) });
  const target = highlightName?.trim().toLowerCase();

  function choose(next: string | null) {
    if (category === undefined) setOwn(next);
    onCategoryChange?.(next);
    setSaid(says(countIn(next), words.showingOne, words.showing, { category: next === null ? words.all : (labelOf(next) ?? next) }));
  }

  const table = (
    <Table aria-labelledby={caption ? captionId : undefined} aria-label={caption ? undefined : words.table} className={cn("border-collapse", (caption || categories.length > 0) && "[&_thead_tr]:border-t")}>
      <TableHeader className="bg-muted/40">
        <TableRow>
          <TableHead scope="col" className="w-14 pr-2 pl-4 @md:w-20 @md:pl-5">
            {words.place}
          </TableHead>
          {has.bib ? (
            <TableHead scope="col" className={cn(FROM_3XL, "w-16 px-2")}>
              {words.bib}
            </TableHead>
          ) : null}
          <TableHead scope="col" className="w-full">
            {words.athlete}
          </TableHead>
          {has.club ? (
            <TableHead scope="col" className={FROM_3XL}>
              {words.club}
            </TableHead>
          ) : null}
          {has.category ? (
            <TableHead scope="col" className={FROM_3XL}>
              {words.category}
            </TableHead>
          ) : null}
          <TableHead scope="col" className="pr-4 text-right text-foreground @md:pr-3">
            {words.time}
          </TableHead>
          <TableHead scope="col" className={cn(FROM_MD, "pr-5 text-right")}>
            <span aria-hidden="true">{words.gap}</span>
            <span className="sr-only">{words.gapLong}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranked.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
              {words.empty}
            </TableCell>
          </TableRow>
        ) : null}
        {ranked.map(({ result, place, tied, gap, seconds, status }) => {
          const highlighted = target !== undefined && result.name.trim().toLowerCase() === target;
          const group = labelOf(result.category);
          const folded = [result.bib === undefined ? null : fill(words.bibFolded, { bib: result.bib }), result.club, group].filter((part): part is string => Boolean(part));
          const NoTime = status === "finished" ? null : NO_TIME[status];
          return (
            <TableRow key={result.id} data-highlighted={highlighted || undefined} data-status={status} className="data-[highlighted]:bg-muted data-[highlighted]:hover:bg-muted">
              <TableCell className="pr-2 pl-4 @md:pl-5">
                {place === null ? (
                  <Nothing>{words.noPlace}</Nothing>
                ) : (
                  <>
                    <span className="font-semibold tabular-nums">{numbers.format(place)}</span>
                    {/* Beside the number when there is room (22rem), under it when there is not, so the column never forces a sideways scroll. */}
                    {tied ? <span className="block text-xs text-muted-foreground @min-[22rem]:ml-1.5 @min-[22rem]:inline">{words.equal}</span> : null}
                  </>
                )}
              </TableCell>
              {has.bib ? <TableCell className={cn(FROM_3XL, "px-2 whitespace-nowrap text-muted-foreground tabular-nums")}>{result.bib ?? <Nothing>{words.none}</Nothing>}</TableCell> : null}
              <th scope="row" className="py-2.5 pr-3 pl-2.5 text-left align-middle font-normal @md:pl-3">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => {
                        const original = results[result.id];
                        if (original) onSelect(original);
                      }}
                      className={cn(
                        "rounded-sm text-left text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40",
                        highlighted ? "font-semibold" : "font-medium",
                      )}
                    >
                      {result.name}
                    </button>
                  ) : (
                    <span className={cn("text-sm", highlighted ? "font-semibold" : "font-medium")}>{result.name}</span>
                  )}
                  {highlighted ? (
                    <>
                      <span className="sr-only">, </span>
                      <Badge>{words.highlighted}</Badge>
                    </>
                  ) : null}
                  {(result.marks ?? []).map((mark) => {
                    const { icon: MarkIcon, word } = MARKS[mark];
                    return (
                      <Badge key={mark} variant="outline">
                        <span className="sr-only">, </span>
                        <MarkIcon aria-hidden="true" />
                        {words[word]}
                      </Badge>
                    );
                  })}
                </span>
                {folded.length > 0 ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground @3xl:hidden">
                    {folded.map((part, index) => (
                      <span key={`${index}-${part}`}>
                        {index > 0 ? (
                          <>
                            <span aria-hidden="true"> &middot; </span>
                            <span className="sr-only">, </span>
                          </>
                        ) : null}
                        {/* A part stays whole, so the line breaks at the dots and never inside "Men 40+" or a club's name. */}
                        <span className={cn("inline-block max-w-full", index === 0 && result.bib !== undefined && "tabular-nums")}>{part}</span>
                      </span>
                    ))}
                  </span>
                ) : null}
                {result.note ? <span className="mt-0.5 block text-xs text-muted-foreground">{result.note}</span> : null}
              </th>
              {has.club ? <TableCell className={cn(FROM_3XL, "whitespace-nowrap text-muted-foreground")}>{result.club ?? <Nothing>{words.none}</Nothing>}</TableCell> : null}
              {has.category ? <TableCell className={cn(FROM_3XL, "whitespace-nowrap text-muted-foreground")}>{group ?? <Nothing>{words.none}</Nothing>}</TableCell> : null}
              <TableCell className="pr-4 pl-2 text-right @md:pr-3 @md:pl-3">
                {NoTime ? (
                  <span className="inline-flex items-center justify-end gap-1.5 text-right text-muted-foreground @md:whitespace-nowrap">
                    {/* The glyph comes with the room for the words on one line (28rem); narrower, they wrap and a glyph would float away from them. */}
                    <NoTime.icon aria-hidden="true" className="hidden size-4 shrink-0 @md:block" />
                    {words[NoTime.word]}
                  </span>
                ) : seconds !== null ? (
                  <time dateTime={isoDuration(seconds, precision)} className="font-medium whitespace-nowrap tabular-nums">
                    <span aria-hidden="true">{formatTime(seconds, hours, precision)}</span>
                    <span className="sr-only">{spokenTime(seconds, precision, locale)}</span>
                  </time>
                ) : null}
                {gap !== null && seconds !== null ? (
                  <span className="mt-0.5 block text-xs whitespace-nowrap text-muted-foreground tabular-nums @md:hidden">
                    <span aria-hidden="true">{formatGap(gap, gapHours, precision)}</span>
                    <span className="sr-only">{fill(words.gapSpoken, { time: spokenTime(gap, precision, locale) })}</span>
                  </span>
                ) : null}
              </TableCell>
              <TableCell className={cn(FROM_MD, "pr-5 text-right whitespace-nowrap text-muted-foreground tabular-nums")}>
                {gap !== null && seconds !== null ? (
                  <>
                    <span aria-hidden="true">{formatGap(gap, gapHours, precision)}</span>
                    <span className="sr-only">{fill(words.gapSpoken, { time: spokenTime(gap, precision, locale) })}</span>
                  </>
                ) : seconds !== null ? (
                  <Nothing>{words.winner}</Nothing>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <section data-slot="competition-results-table" className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {caption ? (
          <p id={captionId} className="px-5 pt-5 pb-4 text-base font-medium tracking-[-0.01em] text-foreground">
            {caption}
          </p>
        ) : null}
        {categories.length > 0 ? (
          <Tabs value={tabOf(active)} onValueChange={(next) => choose(next === ALL ? null : next.slice("category:".length))} className="gap-0">
            {/* The tabs scroll sideways when there are more than fit, and the scroll box is positioned so nothing inside it can escape. */}
            <div className={cn("relative overflow-x-auto px-5 pb-4", !caption && "pt-5")}>
              <TabsList variant="pill" aria-label={words.categories}>
                {[{ id: null, label: words.all }, ...categories].map((entry) => {
                  const count = countIn(entry.id);
                  return (
                    <TabsTrigger key={tabOf(entry.id)} value={tabOf(entry.id)}>
                      {entry.label}
                      <span aria-hidden="true" className="text-xs font-normal text-muted-foreground tabular-nums">
                        {numbers.format(count)}
                      </span>
                      <span className="sr-only">, {says(count, words.countOne, words.count)}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            {/* The panel takes the keyboard (Tab from the tabs lands here), so it shows a ring. The ring is inset: drawn outside the panel, the card's overflow-hidden would cut it off. */}
            <TabsContent value={tabOf(active)} className="rounded-b-xl focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
              {table}
            </TabsContent>
          </Tabs>
        ) : (
          table
        )}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  );
}
