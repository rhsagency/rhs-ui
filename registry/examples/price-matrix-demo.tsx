"use client";

import { useState, type ReactNode } from "react";

import { PriceMatrix, type PriceMatrixColumn, type PriceMatrixPrices, type PriceMatrixRow, type PriceMatrixValue } from "@rhs-ui/commerce/price-matrix";

const POSTER_ROWS: readonly PriceMatrixRow[] = ["A6", "A5", "A4", "A3", "A2"].map((label) => ({ id: label.toLowerCase(), label }));
const POSTER_COLUMNS: readonly PriceMatrixColumn[] = [
  { id: "gloss", label: "170 g gloss" },
  { id: "silk", label: "250 g silk" },
  { id: "matt", label: "350 g matt" },
  { id: "canvas", label: "Canvas" },
];
/** Gloss is not printed at A2, and canvas starts at A4. */
const POSTER_PRICES: PriceMatrixPrices = {
  a6: { gloss: 420, silk: 480, matt: 560, canvas: null },
  a5: { gloss: 590, silk: 690, matt: 820, canvas: null },
  a4: { gloss: 890, silk: 1050, matt: 1250, canvas: 2490 },
  a3: { gloss: 1190, silk: 1450, matt: 1740, canvas: 3490 },
  a2: { gloss: null, silk: 2290, matt: 2790, canvas: 5290 },
};

const CARD_ROWS: readonly PriceMatrixRow[] = [
  { id: "matt", label: "Matt laminate" },
  { id: "soft", label: "Soft touch" },
  { id: "spot", label: "Spot gloss" },
];
const CARD_COLUMNS: readonly PriceMatrixColumn[] = ["100", "250", "500", "1,000"].map((label) => ({ id: label.replace(",", ""), label: `${label} cards` }));
/** Spot gloss starts at 250. */
const CARD_PRICES: PriceMatrixPrices = {
  matt: { "100": 1900, "250": 2900, "500": 4400, "1000": 7400 },
  soft: { "100": 2400, "250": 3600, "500": 5400, "1000": 9200 },
  spot: { "100": null, "250": 4400, "500": 6500, "1000": 11000 },
};

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [cards, setCards] = useState<PriceMatrixValue | null>(null);

  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-14 px-4 py-10 sm:px-6">
      <Example caption="Sizes against paper. Arrow keys move between the prices and Space chooses; combinations that are not made say so and are skipped">
        <PriceMatrix
          title="Poster prints"
          description="Printed and shipped within two working days. Choose the size, then the paper."
          caption="Price per print, VAT included."
          rows={POSTER_ROWS}
          columns={POSTER_COLUMNS}
          prices={POSTER_PRICES}
          defaultValue={{ row: "a3", column: "silk" }}
          currency="EUR"
          locale="en-GB"
          labels={{ corner: "Size", choose: "Choose a size and a paper" }}
        />
      </Example>

      <Example caption="Finishes against quantity, controlled from outside, with nothing chosen yet and no lowest-price mark">
        <PriceMatrix
          headingAs="h3"
          title="Business cards"
          description="Printed on 400 g board, with rounded corners on request."
          caption="Price for the whole order."
          rows={CARD_ROWS}
          columns={CARD_COLUMNS}
          prices={CARD_PRICES}
          value={cards}
          onValueChange={setCards}
          markCheapest={false}
          currency="USD"
          locale="en-US"
          labels={{ corner: "Finish", choose: "Choose a finish and a quantity" }}
        />
      </Example>
    </div>
  );
}
