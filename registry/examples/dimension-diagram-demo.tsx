"use client";

import { useState, type ReactNode } from "react";

import { DimensionDiagram, type Unit } from "@rhs-ui/commerce/dimension-diagram";

function Example({ caption, title, children }: { caption: string; title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="grid gap-2">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // One choice for the whole page: switch any diagram and the others follow, as a shopper would expect.
  const [unit, setUnit] = useState<Unit>("cm");
  const shared = { displayUnit: unit, onDisplayUnitChange: setUnit, locale: "en-GB" } as const;

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr))]">
      <Example caption="A box in light perspective: width, depth and height, written out above the drawing" title="Kestrel two-door wardrobe">
        <DimensionDiagram width={80} depth={45} height={120} {...shared} />
      </Example>

      <Example caption="An extra measurement across the drawing: the height of the seat" title="Northwind oak dining chair">
        <DimensionDiagram width={46} depth={52} height={88} extras={[{ label: "Seat height", value: 46 }]} {...shared} />
      </Example>

      <Example caption="A cylinder: the width is its diameter" title="Halcyon storage drum">
        <DimensionDiagram shape="cylinder" width={40} height={60} {...shared} />
      </Example>

      <Example caption="A flat shape seen from above: the thickness is told in numbers, not drawn to scale" title="Linen runner rug">
        <DimensionDiagram shape="flat" width={200} depth={140} height={1.5} {...shared} />
      </Example>

      <Example caption="No depth given: a flat elevation, and a single unit so there is no switch" title="Wall mirror, oak frame">
        <DimensionDiagram width={60} height={90} units={["cm"]} locale="en-GB" />
      </Example>

      <Example caption="Large and exact: a desk with the height of the lowest shelf" title="Northwind standing desk">
        <DimensionDiagram width={160} depth={70} height={110} extras={[{ label: "Shelf", value: 74 }]} {...shared} />
      </Example>
    </div>
  );
}
