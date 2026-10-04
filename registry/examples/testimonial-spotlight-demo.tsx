import { TestimonialSpotlight } from "@rhs-ui/marketing/testimonial-spotlight";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TestimonialSpotlight
        quote="We replaced three tools and a weekly status call. Our designers now spend Monday mornings designing, which is the whole point."
        name="Mara Lindqvist"
        role="Head of Design, Fieldwork"
        avatar={<span className="flex size-full items-center justify-center text-sm font-medium">ML</span>}
        result={{ value: "6 h", label: "saved per designer, per week" }}
      />
    </div>
  );
}
