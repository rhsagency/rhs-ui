import { BigNumberHero } from "@rhs-ui/marketing/big-number-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Counts up once (in 0.6 seconds here), the first time it is on screen. The page holds 4.2 from the first render, and a reader who asked for less motion sees it at once.</p>
      <BigNumberHero
        className="py-8 sm:py-10 lg:py-12"
        animate
        duration={0.6}
        label="Drinking water saved since 2019"
        value={4.2}
        unit="million litres"
        format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        description="Across 312 households in the Veluwe, with smart meters, leak alerts and a tariff that rewards a short shower. Close to two Olympic swimming pools."
        source={{ label: "Northwind Water Authority, annual report 2025", href: "#report" }}
        asOf="2025-12-31"
        actions={[
          { label: "Read the report", href: "#report" },
          { label: "See how it adds up", href: "#method" },
        ]}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A short unit stays beside the figure at every width, and the figure takes the room that is left.</p>
      <BigNumberHero
        className="py-8 sm:py-10 lg:py-12"
        label="Pickups made inside the two-hour window"
        value={98}
        unit="%"
        description="Every one of our 41 depots reports its window each night, and the figure is the median across the quarter."
        source="Kestrel Logistics, third quarter 2026"
        asOf="2026-09-30"
        actions={[
          { label: "Book a pickup", href: "#book" },
          { label: "How we measure", href: "#method" },
        ]}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A short figure with a longer word after it, and no source to quote.</p>
      <BigNumberHero
        className="py-8 sm:py-10 lg:py-12"
        label="Sunday dinners at Halcyon Kitchen, a seat for anyone"
        value={12}
        unit="years"
        description="We have not missed a week, including the two years the doors had to stay shut and the food went out in boxes."
        actions={[{ label: "Join us on Sunday", href: "#join" }]}
      />
    </div>
  );
}
