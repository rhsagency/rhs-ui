import { ReviewTopics, type ReviewTopic } from "@rhs-ui/marketing/review-topics";

const TOPICS: readonly ReviewTopic[] = [
  {
    id: "ease",
    label: "Ease of use",
    mentions: 842,
    positive: 0.94,
    snippet: { quote: "Our drivers picked it up in one shift. Nobody asked for a manual, and the first week of tickets was almost empty.", author: "Marit D., head of operations, G2" },
  },
  {
    id: "support",
    label: "Support",
    mentions: 611,
    positive: 0.91,
    snippet: { quote: "Every question got a human answer with a screenshot and the next step. At eleven at night, once.", author: "Ingrid S., practice manager, G2" },
  },
  {
    id: "pricing",
    label: "Pricing",
    mentions: 503,
    positive: 0.72,
    snippet: { quote: "Fair for what it replaces, though the jump from the second to the third plan is steeper than I expected.", author: "Tomás H., finance director, Capterra" },
  },
  {
    id: "performance",
    label: "Performance",
    mentions: 398,
    positive: 0.88,
    snippet: { quote: "A hundred and forty drivers open the same schedule at six in the morning and it does not blink.", author: "Daniel O., CTO, G2" },
  },
  {
    id: "setup",
    label: "Setup",
    mentions: 377,
    positive: 0.83,
    snippet: { quote: "The import handled our messy rota on the second try. The first try told us exactly which rows to fix.", author: "Priya R., operations lead, Capterra" },
  },
  {
    id: "integrations",
    label: "Integrations",
    mentions: 214,
    positive: 0.68,
    snippet: { quote: "Payroll and calendar work well. I would like the accounting export to include shift tags without a workaround.", author: "Jonas K., shift supervisor, G2" },
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Six topics from 4,200 reviews. A row shows the topic, how often it comes up and the share of positive mentions as a bar with the percentage and the word "positive" beside it; it tints on hover, opens to one verbatim line and its author, and only one row is open at a time. The bar is decoration, so it reads the same in monochrome and in dark mode.
        </figcaption>
        <ReviewTopics title="What reviewers talk about most" description="Taken from 4,200 reviews on G2 and Capterra, newest first." topics={TOPICS} defaultValue="ease" className="py-2 sm:py-4" />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Five topics, every row closed, a topic mentioned once and the numbers in Dutch: counts and percentages follow the locale, and the fixed words (including "positief" next to each percentage) come from the labels.
        </figcaption>
        <ReviewTopics
          title="Wat klanten het vaakst noemen"
          topics={[
            { id: "gemak", label: "Gebruiksgemak", mentions: 128, positive: 0.95, snippet: { quote: "Eindelijk één plek voor de hele planning, en iedereen snapt hem meteen.", author: "Ingrid S., praktijkmanager, Kiyoh" } },
            { id: "service", label: "Klantenservice", mentions: 96, positive: 0.92, snippet: { quote: "Binnen een uur antwoord, en dan ook nog het goede antwoord.", author: "Sanne V., Kiyoh" } },
            { id: "prijs", label: "Prijs", mentions: 41, positive: 0.7, snippet: { quote: "Eerlijk voor wat je ervoor terugkrijgt, al is het middelste pakket krap.", author: "Marcus L., bedrijfsleider, Kiyoh" } },
            { id: "snelheid", label: "Snelheid", mentions: 22, positive: 0.86, snippet: { quote: "Ook op drukke ochtenden gewoon vlot.", author: "Tomás H., Kiyoh" } },
            { id: "koppeling", label: "Koppelingen", mentions: 1, positive: 1, snippet: { quote: "De koppeling met onze agenda werkte meteen.", author: "Jonas K., Kiyoh" } },
          ]}
          locale="nl-NL"
          labels={{ mentions: "genoemd in {count} beoordelingen", mentionsOne: "genoemd in 1 beoordeling", positive: "positief" }}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
