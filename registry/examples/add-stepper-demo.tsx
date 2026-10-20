"use client";

import { useRef, useState, type ReactNode } from "react";

import { AddStepper } from "@rhs-ui/commerce/add-stepper";
import { cn } from "@/lib/utils";

const art = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 112 112'><rect width='112' height='112' fill='${bg}'/>${body}</svg>`);

interface Dish {
  id: string;
  name: string;
  note: string;
  /** Minor units. */
  price: number;
  stockLimit?: number;
  image: string;
}

const DISHES: Dish[] = [
  {
    id: "burrata",
    name: "Burrata, blood orange",
    note: "Pickled fennel, toasted seeds",
    price: 950,
    image: art("#efe9de", "<circle cx='56' cy='58' r='38' fill='#fbf9f4' stroke='#d9d2c4' stroke-width='2'/><circle cx='56' cy='56' r='18' fill='#fffdf8' stroke='#e6dfd0' stroke-width='2'/><path d='M30 70a30 30 0 0 0 20 12' fill='none' stroke='#e8892f' stroke-width='6' stroke-linecap='round'/><path d='M82 44a30 30 0 0 0-14-14' fill='none' stroke='#e8892f' stroke-width='6' stroke-linecap='round'/><circle cx='44' cy='40' r='2.5' fill='#7a9a5b'/><circle cx='70' cy='72' r='2.5' fill='#7a9a5b'/>"),
  },
  {
    id: "leeks",
    name: "Charred leeks, hazelnut",
    note: "Brown butter, sorrel",
    price: 800,
    image: art("#e4ebdc", "<rect x='26' y='30' width='60' height='14' rx='7' fill='#5f7f45'/><rect x='22' y='50' width='64' height='14' rx='7' fill='#7a9a5b'/><rect x='30' y='70' width='58' height='14' rx='7' fill='#5f7f45'/><circle cx='34' cy='92' r='3.5' fill='#a1743f'/><circle cx='46' cy='96' r='3.5' fill='#8a6234'/><circle cx='58' cy='93' r='3.5' fill='#a1743f'/>"),
  },
  {
    id: "bread",
    name: "Sourdough, cultured butter",
    note: "Baked this morning, 2 slices",
    price: 450,
    stockLimit: 3,
    image: art("#efe3d3", "<ellipse cx='56' cy='58' rx='40' ry='26' fill='#c68b4e'/><path d='M34 52l14-8M50 56l14-8M66 60l14-8' stroke='#e6bf8d' stroke-width='5' stroke-linecap='round'/><rect x='38' y='78' width='22' height='12' rx='3' fill='#f3dd8f'/>"),
  },
  {
    id: "eel",
    name: "Smoked eel toast",
    note: "Horseradish, dill",
    price: 1100,
    stockLimit: 0,
    image: art("#e5e0dc", "<rect x='22' y='30' width='68' height='52' rx='8' fill='#b88a58'/><path d='M28 62c10-14 22-14 32 0s22 14 28 0' fill='none' stroke='#3b3029' stroke-width='9' stroke-linecap='round'/><path d='M40 42l4 8M48 38l2 9M74 44l-4 8' stroke='#7a9a5b' stroke-width='3' stroke-linecap='round'/>"),
  },
];

const PRICE = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" });

function Caption({ text, children }: { text: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [quantities, setQuantities] = useState<Record<string, number>>({ leeks: 2, bread: 3 });
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const timers = useRef<number[]>([]);

  /** The cart answers after half a second, like a real request would. */
  function change(id: string, next: number) {
    setBusy((current) => ({ ...current, [id]: true }));
    timers.current.push(
      window.setTimeout(() => {
        setQuantities((current) => ({ ...current, [id]: next }));
        setBusy((current) => ({ ...current, [id]: false }));
      }, 500),
    );
  }

  return (
    <div className="grid w-full max-w-xl gap-10">
      <Caption text="A menu: the cart answers after a moment, and the control keeps its place while it does">
        <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card px-4 shadow-xs sm:px-5">
          {DISHES.map((dish) => (
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
                  onChange={(next) => change(dish.id, next)}
                  busy={busy[dish.id] === true}
                  stockLimit={dish.stockLimit}
                  // The stock reason hangs under the control without taking room. On a phone the control ends the row, so a dish with stock left leaves space for it.
                  className={cn("ml-auto shrink-0 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:self-center", (dish.stockLimit ?? 0) > 0 && "mb-5 sm:mb-0")}
                />
              </div>
            </li>
          ))}
        </ul>
      </Caption>

      <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
        <Caption text="Small">
          <AddStepper label="Linen shirt" size="sm" defaultValue={2} />
        </Caption>
        <Caption text="Medium">
          <AddStepper label="Linen shirt" defaultValue={2} />
        </Caption>
        <Caption text="Large">
          <AddStepper label="Linen shirt" size="lg" defaultValue={2} />
        </Caption>
        <Caption text="Busy">
          <AddStepper label="Linen shirt" defaultValue={2} busy />
        </Caption>
      </div>
    </div>
  );
}
