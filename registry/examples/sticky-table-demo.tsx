"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { StickyTable } from "@rhs-ui/primitives/sticky-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

const NAMES = [
  "Halcyon desk lamp",
  "Northwind kettle",
  "Kestrel backpack",
  "Oak Lane tea towel",
  "Mirror Labs speaker",
  "Fjord thermos",
  "Lumen reading light",
  "Polder tote bag",
  "Aiko ceramic mug",
  "Atlas road atlas",
  "Birch cutting board",
  "Cinder wool blanket",
  "Delta water bottle",
  "Ember candle set",
  "Harbour rain jacket",
  "Juniper plant pot",
  "Maple serving tray",
  "Quill notebook",
  "Sable leather wallet",
  "Tern travel pillow",
  "Vesper wine glasses",
  "Willow laundry basket",
] as const;

const SUPPLIERS = ["Lumen Works", "Fjord Supply", "Kestrel Goods", "Oak & Ash", "Polder Trading"] as const;
const SITES = ["Amsterdam", "Rotterdam", "Utrecht", "Antwerp", "Ghent", "Lille"] as const;

// No randomness: the same table on the server and in the browser, and the same picture every time. The modulus is prime, rows and columns are mixed and a square keeps the steps from being even, so no column counts up in a line and no two products repeat each other.
const STOCK = NAMES.map((name, row) => ({
  name,
  sku: `NW-${1200 + row * 7}`,
  sites: SITES.map((_, column) => 12 + ((row * 41 + column * 29 + row * column * 7 + row * row * 13) % 151)),
  reserved: 4 + ((row * 29) % 38),
  reorder: 40 + ((row * 17) % 60),
  supplier: SUPPLIERS[row % SUPPLIERS.length] ?? "",
  counted: `Oct ${2 + ((row * 3) % 27)}`,
  cost: 4.5 + ((row * 41) % 380) / 10,
}));

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function WideStock(): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  // Start a little way in, so the picture shows what the edges do: the pinned column's shadow and the header's.
  useEffect(() => {
    scroller.current?.scrollTo({ left: 190, top: 58 });
  }, []);
  return (
    <StickyTable label="Stock by warehouse, scrollable" maxHeight="20rem" stickyColumns={1} scrollRef={scroller} tableClassName="min-w-[62rem]">
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="min-w-32 sm:min-w-44">
            Product
          </TableHead>
          {SITES.map((site) => (
            <TableHead key={site} scope="col" className="text-right">
              {site}
            </TableHead>
          ))}
          <TableHead scope="col" className="text-right">
            Reserved
          </TableHead>
          <TableHead scope="col" className="text-right">
            Reorder at
          </TableHead>
          <TableHead scope="col">Supplier</TableHead>
          <TableHead scope="col">Last count</TableHead>
          <TableHead scope="col" className="text-right">
            Unit cost
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {STOCK.map((item) => (
          <TableRow key={item.sku}>
            {/* The pinned cell wraps its name on a phone, so it takes a third of the box and not half; from sm up it is one line. */}
            <TableCell className="w-32 whitespace-normal sm:w-auto sm:whitespace-nowrap">
              <span className="block font-medium">{item.name}</span>
              <span className="block font-mono text-xs text-muted-foreground">{item.sku}</span>
            </TableCell>
            {item.sites.map((units, index) => (
              <TableCell key={SITES[index]} className="text-right tabular-nums">
                {units}
              </TableCell>
            ))}
            <TableCell className="text-right tabular-nums">{item.reserved}</TableCell>
            <TableCell className="text-right tabular-nums">{item.reorder}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{item.supplier}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{item.counted}</TableCell>
            <TableCell className="text-right tabular-nums">{euro.format(item.cost)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </StickyTable>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-2 sm:p-6">
      <Example caption="Header only: the rows scroll under it, and a soft shadow appears under the header once they have">
        <StickyTable label="Stock count, scrollable" maxHeight="15rem" className="@container">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Product</TableHead>
              <TableHead scope="col" className="text-right">
                On hand
              </TableHead>
              <TableHead scope="col" className="hidden text-right @sm:table-cell">
                Reserved
              </TableHead>
              <TableHead scope="col" className="text-right">
                Unit cost
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {STOCK.slice(0, 14).map((item) => (
              <TableRow key={item.sku}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right tabular-nums">{item.sites[0]}</TableCell>
                <TableCell className="hidden text-right tabular-nums @sm:table-cell">{item.reserved}</TableCell>
                <TableCell className="text-right tabular-nums">{euro.format(item.cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StickyTable>
      </Example>

      <Example caption="Header and first column: shown scrolled a little, so both shadows are on. At rest the pinned column has no shadow, and the right edge says there is more">
        <WideStock />
      </Example>
    </div>
  );
}
