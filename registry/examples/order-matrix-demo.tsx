"use client";

import { useState, type ReactNode } from "react";

import { OrderMatrix, type OrderMatrixColumn, type OrderMatrixOrder, type OrderMatrixRow, type OrderMatrixStock } from "@rhs-ui/commerce/order-matrix";

const JUMPER_ROWS: readonly OrderMatrixRow[] = [
  { id: "navy", label: "Navy", swatch: "#1f2a44" },
  { id: "oat", label: "Oat", swatch: "#d8cdb8" },
  { id: "moss", label: "Moss", swatch: "#5d6b4a" },
  { id: "charcoal", label: "Charcoal", swatch: "#3a3d42" },
  { id: "rust", label: "Rust", swatch: "#b4553a" },
];
const JUMPER_COLUMNS: readonly OrderMatrixColumn[] = ["XS", "S", "M", "L", "XL", "XXL"].map((label) => ({ id: label.toLowerCase(), label }));
/** XXL is not made in Rust, Charcoal XS is sold out and Moss XXL is nearly gone. */
const JUMPER_STOCK: OrderMatrixStock = {
  navy: { xs: 24, s: 60, m: 84, l: 72, xl: 40, xxl: 18 },
  oat: { xs: 12, s: 36, m: 48, l: 44, xl: 20, xxl: 8 },
  moss: { xs: 10, s: 28, m: 40, l: 36, xl: 14, xxl: 3 },
  charcoal: { xs: 0, s: 30, m: 52, l: 46, xl: 22, xxl: 9 },
  rust: { xs: 6, s: 14, m: 22, l: 18, xl: 5 },
};

const SHOE_ROWS: readonly OrderMatrixRow[] = [
  { id: "regular", label: "Regular fit" },
  { id: "wide", label: "Wide fit" },
];
const SHOE_COLUMNS: readonly OrderMatrixColumn[] = ["39", "40", "41", "42", "43", "44", "45", "46"].map((label) => ({ id: label, label }));
const SHOE_STOCK: OrderMatrixStock = {
  regular: { "39": 12, "40": 20, "41": 32, "42": 40, "43": 36, "44": 24, "45": 10, "46": 2 },
  wide: { "41": 0, "42": 14, "43": 16, "44": 12, "45": 4 },
};

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [added, setAdded] = useState("Press Add to order: the button shows it is working while your app takes the order.");
  const addJumpers = async (order: OrderMatrixOrder): Promise<void> => {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setAdded(`Added ${order.pieces} pieces in ${order.lines.length} sizes to the order.`);
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl min-w-0 gap-12 px-4 py-10 sm:px-6">
      <Section title="Kestrel merino crew jumper" note="Spring and summer 2027. Wholesale price €39.00 a piece, at least 2 of any size you order.">
        <div className="grid gap-3">
          <OrderMatrix
            rows={JUMPER_ROWS}
            columns={JUMPER_COLUMNS}
            stock={JUMPER_STOCK}
            defaultValue={{ navy: { s: 4, m: 6, l: 6, xl: 2 }, oat: { m: 4, l: 2 }, moss: { s: 2 } }}
            minPerCell={2}
            unitPrice={3900}
            currency="EUR"
            locale="en-GB"
            onAddAll={addJumpers}
          />
          <p role="status" className="text-xs text-muted-foreground">
            {added}
          </p>
        </div>
      </Section>

      <Section title="Halcyon leather derby" note="Widths down the side and European sizes across: a wide grid scrolls and keeps its first column in view, and the keyboard never ends up under it. The 42 below holds one pair, which is under the minimum.">
        <OrderMatrix
          title="Order by width and size"
          description="Sold in pairs, at least 2 pairs of any size you order."
          rows={SHOE_ROWS}
          columns={SHOE_COLUMNS}
          stock={SHOE_STOCK}
          defaultValue={{ regular: { "42": 1, "43": 4, "44": 6 }, wide: { "43": 2 } }}
          minPerCell={2}
          unitPrice={7400}
          currency="EUR"
          locale="en-GB"
          labels={{
            rowHeader: "Width",
            caption: "Pairs to order, by width and size",
            piecesOne: "{count} pair",
            piecesOther: "{count} pairs",
            each: "{price} a pair",
            minimum: "Order at least {min} pairs of a size, or none. Check {cells}.",
          }}
          onAddAll={() => undefined}
        />
      </Section>
    </div>
  );
}
