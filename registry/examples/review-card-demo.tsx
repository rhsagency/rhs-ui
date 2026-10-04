import { ReviewCard } from "@rhs-ui/commerce/review-card";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-8 md:grid-cols-2">
      <ReviewCard
        rating={5}
        title="Softer after every wash"
        body="Stiff on day one, perfect by week two. The pockets fit a phone and a thermometer without bulging."
        author="Mei T."
        date="12 March 2026"
        dateTime="2026-03-12"
        verified
        variant="Stone, size M"
        reply="Thank you, Mei. That is exactly how the linen is meant to age."
      />
      <ReviewCard rating={3} body="Good apron, but the straps run long for someone my height. I tied them twice around." author="Daan P." date="2 March 2026" dateTime="2026-03-02" verified variant="Charcoal, size S" />
    </div>
  );
}
