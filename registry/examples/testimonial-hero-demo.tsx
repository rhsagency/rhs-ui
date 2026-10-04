import { Button } from "@rhs-ui/primitives/button";
import { TestimonialHero } from "@rhs-ui/marketing/testimonial-hero";

const photo = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='#d8d3c9'/><circle cx='100' cy='85' r='40' fill='#8d877c'/><path d='M30 200 Q100 120 170 200Z' fill='#8d877c'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TestimonialHero
        title="Coaching for founders who are tired of being tired."
        description="Twelve weeks, one hour a week, and a plan you will actually keep."
        actions={<><Button size="lg">Book an intro call</Button><Button size="lg" variant="outline">How it works</Button></>}
        quote="I sleep again, I say no to the right things, and the company grew anyway. Best money I spent this year."
        name="Tom Becker"
        role="Founder, Studio Becker"
        photo={<img src={photo} alt="" />}
      />
    </div>
  );
}
