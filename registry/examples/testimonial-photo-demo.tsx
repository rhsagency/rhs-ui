import { TestimonialPhoto } from "@rhs-ui/marketing/testimonial-photo";

const portrait = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><rect width='400' height='500' fill='#d9d2c6'/><circle cx='200' cy='190' r='80' fill='#8a8174'/><path d='M60 500c0-90 63-150 140-150s140 60 140 150z' fill='#8a8174'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <TestimonialPhoto
        rating={5}
        quote="They rebuilt our kitchen in three weeks and left the house cleaner than they found it. We still get compliments on the worktop."
        name="Annemarie Vos"
        role="Homeowner, Veenendaal"
        photo={<img src={portrait} alt="Annemarie in her new kitchen" />}
      />
    </div>
  );
}
