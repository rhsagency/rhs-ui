"use client";

import { useState, type ComponentProps, type CSSProperties } from "react";

import { IconTrophy, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface ScorecardCriterion {
  /** Identity, the first key of `scores`. */
  id: string;
  /** What is being judged: "Price". It is the row header. */
  label: string;
  /** How much it counts, on any scale you like: 3, 2, 1 or 40, 30, 30. It is shown as a share that adds up to 100 percent. */
  weight: number;
  /** One quiet line under the label: what good looks like. */
  description?: string;
}

export interface ScorecardOption {
  /** Identity, the second key of `scores`. */
  id: string;
  /** What is being chosen: "Northwind". It is the column header. */
  name: string;
}

/** A score per criterion and per option: `scores[criterionId][optionId]`. A missing score means not scored yet. */
export type ScorecardScores = Readonly<Record<string, Readonly<Record<string, number | undefined>>>>;

export interface WeightedScorecardProps extends Omit<ComponentProps<"div">, "children" | "defaultValue"> {
  /** What the options are judged on, one row each. */
  criteria: readonly ScorecardCriterion[];
  /** What is being chosen between, one column each. */
  options: readonly ScorecardOption[];
  /** The scores, for controlled use. Pair it with `onScoreChange`. */
  scores?: ScorecardScores;
  /** The scores to start from when you do not control them. */
  defaultScores?: ScorecardScores;
  /** Called with a new score, or `undefined` when someone clears one. */
  onScoreChange?: (criterionId: string, optionId: string, score: number | undefined) => void;
  /** The top of the scale. Scores run from 1 to this. */
  max?: number;
  /** Show the scores as plain numbers instead of selects. */
  readOnly?: boolean;
  /** BCP 47 locale for the numbers. */
  locale?: string;
  /** Names the table for screen readers. */
  caption?: string;
}

/** Whole percents for the weights that add up to exactly 100: the largest remainders get the leftover points. */
function percentShares(weights: readonly number[]): number[] {
  const clean = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0));
  const total = clean.reduce((sum, weight) => sum + weight, 0);
  const raw = clean.map((weight) => (total === 0 ? 100 / clean.length : (weight / total) * 100));
  const shares = raw.map(Math.floor);
  let left = 100 - shares.reduce((sum, share) => sum + share, 0);
  const byRemainder = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) })).sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of byRemainder) {
    if (left <= 0) break;
    shares[index] = (shares[index] ?? 0) + 1;
    left -= 1;
  }
  return shares;
}

/** The same quiet fill for the total row, solid so a label that sticks while the table scrolls hides what passes beneath it. */
const TOTAL_FILL = "bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]";

/** The line after the sticky criteria column. A collapsed border stays where the column started while the table scrolls; an inset shadow travels with the cell. */
const STICKY_DIVIDER = "[box-shadow:inset_-1px_0_0_var(--border)]";

/**
 * A decision matrix: criteria with their weights down the side, the options
 * you are choosing between across the top, a score in every cell and weighted
 * totals underneath that name the winner. Each cell is a compact select read
 * out as "4 out of 5"; weights show as shares that always add up to 100
 * percent; a cell with no score is flagged in words, and no option is called
 * the leader until every cell is filled in. The leader is marked "Highest
 * score" (a phone's narrow column says "Top"), a tie is called a tie, and a
 * line above the table says it so a screen reader hears every change.
 * Criteria are row headers and options column headers.
 */
export function WeightedScorecard({
  criteria,
  options,
  scores,
  defaultScores,
  onScoreChange,
  max = 5,
  readOnly = false,
  locale = "en-US",
  caption = "Weighted scorecard",
  className,
  ...props
}: WeightedScorecardProps) {
  const [own, setOwn] = useState<ScorecardScores>(defaultScores ?? {});
  const current = scores ?? own;
  const top = Math.max(2, Math.round(max));
  const digits = String(top).length;
  const decimals = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const names = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

  const read = (criterion: ScorecardCriterion, option: ScorecardOption): number | undefined => {
    const value = current[criterion.id]?.[option.id];
    return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= top ? value : undefined;
  };
  const change = (criterion: ScorecardCriterion, option: ScorecardOption, score: number | undefined): void => {
    if (scores === undefined) setOwn((previous) => ({ ...previous, [criterion.id]: { ...previous[criterion.id], [option.id]: score } }));
    onScoreChange?.(criterion.id, option.id, score);
  };

  // Each option column asks for an equal share of what the criteria column leaves on a phone, so the columns line up whatever sits in them.
  const tableVars = { "--option-share": `${Math.floor(72 / Math.max(options.length, 1))}%` } as CSSProperties;
  const shares = percentShares(criteria.map((criterion) => criterion.weight));
  const weightTotal = criteria.reduce((sum, criterion) => sum + (Number.isFinite(criterion.weight) && criterion.weight > 0 ? criterion.weight : 0), 0);
  const weightOf = (criterion: ScorecardCriterion): number => (weightTotal === 0 ? 1 / criteria.length : Math.max(0, criterion.weight) / weightTotal);

  const columns = options.map((option) => {
    const missing = criteria.filter((criterion) => read(criterion, option) === undefined);
    const weighted = missing.length === 0 && criteria.length > 0 ? criteria.reduce((sum, criterion) => sum + weightOf(criterion) * (read(criterion, option) ?? 0), 0) : null;
    return { option, missing: missing.length, weighted };
  });
  const gaps = columns.reduce((sum, column) => sum + column.missing, 0);
  // Compare what is shown, to two decimals, so "tied" never contradicts the numbers on screen.
  const rounded = (value: number): number => Math.round(value * 100) / 100;
  const ranked = columns
    .filter((column): column is typeof column & { weighted: number } => column.weighted !== null)
    .map((column) => ({ ...column, shown: rounded(column.weighted) }))
    .sort((a, b) => b.shown - a.shown);
  const decided = columns.length > 1 && gaps === 0 && ranked.length > 1;
  const best = ranked[0]?.shown;
  const leaders = decided ? ranked.filter((column) => column.shown === best) : [];
  const runnerUp = decided && leaders.length === 1 ? ranked[1] : undefined;
  const leading = new Set(leaders.map((column) => column.option.id));

  const verdict =
    !columns.length || !criteria.length
      ? ""
      : gaps > 0
        ? `${gaps} ${gaps === 1 ? "score is" : "scores are"} missing. Fill in every cell to see which option has the highest score.`
        : leaders.length > 1
          ? `${names.format(leaders.map((column) => column.option.name))} are tied at ${decimals.format(best ?? 0)} out of ${top}.`
          : leaders[0] && best !== undefined
            ? `${leaders[0].option.name} has the highest score: ${decimals.format(best)} out of ${top}${runnerUp ? `, ${decimals.format(best - runnerUp.shown)} ahead of ${runnerUp.option.name}` : ""}.`
            : "";

  return (
    <div data-slot="weighted-scorecard" className={cn("w-full min-w-0", className)} {...props}>
      <p role="status" className="mb-3 flex min-h-5 items-center gap-2 text-sm">
        {verdict ? (
          <>
            {decided ? <IconTrophy aria-hidden="true" className="size-4 shrink-0" /> : <IconWarning aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
            <span className={decided ? "font-medium" : "text-muted-foreground"}>{verdict}</span>
          </>
        ) : null}
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
        {/* A table that scrolls sideways takes the keyboard too: the region can be focused and scrolled with the arrow keys. */}
        <div
          role="region"
          aria-label={caption}
          tabIndex={0}
          className="relative overflow-x-auto bg-inherit outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
        >
          {/* On a phone the criteria column and every option column shrink so two or three options fit side by side; from 640px the table has room to breathe and scrolls only when it must. */}
          <table data-slot="table" style={tableVars} className="w-full caption-bottom border-collapse bg-inherit text-sm sm:min-w-[36rem]">
            <TableCaption className="sr-only">{caption}</TableCaption>
            <TableHeader className="bg-inherit">
              <TableRow className="bg-inherit hover:bg-inherit">
                <TableHead scope="col" className={cn("sticky left-0 z-10 w-[5.75rem] bg-inherit px-2 text-left max-sm:text-[0.8125rem] sm:w-auto sm:min-w-48 sm:px-3", STICKY_DIVIDER)}>
                  Criterion
                </TableHead>
                <TableHead scope="col" className="hidden w-28 text-right sm:table-cell">
                  Weight
                </TableHead>
                {options.map((option) => (
                  <TableHead
                    key={option.id}
                    scope="col"
                    className={cn("px-1 text-center text-[0.8125rem] break-words whitespace-normal text-foreground max-sm:w-(--option-share) max-[23rem]:px-0.5 max-[23rem]:text-xs sm:min-w-32 sm:px-3 sm:text-sm sm:whitespace-nowrap", leading.has(option.id) && "bg-muted/60")}
                  >
                    {option.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="bg-inherit">
              {criteria.map((criterion, index) => {
                const unscored = options.filter((option) => read(criterion, option) === undefined);
                return (
                  <TableRow key={criterion.id} className="bg-inherit hover:bg-inherit">
                    <TableHead scope="row" className={cn("sticky left-0 z-10 bg-inherit px-2 py-3 text-left font-normal whitespace-normal text-foreground sm:px-3", STICKY_DIVIDER)}>
                      <span className="block font-medium max-sm:text-[0.8125rem]">{criterion.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">{shares[index]}% of the score</span>
                      {/* Too long for the narrow column on a phone: kept for screen readers, shown from 640px. */}
                      {criterion.description ? <span className="mt-0.5 block text-xs text-muted-foreground max-sm:sr-only">{criterion.description}</span> : null}
                      {unscored.length ? (
                        <span className="mt-1.5 flex items-start gap-1.5 text-xs font-medium">
                          <IconWarning aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                          Not scored for {names.format(unscored.map((option) => option.name))}
                        </span>
                      ) : null}
                    </TableHead>
                    <TableCell className="hidden text-right sm:table-cell">
                      <span className="sr-only">Weight: {shares[index]} percent</span>
                      <span aria-hidden="true" className="font-medium tabular-nums">
                        {shares[index]}%
                      </span>
                      <span aria-hidden="true" className="mt-1.5 ml-auto block h-1 w-12 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-foreground" style={{ width: `${shares[index]}%` }} />
                      </span>
                    </TableCell>
                    {options.map((option) => {
                      const score = read(criterion, option);
                      const spoken = `${criterion.label} for ${option.name}: ${score === undefined ? "not scored" : `${score} out of ${top}`}`;
                      return (
                        <TableCell key={option.id} className={cn("px-1 text-center sm:px-3", leading.has(option.id) && "bg-muted/60")}>
                          {readOnly ? (
                            score === undefined ? (
                              <span className="text-sm text-muted-foreground">Not scored</span>
                            ) : (
                              <>
                                <span className="sr-only">{spoken}</span>
                                <span aria-hidden="true" className="tabular-nums">
                                  <span className="font-medium">{score}</span>
                                  <span className="text-muted-foreground"> / {top}</span>
                                </span>
                              </>
                            )
                          ) : (
                            <Select
                              value={score === undefined ? "" : String(score)}
                              onValueChange={(next) => change(criterion, option, next === "none" ? undefined : Number(next))}
                            >
                              <SelectTrigger
                                size="sm"
                                aria-label={spoken}
                                className={cn(
                                  "mx-auto w-14 tabular-nums max-sm:px-2 sm:w-[4.5rem]",
                                  // A second digit needs room: on a phone the trigger gives up padding for it rather than grow, so the columns keep their width.
                                  digits > 1 && "max-sm:gap-1 max-sm:px-1.5",
                                  digits > 2 && "max-sm:w-16 sm:w-20",
                                  score === undefined && "border-dashed text-muted-foreground",
                                )}
                              >
                                <SelectValue placeholder="–" />
                              </SelectTrigger>
                              <SelectContent align="center">
                                {Array.from({ length: top }, (_, step) => step + 1).map((value) => (
                                  <SelectItem key={value} value={String(value)} className="tabular-nums">
                                    {value}
                                    <span className="sr-only"> out of {top}</span>
                                  </SelectItem>
                                ))}
                                <SelectSeparator />
                                <SelectItem value="none">Not scored</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>

            <TableFooter className={cn("border-t border-border", TOTAL_FILL)}>
              <TableRow className={cn("hover:bg-inherit", TOTAL_FILL)}>
                <TableHead
                  scope="row"
                  className={cn("sticky left-0 z-10 px-2 py-4 text-left align-baseline font-normal whitespace-normal text-foreground sm:px-3", STICKY_DIVIDER, TOTAL_FILL)}
                >
                  <span className="block font-medium max-sm:text-[0.8125rem]">Weighted score</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground max-sm:sr-only">Out of {top}, weights add up to 100%</span>
                </TableHead>
                <TableCell className="hidden text-right align-baseline font-medium tabular-nums sm:table-cell">{criteria.length ? "100%" : ""}</TableCell>
                {columns.map((column) => (
                  <TableCell key={column.option.id} className={cn("px-1 py-4 text-center align-baseline sm:px-3", leading.has(column.option.id) && "bg-muted/60")}>
                    {column.weighted === null ? (
                      <>
                        <span aria-hidden="true" className="text-lg text-muted-foreground">
                          &ndash;
                        </span>
                        {column.missing > 0 ? (
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {column.missing} {column.missing === 1 ? "score" : "scores"} missing
                          </span>
                        ) : (
                          <span className="sr-only">No weighted score yet</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="sr-only">
                          {column.option.name} weighted score: {decimals.format(column.weighted)} out of {top}
                        </span>
                        <span aria-hidden="true" className="tabular-nums">
                          <span className="text-lg font-medium tracking-[-0.02em] sm:text-xl">{decimals.format(column.weighted)}</span>
                          <span className="text-xs font-normal text-muted-foreground sm:text-sm"> / {top}</span>
                        </span>
                        {leading.has(column.option.id) ? (
                          <Badge variant={leaders.length > 1 ? "outline" : "default"} className="mx-auto mt-2 flex max-sm:[&>svg]:hidden">
                            <IconTrophy aria-hidden="true" />
                            {/* A narrow column has no room for the full words: a phone shows one short word and keeps the full text for screen readers. */}
                            <span className="max-sm:sr-only">{leaders.length > 1 ? "Tied for highest score" : "Highest score"}</span>
                            <span aria-hidden="true" className="sm:hidden">
                              {leaders.length > 1 ? "Tied" : "Top"}
                            </span>
                          </Badge>
                        ) : null}
                      </>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          </table>
        </div>
      </div>
    </div>
  );
}
