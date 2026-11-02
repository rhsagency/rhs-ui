import { useId, type ComponentProps } from "react";

import { dateIn, fill, type DateInput } from "@rhs-ui/application/match-score-card/format";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

/** Where the match stands: not started, being played, or over. */
export type MatchStatus = "scheduled" | "live" | "finished";

/** One side of the match. */
export interface MatchTeam {
  /** The team's name: "Halcyon FC". */
  name: string;
  /** Its crest, as an image address. Without one the card shows the team's initials. */
  logo?: string;
  /** Its goals, points or runs. Leave it out for a match that has not started. */
  score?: number;
}

/** The words the card uses, for translation. `{home}`, `{homeScore}`, `{away}`, `{awayScore}`, `{minute}`, `{date}`, `{time}` and `{team}` are filled in. */
export interface MatchScoreCardLabels {
  /** The word beside the pulsing dot. Default "Live". */
  live?: string;
  /** The minute under it, as shown. Default "{minute} min". */
  minute?: string;
  /** What a finished match says. Default "Full time". */
  fullTime?: string;
  /** What a match without a kickoff says. Default "TBC". */
  toBeConfirmed?: string;
  /** The name of a finished match. Default "{home} {homeScore}, {away} {awayScore}, full time". */
  finishedName?: string;
  /** The name of a live match. Default "{home} {homeScore}, {away} {awayScore}, live, {minute} minutes". */
  liveName?: string;
  /** The same when the minute is not known. Default "{home} {homeScore}, {away} {awayScore}, live". */
  liveNameNoMinute?: string;
  /** The name of a match that has not started. Default "{home} versus {away}, {date}, {time}". */
  scheduledName?: string;
  /** The same when the kickoff is not known. Default "{home} versus {away}, time to be confirmed". */
  scheduledNameTbc?: string;
  /** Said after the name of a match with a winner. Default "{team} won". */
  won?: string;
  /** Said after the name of a drawn match. Default "Draw". */
  draw?: string;
}

export interface MatchScoreCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The home side. */
  home: MatchTeam;
  /** The away side. */
  away: MatchTeam;
  /** Not started, live or finished. A live match shows "Live" with a pulsing dot and the minute, a finished one "Full time", a scheduled one its kickoff. */
  status: MatchStatus;
  /** The minute of a live match: a number, or text such as "45+2". */
  minute?: number | string;
  /** When the match kicks off, as an exact moment (a Date, a timestamp or an ISO string with its offset). Written in `timeZone`; a finished match shows its date. */
  kickoff?: DateInput;
  /** The competition and round: "Eredivisie · Round 12". */
  competition?: string;
  /** The match's page. The whole card opens it. */
  href?: string;
  /** The language of the dates and times. Default "en-US". */
  locale?: string;
  /** The time zone the kickoff is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: MatchScoreCardLabels;
}

const DEFAULT_LABELS = {
  live: "Live",
  minute: "{minute} min",
  fullTime: "Full time",
  toBeConfirmed: "TBC",
  finishedName: "{home} {homeScore}, {away} {awayScore}, full time",
  liveName: "{home} {homeScore}, {away} {awayScore}, live, {minute} minutes",
  liveNameNoMinute: "{home} {homeScore}, {away} {awayScore}, live",
  scheduledName: "{home} versus {away}, {date}, {time}",
  scheduledNameTbc: "{home} versus {away}, time to be confirmed",
  won: "{team} won",
  draw: "Draw",
};

/** A crest at 28px: the image on its own when there is one, the initials in a quiet tile while it loads or when there is none. */
function Crest({ team }: { team: MatchTeam }) {
  return (
    <Avatar className="size-7 rounded-md bg-transparent data-[size=default]:size-7">
      {team.logo ? <AvatarImage src={team.logo} alt="" className="object-contain" /> : null}
      <AvatarFallback className="rounded-md bg-muted text-[0.625rem] tracking-[0.02em]">{initialsOf(team.name)}</AvatarFallback>
    </Avatar>
  );
}

/** How one side reads: the winner in weight, the other quieter, a draw or a live match even. */
type Role = "winner" | "loser" | "even";

function Side({ team, role, scored }: { team: MatchTeam; role: Role; scored: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Crest team={team} />
      <span title={team.name} className={cn("min-w-0 flex-1 truncate text-sm leading-5", role === "winner" ? "font-semibold text-foreground" : role === "loser" ? "text-muted-foreground" : "font-medium text-foreground")}>{team.name}</span>
      {scored && team.score !== undefined ? (
        <span className={cn("min-w-6 shrink-0 text-right text-lg leading-6 tabular-nums", role === "winner" ? "font-semibold text-foreground" : role === "loser" ? "text-muted-foreground" : "font-medium text-foreground")}>{team.score}</span>
      ) : null}
    </div>
  );
}

/**
 * A fixture or a result as a card for a club site or a score list: two teams
 * stacked with their crests, the score on the right of each, and the state in
 * a column of its own. A live match shows "Live" beside a pulsing dot that
 * holds still under reduced motion, with the minute; a finished one says "Full
 * time" and its date; a match to come shows its kickoff in the time zone you
 * name. Scores are tabular and the winner is set in heavier type, and said in
 * words to assistive technology. The card is read as one sentence ("Halcyon FC
 * 2, Kestrel United 1, full time") and nothing else, so a list of fixtures is
 * a list of results, not of fragments. With `href` the whole card is the link.
 */
export function MatchScoreCard({ home, away, status, minute, kickoff, competition, href, locale = "en-US", timeZone = "UTC", labels, className, ...props }: MatchScoreCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const nameId = useId();
  const noteId = useId();
  const scored = status !== "scheduled";
  const homeScore = home.score;
  const awayScore = away.score;
  const winner: "home" | "away" | "draw" | null =
    status === "finished" && homeScore !== undefined && awayScore !== undefined ? (homeScore > awayScore ? "home" : awayScore > homeScore ? "away" : "draw") : null;
  const roleOf = (side: "home" | "away"): Role => (winner === null || winner === "draw" ? "even" : winner === side ? "winner" : "loser");

  const time = kickoff === undefined ? null : dateIn(kickoff, locale, timeZone, { hour: "numeric", minute: "2-digit" });
  const date = kickoff === undefined ? null : dateIn(kickoff, locale, timeZone, { weekday: "short", day: "numeric", month: "short" });
  const longDate = kickoff === undefined ? null : dateIn(kickoff, locale, timeZone, { weekday: "long", day: "numeric", month: "long" });
  const minuteText = minute === undefined ? null : fill(text.minute, { minute });
  const teams = { home: home.name, away: away.name, homeScore: homeScore ?? 0, awayScore: awayScore ?? 0 };

  const name =
    status === "finished"
      ? fill(text.finishedName, teams)
      : status === "live"
        ? fill(minute === undefined ? text.liveNameNoMinute : text.liveName, { ...teams, minute: minute ?? "" })
        : time && longDate
          ? fill(text.scheduledName, { ...teams, date: longDate, time })
          : fill(text.scheduledNameTbc, teams);

  return (
    <article
      data-slot="match-score-card"
      data-status={status}
      aria-labelledby={nameId}
      aria-describedby={winner ? noteId : undefined}
      className={cn(
        "group/match-score-card @container relative flex min-w-0 flex-col rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=match-score-card-open]:focus-visible]:border-ring has-[[data-slot=match-score-card-open]:focus-visible]:ring-[3px] has-[[data-slot=match-score-card-open]:focus-visible]:ring-ring/40",
        href && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <p id={nameId} className="sr-only">
        {name}
      </p>
      {winner ? (
        <p id={noteId} className="sr-only">
          {winner === "draw" ? text.draw : fill(text.won, { team: winner === "home" ? home.name : away.name })}
        </p>
      ) : null}
      {href ? <a data-slot="match-score-card-open" href={href} aria-labelledby={nameId} aria-describedby={winner ? noteId : undefined} className="absolute inset-0 rounded-xl outline-none" /> : null}

      <div aria-hidden="true" className="flex flex-col gap-3">
        {competition ? <p className="truncate text-xs leading-4 font-medium text-muted-foreground">{competition}</p> : null}
        <div className="flex flex-col gap-3 @min-[20rem]:flex-row @min-[20rem]:items-stretch @min-[24rem]:gap-4">
          <div className="grid min-w-0 flex-1 gap-2.5">
            <Side team={home} role={roleOf("home")} scored={scored} />
            <Side team={away} role={roleOf("away")} scored={scored} />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-x-3 border-t border-border pt-3 @min-[20rem]:w-20 @min-[20rem]:flex-col @min-[20rem]:justify-center @min-[20rem]:gap-0.5 @min-[20rem]:border-t-0 @min-[20rem]:border-l @min-[20rem]:pt-0 @min-[20rem]:pl-3 @min-[20rem]:text-center @min-[24rem]:w-[5.5rem] @min-[24rem]:pl-4">
            {status === "live" ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs leading-4 font-semibold">
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full rounded-full bg-foreground opacity-50 motion-safe:animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-foreground" />
                  </span>
                  {text.live}
                </span>
                {minuteText ? <span className="text-sm leading-5 font-medium tabular-nums">{minuteText}</span> : null}
              </>
            ) : status === "finished" ? (
              <>
                <span className="text-xs leading-4 font-semibold">{text.fullTime}</span>
                {date ? <span className="text-xs leading-4 text-muted-foreground tabular-nums">{date}</span> : null}
              </>
            ) : (
              <>
                {kickoff !== undefined && time ? (
                  <time dateTime={new Date(kickoff).toISOString()} className="text-lg leading-6 font-semibold tracking-[-0.02em] tabular-nums">
                    {time}
                  </time>
                ) : (
                  <span className="text-sm leading-5 font-semibold">{text.toBeConfirmed}</span>
                )}
                {date ? <span className="text-xs leading-4 text-muted-foreground tabular-nums">{date}</span> : null}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
