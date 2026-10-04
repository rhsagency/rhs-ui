import { TestimonialWall } from "@rhs-ui/marketing/testimonial-wall";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TestimonialWall
        eyebrow="Wall of love"
        title="What people say after the first week"
        quotes={[
          { id: "1", name: "Jonas Meier", handle: "@jmeier", quote: "Set it up on a Friday afternoon. By Monday the whole team had moved over without being asked." },
          { id: "2", name: "Priya Nair", handle: "@priyabuilds", quote: "The keyboard shortcuts alone are worth it." },
          { id: "3", name: "Tom Becker", handle: "Studio Becker", quote: "Finally a tool that does not want to be the center of my day. It shows what matters and gets out of the way. Our clients notice the calmer handoffs too." },
          { id: "4", name: "Lea Vos", handle: "@leavos", quote: "Support answered in eleven minutes, on a Sunday." },
          { id: "5", name: "Sam Okafor", handle: "@samo", quote: "We cut our planning meeting from an hour to fifteen minutes. Everyone already knows where things are." },
          { id: "6", name: "Ines Duarte", handle: "Duarte & Filhos", quote: "Clean, quick, and it respects my attention." },
        ]}
      />
    </div>
  );
}
