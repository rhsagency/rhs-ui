import { PressMentionsList, type PressMention } from "@rhs-ui/marketing/press-mentions-list";

const COVERAGE: readonly PressMention[] = [
  {
    outlet: "The Meridian Review",
    headline: "How a Rotterdam start-up quietly rebuilt hospital scheduling",
    date: "2026-10-14",
    href: "https://example.com/meridian/halcyon-hospital-scheduling",
    excerpt: "Halcyon's planners now cover 41 hospitals in seven countries, and most of the nurses who use them have never heard the company's name.",
  },
  {
    outlet: "Daily Ledger",
    headline: "Halcyon raises €38 million to take the calendar out of the spreadsheet",
    date: "2026-09-02",
    href: "https://example.com/ledger/halcyon-series-b",
  },
  {
    outlet: "Halcyon newsroom",
    headline: "Our statement on the Series B, and what we will build with it",
    date: "2026-09-02",
    href: "/newsroom/series-b",
    excerpt: "From our own site: a link that stays on it opens in the same tab and carries no arrow.",
  },
  {
    outlet: "Foundry Weekly",
    headline: "The boring software that keeps 2,400 teams on time",
    date: "2026-07-21",
    href: "https://example.com/foundry/boring-software",
    excerpt: "A profile of the planning tool that wins on reliability, not on features.",
  },
  {
    outlet: "Brightwave",
    headline: "Founders on the one meeting they would never skip",
    date: "2026-05-09",
    href: "https://example.com/brightwave/the-one-meeting",
  },
  {
    outlet: "The Northern Post",
    headline: "Why European buyers are choosing local scheduling software",
    date: "2026-03-17",
    href: "https://example.com/northern-post/local-scheduling",
  },
];

const IN_DUTCH: readonly PressMention[] = [
  {
    outlet: "De Gazet",
    headline: "Rotterdams bedrijf plant de zorg slimmer in",
    date: "2026-10-14T08:30:00Z",
    href: "https://example.com/gazet/halcyon-zorg",
    excerpt: "In 41 ziekenhuizen bepaalt Halcyon al wie wanneer waar staat.",
  },
  {
    outlet: "Zakelijk Nieuws",
    headline: "Halcyon haalt 38 miljoen euro op voor Europese groei",
    date: "2026-09-02T06:00:00Z",
    href: "https://example.com/zakelijk/halcyon-groei",
  },
  {
    outlet: "Ondernemers Weekblad",
    headline: "De rust van een agenda die klopt",
    date: "2026-07-21T10:00:00Z",
    href: "https://example.com/weekblad/rust-van-een-agenda",
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-4xl gap-12 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Six pieces of coverage with a limit of four: the date and the outlet in the narrow column, the headline as the link. The whole row is the click target, links to other sites carry an arrow and say they open in a new tab, and the button shows the rest.
        </figcaption>
        <PressMentionsList title="In the news" items={COVERAGE} limit={4} className="py-2 sm:py-4" />
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The same list in Dutch: the dates follow the locale and are written in Amsterdam time, and the fixed words come from the labels.
        </figcaption>
        <PressMentionsList
          title="In de media"
          items={IN_DUTCH}
          locale="nl-NL"
          timeZone="Europe/Amsterdam"
          labels={{ newTab: "opent in een nieuw tabblad", showAll: "Toon alle berichten", showLess: "Toon minder" }}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
