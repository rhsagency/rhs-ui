"use client";

import { useMemo, useState, type ReactNode } from "react";

import { IconStar } from "@rhs-ui/icons";
import { FilterPopover, type FilterGroup, type FilterValue } from "@rhs-ui/application/filter-popover";
import { FilterPanel } from "@rhs-ui/application/filter-popover/panel";
import { Badge } from "@rhs-ui/primitives/badge";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [applied, setApplied] = useState<FilterValue>({ category: ["keyboards"], inStock: true });
  const matches = useMemo(() => PRODUCTS.filter((product) => fits(product, applied)), [applied]);
  const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12">
        <Case caption="Choose in the panel and nothing changes until you press the button, which counts what you would get as you go: the count is asked of a pretend server, so it takes a moment. Close the panel with Escape, or click away, and the draft is thrown away. Brand has ten options, so it gets a search field.">
          <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="grid gap-0.5">
                <h2 className="text-sm font-semibold tracking-[-0.01em]">Peripherals</h2>
                <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  {matches.length} of {PRODUCTS.length} products
                </p>
              </div>
              <FilterPopover
                groups={GROUPS}
                value={applied}
                onApply={setApplied}
                align="end"
                resultCount={async (draft) => {
                  await wait(450);
                  return PRODUCTS.filter((product) => fits(product, draft)).length;
                }}
              />
            </div>
            {matches.length ? (
              <ul className="divide-y divide-border">
                {matches.slice(0, 6).map((product) => (
                  <li key={product.name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm sm:px-5">
                    <span className="grid min-w-0 gap-0.5">
                      <span className="truncate font-medium">{product.name}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {CATEGORY_NAME[product.category]}
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-0.5 tabular-nums">
                          <IconStar aria-hidden="true" className="size-3" />
                          {product.rating.toFixed(1)}
                        </span>
                        {!product.inStock ? <Badge variant="muted" className="ml-1 h-4 px-1.5 text-[0.6875rem]">Sold out</Badge> : null}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{euro.format(product.price)}</span>
                  </li>
                ))}
                {matches.length > 6 ? <li className="px-4 py-2.5 text-xs text-muted-foreground sm:px-5">and {matches.length - 6} more</li> : null}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing matches these filters. Open Filters and take one away.</p>
            )}
          </div>
        </Case>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="The panel on its own, for a sheet on a phone. Closed groups say what is chosen in them, the button counts the results, and with an answer at hand there is no wait.">
            <Surface>
              <FilterPanel
                groups={CLOSED}
                value={{ brand: ["halcyon", "kestrel"], price: [20, 180], inStock: true }}
                onApply={() => undefined}
                resultCount={(draft) => PRODUCTS.filter((product) => fits(product, draft)).length}
                className="max-h-[34rem]"
              />
            </Surface>
          </Case>
          <Case caption="Without resultCount the button names the outcome in groups: Apply 2 filters. After Reset with filters on, it says Clear filters. A range, a list and a switch share one panel.">
            <Surface>
              <FilterPanel groups={GROUPS.slice(2)} value={{ price: [40, 240], inStock: true }} onApply={() => undefined} className="max-h-[34rem]" />
            </Surface>
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full max-w-[22rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">{children}</div>;
}

interface Product {
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  freeShipping: boolean;
}

const BRANDS: readonly (readonly [string, string])[] = [
  ["halcyon", "Halcyon"],
  ["kestrel", "Kestrel"],
  ["northwind", "Northwind"],
  ["lumen", "Lumen"],
  ["orbit", "Orbit"],
  ["fjord", "Fjord"],
  ["tessel", "Tessel"],
  ["mira", "Mira"],
  ["quill", "Quill"],
  ["vantage", "Vantage"],
];

const CATEGORY_NAME: Record<string, string> = { keyboards: "Keyboards", mice: "Mice", monitors: "Monitors", headphones: "Headphones", cables: "Cables", stands: "Stands" };

const MODELS: Record<string, readonly string[]> = {
  keyboards: ["K65 Keyboard", "Slim Keyboard", "Compact Keyboard", "Pro Keyboard", "Low-profile Keyboard", "Split Keyboard", "Numpad Keyboard", "Travel Keyboard"],
  mice: ["Glide Mouse", "Trail Mouse", "Pebble Mouse", "Vertical Mouse", "Silent Mouse", "Travel Mouse", "Ergo Mouse", "Trackball"],
  monitors: ["27 QHD Monitor", "32 4K Monitor", "24 FHD Monitor", "34 Ultrawide", "27 4K Monitor", "28 Portrait Monitor", "25 Gaming Monitor", "32 Curved Monitor"],
  headphones: ["Studio Headphones", "Air Earbuds", "Nomad Headphones", "Calm Headphones", "Sport Earbuds", "Open-back Headphones", "Wireless Headset", "Monitor Headphones"],
  cables: ["USB-C Cable 1 m", "HDMI Cable 2 m", "DisplayPort Cable", "Thunderbolt Cable", "USB-C Cable 2 m", "Ethernet Cable 5 m", "Power Cable", "Audio Cable"],
  stands: ["Laptop Riser", "Monitor Arm", "Dock Stand", "Headphone Stand", "Tablet Stand", "Phone Stand", "Desk Shelf", "Cable Tray"],
};

/** Forty-eight products, worked out from a few lists so the demo has real numbers to filter and count. */
const PRODUCTS: readonly Product[] = Object.keys(MODELS).flatMap((category, row) =>
  (MODELS[category] ?? []).map((model, at): Product => {
    const seed = row * 8 + at;
    const brand = BRANDS[(seed * 7 + row) % BRANDS.length] ?? BRANDS[0] ?? ["halcyon", "Halcyon"];
    const base = category === "monitors" ? 180 : category === "cables" ? 9 : category === "stands" ? 24 : category === "keyboards" ? 49 : category === "headphones" ? 59 : 29;
    return {
      name: `${brand[1]} ${model}`,
      brand: brand[0],
      category,
      price: Math.round(base + ((seed * 53) % 17) * (category === "monitors" ? 14 : category === "cables" ? 2 : 6)),
      rating: 3 + ((seed * 7 + row) % 21) / 10,
      inStock: seed % 6 !== 0,
      freeShipping: seed % 3 !== 1,
    };
  }),
);

const countOf = (test: (product: Product) => boolean) => PRODUCTS.filter(test).length;

const GROUPS: readonly FilterGroup[] = [
  {
    id: "category",
    kind: "checkbox",
    label: "Category",
    options: Object.entries(CATEGORY_NAME).map(([value, label]) => ({ value, label, count: countOf((product) => product.category === value) })),
  },
  {
    id: "brand",
    kind: "checkbox",
    label: "Brand",
    options: BRANDS.map(([value, label]) => ({ value, label, count: countOf((product) => product.brand === value) })),
  },
  { id: "price", kind: "range", label: "Price", min: 0, max: 400, step: 5, prefix: "€" },
  {
    id: "rating",
    kind: "radio",
    label: "Rating",
    defaultValue: "any",
    options: [
      { value: "any", label: "Any rating", count: PRODUCTS.length },
      { value: "4", label: "4 stars and up", count: countOf((product) => product.rating >= 4) },
      { value: "3", label: "3 stars and up", count: countOf((product) => product.rating >= 3) },
    ],
  },
  { id: "inStock", kind: "toggle", label: "In stock only", description: "Hide what is sold out" },
  { id: "freeShipping", kind: "toggle", label: "Free shipping", description: "Orders that ship at no cost" },
];

/** The same groups, folded, so a panel shows what is chosen in each. */
const CLOSED: readonly FilterGroup[] = GROUPS.map((group) => ({ ...group, defaultOpen: false }));

/** Whether a product passes the filters: every group that is on has to agree. */
function fits(product: Product, filters: FilterValue): boolean {
  const category = filters.category;
  if (Array.isArray(category) && category.length && !(category as string[]).includes(product.category)) return false;
  const brand = filters.brand;
  if (Array.isArray(brand) && brand.length && !(brand as string[]).includes(product.brand)) return false;
  const price = filters.price;
  if (Array.isArray(price) && typeof price[0] === "number" && (product.price < price[0] || product.price > Number(price[1]))) return false;
  const rating = filters.rating;
  if (typeof rating === "string" && rating !== "" && rating !== "any" && product.rating < Number(rating)) return false;
  if (filters.inStock === true && !product.inStock) return false;
  if (filters.freeShipping === true && !product.freeShipping) return false;
  return true;
}
