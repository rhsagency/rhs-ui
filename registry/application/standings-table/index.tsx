import type { ComponentProps, ReactNode } from "react";

import { IconStar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

import { fill, makeFormats, parseForm, zoneAt, type StandingsResult } from "./standings";

export type { StandingsResult } from "./standings";

export interface StandingsRow {
  /** The club's name. It is the row's heading and must be unique in the table. */
  team: string;
  /** The crest. The initials of the name show until it loads, and when it fails. It steps aside when the table is narrower than 22rem. */
  logo?: string;
  /** The place in the table. Default: the place in `rows`, so rows that are already in order need none. Clubs that cannot be split may share one. */
  position?: number;
  /** Matches played. */
  played: number;
  /** Matches won. */
  won: number;
  /** Matches drawn. */
  drawn: number;
  /** Matches lost. */
  lost: number;
  /** Goals scored. */
  for: number;
  /** Goals conceded. */
  against: number;
  /** Points, as the competition counts them. The table never works them out, because the rules differ (a deduction, three for a win, a bonus). */
  points: number;
  /** The last results, oldest first: `"WWDLW"`, `["W", "W", "D", "L", "W"]` or the words win, draw and loss. Only the last five are drawn. */
  form?: string | readonly string[];
}

export interface StandingsZone {
  /** The first position in the zone. */
  from: number;
  /** The last position in the zone, included. */
  to: number;
  /** What the zone means, said in words: "Promotion", "Play-offs", "Relegation". It names the zone in the legend and for a screen reader on every row inside it. */
  label: string;
  /** How the zone's rule is drawn, so the zones differ by more than colour: `positive` is a solid rule, `neutral` a dashed one, `negative` a dotted one in the destructive tone. Default "neutral". */
  tone?: "positive" | "neutral" | "negative";
}

export type StandingsColumn = "position" | "played" | "won" | "drawn" | "lost" | "goalsFor" | "goalsAgainst" | "goalDifference" | "points";

/** The words the table says on its own, for another language or your own wording. `{results}`, `{label}`, `{from}`, `{to}` and `{position}` are filled in. */
export interface StandingsLabels {
  /** Each column's abbreviation, which is what the heading shows, and the full word a screen reader hears instead. */
  columns: Record<StandingsColumn, { short: string; long: string }>;
  /** The heading of the club column. Default "Club". */
  club: string;
  /** The heading of the form column. Default "Form". */
  form: string;
  /** A win, in the sentence about the form. Default "win". */
  win: string;
  /** A draw, in the sentence about the form. Default "draw". */
  draw: string;
  /** A loss, in the sentence about the form. Default "loss". */
  loss: string;
  /** The sentence the five shapes stand for. Default "Last five: {results}". */
  lastFive: string;
  /** Said for a club with no results yet. Default "No results yet". */
  noForm: string;
  /** Said after the name of the highlighted club, for a screen reader. Default "highlighted". */
  highlighted: string;
  /** Said after the name of a club inside a zone, for a screen reader. Default "{label} zone". */
  zone: string;
  /** The name of the zone legend. Default "Zones of the table". */
  zones: string;
  /** The places a zone covers, in the legend. Default "Positions {from} to {to}". */
  positions: string;
  /** The place a one-place zone covers, in the legend. Default "Position {position}". */
  position: string;
  /** Introduces the shapes in the key. Default "Form, oldest to latest:". */
  formKey: string;
  /** What shows when there are no rows. Default "No standings to show yet." */
  empty: string;
}

export interface StandingsLabelOverrides extends Partial<Omit<StandingsLabels, "columns">> {
  /** Any of the column words, by column: the rest keep their defaults. */
  columns?: Partial<StandingsLabels["columns"]>;
}

export interface StandingsTableProps extends Omit<ComponentProps<"section">, "children"> {
  /** One object per club, in table order. */
  rows: readonly StandingsRow[];
  /** Stretches of the table with a meaning: the places that go up, into a play-off or down. Each gets a rule on the left of its rows and a line in the legend. */
  zones?: readonly StandingsZone[];
  /** The `team` of a club to single out: its row is set on a plate and in weight, with a star and, for a screen reader, the word "highlighted". */
  highlightTeam?: string;
  /** What the table is, shown above it and read out as its name: "Championship, after matchday 14". */
  caption?: ReactNode;
  /** The locale that writes the figures: 1,204 or 1.204. Default "en-US". */
  locale?: string;
  /** The words the table says, for translation. */
  labels?: StandingsLabelOverrides;
}

const COLUMN_WORDS: StandingsLabels["columns"] = {
  position: { short: "Pos", long: "Position" },
  played: { short: "P", long: "Played" },
  won: { short: "W", long: "Won" },
  drawn: { short: "D", long: "Drawn" },
  lost: { short: "L", long: "Lost" },
  goalsFor: { short: "GF", long: "Goals for" },
  goalsAgainst: { short: "GA", long: "Goals against" },
  goalDifference: { short: "GD", long: "Goal difference" },
  points: { short: "Pts", long: "Points" },
};

const LABELS: StandingsLabels = {
  columns: COLUMN_WORDS,
  club: "Club",
  form: "Form",
  win: "win",
  draw: "draw",
  loss: "loss",
  lastFive: "Last five: {results}",
  noForm: "No results yet",
  highlighted: "highlighted",
  zone: "{label} zone",
  zones: "Zones of the table",
  positions: "Positions {from} to {to}",
  position: "Position {position}",
  formKey: "Form, oldest to latest:",
  empty: "No standings to show yet.",
};

// Written out whole: Tailwind only generates the classes it can read in the source.
// The rule sits on the position cell, so the row's own cells stay in line whatever the zone.
const RULE = "before:absolute before:inset-y-0 before:left-0 before:w-[3px]";
const RULES = {
  positive: "before:bg-foreground",
  neutral: "before:border-l-[3px] before:border-dashed before:border-foreground",
  negative: "before:border-l-[3px] before:border-dotted before:border-destructive",
} as const;
const SWATCHES = {
  positive: "bg-foreground",
  neutral: "border-l-[3px] border-dashed border-foreground",
  negative: "border-l-[3px] border-dotted border-destructive",
} as const;

// Under 32rem of its own width a row keeps the position, the club, the matches played and the points; the rest come back as the room does.
const FROM_LG = "hidden @lg:table-cell";
const FROM_2XL = "hidden @2xl:table-cell";
const FROM_4XL = "hidden @4xl:table-cell";

/** The abbreviations the key explains, in the order of the columns, each shown as soon as its column is. */
const KEY: readonly { column: Exclude<StandingsColumn, "position">; show: string }[] = [
  { column: "played", show: "" },
  { column: "won", show: "hidden @lg:inline" },
  { column: "drawn", show: "hidden @lg:inline" },
  { column: "lost", show: "hidden @lg:inline" },
  { column: "goalsFor", show: "hidden @4xl:inline" },
  { column: "goalsAgainst", show: "hidden @4xl:inline" },
  { column: "goalDifference", show: "hidden @lg:inline" },
  { column: "points", show: "" },
];

/** One result as a shape: filled for a win, hollow for a draw, a dash for a loss. Each sits in the same box so five of them line up. */
function Shape({ result }: { result: StandingsResult }) {
  return (
    <span className="grid size-3.5 place-items-center">
      {result === "win" ? (
        <span className="size-2.5 rounded-full bg-foreground" />
      ) : result === "draw" ? (
        <span className="size-2.5 rounded-full border-[1.5px] border-foreground" />
      ) : (
        <span className="h-[2px] w-2.5 rounded-full bg-foreground" />
      )}
    </span>
  );
}

/**
 * A club's last results as shapes, oldest on the left. The shapes are for the eye and are hidden from a screen reader,
 * which gets the same thing as a sentence: "Last five: win, win, draw, loss, win". Hovering the shapes shows the
 * sentence too.
 */
function Form({ results, labels }: { results: readonly StandingsResult[]; labels: StandingsLabels }) {
  if (results.length === 0) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true" className="inline-block h-px w-3 bg-muted-foreground/70 align-middle" />
        <span className="sr-only">{labels.noForm}</span>
      </span>
    );
  }
  const sentence = fill(labels.lastFive, { results: results.map((result) => labels[result]).join(", ") });
  return (
    <span className="inline-flex items-center">
      <span aria-hidden="true" title={sentence} className="inline-flex gap-0.5">
        {results.map((result, index) => (
          <Shape key={index} result={result} />
        ))}
      </span>
      <span className="sr-only">{sentence}</span>
    </span>
  );
}

/** A figure column's heading: the short word for the eye, the long one for a screen reader. */
function Heading({ words, className }: { words: { short: string; long: string }; className?: string }) {
  return (
    <TableHead scope="col" className={cn("px-2.5 text-right", className)}>
      <span aria-hidden="true">{words.short}</span>
      <span className="sr-only">{words.long}</span>
    </TableHead>
  );
}

/**
 * A league table: position, club, played, won, drawn, lost, goal difference and points, with the last five results as
 * shapes. Figures are right-aligned in tabular digits so the places line up, points are set in weight, and goal
 * difference always carries its sign (+12, 0, −3, with a true minus). Form is drawn as a filled shape for a win, a
 * hollow one for a draw and a dash for a loss, and read out as a sentence. The zones of the table (the places that
 * go up, into a play-off or down) get a rule on the left of their rows, solid, dashed or dotted, and a legend that says
 * what each one means in words, and a screen reader hears the zone after the club's name, so none of it rests on
 * colour. Narrow it and the columns step aside (position, club, played and points stay, and under 22rem the crest goes
 * too, so a club's name is never clipped), and it needs no script: it renders on the server and takes plain data.
 */
export function StandingsTable({ rows, zones = [], highlightTeam, caption, locale = "en-US", labels: custom, className, ...props }: StandingsTableProps) {
  const labels: StandingsLabels = { ...LABELS, ...custom, columns: { ...COLUMN_WORDS, ...custom?.columns } };
  const format = makeFormats(locale);
  const forms = rows.map((row) => parseForm(row.form));
  const showForm = forms.some((form) => form.length > 0);

  if (rows.length === 0) {
    return (
      <section data-slot="standings-table" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
      </section>
    );
  }

  const range = (zone: StandingsZone) => {
    const [from, to] = [Math.min(zone.from, zone.to), Math.max(zone.from, zone.to)];
    return from === to ? fill(labels.position, { position: format.count(from) }) : fill(labels.positions, { from: format.count(from), to: format.count(to) });
  };

  return (
    <section data-slot="standings-table" className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table className="caption-top">
          {caption ? <TableCaption className="mt-0 px-5 pt-5 pb-4 text-left text-base font-medium tracking-[-0.01em] text-foreground">{caption}</TableCaption> : null}
          <TableHeader className="bg-muted/40">
            <TableRow>
              <Heading words={labels.columns.position} className="w-14 pr-2 pl-5 text-left" />
              <TableHead scope="col" className="w-full px-3 text-left">
                {labels.club}
              </TableHead>
              <Heading words={labels.columns.played} />
              <Heading words={labels.columns.won} className={FROM_LG} />
              <Heading words={labels.columns.drawn} className={FROM_LG} />
              <Heading words={labels.columns.lost} className={FROM_LG} />
              <Heading words={labels.columns.goalsFor} className={FROM_4XL} />
              <Heading words={labels.columns.goalsAgainst} className={FROM_4XL} />
              <Heading words={labels.columns.goalDifference} className={FROM_LG} />
              <Heading words={labels.columns.points} className="pr-5 text-foreground" />
              {showForm ? (
                <TableHead scope="col" className={cn(FROM_2XL, "pr-5 pl-4 text-left")}>
                  {labels.form}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const position = row.position ?? index + 1;
              const zone = zoneAt(position, zones);
              const tone = zone ? (zone.tone ?? "neutral") : null;
              const highlighted = highlightTeam !== undefined && row.team === highlightTeam;
              return (
                <TableRow key={row.team} data-highlighted={highlighted || undefined} data-zone={tone ?? undefined} className="data-[highlighted]:bg-muted data-[highlighted]:hover:bg-muted">
                  <TableCell className={cn("relative pr-2 pl-5 text-left font-medium tabular-nums", tone && RULE, tone && RULES[tone])}>{format.count(position)}</TableCell>
                  <th scope="row" className="w-full max-w-0 px-3 py-2.5 text-left align-middle">
                    <span className="flex min-w-0 items-center gap-3">
                      {/* The crest gives way below 22rem of the table's own width: a club's name matters more than its badge, and the highlighted club must read whole at 320. */}
                      <Avatar size="sm" aria-hidden="true" className="hidden size-7 @min-[22rem]:flex">
                        {row.logo ? <AvatarImage src={row.logo} alt="" /> : null}
                        <AvatarFallback>{initialsOf(row.team)}</AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className={cn("truncate", highlighted ? "font-semibold" : "font-medium")}>{row.team}</span>
                        {highlighted ? <IconStar aria-hidden="true" className="size-3.5 shrink-0 fill-current" /> : null}
                      </span>
                      {highlighted ? <span className="sr-only">, {labels.highlighted}</span> : null}
                      {zone ? <span className="sr-only">, {fill(labels.zone, { label: zone.label })}</span> : null}
                    </span>
                  </th>
                  <TableCell className="px-2.5 text-right tabular-nums">{format.count(row.played)}</TableCell>
                  <TableCell className={cn(FROM_LG, "px-2.5 text-right tabular-nums")}>{format.count(row.won)}</TableCell>
                  <TableCell className={cn(FROM_LG, "px-2.5 text-right tabular-nums")}>{format.count(row.drawn)}</TableCell>
                  <TableCell className={cn(FROM_LG, "px-2.5 text-right tabular-nums")}>{format.count(row.lost)}</TableCell>
                  <TableCell className={cn(FROM_4XL, "px-2.5 text-right tabular-nums text-muted-foreground")}>{format.count(row.for)}</TableCell>
                  <TableCell className={cn(FROM_4XL, "px-2.5 text-right tabular-nums text-muted-foreground")}>{format.count(row.against)}</TableCell>
                  <TableCell className={cn(FROM_LG, "px-2.5 text-right tabular-nums")}>{format.signed(row.for - row.against)}</TableCell>
                  <TableCell className="pr-5 pl-2.5 text-right font-semibold tabular-nums">{format.count(row.points)}</TableCell>
                  {showForm ? (
                    <TableCell className={cn(FROM_2XL, "pr-5 pl-4")}>
                      <Form results={forms[index] ?? []} labels={labels} />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 grid gap-2.5 text-xs text-muted-foreground">
        {zones.length > 0 ? (
          <ul role="list" aria-label={labels.zones} className="flex flex-wrap gap-x-6 gap-y-2">
            {zones.map((zone) => (
              <li key={`${zone.from}-${zone.to}-${zone.label}`} className="flex items-center gap-2">
                <span aria-hidden="true" className={cn("h-4 w-[3px] shrink-0", SWATCHES[zone.tone ?? "neutral"])} />
                <span>
                  <span className="font-medium text-foreground">{zone.label}</span>
                  <span className="sr-only">, </span>
                  <span aria-hidden="true"> &middot; </span>
                  <span className="tabular-nums">{range(zone)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {/* The shapes are only on screen from 42rem, where the form column is, so the key for them is too. */}
        {showForm ? (
          <p className="hidden flex-wrap items-center gap-x-3 gap-y-1 @2xl:flex">
            <span>{labels.formKey}</span>
            {(["win", "draw", "loss"] as const).map((result) => (
              <span key={result} className="inline-flex items-center gap-1">
                <Shape result={result} />
                {labels[result]}
              </span>
            ))}
          </p>
        ) : null}
        {/* Each abbreviation is explained only while its column is on screen. A screen reader has the long words in the headings. */}
        <p aria-hidden="true" className="flex flex-wrap gap-x-3 gap-y-1">
          {KEY.map(({ column, show }) => (
            <span key={column} className={show}>
              <span className="font-medium text-foreground">{labels.columns[column].short}</span> {labels.columns[column].long}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
