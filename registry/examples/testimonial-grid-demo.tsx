import { TestimonialGrid } from "@rhs-ui/marketing/testimonial-grid";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TestimonialGrid
        eyebrow="In their words"
        title="Studios that stopped chasing status updates."
        featured="ines"
        testimonials={[
          {
            id: "ines",
            quote: "We cut our Monday meeting from an hour to ten minutes. Everyone already knows where things stand, so we talk about the work instead of the plan.",
            name: "Ines Moreau",
            role: "Founder, Atelier Moreau",
          },
          { id: "sam", quote: "The first planning tool our designers open without being asked.", name: "Sam Okafor", role: "Design lead, Harbour & Co" },
          { id: "lotte", quote: "Clients see progress without a single status email from us.", name: "Lotte de Vries", role: "Producer, Fieldwork" },
          { id: "arjun", quote: "It feels like it was made by people who run a studio.", name: "Arjun Mehta", role: "Partner, Mirror Labs" },
          { id: "maya", quote: "Reviews used to live in five places. Now there is one, next to the work.", name: "Maya Lindqvist", role: "Art director, Oak Lane" },
        ]}
      />
    </div>
  );
}
