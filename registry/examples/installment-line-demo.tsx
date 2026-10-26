import type { ReactNode } from "react";

import { formatMoney } from "@rhs-ui/commerce/money";
import { InstallmentLine, type InstallmentLineProps } from "@rhs-ui/commerce/installment-line";

const TERMS = (
  <p>
    Each part is charged to the card you pay with, on the same day of the month. Paying early is free. If a payment fails we try again after three days and
    send you a message first.
  </p>
);

/** A product block as it sits on a product page: the name, the price, then the line under it. */
function Product({ name, price, line, note }: { name: string; price: number; line: ReactNode; note?: ReactNode }): React.JSX.Element {
  return (
    <section aria-label={name} className="grid content-start gap-1.5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <h2 className="text-sm text-muted-foreground">{name}</h2>
      <p className="text-3xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{formatMoney({ amount: price, currency: "EUR" }, "en-GB")}</p>
      <div className="mt-1.5">{line}</div>
      {note}
    </section>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const SHARED: Partial<InstallmentLineProps> = { currency: "EUR", locale: "en-GB", terms: TERMS };

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
      <Example caption="Three even parts: the details count the months">
        <Product name="Arc desk lamp" price={9900} line={<InstallmentLine price={9900} parts={3} {...SHARED} />} />
      </Example>

      <Example caption="Four parts, two weeks apart: the odd cents go first">
        <Product name="Ridge reading chair" price={14999} line={<InstallmentLine price={14999} parts={4} interval="two-weeks" now="2026-10-20T10:00:00Z" timeZone="Europe/Amsterdam" {...SHARED} />} />
      </Example>

      <Example caption="With a fee: in the line and in the details">
        <Product name="Kestrel standing desk" price={29900} line={<InstallmentLine price={29900} parts={3} fee={600} now="2026-10-20T10:00:00Z" timeZone="Europe/Amsterdam" {...SHARED} />} />
      </Example>

      <Example caption="Below the 50.00 minimum: no line at all">
        <Product
          name="Cedar coaster set"
          price={2400}
          line={<InstallmentLine price={2400} minPrice={5000} {...SHARED} />}
          note={<p className="mt-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">Nothing under the price: payment in parts starts at €50.00.</p>}
        />
      </Example>
    </div>
  );
}
