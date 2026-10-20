"use client";

import { useState } from "react";

import { AddStepper } from "@rhs-ui/commerce/add-stepper";
import { ViewCartBar } from "@rhs-ui/commerce/view-cart-bar";

const art = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 112 112'><rect width='112' height='112' fill='${bg}'/>${body}</svg>`);

interface Dish {
  id: string;
  name: string;
  note: string;
  /** Minor units. */
  price: number;
  image: string;
}

const STARTERS: Dish[] = [
  {
    id: "burrata",
    name: "Burrata, blood orange",
    note: "Pickled fennel, toasted seeds",
    price: 950,
    image: art("#efe9de", "<circle cx='56' cy='58' r='38' fill='#fbf9f4' stroke='#d9d2c4' stroke-width='2'/><circle cx='56' cy='56' r='18' fill='#fffdf8' stroke='#e6dfd0' stroke-width='2'/><path d='M30 70a30 30 0 0 0 20 12' fill='none' stroke='#e8892f' stroke-width='6' stroke-linecap='round'/><path d='M82 44a30 30 0 0 0-14-14' fill='none' stroke='#e8892f' stroke-width='6' stroke-linecap='round'/>"),
  },
  {
    id: "leeks",
    name: "Charred leeks, hazelnut",
    note: "Brown butter, sorrel",
    price: 800,
    image: art("#e4ebdc", "<rect x='26' y='30' width='60' height='14' rx='7' fill='#5f7f45'/><rect x='22' y='50' width='64' height='14' rx='7' fill='#7a9a5b'/><rect x='30' y='70' width='58' height='14' rx='7' fill='#5f7f45'/>"),
  },
  {
    id: "bread",
    name: "Sourdough, cultured butter",
    note: "Baked this morning",
    price: 450,
    image: art("#efe3d3", "<ellipse cx='56' cy='58' rx='40' ry='26' fill='#c68b4e'/><path d='M34 52l14-8M50 56l14-8M66 60l14-8' stroke='#e6bf8d' stroke-width='5' stroke-linecap='round'/><rect x='38' y='78' width='22' height='12' rx='3' fill='#f3dd8f'/>"),
  },
];

const MAINS: Dish[] = [
  {
    id: "halibut",
    name: "Halibut, brown butter",
    note: "Celeriac, capers, lemon",
    price: 2400,
    image: art("#e1e7ec", "<path d='M24 58c14-22 44-22 64 0-20 22-50 22-64 0z' fill='#f3efe8'/><path d='M84 58l14-12v24z' fill='#e6e0d4'/><circle cx='42' cy='54' r='3' fill='#3b3029'/><path d='M30 76c14 8 34 8 48 0' fill='none' stroke='#d8a24a' stroke-width='6' stroke-linecap='round'/>"),
  },
  {
    id: "celeriac",
    name: "Pot-roast celeriac",
    note: "Miso, walnut, parsley oil",
    price: 1900,
    image: art("#ece6dc", "<circle cx='56' cy='58' r='30' fill='#b79c72'/><path d='M40 50c8 6 24 6 32 0M38 64c10 8 26 8 36 0' fill='none' stroke='#8f7650' stroke-width='3' stroke-linecap='round'/><path d='M56 28c-6-8-2-14 4-16' fill='none' stroke='#6c8a4e' stroke-width='5' stroke-linecap='round'/>"),
  },
  {
    id: "gnocchi",
    name: "Potato gnocchi, sage",
    note: "Aged gouda, browned butter",
    price: 2100,
    image: art("#f0ebdd", "<circle cx='56' cy='58' r='38' fill='#fbf9f4' stroke='#d9d2c4' stroke-width='2'/><ellipse cx='42' cy='52' rx='9' ry='6' fill='#e9cf8f'/><ellipse cx='60' cy='48' rx='9' ry='6' fill='#e3c47c'/><ellipse cx='72' cy='62' rx='9' ry='6' fill='#e9cf8f'/><ellipse cx='50' cy='68' rx='9' ry='6' fill='#e3c47c'/><path d='M58 56l6 6' stroke='#6c8a4e' stroke-width='4' stroke-linecap='round'/>"),
  },
];

const PRICE = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });

export default function Demo(): React.JSX.Element {
  const [quantities, setQuantities] = useState<Record<string, number>>({ burrata: 1, leeks: 2 });
  const [note, setNote] = useState("Opens 11:30 to 22:00, Tuesday to Sunday.");

  const dishes = [...STARTERS, ...MAINS];
  const count = dishes.reduce((sum, dish) => sum + (quantities[dish.id] ?? 0), 0);
  const total = dishes.reduce((sum, dish) => sum + (quantities[dish.id] ?? 0) * dish.price, 0);

  const section = (title: string, list: Dish[]) => (
    <section className="pt-7">
      <h2 className="text-lg font-semibold tracking-[-0.03em]">{title}</h2>
      <ul className="mt-2 divide-y divide-border">
        {list.map((dish) => (
          // On a phone the price and the control share a line under the words (and stack when there is no room); from sm up the control sits at the end, centred.
          <li key={dish.id} className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1.5 py-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto]">
            {/* eslint-disable-next-line @next/next/no-img-element -- a drawn demo picture */}
            <img src={dish.image} alt="" width={64} height={64} className="row-span-2 size-16 rounded-lg border border-border object-cover" />
            <div className="min-w-0">
              <p className="text-sm leading-snug font-medium">{dish.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{dish.note}</p>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 sm:contents">
              <p className="text-sm leading-9 font-medium tabular-nums sm:col-start-2 sm:row-start-2 sm:leading-normal">{PRICE.format(dish.price / 100)}</p>
              <AddStepper
                label={dish.name}
                value={quantities[dish.id] ?? 0}
                onChange={(next) => setQuantities((current) => ({ ...current, [dish.id]: next }))}
                className="ml-auto shrink-0 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:self-center"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="relative h-screen overflow-y-auto bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-semibold tracking-[-0.02em]">Halcyon Kitchen</p>
            <p className="truncate text-xs text-muted-foreground">Delivery in 25 to 35 minutes</p>
          </div>
          <button
            type="button"
            onClick={() => setQuantities({})}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            Empty cart
          </button>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-3xl px-4 pb-10">
          {section("Starters", STARTERS)}
          {section("Mains", MAINS)}
        </div>
        <ViewCartBar count={count} total={total} currency="EUR" locale="en-GB" onView={() => setNote(`Cart opened with ${count} ${count === 1 ? "item" : "items"}.`)} />
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        <p role="status">{note}</p>
      </footer>
    </div>
  );
}
