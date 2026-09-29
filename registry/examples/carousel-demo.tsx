import { Carousel } from "@rhs-ui/primitives/carousel";

const STORIES = [
  { client: "Northwind", quote: "We shipped the new site in three weeks, and it still feels hand-made.", person: "Ruth Owusu, Head of Brand" },
  { client: "Harbour & Co", quote: "Bookings doubled the month the new flow went live.", person: "Arjun Mehta, Product" },
  { client: "Fieldwork", quote: "Our team edits every page themselves now. Nothing breaks.", person: "Lotte de Vries, Marketing" },
  { client: "Oak Lane", quote: "Pre-orders sold out in an afternoon. The checkout just works.", person: "Tom Becker, Founder" },
  { client: "Mirror Labs", quote: "The docs finally look like the product they describe.", person: "Maya Lindqvist, DevRel" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-3xl">
      <Carousel label="Customer stories" perView={2}>
        {STORIES.map((story) => (
          <figure key={story.client} className="flex h-full flex-col justify-between gap-8 rounded-2xl border border-border bg-background p-6">
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{story.client}</p>
            <blockquote className="text-lg leading-snug font-medium tracking-tight">“{story.quote}”</blockquote>
            <figcaption className="text-sm text-muted-foreground">{story.person}</figcaption>
          </figure>
        ))}
      </Carousel>
    </div>
  );
}
