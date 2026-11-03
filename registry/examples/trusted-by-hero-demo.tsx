import { IconArrowRight } from "@rhs-ui/icons";
import type { Logo } from "@rhs-ui/marketing/logo-cloud";
import { TrustedByHero } from "@rhs-ui/marketing/trusted-by-hero";
import { Button } from "@rhs-ui/primitives/button";

/* Marks drawn for the demo, each in its own hand so the row reads as six companies. In your app these are the real logos, as inline SVG or <img>. */
const LOGOS: Logo[] = [
  {
    name: "Northwind",
    mark: (
      <svg viewBox="0 0 138 28" fill="currentColor">
        <circle cx="13" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="2.6" />
        <path d="M13 6.5 17.5 16h-9L13 6.5Z" />
        <text x="30" y="21" fontSize="20" fontWeight="600" letterSpacing="-0.5">
          Northwind
        </text>
      </svg>
    ),
  },
  {
    name: "Ardent",
    mark: (
      <svg viewBox="0 0 74 28" fill="currentColor">
        <text x="0" y="21" fontSize="21" fontWeight="600" letterSpacing="-0.6">
          ardent
        </text>
        <rect x="65" y="15" width="6" height="6" rx="1.2" />
      </svg>
    ),
  },
  {
    name: "Kestrel",
    mark: (
      <svg viewBox="0 0 98 28" fill="currentColor">
        <text x="0" y="20.5" fontSize="17" fontWeight="700" letterSpacing="2.2">
          KESTREL
        </text>
      </svg>
    ),
  },
  {
    name: "Polder & Co",
    mark: (
      <svg viewBox="0 0 128 28" fill="currentColor">
        <text x="0" y="21" fontSize="22" fontStyle="italic" fontWeight="600" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing="-0.4">
          Polder &amp; Co
        </text>
      </svg>
    ),
  },
  {
    name: "Lumen",
    mark: (
      <svg viewBox="0 0 94 28" fill="currentColor">
        <circle cx="13" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
        <circle cx="13" cy="14" r="3.4" />
        <text x="30" y="21" fontSize="20" fontWeight="600" letterSpacing="-0.4">
          lumen
        </text>
      </svg>
    ),
  },
  {
    name: "Fjord Freight",
    mark: (
      <svg viewBox="0 0 142 28" fill="currentColor">
        <text x="0" y="20" fontSize="17" fontWeight="500" fontFamily="ui-monospace, 'Cascadia Mono', Consolas, monospace" letterSpacing="-0.2">
          fjord/freight
        </text>
      </svg>
    ),
  },
];

/* No marks, only names: they are set in type and link to the customer's story. */
const NAMES: Logo[] = ["Northwind", "Ardent", "Kestrel", "Polder & Co", "Lumen", "Fjord Freight"].map((name) => ({ name, href: `#${name.toLowerCase().replace(/[^a-z]+/g, "-")}` }));

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TrustedByHero
        eyebrow="Customer support platform"
        title="Answer every customer in minutes, not days."
        description="Halcyon gives your team one shared inbox, rules that route the routine, and reports that show what to fix next."
        actions={
          <>
            <Button size="lg">
              Start a free trial
              <IconArrowRight />
            </Button>
            <Button size="lg" variant="outline">
              Book a demo
            </Button>
          </>
        }
        proofLabel="Trusted by 4,200 teams"
        logos={LOGOS}
        rating={{ score: 4.8, count: 1240, source: "G2" }}
      />
      <p className="border-t border-border pt-8 text-xs text-muted-foreground">Without a rating, with plain names that link to their stories, and a shorter first screen</p>
      <TrustedByHero
        className="min-h-[34rem]"
        title="Ship the thing you promised."
        description="Plans, handoffs and reviews in one place, so the work that was agreed is the work that goes out."
        actions={
          <Button size="lg">
            See how it works
            <IconArrowRight />
          </Button>
        }
        proofLabel="Used by teams at"
        logos={NAMES}
      />
    </div>
  );
}
