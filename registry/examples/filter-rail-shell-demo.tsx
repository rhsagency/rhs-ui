"use client";

import { useMemo, useState } from "react";

import { FilterRailShell, type FilterChip } from "@rhs-ui/application/filter-rail-shell";
import { IconGrid, IconList, IconStar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { RangeSlider } from "@rhs-ui/primitives/range-slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Switch } from "@rhs-ui/primitives/switch";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

type Category = "Jackets" | "Packs" | "Footwear" | "Tents";

/** Flat product drawings, one silhouette per category, tinted per brand. */
const SHAPES: Record<Category, string> = {
  Jackets:
    "<ellipse cx='200' cy='244' rx='96' ry='8' fill='SH' opacity='.18'/><path d='M150 102L98 212 122 226 164 134Z' fill='FG'/><path d='M250 102L302 212 278 226 236 134Z' fill='FG'/><rect x='146' y='88' width='108' height='144' rx='18' fill='FG'/><path d='M146 130h108M146 168h108M146 206h108' stroke='SH' stroke-width='3' opacity='.35'/><path d='M172 86Q200 110 228 86V76Q200 66 172 76Z' fill='SH'/><rect x='198' y='100' width='4' height='132' fill='BG' opacity='.6'/>",
  Packs:
    "<ellipse cx='200' cy='248' rx='84' ry='8' fill='SH' opacity='.18'/><rect x='134' y='112' width='10' height='108' rx='5' fill='SH'/><rect x='256' y='112' width='10' height='108' rx='5' fill='SH'/><rect x='150' y='70' width='100' height='170' rx='30' fill='FG'/><path d='M150 108Q150 70 200 70T250 108Q200 128 150 108Z' fill='SH'/><rect x='166' y='160' width='68' height='56' rx='14' fill='SH' opacity='.85'/><path d='M184 70Q200 52 216 70' stroke='SH' stroke-width='8' fill='none' stroke-linecap='round'/><rect x='194' y='116' width='12' height='16' rx='3' fill='BG' opacity='.7'/>",
  Footwear:
    "<ellipse cx='210' cy='244' rx='96' ry='8' fill='SH' opacity='.18'/><path d='M138 72H208L214 148Q216 164 236 170L268 180Q286 186 286 204V226H138Z' fill='FG'/><rect x='132' y='218' width='160' height='22' rx='8' fill='SH'/><rect x='138' y='66' width='70' height='14' rx='7' fill='SH'/><path d='M170 104L196 98M172 126L200 120M176 148L204 142' stroke='BG' stroke-width='5' stroke-linecap='round' opacity='.7'/>",
  Tents:
    "<rect x='84' y='228' width='232' height='6' rx='3' fill='SH' opacity='.35'/><path d='M200 70L322 228H78Z' fill='FG'/><path d='M200 118L248 228H152Z' fill='SH'/><path d='M200 118V228' stroke='BG' stroke-width='3' opacity='.6'/><circle cx='200' cy='70' r='5' fill='SH'/>",
};
const TINTS: Record<string, { bg: string; fg: string; sh: string }> = {
  Halcyon: { bg: "#e7e4dd", fg: "#a39d8f", sh: "#6f6a5f" },
  Kestrel: { bg: "#e1e4e6", fg: "#9aa3ab", sh: "#5f6870" },
  Larkspur: { bg: "#e9e7e4", fg: "#b4aea5", sh: "#7b756c" },
  Northwind: { bg: "#dcdfe2", fg: "#7d868e", sh: "#454b52" },
};
const art = (category: Category, brand: string) => {
  const tint = TINTS[brand] ?? TINTS.Halcyon!;
  const body = SHAPES[category].replaceAll("FG", tint.fg).replaceAll("SH", tint.sh).replaceAll("BG", tint.bg);
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='${tint.bg}'/>${body}</svg>`);
};

const product = (name: string, brand: string, category: Category, price: number, rating: number, stock = true) => ({ name, brand, category, price, rating, stock });
const PRODUCTS = [
  product("Ridgeline shell", "Halcyon", "Jackets", 249, 4.8),
  product("Fjord down parka", "Northwind", "Jackets", 329, 4.7),
  product("Drizzle anorak", "Larkspur", "Jackets", 139, 4.4),
  product("Cairn softshell", "Kestrel", "Jackets", 189, 4.6, false),
  product("Tern windbreaker", "Halcyon", "Jackets", 99, 4.3),
  product("Marl fleece", "Larkspur", "Jackets", 119, 4.5),
  product("Summit hardshell", "Northwind", "Jackets", 389, 4.9, false),
  product("Alder trail vest", "Kestrel", "Jackets", 109, 4.2),
  product("Haul 40 pack", "Kestrel", "Packs", 169, 4.7),
  product("Day 22 pack", "Halcyon", "Packs", 119, 4.5),
  product("Basecamp 65", "Northwind", "Packs", 259, 4.8),
  product("Roll-top dry bag", "Larkspur", "Packs", 49, 4.4),
  product("Summit 28", "Halcyon", "Packs", 149, 4.6, false),
  product("Sling 8", "Kestrel", "Packs", 59, 4.1),
  product("Crag 35", "Northwind", "Packs", 179, 4.6),
  product("Moraine boot", "Northwind", "Footwear", 219, 4.8),
  product("Trail runner 2", "Kestrel", "Footwear", 139, 4.5),
  product("Gorge approach shoe", "Halcyon", "Footwear", 159, 4.6),
  product("Hollow camp sandal", "Larkspur", "Footwear", 69, 4.2),
  product("Skerry waterproof boot", "Larkspur", "Footwear", 199, 4.4, false),
  product("Fell hiker mid", "Halcyon", "Footwear", 179, 4.7),
  product("Tarn gaiters", "Kestrel", "Footwear", 45, 4.3),
  product("Bivvy 1P tent", "Halcyon", "Tents", 289, 4.6),
  product("Basin 2P tent", "Northwind", "Tents", 449, 4.9),
  product("Ridge 3P tent", "Kestrel", "Tents", 379, 4.5, false),
  product("Tarp 3x3", "Larkspur", "Tents", 89, 4.2),
  product("Dome 4P tent", "Northwind", "Tents", 529, 4.7),
  product("Pitch 1P lite", "Larkspur", "Tents", 199, 4.4),
];

const CATEGORIES: readonly Category[] = ["Jackets", "Packs", "Footwear", "Tents"];
const BRANDS = ["Halcyon", "Kestrel", "Larkspur", "Northwind"] as const;
const FULL_RANGE: [number, number] = [0, 600];
const countOf = (key: "category" | "brand", value: string) => PRODUCTS.filter((item) => item[key] === value).length;

function Options({ name, values, field, selected, onChange }: { name: string; values: readonly string[]; field: "category" | "brand"; selected: readonly string[]; onChange: (next: string[]) => void }) {
  return (
    <div role="group" aria-label={name} className="grid gap-2.5">
      {values.map((value) => (
        <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox checked={selected.includes(value)} onCheckedChange={(checked) => onChange(checked === true ? [...selected, value] : selected.filter((entry) => entry !== value))} />
          <span className="flex-1">{value}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{countOf(field, value)}</span>
        </label>
      ))}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [categories, setCategories] = useState<string[]>(["Jackets", "Packs"]);
  const [brands, setBrands] = useState<string[]>([]);
  const [price, setPrice] = useState<[number, number]>(FULL_RANGE);
  const [inStock, setInStock] = useState(true);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");

  const priceActive = price[0] !== FULL_RANGE[0] || price[1] !== FULL_RANGE[1];
  const shown = useMemo(() => {
    const list = PRODUCTS.filter(
      (item) =>
        (!categories.length || categories.includes(item.category)) &&
        (!brands.length || brands.includes(item.brand)) &&
        item.price >= price[0] &&
        item.price <= price[1] &&
        (!inStock || item.stock),
    );
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "rated") return [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [categories, brands, price, inStock, sort]);

  const chips: FilterChip[] = [
    ...categories.map((value) => ({ id: `category-${value}`, label: value, onRemove: () => setCategories((list) => list.filter((entry) => entry !== value)) })),
    ...brands.map((value) => ({ id: `brand-${value}`, label: value, onRemove: () => setBrands((list) => list.filter((entry) => entry !== value)) })),
    ...(priceActive ? [{ id: "price", label: `${EURO.format(price[0])} to ${EURO.format(price[1])}`, onRemove: () => setPrice(FULL_RANGE) }] : []),
    ...(inStock ? [{ id: "stock", label: "In stock", onRemove: () => setInStock(false) }] : []),
  ];
  const clearAll = () => {
    setCategories([]);
    setBrands([]);
    setPrice(FULL_RANGE);
    setInStock(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h2 className="text-2xl font-semibold tracking-[-0.03em]">Trail gear</h2>
      <p className="mt-1.5 mb-8 max-w-xl text-sm text-muted-foreground">Shells, packs, boots and tents tested on the Northwind routes. Narrow the list and the count updates with you.</p>
      <FilterRailShell
        filters={[
          { id: "category", label: "Category", activeCount: categories.length, children: <Options name="Category" field="category" values={CATEGORIES} selected={categories} onChange={setCategories} /> },
          { id: "brand", label: "Brand", activeCount: brands.length, children: <Options name="Brand" field="brand" values={BRANDS} selected={brands} onChange={setBrands} /> },
          {
            id: "price",
            label: "Price",
            activeCount: priceActive ? 1 : 0,
            children: <RangeSlider label="Price range" min={FULL_RANGE[0]} max={FULL_RANGE[1]} step={10} value={price} onValueChange={setPrice} format={(value) => EURO.format(value)} />,
          },
          {
            id: "stock",
            label: "Availability",
            defaultOpen: true,
            children: (
              <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                In stock only
                <Switch checked={inStock} onCheckedChange={setInStock} />
              </label>
            ),
          },
        ]}
        chips={chips}
        onClearAll={clearAll}
        resultCount={shown.length}
        toolbar={
          <>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger size="sm" aria-label="Sort by" className="w-36 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="low">Price, low to high</SelectItem>
                <SelectItem value="high">Price, high to low</SelectItem>
                <SelectItem value="rated">Top rated</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup type="single" size="sm" aria-label="View" className="max-sm:hidden" value={view} onValueChange={(next) => next && setView(next as "grid" | "list")}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <IconGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <IconList />
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        }
      >
        {shown.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
            <p className="font-medium">Nothing matches these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Loosen one of them, or start again.</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={(event) => {
                // This button leaves with the empty state, so hand focus to the results region first: a keyboard user keeps their place.
                event.currentTarget.closest<HTMLElement>("[data-slot=filter-rail-shell-results]")?.focus();
                clearAll();
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {shown.map((item) => {
              return (
                <article key={item.name} className="overflow-hidden rounded-xl border border-border bg-card">
                  <img src={art(item.category, item.brand)} alt="" width={400} height={300} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-3 sm:p-3.5">
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                    <h3 className="mt-0.5 text-sm font-medium">{item.name}</h3>
                    <p className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-medium tabular-nums">{EURO.format(item.price)}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                        <IconStar className="size-3.5" />
                        {item.rating.toFixed(1)}
                      </span>
                    </p>
                    {item.stock ? null : <p className="mt-1.5 text-xs text-muted-foreground">Out of stock</p>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {shown.map((item) => {
              return (
                <li key={item.name} className="flex items-center gap-4 p-3">
                  <img src={art(item.category, item.brand)} alt="" width={400} height={300} loading="lazy" className="h-14 w-[4.5rem] shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {item.brand} · {item.category}
                      {item.stock ? "" : " · Out of stock"}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <IconStar className="size-3.5" />
                    {item.rating.toFixed(1)}
                  </span>
                  <span className="w-14 text-right text-sm font-medium tabular-nums">{EURO.format(item.price)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </FilterRailShell>
    </div>
  );
}
