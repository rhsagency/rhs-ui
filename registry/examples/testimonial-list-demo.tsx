import { TestimonialList, type TestimonialListItem } from "@rhs-ui/marketing/testimonial-list";

/** A portrait drawn for the demo: a head and shoulders on a pale ground. In your page: a photograph of the person. */
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='#dcdcdc'/><circle cx='48' cy='38' r='17' fill='#8c8c8c'/><path d='M14 96c2-20 17-30 34-30s32 10 34 30z' fill='#8c8c8c'/></svg>",
  );

const TESTIMONIALS: readonly TestimonialListItem[] = [
  {
    id: "marit",
    quote: "We moved 140 drivers onto Halcyon in a weekend. Dispatch used to be a whiteboard and four WhatsApp groups; now Monday starts with everyone already knowing their route.",
    name: "Marit de Vries",
    role: "Head of operations",
    company: "Northwind Logistics",
    avatar: PORTRAIT,
    result: "Late deliveries down 31 percent",
  },
  {
    id: "tomas",
    quote: "Month-end close went from nine working days to four. The audit trail is the first thing our accountants ask about, and it is the first thing Halcyon got right.",
    name: "Tomás Herrera",
    role: "Finance director",
    company: "Kestrel Studio",
    result: "Month-end close in 4 days, down from 9",
  },
  {
    id: "ingrid",
    quote: "I have bought a lot of software that nobody used. This is the one my whole clinic opens first thing in the morning, without being asked.",
    name: "Ingrid Solheim",
    role: "Co-founder",
    company: "Polder Health",
    avatar: PORTRAIT,
  },
  {
    id: "daniel",
    quote: "Support tickets about scheduling nearly disappeared, because customers can finally see what we see. That alone paid for the first year.",
    name: "Daniel Okafor",
    role: "CTO",
    company: "Lumen Energy",
    result: "Support tickets down 24 percent",
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-5xl gap-14 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Four quotes as rows: the words large on the left, the person on the right with a portrait or initials and, where there is one, the result as a chip. Hairlines divide the rows; there are no boxes. On a phone each row is the quote, then the person.
        </figcaption>
        <TestimonialList eyebrow="Customers" title="Work that is easier to talk about than to describe" testimonials={TESTIMONIALS} className="py-4 sm:py-6" />
      </figure>

      <figure className="grid gap-3 border-t border-border pt-10">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">Two quotes, no eyebrow and no results: the same list, quieter.</figcaption>
        <TestimonialList title="What teams say after a year" testimonials={TESTIMONIALS.slice(2, 4).map(({ result: _result, ...item }) => item)} className="py-4 sm:py-6" />
      </figure>
    </div>
  );
}
