import { TestimonialCard } from "@rhs-ui/application/testimonial-card";

// Drawn portraits as data URIs, so the preview needs no image host: a head and shoulders on a quiet ground.
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${ground}"/><circle cx="48" cy="38" r="17" fill="${ink}"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="${ink}"/></svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl gap-4">
      <p className="text-center text-xs text-muted-foreground">Each card fills its grid cell with the person at the bottom. A long quote folds, a link covers the card, one quote can lead.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TestimonialCard
          rating={5}
          quote="Kestrel replaced three tools and a weekly meeting. Our designers now ship their own copy changes, and nobody has asked where the latest file lives since March."
          author={{ name: "Ana Costa", role: "Head of design", company: "Northwind", image: portrait("#d9d6cf", "#3a3733") }}
        />
        <TestimonialCard
          rating={4.5}
          quote="The handover that used to take a day now takes ten minutes. The one thing I would add is a way to schedule reports for the weekend crew."
          author={{ name: "Tom Berg", role: "Operations lead", company: "Halcyon Freight" }}
        />
        <TestimonialCard
          href="#story"
          rating={5}
          quote="We looked at six tools over two months. This was the only one where someone who joined on a Monday was shipping on the Wednesday. The templates are honest about what they do, the defaults are the ones we would have picked, and when we hit a wall, a person answered within the hour. Six months in, our onboarding doc for the whole stack fits on one page, and the people who wrote it are no longer the ones who have to explain it."
          author={{ name: "Imke Visser", role: "Engineering manager", company: "Kestrel Studio", image: portrait("#cfd3d6", "#2f3438") }}
        />
        <TestimonialCard
          featured
          className="lg:col-span-2"
          quote="In twenty years of building software for logistics I have not seen a rollout this quiet. Dispatchers stopped phoning us. That is the whole review."
          author={{ name: "Noor Haddad", role: "CTO", company: "Quickbeam Logistics", image: portrait("#dcd5d0", "#4a3d36") }}
        />
        <TestimonialCard quote="Simple, quick, and the support actually answers." author={{ name: "Lucas Meyer", role: "Owner", company: "Meyer Bouw" }} />
      </div>
    </div>
  );
}
