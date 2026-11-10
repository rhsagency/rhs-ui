"use client";

import { useEffect, useId, useState, type ComponentProps, type CSSProperties } from "react";

import { IconPin, IconPlay, IconTicket } from "@rhs-ui/icons";
import { clockText, countdownIso, countdownOf, countdownText, countText, dayText, fill, kickoffIso, LABELS, momentMs, plural, type MatchdayHeroLabels, type MomentInput } from "@rhs-ui/marketing/matchday-hero/time";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { MatchdayHeroLabels, MomentInput } from "@rhs-ui/marketing/matchday-hero/time";

export interface MatchTeam {
  /** The team's name: "Halcyon FC". */
  name: string;
  /** The crest, as an address. A data: URI works too. Leave it out, or when it fails to load, the initials of the name sit in the circle. */
  logo?: string;
}

export interface MatchFixture {
  /** The competition and the round: "Premier Division, matchday 14". */
  competition: string;
  /** The team that plays at home, shown on the left. */
  home: MatchTeam;
  /** The visiting team, shown on the right. */
  away: MatchTeam;
  /** When it kicks off, as an ISO string with its offset ("2026-11-14T15:00:00+01:00"), a Date or a timestamp. It is written in the venue's `timeZone`, not the visitor's. */
  kickoff: MomentInput;
  /** Where it is played: "Halcyon Arena, Utrecht". */
  venue: string;
  /** "live" shows the score and Live in words, and Watch live in place of Tickets. Default "upcoming". */
  status?: "upcoming" | "live";
  /** The score while it is live. */
  score?: { home: number; away: number };
  /** The minute while it is live, as the club writes it: "67" or "45+2". */
  minute?: string;
}

/** How a match ended, for the team the form guide is about. */
export type MatchResult = "win" | "draw" | "loss";

export interface MatchFormEntry {
  result: MatchResult;
  /** The other team, in full. It is spoken after the score and appears as a tooltip on the chip, so it is never cut short on the page. */
  opponent: string;
  /** The score as written, with the club's own score first: "2–1". */
  score: string;
  /** The other team in a few letters, set under the score: "WAN", "KES". Leave it out and the chip and the score stand alone. */
  short?: string;
}

export interface MatchPosition {
  /** Where the club stands, from 1. */
  rank: number;
  /** The league, with its article if it has one: "the Eredivisie". */
  league: string;
  /** The points so far. */
  points?: number;
}

export interface MatchdayHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The heading over the card. Left out, it says Next match, or Live now while the match is live. */
  title?: string;
  /** The next fixture. */
  fixture: MatchFixture;
  /** The last results, oldest first. The last five are shown, with the most recent at the end. */
  form?: readonly MatchFormEntry[];
  /** The league position, written as one line. */
  position?: MatchPosition;
  /** Where to buy tickets. Leave it out for no button. */
  ticketsHref?: string;
  /** Where to watch the match live. It takes the place of the tickets button while the match is live. */
  liveHref?: string;
  /** The venue's time zone as an IANA name: "Europe/Amsterdam". The kick-off is written in it. Default "UTC". */
  timeZone?: string;
  /** The language of the dates and the numbers. Default "en-US". The rank is written 1st, 2nd, 3rd for an English locale only; for another language it is a plain number until you pass its endings in `labels.ordinals`. */
  locale?: string;
  /** "h23" writes 15:00 whatever the locale, "h12" writes 3:00 PM. Default "h23". */
  hourCycle?: "h12" | "h23";
  /** A fixed moment to work the countdown out from, for previews and tests. Leave it out and the visitor's own clock is read once the page is live, so the server never prints a stale countdown. */
  now?: MomentInput;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<MatchdayHeroLabels>;
}

/** Fill levels, not colours: a win is solid, a draw is half, a loss is empty, and every chip carries its letter. */
const CHIP: Record<MatchResult, string> = {
  win: "bg-foreground text-background",
  draw: "border border-foreground/40 bg-muted text-foreground",
  loss: "border border-border bg-background text-muted-foreground",
};

function Crest({ team }: { team: MatchTeam }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      {/* The avatar sizes itself with a data-size selector, so the size here answers the same selector. */}
      <Avatar className="border border-border bg-card data-[size=default]:size-16 sm:data-[size=default]:size-24">
        {team.logo ? <AvatarImage src={team.logo} alt="" className="object-contain p-2 sm:p-3" /> : null}
        <AvatarFallback className="bg-card text-xl font-semibold tracking-[-0.02em] sm:text-3xl">{initialsOf(team.name)}</AvatarFallback>
      </Avatar>
      <p className="max-w-full text-base leading-tight font-medium tracking-[-0.01em] text-balance [overflow-wrap:anywhere] sm:text-xl">{team.name}</p>
    </div>
  );
}

/**
 * A club's opening on matchday: the next fixture as one card in the middle of
 * the page. Two teams with their crests, or their initials in a circle where
 * there is no crest; the competition; the kick-off in the venue's own time
 * zone as a time element; the venue; and a Tickets button. When the match is
 * less than a week away, a countdown in days and hours appears in the corner
 * of the card, worked out in the browser so the server never prints a stale
 * one. Under the fixture, the form guide shows the last five results as chips
 * (Win, Draw and Loss are fill levels with a letter and are spelled out for
 * screen readers) with their scores and, when you give one, a short name for
 * the opponent under each; the full name is spoken after the score. The
 * league position is one line. While the match is live the card shows the
 * score with Live in words and the tickets button becomes Watch live. For
 * football, hockey, basketball and esports clubs.
 */
export function MatchdayHero({
  titleAs: Title = "h2",
  title,
  fixture,
  form = [],
  position,
  ticketsHref,
  liveHref,
  timeZone = "UTC",
  locale = "en-US",
  hourCycle = "h23",
  now,
  labels: custom,
  className,
  ...props
}: MatchdayHeroProps) {
  // The English endings (1st, 2nd, 3rd) are English: in another language the rank stays a plain number until you pass the endings of that language in labels.ordinals.
  const ordinals = custom?.ordinals ?? (/^en(-|$)/i.test(locale) ? LABELS.ordinals : { other: "{n}" });
  const words = { ...LABELS, ...custom, ordinals, points: { ...LABELS.points, ...custom?.points } };
  const id = useId();
  const live = fixture.status === "live";
  const kickoff = momentMs(fixture.kickoff);
  const known = !Number.isNaN(kickoff);
  const pinned = now !== undefined && !Number.isNaN(momentMs(now));
  const [tick, setTick] = useState<number | null>(null);

  // The browser's clock, read once the page is live and then every minute: null on the server and until then, so both write the same text.
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned]);
  const clock = pinned ? momentMs(now as MomentInput) : tick;

  const left = !live && known && clock !== null ? countdownOf(kickoff, clock) : null;
  const leftText = left ? countdownText(left, locale) : null;
  const recent = form.slice(-5);
  const score = fixture.score ?? { home: 0, away: 0 };
  const heading = title ?? (live ? words.liveNow : words.next);
  const action = live ? (liveHref ? { href: liveHref, label: words.watchLive, icon: <IconPlay fill="currentColor" /> } : null) : ticketsHref ? { href: ticketsHref, label: words.tickets, icon: <IconTicket /> } : null;
  const ordinal = position ? fill(plural(words.ordinals, position.rank, locale, "ordinal"), { n: countText(position.rank, locale) }) : "";
  // "41 points" stays on one line: a number is never left at the end of one and its word at the start of the next.
  const points = position?.points === undefined ? null : fill(plural(words.points, position.points, locale), { count: countText(position.points, locale) }).replace(/ /g, "\u00a0");

  return (
    <section data-slot="matchday-hero" aria-labelledby={`${id}-title`} className={cn("py-14 sm:py-20", className)} {...props}>
      <Title id={`${id}-title`} className="text-center text-3xl leading-[1.05] font-medium tracking-[-0.035em] text-balance sm:text-4xl [overflow-wrap:anywhere]">
        {heading}
      </Title>

      <div data-slot="matchday-hero-card" data-live={live || undefined} className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-xs data-[live]:border-foreground/40 sm:mt-10">
        <div className="px-5 pt-5 pb-8 sm:px-10 sm:pt-6 sm:pb-10">
          <div className="flex min-h-7 items-center justify-between gap-3">
            <p className="min-w-0 text-sm font-medium text-muted-foreground">{fixture.competition}</p>
            {live ? (
              <Badge variant="outline" className="h-7 shrink-0 gap-2 px-3 text-[0.8125rem]">
                <span aria-hidden="true" className="relative flex size-2">
                  <span className="absolute inline-flex size-full rounded-full bg-foreground opacity-50 motion-safe:animate-rhs-matchday-ping" />
                  <span className="relative inline-flex size-2 rounded-full bg-foreground" />
                </span>
                {words.live}
                {fixture.minute ? (
                  <>
                    <span aria-hidden="true" className="tabular-nums">
                      {fill(words.minute, { minute: fixture.minute })}
                    </span>
                    <span className="sr-only">{fill(words.minuteSpoken, { minute: fixture.minute })}</span>
                  </>
                ) : null}
              </Badge>
            ) : left ? (
              <Badge variant="secondary" className="h-7 shrink-0 px-3 text-[0.8125rem] tabular-nums">
                <time dateTime={countdownIso(left)}>{leftText ? fill(words.countdown, { time: leftText }) : words.soon}</time>
              </Badge>
            ) : null}
          </div>

          {/* The crests line up at the top, whatever the names do; the middle is as high as a crest, so "vs" and the score sit level with it. */}
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3 sm:mt-8 sm:gap-x-8">
            <Crest team={fixture.home} />
            <div className="flex h-16 items-center justify-center px-1 sm:h-24 sm:px-3">
              {live ? (
                <p className="text-center">
                  <span className="sr-only">{fill(words.score, { home: fixture.home.name, homeScore: score.home, away: fixture.away.name, awayScore: score.away })}</span>
                  <span aria-hidden="true" className="text-4xl font-medium tracking-[-0.04em] whitespace-nowrap tabular-nums sm:text-6xl">
                    {score.home}
                    <span className="mx-[0.18em] text-muted-foreground">&ndash;</span>
                    {score.away}
                  </span>
                </p>
              ) : (
                <p className="text-center text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">{words.versus}</p>
              )}
            </div>
            <Crest team={fixture.away} />
          </div>

          <div className="mt-8 text-center sm:mt-10">
            {known ? (
              <p className="text-lg leading-snug font-medium tracking-[-0.01em] text-balance sm:text-xl">
                <time dateTime={kickoffIso(fixture.kickoff, kickoff)}>
                  {dayText(kickoff, locale, timeZone)}
                  <span aria-hidden="true">&nbsp;&middot; </span>
                  <span className="sr-only">, </span>
                  <span className="tabular-nums">{clockText(kickoff, locale, timeZone, hourCycle)}</span>
                </time>
              </p>
            ) : null}
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <IconPin className="size-3.5 shrink-0" />
              {fixture.venue}
            </p>
            {action ? (
              <Button asChild size="lg" className="mt-6 h-12 px-8 text-base max-sm:w-full">
                <a href={action.href}>
                  {action.icon}
                  {action.label}
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Side by side when the card is wide enough for both; otherwise the position drops under the form, whole, so it never runs into the chips and its dot never ends a line. */}
        {recent.length || position ? (
          <div data-slot="matchday-hero-form" className="flex flex-col items-center gap-6 border-t border-border bg-muted/50 px-5 py-6 sm:flex-row sm:flex-wrap sm:justify-between sm:px-10">
            {recent.length ? (
              <div className="flex w-full min-w-0 flex-col items-center sm:w-auto sm:items-start">
                <p className="text-xs font-medium text-muted-foreground">{words.formTitle}</p>
                {/* Equal columns, as wide as the card allows on a phone and four and a quarter rem on a wide screen, so the row can never be wider than its card. */}
                <ol
                  aria-label={words.form}
                  style={{ "--n": recent.length } as CSSProperties}
                  className="mt-3 grid w-full max-w-[calc(var(--n)*4.4rem)] grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-1.5 sm:w-auto sm:max-w-none sm:grid-cols-[repeat(var(--n),4.25rem)] sm:gap-2.5"
                >
                  {recent.map((entry, index) => {
                    const word = words[entry.result];
                    return (
                      <li key={`${index}-${entry.opponent}`} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                        {/* The tooltip sits on the parts that are hidden from assistive technology, which hears the opponent in full after the score. */}
                        <span aria-hidden="true" title={entry.opponent} className={cn("grid size-9 place-items-center rounded-full text-sm font-semibold", CHIP[entry.result])}>
                          {word.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium tabular-nums">
                          <span className="sr-only">{word}, </span>
                          {entry.score}
                          <span className="sr-only">, {fill(words.against, { opponent: entry.opponent })}</span>
                        </span>
                        {entry.short ? (
                          <span aria-hidden="true" title={entry.opponent} className="block max-w-full truncate text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                            {entry.short}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
            {position ? (
              <p className="text-center text-pretty sm:text-right">
                <span className="text-2xl leading-none font-medium tracking-[-0.03em] tabular-nums">{ordinal}</span>{" "}
                <span className="text-sm text-muted-foreground">
                  {fill(words.inLeague, { league: position.league })}
                  {points ? (
                    <>
                      {/* On a phone the points take a line of their own, so the dot never ends a line or starts one. */}
                      <span aria-hidden="true" className="max-sm:hidden">
                        &nbsp;&middot;{" "}
                      </span>
                      <span className="sr-only">, </span>
                      <span className="max-sm:block">{points}</span>
                    </>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
