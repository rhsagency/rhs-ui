import type { ReactNode } from "react";

import { PriceTransparency } from "@rhs-ui/commerce/price-transparency";

/** A caption and the card under it. Side by side, the two share their rows, so the cards start at the same height whatever the captions say. */
function Example({ caption, paired = false, children }: { caption: string; paired?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <div className={paired ? "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 md:row-span-2 md:grid-rows-subgrid md:items-start" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-3xl min-w-0 gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="A direct-to-consumer jacket: four parts that add up to the price, an explanation behind each name, and the typical retail price beside it">
        <PriceTransparency
          description="Kestrel down jacket, in Fjord green"
          price={14_800}
          retail={24_500}
          currency="EUR"
          locale="en-GB"
          parts={[
            { label: "Materials", amount: 4_200, note: "Recycled down fill and a three-layer shell fabric, bought straight from the mill in Biella." },
            { label: "Making", amount: 3_600, note: "Cut and sewn in a partner workshop in Porto, where everyone is paid above the living wage." },
            { label: "Shipping and duties", amount: 1_500, note: "Sea freight to our warehouse in Rotterdam, import duty and the parcel to your door." },
            { label: "Margin", amount: 5_500, note: "What is left for design, the team and the shop. It is before tax." },
          ]}
          note="Based on the production run of September 2026. Amounts are rounded to the nearest euro cent, and the typical retail price is the median of twelve comparable down jackets."
        />
      </Example>

      <div className="grid min-w-0 gap-x-10 gap-y-16 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:items-start md:gap-y-4">
        <Example paired caption="When the parts do not explain the whole price, the rest is drawn as other costs, so the bar still adds up">
          <PriceTransparency
            headingAs="h3"
            title="What you pay for"
            description="Halcyon chilli oil, 250 ml"
            price={6_400}
            currency="EUR"
            locale="en-GB"
            parts={[
              { label: "Ingredients", amount: 1_400, note: "Chillies from a single farm in Puebla and cold-pressed sunflower oil." },
              { label: "Packaging", amount: 800 },
              { label: "Production", amount: 1_700 },
              { label: "Shipping", amount: 1_500 },
            ]}
          />
        </Example>
        <Example paired caption="Without a retail price there is nothing to compare, and a part with no explanation is plain text">
          <PriceTransparency
            headingAs="h3"
            title="Where it goes"
            description="Northwind linen shirt"
            price={9_500}
            currency="EUR"
            locale="en-GB"
            parts={[
              { label: "Fabric", amount: 3_100, note: "European flax, woven and washed in Portugal." },
              { label: "Making", amount: 2_400 },
              { label: "Shipping and duties", amount: 900 },
              { label: "Margin", amount: 3_100, note: "Before tax, overheads and the cost of returns." },
            ]}
            note="Checked on 12 October 2026."
          />
        </Example>
      </div>

      <Example caption="Without any cost data there is no bar and no list, and the price stands as it is: it is never shown as nothing, and the comparison with the retail price still works">
        <PriceTransparency
          headingAs="h3"
          title="How our price compares"
          description="Northwind cashmere beanie"
          price={7_900}
          retail={11_900}
          parts={[]}
          currency="EUR"
          locale="en-GB"
          note="The typical retail price is the median of nine comparable beanies, checked on 12 October 2026."
        />
      </Example>
    </div>
  );
}
