import { MasonryGrid } from "@rhs-ui/primitives/masonry-grid";

const NOTES = [
  { text: "We replaced three tools and a weekly status call.", name: "Mara, Fieldwork", tall: false },
  { text: "Our clients stopped asking for updates, because the update is always there. That alone paid for the year.", name: "Tom, Studio Becker", tall: true },
  { text: "The rollout took an afternoon.", name: "Priya, Halcyon", tall: false },
  { text: "Decisions used to vanish in chat. Now they have a home, with the reason next to them, and new hires read them in week one.", name: "Sara, Meridian", tall: true },
  { text: "Calm is underrated.", name: "Luca, Quanta", tall: false },
  { text: "The changelog writes itself.", name: "Mei, Brightline", tall: false },
  { text: "Guests see what they need and nothing else, which is exactly what our clients wanted.", name: "Daan, Oakmont", tall: true },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <MasonryGrid columns={3}>
        {NOTES.map((note) => (
          <figure key={note.name} className="rounded-2xl border border-border p-5">
            <blockquote className={note.tall ? "text-lg leading-snug" : "text-sm"}>“{note.text}”</blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">{note.name}</figcaption>
          </figure>
        ))}
      </MasonryGrid>
    </div>
  );
}
