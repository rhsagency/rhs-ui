import type { ReactNode } from "react";

import { RatingInline } from "@rhs-ui/commerce/rating-inline";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]">
      <Example caption="Under a product name, linking to the reviews">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Linen shirt</h2>
          <RatingInline value={4.6} count={128} href="#reviews" />
          <p className="mt-1 text-lg font-medium tabular-nums">€48.00</p>
        </div>
      </Example>

      <Example caption="Three sizes">
        <div className="grid gap-3">
          <RatingInline size="sm" value={4.6} count={128} />
          <RatingInline value={4.6} count={128} />
          <RatingInline size="lg" value={4.6} count={128} />
        </div>
      </Example>

      <Example caption="Fractions are drawn, not rounded">
        <div className="grid gap-3">
          <RatingInline value={5} count={42} />
          <RatingInline value={4.5} count={210} />
          <RatingInline value={3.2} count={17} />
          <RatingInline value={1.8} count={9} />
        </div>
      </Example>

      <Example caption="Above a thousand the count is shortened, and the name keeps the full number">
        <div className="grid gap-3">
          <RatingInline value={4.8} count={1284} />
          <RatingInline value={4.7} count={12400} />
          <RatingInline value={4.9} count={1} />
        </div>
      </Example>

      <Example caption="Without the count on screen">
        <RatingInline value={4.4} count={86} hideCount />
      </Example>

      <Example caption="With no reviews: a line of words, or a link to write the first one. Never five empty stars.">
        <div className="grid gap-3">
          <RatingInline count={0} />
          <RatingInline count={0} href="#write" emptyText="Be the first to review" />
        </div>
      </Example>
    </div>
  );
}
