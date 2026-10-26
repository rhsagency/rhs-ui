"use client";

import { useRef, useState, type ReactNode } from "react";

import { RankedProductList, type RankedMovement, type RankedProduct } from "@rhs-ui/commerce/ranked-product-list";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/><ellipse cx='60' cy='99' rx='30' ry='4' fill='#000' opacity='.07'/>${body}</svg>`);

/** Each product is drawn from a few flat shapes, so the demo needs no pictures. */
const ART = {
  kettle: pic(
    "#e6e8eb",
    "<path d='M36 54h36l-3 40a6 6 0 0 1-6 5H45a6 6 0 0 1-6-5z' fill='#c4cad3'/><rect x='41' y='46' width='26' height='9' rx='4.5' fill='#a3abb7'/><circle cx='54' cy='42' r='3.5' fill='#2d2f31'/><path d='M71 66c8-6 12-14 14-24 .5-3 4-2.5 4 .5-1 13-6 24-16 31' fill='none' stroke='#a3abb7' stroke-width='5' stroke-linecap='round'/><path d='M36 60c-13-2-14 24 0 22' fill='none' stroke='#2d2f31' stroke-width='5' stroke-linecap='round'/><path d='M45 64v26' stroke='#fff' stroke-opacity='.55' stroke-width='4' stroke-linecap='round'/>",
  ),
  mug: pic(
    "#ece7de",
    "<path d='M34 44h42v38a14 14 0 0 1-14 14H48a14 14 0 0 1-14-14z' fill='#d9c9ae'/><path d='M76 52h6a10 10 0 0 1 0 20h-6' fill='none' stroke='#d9c9ae' stroke-width='7' stroke-linecap='round'/><ellipse cx='55' cy='44' rx='21' ry='4.5' fill='#6f5a3e'/><path d='M42 58v24' stroke='#fff' stroke-opacity='.4' stroke-width='4' stroke-linecap='round'/>",
  ),
  dripper: pic(
    "#e5e9e6",
    "<path d='M30 36h60l-14 26H44z' fill='#f4f3ee'/><path d='M30 36h60l-14 26H44z' fill='none' stroke='#c9ccc4' stroke-width='3' stroke-linejoin='round'/><rect x='46' y='62' width='28' height='8' rx='3' fill='#cfd3c8'/><path d='M44 70h32l-3 24a5 5 0 0 1-5 4H52a5 5 0 0 1-5-4z' fill='#c3d0c5'/><path d='M52 78v14' stroke='#fff' stroke-opacity='.55' stroke-width='3.5' stroke-linecap='round'/>",
  ),
  candle: pic(
    "#ebe6e1",
    "<rect x='38' y='50' width='44' height='46' rx='8' fill='#cdbfae'/><rect x='38' y='50' width='44' height='46' rx='8' fill='none' stroke='#b9a995' stroke-width='3'/><rect x='42' y='60' width='36' height='32' rx='4' fill='#f1e9dc'/><path d='M60 60V50' stroke='#4a3f35' stroke-width='3' stroke-linecap='round'/><path d='M60 30c8 7 9 13 0 19-9-6-8-12 0-19z' fill='#e3a64f'/><path d='M60 38c3 3 4 6 0 9-4-3-3-6 0-9z' fill='#f6d28a'/>",
  ),
  throw: pic(
    "#e9e6df",
    "<rect x='26' y='70' width='68' height='24' rx='4' fill='#bfb6a4'/><rect x='24' y='50' width='72' height='24' rx='4' fill='#d3cbb9'/><rect x='22' y='30' width='76' height='24' rx='4' fill='#e4dece'/><path d='M22 42h76M24 62h72M26 82h68' stroke='#9c9079' stroke-width='3'/><path d='M22 54v6M30 54v7M38 54v6M46 54v7M54 54v6M62 54v7M70 54v6M78 54v7M86 54v6M94 54v6' stroke='#c2b9a6' stroke-width='2.5' stroke-linecap='round'/>",
  ),
  planter: pic(
    "#e6e9e3",
    "<path d='M36 66h48l-6 30a5 5 0 0 1-5 4H47a5 5 0 0 1-5-4z' fill='#c9825f'/><rect x='33' y='60' width='54' height='9' rx='4' fill='#b86f4d'/><path d='M60 60c-16-2-22-14-18-26 12 2 20 12 18 26z' fill='#7d9a78'/><path d='M60 60c14-4 20-16 14-28-12 4-18 14-14 28z' fill='#93ae8d'/><path d='M60 60V40' stroke='#5f7a5b' stroke-width='3' stroke-linecap='round'/>",
  ),
};

type Row = readonly [id: keyof typeof ART, proof: string, movement: RankedMovement, rating?: number, count?: number];

const CATALOGUE: Record<keyof typeof ART, Omit<RankedProduct, "proof" | "movement" | "rating" | "ratingCount">> = {
  kettle: { id: "kettle", name: "Halcyon pour-over kettle", subtitle: "Brushed steel, 0.9 L", price: 8900, href: "#kettle", image: { src: ART.kettle } },
  mug: { id: "mug", name: "Kestrel stoneware mug", subtitle: "Set of two, 350 ml", price: 3400, compareAtPrice: 4200, href: "#mug", image: { src: ART.mug } },
  dripper: { id: "dripper", name: "Northwind ceramic dripper", subtitle: "Fits one to four cups", price: 2600, href: "#dripper", image: { src: ART.dripper } },
  candle: { id: "candle", name: "Evening candle, cedar and fig", subtitle: "Glass jar, 40 hours", price: 2800, href: "#candle", image: { src: ART.candle } },
  throw: { id: "throw", name: "Merino wool throw", subtitle: "130 × 180 cm, oat", price: 12900, href: "#throw", image: { src: ART.throw }, available: false },
  planter: { id: "planter", name: "Terracotta planter", subtitle: "Hand glazed, 22 cm", price: 4500, href: "#planter", image: { src: ART.planter } },
};

const build = (rows: readonly Row[]): readonly RankedProduct[] =>
  rows.map(([id, proof, movement, rating, ratingCount]) => ({ ...CATALOGUE[id], proof, movement, rating, ratingCount }));

const LISTS: Record<string, readonly RankedProduct[]> = {
  week: build([
    ["kettle", "1,240 sold this week", { kind: "up", by: 2 }, 4.8, 312],
    ["mug", "986 sold this week", { kind: "new" }],
    ["dripper", "744 sold this week", { kind: "down", by: 1 }, 4.7, 188],
    ["candle", "Rated by 1,204 people", { kind: "same" }, 4.6, 1204],
    ["throw", "Back in stock on 3 November", { kind: "down", by: 2 }],
    ["planter", "402 sold this week", { kind: "up", by: 1 }],
  ]),
  month: build([
    ["candle", "4,310 sold this month", { kind: "same" }, 4.6, 1204],
    ["kettle", "3,980 sold this month", { kind: "up", by: 1 }, 4.8, 312],
    ["throw", "Back in stock on 3 November", { kind: "down", by: 1 }],
    ["dripper", "2,206 sold this month", { kind: "down", by: 1 }, 4.7, 188],
    ["mug", "1,870 sold this month", { kind: "new" }],
    ["planter", "1,125 sold this month", { kind: "same" }],
  ]),
  all: build([
    ["candle", "31,402 sold", { kind: "same" }, 4.6, 1204],
    ["throw", "22,960 sold", { kind: "same" }],
    ["dripper", "18,337 sold", { kind: "up", by: 1 }, 4.7, 188],
    ["kettle", "16,820 sold", { kind: "down", by: 1 }, 4.8, 312],
    ["planter", "9,744 sold", { kind: "same" }],
    ["mug", "3,712 sold since March", { kind: "new" }],
  ]),
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [period, setPeriod] = useState("week");
  const [log, setLog] = useState("Switch the period to change the list, or press Add on a row. The sold out throw keeps its place, and the first add of the planter fails on purpose, to show Try again.");
  // The planter's first add is rejected, so the state of a failed add can be seen; a second press goes through.
  const plantersTried = useRef(false);
  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="The best sellers of a home shop: a period control, a word for every movement, and one product that is sold out" note={log}>
        <RankedProductList
          items={LISTS[period] ?? LISTS.week ?? []}
          period={period}
          onPeriodChange={(next) => {
            setPeriod(next);
            setLog(`onPeriodChange("${next}"): pass the list for that period back as items`);
          }}
          onAddToCart={async (item) => {
            await wait(700);
            if (item.id === "planter" && !plantersTried.current) {
              plantersTried.current = true;
              setLog("onAddToCart rejected: the button says Try again, and a second press goes through");
              throw new Error("The warehouse did not answer");
            }
            setLog(`onAddToCart: ${item.name}`);
          }}
          currency="EUR"
          locale="en-GB"
        />
      </Example>

      <div className="grid min-w-0 gap-x-12 gap-y-14 md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:items-start">
        <Example caption="In a narrow column the picture shrinks and the proof moves under the name">
          <RankedProductList
            headingAs="h3"
            title="Top four this week"
            description="Updated every hour."
            items={LISTS.week ?? []}
            period="week"
            limit={4}
            onAddToCart={async () => {
              await wait(500);
            }}
            currency="EUR"
            locale="en-GB"
          />
        </Example>
        <Example caption="Without a control or Add buttons it is a plain chart: the period is only named, and every row is one link">
          <RankedProductList headingAs="h3" title="All-time favourites" description="Since the shop opened in 2019." items={LISTS.all ?? []} period="all" limit={5} currency="EUR" locale="en-GB" />
        </Example>
      </div>
    </div>
  );
}
