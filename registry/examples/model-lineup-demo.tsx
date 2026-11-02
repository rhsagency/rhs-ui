import type { ReactNode } from "react";

import { ModelLineup } from "@rhs-ui/marketing/model-lineup";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="A model family in one table: what each is best for, the context window, speed as a meter with a word, and the price of a million tokens. One model is marked Recommended in words">
        <ModelLineup
          eyebrow="Models"
          title="Pick the model that fits the job"
          description="All four share one API, so you can start with the one in the middle and move up or down when the numbers tell you to."
          note="Prices are in US dollars per million tokens, billed monthly. Batch requests cost half, and cached input costs 90% less."
          models={[
            {
              id: "kestrel-swift",
              name: "Kestrel Swift",
              tier: "Compact",
              bestFor: "high-volume work: tagging, routing and short answers",
              context: 200_000,
              speed: 3,
              priceIn: 0.25,
              priceOut: 1.25,
              href: "#swift",
            },
            {
              id: "kestrel-core",
              name: "Kestrel Core",
              tier: "Balanced",
              bestFor: "everyday product features, support agents and drafting",
              context: 200_000,
              speed: 2,
              priceIn: 3,
              priceOut: 15,
              recommended: true,
              href: "#core",
            },
            {
              id: "kestrel-lens",
              name: "Kestrel Lens",
              tier: "Vision",
              bestFor: "reading images, charts and scanned documents",
              context: 200_000,
              speed: 2,
              priceIn: 4,
              priceOut: 20,
              href: "#lens",
            },
            {
              id: "kestrel-apex",
              name: "Kestrel Apex",
              tier: "Flagship",
              bestFor: "hard problems: long documents, code review and analysis",
              context: 1_000_000,
              speed: 1,
              priceIn: 15,
              priceOut: 75,
              href: "#apex",
              linkLabel: "Talk to us",
            },
          ]}
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="Three models in a narrow column, priced in euros: each becomes a card with the same labels, and none is recommended">
          <ModelLineup
            headingLevel={3}
            title="Northwind assistant models"
            currency="EUR"
            locale="en-IE"
            models={[
              { id: "nw-lite", name: "Northwind Lite", tier: "Compact", bestFor: "quick replies in chat", context: 128_000, speed: 3, priceIn: 0.1, priceOut: 0.4, href: "#lite" },
              { id: "nw-standard", name: "Northwind Standard", tier: "Balanced", bestFor: "drafting and summaries", context: 128_000, speed: 2, priceIn: 1.2, priceOut: 4.8, href: "#standard" },
              { id: "nw-max", name: "Northwind Max", tier: "Flagship", bestFor: "complex reasoning over long files", context: 512_000, speed: 1, priceIn: 9, priceOut: 36, href: "#max" },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
