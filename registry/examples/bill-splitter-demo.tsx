"use client";

import { useState, type ReactNode } from "react";

import { BillSplitter, type BillItem, type BillShare } from "@rhs-ui/commerce/bill-splitter";
import { formatMoney } from "@rhs-ui/commerce/money";

/** The bill of table 12 at Osteria Marlow, line by line. A line with no names is shared by everyone. */
const ITEMS: readonly BillItem[] = [
  { id: "burrata", name: "Burrata with figs", amount: 1450, sharedBy: [0, 2] },
  { id: "tagliatelle", name: "Tagliatelle ragù", amount: 1850, sharedBy: [1] },
  { id: "margherita", name: "Pizza margherita", amount: 1400, sharedBy: [0] },
  { id: "risotto", name: "Risotto ai funghi", amount: 1900, sharedBy: [2] },
  { id: "tiramisu", name: "Tiramisu, two portions", amount: 1300, sharedBy: [0, 1] },
  { id: "water", name: "Sparkling water, 1 l", amount: 650 },
  { id: "wine", name: "Montepulciano, bottle", amount: 3200, sharedBy: [0, 1] },
];

/** A dinner for ten at Bar Lupo, billed line by line. A line with no names is shared by everyone. */
const TABLE: readonly BillItem[] = [
  { id: "board", name: "Antipasti board, to share", amount: 5200, sharedBy: [0, 1, 2, 3] },
  { id: "pizza", name: "Pizza quattro formaggi", amount: 1600, sharedBy: [4] },
  { id: "pasta", name: "Pasta al forno", amount: 1850, sharedBy: [5, 6] },
  { id: "risotto", name: "Risotto ai funghi", amount: 1900, sharedBy: [7] },
  { id: "dessert", name: "Tiramisu, four portions", amount: 3400, sharedBy: [8, 9, 0, 1] },
  { id: "water", name: "Sparkling water, 3 bottles", amount: 1950 },
];

function Example({ caption, note, className, children }: { caption: string; note: string; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 ${className ?? ""}`}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      <p role="status" className="text-xs text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [equalNote, setEqualNote] = useState("Press Pay on a share: the card works for a moment, then the share is settled.");
  const [itemNote, setItemNote] = useState("Tap a name under a dish to change who had it.");
  const settle = (set: (note: string) => void) => async (share: BillShare) => {
    await wait(700);
    set(`${share.name} paid ${formatMoney({ amount: share.total, currency: share.currency }, "en-GB")}.`);
  };

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
      <Example caption="Equally between three: the odd cent is named" note={equalNote} className="md:col-start-1 md:row-start-1">
        <BillSplitter total={9640} people={["Mira Jansen", "Joost de Vries", "Sanne Bakker"]} description="Table 12, Osteria Marlow" locale="en-GB" onPay={settle(setEqualNote)} />
      </Example>

      <Example caption="By item, a service charge shared in proportion, rounded up to whole euros" note={itemNote} className="md:col-start-2 md:row-span-2 md:row-start-1">
        <BillSplitter
          total={11990}
          items={ITEMS}
          people={["Mira Jansen", "Joost de Vries", "Sanne Bakker"]}
          defaultMode="items"
          defaultRoundUp
          description="Table 12, Osteria Marlow"
          locale="en-GB"
          onPay={settle(setItemNote)}
        />
      </Example>

      <Example caption="One share is paid: the split is fixed from then on" note="Mira has paid. The status under the total says what is left." className="md:col-start-1 md:row-start-2">
        <BillSplitter total={9640} people={["Mira Jansen", "Joost de Vries", "Sanne Bakker"]} tipPercent={5} paid={[0]} onPay={() => undefined} locale="en-GB" />
      </Example>

      <Example
        caption="Only a count, no names: ten people in a wide card, by item"
        note="Guest 1 to Guest 10: every chip says who it is, and the chips wrap under the dish instead of squeezing its name."
        className="md:col-span-2 md:mx-auto md:w-full md:max-w-[40rem]"
      >
        <BillSplitter total={17490} items={TABLE} people={10} defaultMode="items" description="Table 7, Bar Lupo" locale="en-GB" />
      </Example>
    </div>
  );
}
