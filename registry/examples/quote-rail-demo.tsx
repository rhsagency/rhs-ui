import { QuoteRail, type RailQuote } from "@rhs-ui/marketing/quote-rail";

type Hair = "none" | "bun" | "long" | "short";

/** A portrait drawn for the demo: a head and shoulders on a pale ground. In your page: a photograph of the person. */
function portrait(ground: string, hair: Hair): string {
  const behind = hair === "long" ? "<path d='M29 42c0-15 8-26 19-26s19 11 19 26v16H29z' fill='#3c3c3c'/>" : "";
  const above =
    hair === "bun"
      ? "<circle cx='48' cy='17' r='7' fill='#3c3c3c'/><path d='M31 36c0-11 7-17 17-17s17 6 17 17c-5-6-10-8-17-8s-12 2-17 8z' fill='#3c3c3c'/>"
      : hair === "short"
        ? "<path d='M31 37c0-12 7-19 17-19s17 7 17 19c-5-6-10-8-17-8s-12 2-17 8z' fill='#3c3c3c'/>"
        : "";
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${ground}'/>${behind}<circle cx='48' cy='38' r='17' fill='#a0a0a0'/>${above}<path d='M14 96c2-20 17-30 34-30s32 10 34 30z' fill='#626262'/></svg>`,
    )
  );
}

const QUOTES: readonly RailQuote[] = [
  {
    id: "marit",
    quote: "We moved 140 drivers onto Halcyon in a weekend. Monday started with everyone already knowing their route.",
    name: "Marit de Vries",
    role: "Head of operations, Northwind Logistics",
    avatar: portrait("#e2e2e2", "bun"),
    rating: 5,
  },
  {
    id: "sam",
    quote: "The first planning tool our designers open without being asked.",
    name: "Sam Okafor",
    role: "Design lead, Harbour & Co",
    avatar: portrait("#d6d6d6", "short"),
    rating: 5,
  },
  {
    id: "tomas",
    quote: "Month-end close went from nine working days to four. Our accountants ask about the audit trail first, and Halcyon got that right.",
    name: "Tomás Herrera",
    role: "Finance director, Kestrel Studio",
    rating: 5,
  },
  {
    id: "ingrid",
    quote: "Support answers with a screenshot and the next step, not a template. That is rare, and it is why we renewed.",
    name: "Ingrid Solheim",
    role: "Co-founder, Polder Health",
    avatar: portrait("#e8e8e8", "long"),
    rating: 4.5,
  },
  {
    id: "lotte",
    quote: "We stopped sending status emails. Clients open the shared view and see exactly where their project stands.",
    name: "Lotte de Vries",
    role: "Producer, Fieldwork",
    rating: 5,
  },
  {
    id: "daniel",
    quote: "The import took an afternoon. A week later nobody asked where the old spreadsheet went.",
    name: "Daniel Okafor",
    role: "CTO, Lumen Energy",
    avatar: portrait("#d9d9d9", "none"),
    rating: 4.5,
  },
  {
    id: "priya",
    quote: "Fair for what it replaces. We cancelled three tools in the first month and nobody missed them.",
    name: "Priya Raman",
    role: "Operations lead, Fjord Freight",
    avatar: portrait("#e4e4e4", "long"),
    rating: 5,
  },
  {
    id: "jonas",
    quote: "Rota swaps used to take a dozen messages. Now it is two taps and the manager sees it.",
    name: "Jonas Keller",
    role: "Shift supervisor, Mercy Lane Clinic",
    rating: 4,
  },
  {
    id: "elif",
    quote: "I was the sceptic in the room. Six weeks later I am the one asking for the API.",
    name: "Elif Aksoy",
    role: "Engineering manager, Atlas Rail",
    avatar: portrait("#dcdcdc", "short"),
    rating: 5,
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid min-w-0 gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Nine quotes in one row, each card as wide as a readable line. Swipe, scroll or use the arrows; the line and the count under the rail show where you are, the buttons rest at the ends, and after a press a screen reader hears "Quotes 2 to 4 of 9". Nothing moves by itself. On a phone the rail runs to the screen edge so the next card peeks in.
        </figcaption>
        <QuoteRail
          title="What teams say after a year with Halcyon"
          description="Nine of the 340 stories customers have sent us."
          items={QUOTES}
          className="py-2 sm:py-4"
        />
      </figure>

      <figure className="grid min-w-0 gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Six quotes without stars or portraits: initials stand in, and the rail stays as quiet. Every card still shares one height.
        </figcaption>
        <QuoteRail title="In their own words" items={QUOTES.slice(2, 8).map(({ avatar: _avatar, rating: _rating, ...item }) => item)} className="py-2 sm:py-4" />
      </figure>
    </div>
  );
}
