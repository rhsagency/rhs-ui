import { MatchdayHero, type MatchFormEntry } from "@rhs-ui/marketing/matchday-hero";

/* The crests are drawn for the demo, so they need no files. In your site: the club's crest as a PNG or an SVG with a transparent background. */
const crest = (outline: string, field: string, emblem: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 240'>` +
      `<path d='M100 8L188 34V122C188 176 150 214 100 234C50 214 12 176 12 122V34Z' fill='${outline}'/>` +
      `<path d='M100 24L172 46V120C172 166 140 198 100 216C60 198 28 166 28 120V46Z' fill='${field}'/>` +
      emblem +
      `</svg>`,
  );

const halcyon = crest(
  "#16313b",
  "#f1ead8",
  `<rect x='86' y='42' width='28' height='176' fill='#16313b'/><circle cx='100' cy='112' r='34' fill='#f1ead8' stroke='#16313b' stroke-width='9'/><path d='M100 98l6 12h13l-10 8 4 13-13-8-13 8 4-13-10-8h13z' fill='#16313b'/>`,
);

const northwind = crest(
  "#2a2a2a",
  "#d9dedf",
  `<path d='M28 78L172 148V186L28 116Z' fill='#2a2a2a'/><path d='M60 60l8 16h18l-14 11 5 17-17-10-17 10 5-17-14-11h18z' fill='#2a2a2a' transform='translate(26 -10) scale(.9)'/>`,
);

const at = (day: string, time: string) => `${day}T${time}:00+01:00`;

const form: MatchFormEntry[] = [
  { result: "win", opponent: "Rovers", short: "ROV", score: "2–1" },
  { result: "win", opponent: "Wanderers", short: "WAN", score: "3–0" },
  { result: "draw", opponent: "Athletic", short: "ATH", score: "1–1" },
  { result: "loss", opponent: "Kestrel Town", short: "KES", score: "0–2" },
  { result: "win", opponent: "Lumen City", short: "LUM", score: "2–0" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Wednesday morning, three days out: the countdown shows in the corner. The form guide spells Win, Draw and Loss for screen readers, and says each opponent in full after the score.</p>
      <MatchdayHero
        className="py-8 sm:py-10 lg:py-12"
        fixture={{
          competition: "Premier Division, matchday 14",
          home: { name: "Halcyon FC", logo: halcyon },
          away: { name: "Northwind United", logo: northwind },
          kickoff: at("2026-11-14", "15:00"),
          venue: "Halcyon Arena, Utrecht",
        }}
        form={form}
        position={{ rank: 3, league: "the Premier Division", points: 41 }}
        ticketsHref="#tickets"
        timeZone="Europe/Amsterdam"
        now={at("2026-11-11", "10:40")}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">While the match is live: the score, Live in words and the minute, and the button becomes Watch live.</p>
      <MatchdayHero
        className="py-8 sm:py-10 lg:py-12"
        fixture={{
          competition: "Premier Division, matchday 15",
          home: { name: "Halcyon FC", logo: halcyon },
          away: { name: "Kestrel Town" },
          kickoff: at("2026-11-21", "15:00"),
          venue: "Halcyon Arena, Utrecht",
          status: "live",
          score: { home: 2, away: 1 },
          minute: "67",
        }}
        form={[...form.slice(1), { result: "win", opponent: "Northwind United", short: "NOR", score: "2–1" }]}
        position={{ rank: 2, league: "the Premier Division", points: 44 }}
        ticketsHref="#tickets"
        liveHref="#watch"
        timeZone="Europe/Amsterdam"
        now={at("2026-11-21", "16:05")}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">An esports club, weeks away: no crests, so the initials stand in; no countdown yet; 12-hour times; and no form to show.</p>
      <MatchdayHero
        className="py-8 sm:py-10 lg:py-12"
        title="Our next series"
        fixture={{
          competition: "Spring Split, week 3",
          home: { name: "Halcyon Gaming" },
          away: { name: "Pixel Foxes" },
          kickoff: at("2027-03-02", "19:30"),
          venue: "Halcyon Arena, Utrecht",
        }}
        ticketsHref="#tickets"
        timeZone="Europe/Amsterdam"
        hourCycle="h12"
        now={at("2026-11-11", "10:40")}
      />
    </div>
  );
}
