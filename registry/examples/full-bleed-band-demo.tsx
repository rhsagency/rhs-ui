import { Button } from "@rhs-ui/primitives/button";
import { Container } from "@rhs-ui/primitives/container";
import { FullBleedBand } from "@rhs-ui/primitives/full-bleed-band";

const STATS = [
  { value: "11,400", label: "orders a month across 240 shops" },
  { value: "31%", label: "faster checkout than a four-step flow" },
  { value: "99.98%", label: "uptime over the last twelve months" },
];

/** Wordmarks drawn as text, each in its own hand, so the demo needs no pictures and names no real company. */
const STUDIOS = [
  { name: "NORTHWIND", size: 19, weight: 700, spacing: 3 },
  { name: "kestrel", size: 28, weight: 700, spacing: -0.8 },
  { name: "Atlas & Oak", size: 26, weight: 500, spacing: 0, serif: true },
  { name: "ORCHID", size: 18, weight: 600, spacing: 5 },
  { name: "fernhill", size: 28, weight: 600, spacing: -1 },
];

export default function Demo(): React.JSX.Element {
  return (
    <FullBleedBand.Root>
      <Container as="main" className="pt-12 sm:pt-16">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Halcyon Shop</p>
        <h2 className="mt-3 max-w-[22ch] text-3xl leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Run a shop that feels like yours</h2>
        <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground">
          The page below sits in a centred column. The bands break out of it to the edges of the page, and the words inside them line up with the headline above.
        </p>

        <FullBleedBand tone="muted" size="lg" className="mt-12 sm:mt-16" aria-label="Halcyon in numbers" as="section">
          <dl className="grid gap-8 sm:grid-cols-3 sm:gap-10">
            {STATS.map((stat) => (
              <div key={stat.value} className="border-t border-border pt-5">
                <dt className="text-4xl font-semibold tracking-[-0.04em] tabular-nums sm:text-5xl">{stat.value}</dt>
                <dd className="mt-2 max-w-[22ch] text-sm leading-snug text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </FullBleedBand>

        <div className="grid gap-4 py-12 sm:py-16 md:grid-cols-2 md:gap-12">
          <h3 className="text-2xl font-semibold tracking-[-0.03em] text-balance">Built for the way a small shop actually works</h3>
          <p className="text-base leading-relaxed text-pretty text-muted-foreground">Products, orders and customers in one place, with a checkout your customers finish and a dashboard you can read at a glance. No plugins to keep in step, and nothing to rebuild when you grow.</p>
        </div>

        <FullBleedBand bordered size="md" as="section" aria-label="Shops that use Halcyon">
          <p className="text-center text-sm text-muted-foreground">Trusted by independent shops in 14 countries</p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
            {STUDIOS.map(({ name, size, weight, spacing, serif }) => {
              // Capitals are wider than lower case: leave room for what the letters and the spacing add up to.
              const width = Math.ceil(name.length * (size * (name === name.toUpperCase() ? 0.76 : 0.56) + spacing) + 8);
              return (
                <li key={name}>
                  <svg role="img" aria-label={name} width={width} height="36" viewBox={`0 0 ${width} 36`} overflow="visible" className="text-muted-foreground">
                    <text x="0" y="26" fill="currentColor" fontSize={size} fontWeight={weight} letterSpacing={spacing} fontStyle={serif ? "italic" : undefined} fontFamily={serif ? "Georgia, 'Times New Roman', serif" : undefined}>
                      {name}
                    </text>
                  </svg>
                </li>
              );
            })}
          </ul>
        </FullBleedBand>

        <div className="py-12 sm:py-16">
          <h3 className="max-w-[24ch] text-2xl font-semibold tracking-[-0.03em] text-balance">Start with the shop you described</h3>
          <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-pretty text-muted-foreground">Import your catalogue from a spreadsheet, pick a layout and take the first order the same afternoon. When something needs a hand, a person answers within the hour.</p>
        </div>

        <FullBleedBand tone="inverted" size="xl" as="section" aria-label="Get started">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-16">
            <div>
              <h3 className="max-w-[18ch] text-3xl leading-[1.1] font-semibold tracking-[-0.035em] text-balance sm:text-4xl">Open your shop this week</h3>
              <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-pretty text-muted-foreground">Free for 30 days, no card needed. Bring your products and we will bring everything else.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Start free</Button>
              <Button size="lg" variant="outline">
                Talk to a person
              </Button>
            </div>
          </div>
        </FullBleedBand>
      </Container>
    </FullBleedBand.Root>
  );
}
