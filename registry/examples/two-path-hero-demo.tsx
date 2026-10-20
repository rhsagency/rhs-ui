import { TwoPathHero } from "@rhs-ui/marketing/two-path-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TwoPathHero
        title="Northwind connects the people who build with the people who hire."
        description="Whichever side of the table you are on, the first step takes about five minutes."
        paths={[
          {
            label: "For teams",
            heading: "Hire engineers who can start on Monday",
            points: ["A vetted shortlist within 48 hours", "Two-week paid trial before you commit", "Swap anyone, any time, at no fee"],
            href: "#teams",
            cta: "Start hiring",
          },
          {
            label: "For individuals",
            heading: "Find work that fits the life you want",
            points: ["Roles matched to your skills and rate", "You set your own hours and terms", "Paid every week, in your own currency"],
            href: "#individuals",
            cta: "Create your profile",
          },
        ]}
      />
    </div>
  );
}
