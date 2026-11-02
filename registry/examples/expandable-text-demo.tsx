"use client";

import { useState, type ReactNode } from "react";

import { ExpandableText } from "@rhs-ui/application/expandable-text";
import { Button } from "@rhs-ui/primitives/button";

const THROW =
  "Woven in small batches at a family mill in Kortrijk, the Halcyon throw starts stiff and softens with every wash, until it drapes as if it had always lived on your sofa. The stonewashed Belgian flax is breathable in July and quietly warm in January, and the hand-knotted fringe is finished in the same thread, so it never frays. Machine wash at 40 degrees, tumble dry low, and expect it to look better in a year than it does today. Every throw ships in a reusable cotton bag with a swatch card of the dye lot, in case you ever want to match a cushion.";

const REVIEWS = [
  {
    id: "anneke",
    name: "Anneke V.",
    text: "I bought the throw for my mother in March and now she refuses to share it. The weight is perfect, the colour (Oat) is exactly as photographed, and it survived a red wine incident with a single wash. Delivery took three days, and the cotton bag it came in is now our picnic blanket carrier.",
  },
  {
    id: "daniel",
    name: "Daniel R.",
    text: "Lovely, but size up if you want it to cover a full sofa: the standard throw is closer to a generous lap blanket. The quality is outstanding and the fringe is beautifully finished. Support answered my sizing question within the hour.",
  },
];

function Card({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">{children}</div>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  // One flag per review, so a person can open one, and "Expand all" is just a way to set them together.
  const [open, setOpen] = useState<Record<string, boolean>>({ anneke: true, daniel: false });
  const all = REVIEWS.every((review) => open[review.id]);

  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-md gap-6">
        <Card caption="Three lines by default. The toggle is there because the text is cut.">
          <h2 className="text-base font-semibold tracking-[-0.02em]">Halcyon linen throw</h2>
          <ExpandableText className="text-muted-foreground">{THROW}</ExpandableText>
        </Card>

        <Card caption="A text that fits has no toggle, so nothing is offered that does nothing">
          <h2 className="text-base font-semibold tracking-[-0.02em]">About Kestrel Studio</h2>
          <ExpandableText className="text-muted-foreground">A two-person design practice in Rotterdam, making identities and shops for makers.</ExpandableText>
        </Card>

        <Card caption="Controlled: the state is yours, two lines, your own words on the toggle">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-[-0.02em]">Customer reviews</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(Object.fromEntries(REVIEWS.map((review) => [review.id, !all])))}>
              {all ? "Collapse all" : "Expand all"}
            </Button>
          </div>
          <ul className="grid gap-4">
            {REVIEWS.map((review) => (
              <li key={review.id} className="grid gap-1.5 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <p className="text-[0.8125rem] font-medium">{review.name}</p>
                <ExpandableText lines={2} expanded={open[review.id] ?? false} onExpandedChange={(next) => setOpen((state) => ({ ...state, [review.id]: next }))} moreLabel="Read full review" lessLabel="Collapse" className="text-muted-foreground">
                  {review.text}
                </ExpandableText>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
