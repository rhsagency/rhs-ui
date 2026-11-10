import { QuoteStack } from "@rhs-ui/marketing/quote-stack";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <QuoteStack
        title="Customers, in one sentence"
        quotes={[
          { id: "ines", quote: "It replaced three tools and two weekly meetings.", name: "Inès Moreau", role: "Founder, Atelier Moreau" },
          { id: "sam", quote: "The first software our whole studio opens without being asked.", name: "Sam Okafor", role: "Design lead, Harbour & Co" },
          { id: "arjun", quote: "Setup took an afternoon. Nobody needed training.", name: "Arjun Mehta", role: "Partner, Mirror Labs" },
          { id: "lotte", quote: "Finally, a status page my clients actually read.", name: "Lotte de Vries", role: "Head of marketing, Fieldwork" },
          { id: "jonas", quote: "Quiet, fast and exactly where I left it.", name: "Jonas Keller", role: "Staff engineer, Kestrel Studio" },
          { id: "mei", quote: "We cancelled the spreadsheet and nobody even noticed.", name: "Mei Tanaka", role: "Producer, Polder Health" },
        ]}
      />
    </div>
  );
}
