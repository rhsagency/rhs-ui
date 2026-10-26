import { ArticleSeriesOutline, type SeriesPart } from "@rhs-ui/marketing/article-series-outline";

const QUIET_LAUNCH: readonly SeriesPart[] = [
  { title: "Choosing what not to build", href: "#launch-1", minutes: 12 },
  { title: "Pricing without a spreadsheet", href: "#launch-2", minutes: 9 },
  { title: "Writing the first announcement", href: "#launch-3", minutes: 11 },
  { title: "Onboarding your first ten customers", minutes: 14, releaseDate: "2026-11-04" },
  { title: "Reading the first month of feedback", minutes: 10, releaseDate: "2026-11-18" },
  { title: "When to say no to a feature request", minutes: 8 },
];

const PRICING: readonly SeriesPart[] = [
  { title: "Why a price is a promise", href: "#pricing-1", minutes: 8 },
  { title: "Finding the floor: what each customer costs you", href: "#pricing-2", minutes: 11 },
  { title: "Tiers that do not trap people", href: "#pricing-3", minutes: 9 },
  { title: "Announcing a price change", href: "#pricing-4", minutes: 7 },
  { title: "What to say when it is too expensive", minutes: 10, releaseDate: "2026-11-11" },
];

const COUNTER: readonly SeriesPart[] = [
  { title: "Opening hours that fit your customers", href: "#counter-1", minutes: 6 },
  { title: "The float, the till and the Friday count", href: "#counter-2", minutes: 9 },
  { title: "Hiring your first Saturday person", href: "#counter-3", minutes: 8 },
  { title: "Handling the return nobody planned for", minutes: 7, releaseDate: "2026-11-05" },
  { title: "Stock you should never carry", minutes: 8, releaseDate: "2026-11-19" },
  { title: "Closing for a week without losing a customer", minutes: 10 },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-4 text-xs text-muted-foreground">Card, in an article&rsquo;s sidebar: part 3 of 6, with three parts to come</p>
      <ArticleSeriesOutline className="max-w-sm" series={{ title: "The Quiet Launch", href: "#the-quiet-launch" }} parts={QUIET_LAUNCH} current={3} locale="en-GB" />

      <p className="mt-16 mb-4 text-xs text-muted-foreground">A card at the end of an article, beside the pager: it lays each part out on one line once it has the room</p>
      <ArticleSeriesOutline className="max-w-2xl" series={{ title: "Pricing, explained", href: "#pricing-explained" }} parts={PRICING} current={4} locale="en-GB" />

      <p className="mt-16 mb-4 text-xs text-muted-foreground">Strip, across the top of the body: the whole series at a glance</p>
      <ArticleSeriesOutline layout="strip" series={{ title: "Behind the counter", href: "#behind-the-counter" }} parts={COUNTER} current={3} locale="en-GB" />

      <p className="mt-16 mb-4 text-xs text-muted-foreground">On the series&rsquo; own page nothing is current, and a published part that comes later is still a link</p>
      <ArticleSeriesOutline
        className="max-w-2xl"
        headingLevel={2}
        locale="en-GB"
        series={{ title: "Field notes from a small bakery" }}
        parts={[
          { title: "Why we stopped selling on Saturdays", href: "#bakery-1", minutes: 6 },
          { title: "Sourdough at 6,000 loaves a week", href: "#bakery-2", minutes: 8 },
          { title: "The oven that nearly closed us", minutes: 7, releaseDate: "2026-12-09" },
        ]}
      />
    </div>
  );
}
