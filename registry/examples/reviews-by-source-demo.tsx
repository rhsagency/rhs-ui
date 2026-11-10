import { ReviewsBySource, type ReviewSource, type SourcedReview } from "@rhs-ui/marketing/reviews-by-source";

const SOURCES: readonly ReviewSource[] = [
  { name: "G2", average: 4.7, count: 312, href: "https://example.com/reviews/g2/halcyon" },
  { name: "App Store", average: 4.8, count: 2140, href: "https://example.com/reviews/app-store/halcyon" },
  { name: "Google", average: 4.6, count: 487 },
];

const REVIEWS: readonly SourcedReview[] = [
  {
    id: "g2-1",
    source: "G2",
    rating: 5,
    title: "Finally, a planner our whole clinic opens",
    body: "We replaced three spreadsheets and a shared calendar in two weeks. Reminders alone cut our no-shows by a quarter, and the reports finally match what finance sees.",
    author: "Ingrid S., practice manager",
    date: "2026-10-02",
  },
  {
    id: "app-1",
    source: "App Store",
    rating: 5,
    title: "Does what it says",
    body: "I check my shifts on the train and swap with a colleague in two taps. The notifications are timely and never noisy.",
    author: "Sanne V.",
    date: "2026-10-11",
  },
  {
    id: "goo-1",
    source: "Google",
    rating: 4.5,
    title: "Our deliveries run on it",
    body: "Dispatch moved from WhatsApp to Halcyon over a weekend. Drivers like that the route looks the same on the phone and on the wall screen.",
    author: "Priya R., depot manager",
    date: "2026-09-14",
  },
  {
    id: "g2-2",
    source: "G2",
    rating: 4.5,
    title: "Great once it is set up, and set-up takes a day",
    body: "Importing our rotas was smooth and support answered within the hour. I would like more control over recurring shifts, but the team ships fast.",
    author: "Marcus L., operations lead",
    date: "2026-08-19",
  },
  {
    id: "app-2",
    source: "App Store",
    rating: 4,
    title: "Solid, and it wants a widget",
    body: "Fast and clear. A home screen widget with the next shift on it would make it perfect.",
    author: "Jonas K.",
    date: "2026-09-27",
  },
  {
    id: "goo-2",
    source: "Google",
    rating: 5,
    title: "The support is the product",
    body: "Every question got a human answer with a screenshot. That is rare, and it is why we renewed.",
    author: "Tomás H.",
    date: "2026-07-30",
  },
];

const IN_DUTCH_SOURCES: readonly ReviewSource[] = [
  { name: "Kiyoh", average: 4.6, count: 128, href: "https://example.com/beoordelingen/kiyoh/halcyon" },
  { name: "Google", average: 4.7, count: 391 },
];

const IN_DUTCH: readonly SourcedReview[] = [
  {
    id: "kiy-1",
    source: "Kiyoh",
    rating: 5,
    title: "Eindelijk rust in de planning",
    body: "Onze hele praktijk plant nu op één plek. De herinneringen scheelden meteen een kwart van de gemiste afspraken.",
    author: "Ingrid S.",
    date: "2026-10-02T09:00:00Z",
  },
  {
    id: "goo-nl-1",
    source: "Google",
    rating: 4.5,
    title: "Snel ingericht, vriendelijke hulp",
    body: "Na een dag stond alles erin. Wie belt, krijgt een mens aan de lijn die écht meedenkt.",
    author: "Marcus L.",
    date: "2026-08-19T14:30:00Z",
  },
  {
    id: "kiy-2",
    source: "Kiyoh",
    rating: 4,
    title: "Fijn, met één wens",
    body: "Alles klopt en het werkt op de telefoon. Een weekoverzicht per team zou het compleet maken.",
    author: "Sanne V.",
    date: "2026-09-27T18:10:00Z",
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Choose a source and the cards, the summary and the link under them follow. The summary is a polite live region, so a screen reader hears "4.8 average from 2,140 reviews on App Store" when the tab changes; the tabs take arrow keys.
        </figcaption>
        <ReviewsBySource title="What customers say, and where they said it" reviews={REVIEWS} sources={SOURCES} className="py-2 sm:py-4" />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The same block in Dutch, starting on the second tab: numbers and dates follow the locale, and every fixed word comes from the labels.
        </figcaption>
        <ReviewsBySource
          title="Wat klanten zeggen"
          reviews={IN_DUTCH}
          sources={IN_DUTCH_SOURCES}
          locale="nl-NL"
          timeZone="Europe/Amsterdam"
          defaultValue="Kiyoh"
          labels={{
            all: "Alle",
            rated: "Beoordeeld met {rating} van {max}",
            summary: "{average} gemiddeld uit {count} {reviews}",
            summarySource: "{average} gemiddeld uit {count} {reviews} op {source}",
            review: "beoordeling",
            reviews: "beoordelingen",
            readAll: "Lees alles op {source}",
            newTab: "opent in een nieuw tabblad",
            sources: "Bronnen van beoordelingen",
            empty: "Nog geen beoordelingen van {source}.",
          }}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
