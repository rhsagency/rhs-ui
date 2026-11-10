import { ClaimQuotes, type Claim } from "@rhs-ui/marketing/claim-quotes";

const THREE: readonly Claim[] = [
  {
    id: "setup",
    claim: "Set up in an afternoon.",
    figure: { value: "11 min", label: "median time to the first published schedule" },
    quote: "I imported our rota at ten past nine and sent the first schedule to the drivers before lunch.",
    name: "Marit de Vries",
    role: "Head of operations, Northwind Logistics",
  },
  {
    id: "pricing",
    claim: "Pricing that stays honest.",
    figure: { value: "0", label: "overage charges across 2,400 workspaces last year, enterprise contracts included" },
    quote: "The invoice in month twelve was the invoice from month one, which has never happened to us with software.",
    name: "Tomás Herrera",
    role: "Finance director, Kestrel Studio",
  },
  {
    id: "support",
    claim: "Support that answers.",
    figure: { value: "8 min", label: "median first reply" },
    quote: "I asked a question at eleven at night and had an answer with a screenshot before I closed the laptop.",
    name: "Ingrid Solheim",
    role: "Co-founder, Polder Health",
  },
];

const FOUR: readonly Claim[] = [
  THREE[0]!,
  {
    id: "export",
    claim: "Your data stays yours.",
    quote: "We exported everything in one click during our audit, and nobody asked us a single question in return.",
    name: "Daniel Okafor",
    role: "CTO, Lumen Energy",
  },
  THREE[1]!,
  THREE[2]!,
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Three promises, each with the number that proves it and a customer who says the same. From 768px the claims share rows, so the numbers, the quotes and the names line up across the row however long a quote runs and however many lines a label takes (the middle label is the longest). On a phone each claim is a full-width block under its own rule.
        </figcaption>
        <ClaimQuotes title="Three promises, and the customers who held us to them" claims={THREE} className="py-2 sm:py-4" />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Four claims, one of them without a number: its figure row stays empty so the quotes and names still line up with their neighbours.
        </figcaption>
        <ClaimQuotes title="What customers hold us to" claims={FOUR} className="py-2 sm:py-4" />
      </figure>
    </div>
  );
}
