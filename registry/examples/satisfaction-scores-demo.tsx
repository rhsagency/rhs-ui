import { SatisfactionScores } from "@rhs-ui/marketing/satisfaction-scores";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          One overall score with how many answered and when, and six categories as labelled bars. Each bar is a meter, so a screen reader hears "Ease of use, 9.4 out of 10" once; a list that is below the window fills its bars one after another as it scrolls into view, and one already in view stands still. The source is required, and the link to the method sits beside it.
        </figcaption>
        <SatisfactionScores
          title="Customers rate Halcyon 9.2 out of 10"
          description="Scored by the account owners and admins who run it every day."
          overall={{ score: 9.2, max: 10, responses: 1284, period: "July to September 2026" }}
          categories={[
            { label: "Ease of use", score: 9.4 },
            { label: "Customer support", score: 9.6 },
            { label: "Setup and onboarding", score: 9.1 },
            { label: "Reliability", score: 9.3 },
            { label: "Value for money", score: 8.7 },
            { label: "Depth of features", score: 8.8 },
          ]}
          source="Halcyon customer survey, sent to every account owner and admin in the quarter, scored from 0 to 10."
          methodHref="#method"
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The same block on a scale of five, in Dutch, with no heading and a method page on another site: numbers follow the locale, every fixed word comes from the labels, and the link says that it opens in a new tab.
        </figcaption>
        <SatisfactionScores
          overall={{ score: 4.7, max: 5, responses: 912, period: "oktober 2026" }}
          categories={[
            { label: "Gebruiksgemak", score: 4.8 },
            { label: "Klantenservice", score: 4.9 },
            { label: "Prijs en waarde", score: 4.4 },
            { label: "Betrouwbaarheid", score: 4.7 },
            { label: "Installatie", score: 4.6 },
          ]}
          source="Klanttevredenheidsonderzoek van Halcyon, onder alle accounthouders in oktober 2026, beoordeeld van 1 tot 5."
          methodHref="https://example.com/methode"
          locale="nl-NL"
          labels={{
            outOf: "van {max}",
            basedOn: "Gebaseerd op {responses} reacties",
            valueText: "{score} van {max}",
            source: "Bron",
            method: "Zo meten we dit",
            newTab: "opent in een nieuw tabblad",
            categories: "Scores per onderdeel",
            region: "Klanttevredenheid",
          }}
          className="py-2 sm:py-4"
        />
      </figure>
    </div>
  );
}
