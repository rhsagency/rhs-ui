import type { ComponentProps, ReactNode } from "react";

import { fill } from "@rhs-ui/application/match-timeline/format";
import { Glyph, IconArrowLeftRight, IconSoccer, IconTarget, IconXCircle } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/** What happened. An own goal counts for the other side. */
export type MatchEventType = "goal" | "penalty" | "own-goal" | "penalty-missed" | "yellow-card" | "red-card" | "substitution";

/** One thing that happened in the match. */
export interface MatchEvent {
  /** A stable id: it keys the line. */
  id: string;
  /** The minute on the clock: 34. For added time this is the minute it was added to, 45, and `extraMinute` is how far in. */
  minute: number;
  /** Added time: minute 45 with an extraMinute of 2 reads "45+2". */
  extraMinute?: number;
  /** The side of the player the event belongs to. An own goal sits on the side of the player who scored it and counts for the other. */
  side: "home" | "away";
  /** What it was. */
  type: MatchEventType;
  /** Who: the scorer, the player who was carded, or the player who came on. */
  player: string;
  /** For a goal, who set it up. */
  assist?: string;
  /** A line more, in a quieter tone: "Header from a corner", or for a substitution "for Jonas Weber". */
  detail?: string;
}

/** Not started, being played, or over. A finished match ends with "Full time" and a live one with a pulsing "Live". */
export type MatchTimelineStatus = "scheduled" | "live" | "finished";

/** The words the timeline uses, for translation. `{minute}`, `{extra}`, `{name}`, `{home}` and `{away}` are filled in. */
export interface MatchTimelineLabels {
  /** The name of the list. Default "Match events". */
  title?: string;
  /** The word for each kind of event. */
  types?: Partial<Record<MatchEventType, string>>;
  /** What a screen reader hears for a minute. Default "Minute {minute}". */
  minute?: string;
  /** The same for added time. Default "Minute {minute} plus {extra}". */
  minuteAdded?: string;
  /** Said before the running score after a goal. Default "Score". */
  score?: string;
  /** Before the assist. Default "Assist: {name}". */
  assist?: string;
  /** The small word over the home team's name on a wide screen. Default "Home". */
  homeSide?: string;
  /** The small word over the away team's name. Default "Away". */
  awaySide?: string;
  /** The half-time break. Default "Half time". */
  halfTime?: string;
  /** The full-time break. Default "Full time". */
  fullTime?: string;
  /** The last line of a live match. Default "Live". */
  live?: string;
  /** The score as it is read. Default "{home} to {away}". */
  scoreTo?: string;
  /** What the list says when nothing has happened yet. Default "No events yet". */
  empty?: string;
}

export interface MatchTimelineProps extends Omit<ComponentProps<"div">, "children"> {
  /** What happened, in any order: they are sorted by the clock. */
  events: readonly MatchEvent[];
  /** The home team's name. */
  home: string;
  /** The away team's name. */
  away: string;
  /** Not started, live or finished. A finished match shows its half-time and full-time breaks, a live one ends with "Live". Default "finished". */
  status?: MatchTimelineStatus;
  /** The minute the first half ends, where the "Half time" break goes. Default 45. */
  halfTimeAt?: number;
  /** The words the timeline uses, for translation. */
  labels?: MatchTimelineLabels;
}

const DEFAULT_LABELS = {
  title: "Match events",
  minute: "Minute {minute}",
  minuteAdded: "Minute {minute} plus {extra}",
  score: "Score",
  assist: "Assist: {name}",
  homeSide: "Home",
  awaySide: "Away",
  halfTime: "Half time",
  fullTime: "Full time",
  live: "Live",
  scoreTo: "{home} to {away}",
  empty: "No events yet",
};

const DEFAULT_TYPES: Record<MatchEventType, string> = {
  goal: "Goal",
  penalty: "Penalty",
  "own-goal": "Own goal",
  "penalty-missed": "Penalty missed",
  "yellow-card": "Yellow card",
  "red-card": "Red card",
  substitution: "Substitution",
};

/** A card is drawn as a card, held up at a slant: outlined for a yellow, solid for a red, so the two differ in shape and weight and not only in colour. */
function CardGlyph({ solid }: { solid: boolean }) {
  return (
    <Glyph>
      <rect x="7" y="3.5" width="10" height="17" rx="2" fill={solid ? "currentColor" : "none"} transform="rotate(10 12 12)" />
    </Glyph>
  );
}

const GLYPHS: Record<MatchEventType, ReactNode> = {
  goal: <IconSoccer />,
  penalty: <IconTarget />,
  "own-goal": <IconSoccer />,
  "penalty-missed": <IconXCircle />,
  "yellow-card": <CardGlyph solid={false} />,
  "red-card": <CardGlyph solid />,
  substitution: <IconArrowLeftRight />,
};

/** The score as it stood. */
interface Score {
  home: number;
  away: number;
}

/** The pieces of a row on the line: a break (half time, full time, live) or an event, with the score as it stood. */
type Row = { kind: "event"; event: MatchEvent; score: Score | null; scoring: boolean } | { kind: "break"; id: string; label: string; score: Score | null; live?: boolean };

const clock = (event: MatchEvent) => event.minute * 1000 + (event.extraMinute ?? 0);

/** What an event does to the score: a goal or a scored penalty counts for its own side, an own goal for the other. */
function scorer(event: MatchEvent): "home" | "away" | null {
  if (event.type === "goal" || event.type === "penalty") return event.side;
  if (event.type === "own-goal") return event.side === "home" ? "away" : "home";
  return null;
}

/** "1–0" for the eye. The ear gets the same in words from the spoken line, since a dash is read as nothing, or as "dash". */
function ScoreText({ score }: { score: Score }) {
  return (
    <>
      {score.home}–{score.away}
    </>
  );
}

/**
 * The events of a match on a centre line, in the order they happened: goals,
 * cards and substitutions with the minute, the player and the side they belong
 * to. When the timeline is wide enough, home events sit on the left of the
 * line and away events on the right; below that everything runs in one column
 * and each event names its team. Every event has an icon and a word ("Goal",
 * "Yellow card"), so it reads without colour, goals stand out in a solid icon,
 * the running score follows each goal, and added time reads "45+2". Half time
 * and full time are labelled breaks. It is an ordered list, and each line is
 * read as one sentence in the order minute, event, player, whatever side it
 * sits on.
 */
export function MatchTimeline({ events, home, away, status = "finished", halfTimeAt = 45, labels, className, ...props }: MatchTimelineProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const types = { ...DEFAULT_TYPES, ...labels?.types };
  const ordered = events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => clock(a.event) - clock(b.event) || a.index - b.index)
    .map((entry) => entry.event);

  // Walk the match once: the score after each event, and where the breaks fall.
  const score: Score = { home: 0, away: 0 };
  const rows: Row[] = [];
  let halfShown = false;
  const half = () => {
    if (halfShown) return;
    halfShown = true;
    rows.push({ kind: "break", id: "half-time", label: text.halfTime, score: { ...score } });
  };
  for (const event of ordered) {
    if (event.minute > halfTimeAt) half();
    const side = scorer(event);
    if (side) score[side] += 1;
    rows.push({ kind: "event", event, score: side ? { ...score } : null, scoring: side !== null });
  }
  if (status === "finished") {
    half();
    rows.push({ kind: "break", id: "full-time", label: text.fullTime, score: { ...score } });
  } else if (status === "live" && ordered.length) {
    rows.push({ kind: "break", id: "live", label: text.live, score: null, live: true });
  }

  const spoken = (value: Score) => `${text.score} ${fill(text.scoreTo, { home: value.home, away: value.away })}`;

  return (
    <div data-slot="match-timeline" data-status={status} className={cn("@container w-full", className)} {...props}>
      <div aria-hidden="true" className="mb-6 hidden grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-end gap-x-4 @lg:grid">
        <div className="min-w-0 text-right">
          <p className="text-[0.6875rem] leading-4 font-medium tracking-[0.08em] text-muted-foreground uppercase">{text.homeSide}</p>
          <p className="truncate text-sm leading-5 font-semibold tracking-[-0.01em]">{home}</p>
        </div>
        <span />
        <div className="min-w-0">
          <p className="text-[0.6875rem] leading-4 font-medium tracking-[0.08em] text-muted-foreground uppercase">{text.awaySide}</p>
          <p className="truncate text-sm leading-5 font-semibold tracking-[-0.01em]">{away}</p>
        </div>
      </div>

      {rows.length ? (
        <ol aria-label={text.title} className="relative before:absolute before:inset-y-6 before:left-7 before:w-px before:-translate-x-1/2 before:bg-border before:content-[''] @lg:before:left-1/2">
          {rows.map((row) =>
            row.kind === "break" ? (
              <li key={row.id} className="flex py-3 @lg:justify-center">
                <span className={cn("relative z-10 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs leading-4 font-semibold tabular-nums", row.live && "bg-card")}>
                  {row.live ? (
                    <span aria-hidden="true" className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex size-full rounded-full bg-foreground opacity-50 motion-safe:animate-ping" />
                      <span className="relative inline-flex size-2 rounded-full bg-foreground" />
                    </span>
                  ) : null}
                  {row.label}
                  {row.score ? (
                    <>
                      <span aria-hidden="true" className="text-muted-foreground">
                        ·
                      </span>
                      <span aria-hidden="true">
                        <ScoreText score={row.score} />
                      </span>
                      <span className="sr-only">, {spoken(row.score)}</span>
                    </>
                  ) : null}
                </span>
              </li>
            ) : (
              <li key={row.event.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3 py-3 @lg:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] @lg:gap-x-4">
                {/* One sentence in the order a listener wants it: minute, event, player, then the rest. What is drawn is hidden from screen readers, which would otherwise hear it in the order it is laid out. */}
                <p className="sr-only">
                  {[
                    fill(row.event.extraMinute ? text.minuteAdded : text.minute, { minute: row.event.minute, extra: row.event.extraMinute ?? 0 }),
                    types[row.event.type],
                    row.event.player,
                    row.event.assist ? fill(text.assist, { name: row.event.assist }) : null,
                    row.event.detail ?? null,
                    row.event.side === "home" ? home : away,
                    row.score ? spoken(row.score) : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <span aria-hidden="true" className="relative z-10 col-start-1 row-start-1 mx-auto grid h-8 min-w-11 place-items-center rounded-full border border-border bg-card px-2 text-xs font-semibold tabular-nums @lg:col-start-2">
                  {row.event.minute}
                  {row.event.extraMinute ? `+${row.event.extraMinute}` : ""}&prime;
                </span>
                <div
                  aria-hidden="true"
                  className={cn("col-start-2 row-start-1 flex min-w-0 items-start gap-3", row.event.side === "home" ? "@lg:col-start-1 @lg:flex-row-reverse @lg:text-right" : "@lg:col-start-3")}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-[18px]", row.scoring ? "bg-foreground text-background" : "bg-muted text-foreground")}>{GLYPHS[row.event.type]}</span>
                  <div className="min-w-0 pt-1">
                    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 font-semibold", row.event.side === "home" && "@lg:justify-end")}>
                      {types[row.event.type]}
                      {row.score ? (
                        <span className="rounded-md bg-muted px-1.5 text-xs leading-5 font-semibold tabular-nums">
                          <ScoreText score={row.score} />
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm leading-5 [overflow-wrap:anywhere]">{row.event.player}</p>
                    {row.event.assist ? <p className="text-[0.8125rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{fill(text.assist, { name: row.event.assist })}</p> : null}
                    {row.event.detail ? <p className="text-[0.8125rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{row.event.detail}</p> : null}
                    <p className="text-xs leading-5 text-muted-foreground @lg:hidden">{row.event.side === "home" ? home : away}</p>
                  </div>
                </div>
              </li>
            ),
          )}
        </ol>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">{text.empty}</p>
      )}
    </div>
  );
}
