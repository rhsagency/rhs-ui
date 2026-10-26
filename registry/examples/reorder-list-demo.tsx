"use client";

import { useState, type ReactNode } from "react";

import { ReorderList, type ReorderItem } from "@rhs-ui/commerce/reorder-list";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

const BEANS = pic(
  "#ece6da",
  "<rect x='34' y='20' width='52' height='80' rx='7' fill='#2d2a26'/><rect x='34' y='20' width='52' height='15' rx='5' fill='#4a4540'/><rect x='42' y='50' width='36' height='28' rx='3' fill='#e9dfcf'/><path d='M48 58h24M48 65h14M48 71h18' stroke='#2d2a26' stroke-width='2.5' stroke-linecap='round'/>",
);
const OAT = pic(
  "#e8e9e1",
  "<path d='M38 38l22-12 22 12v62H38z' fill='#f1eee3'/><path d='M38 38l22 10 22-10' fill='none' stroke='#cfcab8' stroke-width='3'/><rect x='46' y='58' width='28' height='24' rx='3' fill='#c9a45e'/><path d='M52 66h16M52 73h10' stroke='#fbf6e8' stroke-width='2.5' stroke-linecap='round'/>",
);
const CUPS = pic(
  "#e6e9e6",
  "<path d='M36 36h48l-7 62H43z' fill='#f4f3ee'/><ellipse cx='60' cy='36' rx='24' ry='5' fill='#fbfaf6'/><ellipse cx='60' cy='36' rx='24' ry='5' fill='none' stroke='#cfcdc4' stroke-width='2'/><path d='M40 58h40M42 76h36' stroke='#7e8f7a' stroke-width='3'/>",
);
const DESCALER = pic(
  "#e7eaee",
  "<rect x='38' y='30' width='44' height='70' rx='8' fill='#dfe5ec'/><rect x='46' y='20' width='28' height='14' rx='4' fill='#5b6676'/><rect x='38' y='54' width='44' height='24' fill='#5b6676'/><path d='M46 62h28M46 70h16' stroke='#e7eaee' stroke-width='2.5' stroke-linecap='round'/>",
);
const SINGLE = pic(
  "#ede7dc",
  "<rect x='38' y='30' width='44' height='66' rx='6' fill='#b9a07a'/><rect x='38' y='30' width='44' height='12' rx='4' fill='#a38a64'/><circle cx='60' cy='66' r='13' fill='#f1e8d6'/><path d='M54 66a6 6 0 0 1 12 0' fill='none' stroke='#6b573a' stroke-width='2.5' stroke-linecap='round'/>",
);
const JUG = pic(
  "#e8e9ec",
  "<path d='M40 42h38l-4 52a6 6 0 0 1-6 5H50a6 6 0 0 1-6-5z' fill='#c9ced6'/><path d='M78 52h8a8 8 0 0 1 0 16h-7' fill='none' stroke='#aab1bb' stroke-width='5' stroke-linecap='round'/><path d='M40 42l-6-8h12' fill='#c9ced6'/><path d='M48 56v30' stroke='#fff' stroke-opacity='.55' stroke-width='4' stroke-linecap='round'/>",
);

const NOW = "2026-10-26T09:00:00Z";

const ITEMS: readonly ReorderItem[] = [
  { id: "espresso", name: "Espresso beans, Halcyon Roast", variant: "Whole bean, 1 kg", image: BEANS, price: 1850, lastOrderedAt: "2026-10-05", lastQuantity: 4, href: "#espresso" },
  { id: "oat", name: "Barista oat drink", variant: "Case of 12 × 1 L", image: OAT, price: 2160, per: "per case", lastOrderedAt: "2026-10-05", lastQuantity: 2, href: "#oat" },
  { id: "cups", name: "Compostable cups, 8 oz", variant: "Sleeve of 50", image: CUPS, price: 420, lastOrderedAt: "2026-09-21", lastQuantity: 10, max: 40, href: "#cups" },
  { id: "descaler", name: "Descaler for espresso machines", variant: "5 L can", image: DESCALER, price: 3200, lastOrderedAt: "2026-08-25", lastQuantity: 1, unavailable: "Out of stock until 3 November" },
  { id: "single", name: "Single origin, Kestrel Farm", variant: "Whole bean, 250 g", image: SINGLE, price: 790, lastOrderedAt: "2026-10-25", lastQuantity: 6, href: "#single" },
  { id: "jug", name: "Milk jug, stainless steel", variant: "600 ml", image: JUG, price: 1400, lastOrderedAt: "2026-06-26", lastQuantity: 2, href: "#jug" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground tabular-nums">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Press Add, then raise the quantity: the button says how many more and sends only those. Not interested can be undone.");
  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="A café's usual order: each quantity starts at what was bought last time, and one product is out of stock" note={log}>
        <ReorderList
          items={ITEMS}
          currency="EUR"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          now={NOW}
          onAdd={async (id, quantity) => {
            await wait(600);
            setLog(`onAdd("${id}", ${quantity})`);
          }}
          onAddAll={async (lines) => {
            await wait(800);
            setLog(`onAddAll: ${lines.map((line) => `${line.quantity} × ${line.id}`).join(", ")}`);
          }}
          onRemove={(id) => setLog(`onRemove("${id}"): save it, so it is not suggested again`)}
          onUnremove={(id) => setLog(`onUnremove("${id}"): take that back`)}
        />
      </Example>
      <div className="grid min-w-0 gap-x-10 gap-y-12 md:grid-cols-2">
        <Example caption="In a narrow column the lines stack">
          <div className="max-w-sm min-w-0">
            <ReorderList items={ITEMS.slice(0, 3)} title="Your usual" description="Back in one tap." currency="EUR" locale="en-GB" timeZone="Europe/Amsterdam" now={NOW} headingAs="h3" />
          </div>
        </Example>
        <Example caption="When nothing is left to suggest">
          <ReorderList items={[]} title="Reorder at the counter" headingAs="h3" locale="en-GB" />
        </Example>
      </div>
    </div>
  );
}
