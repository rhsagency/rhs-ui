import { RatingBand } from "@rhs-ui/marketing/rating-band";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <RatingBand
        ratings={[
          { source: "App Store", rating: 4.8, count: "2,140 reviews", href: "#app-store" },
          { source: "Google Play", rating: 4.6, count: "1,380 reviews", href: "#google-play" },
          { source: "Trustpilot", rating: 4.7, count: "910 reviews", href: "#trustpilot" },
        ]}
      />
    </div>
  );
}
