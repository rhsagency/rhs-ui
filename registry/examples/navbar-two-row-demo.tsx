"use client";

import { useEffect, useRef, useState } from "react";

import { IconBag, IconHelp, IconUser } from "@rhs-ui/icons";
import { NavbarTwoRow } from "@rhs-ui/marketing/navbar-two-row";
import { Button } from "@rhs-ui/primitives/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { SearchTrigger } from "@rhs-ui/primitives/search-trigger";

const CATEGORIES = [
  { label: "Women", href: "#women" },
  { label: "Men", href: "#men" },
  { label: "Kids", href: "#kids" },
  { label: "Home", href: "#home" },
  { label: "Outdoor", href: "#outdoor" },
  { label: "Gifts", href: "#gifts" },
  { label: "Sale", href: "#sale" },
];

const PRODUCTS = [
  { name: "Merino base layer", price: "€ 89" },
  { name: "Ripstop trail jacket", price: "€ 219" },
  { name: "Waxed canvas daypack", price: "€ 149" },
  { name: "Wool field socks, 3 pack", price: "€ 36" },
  { name: "Linen camp shirt", price: "€ 95" },
  { name: "Packable rain shell", price: "€ 179" },
  { name: "Enamel trail mug", price: "€ 18" },
  { name: "Down liner vest", price: "€ 165" },
];

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("");
  const opener = useRef<HTMLElement | null>(null);

  // The palette opens from code, and the dialog gives focus back to a DialogTrigger only: remember what had focus and return it when the palette closes.
  useEffect(() => {
    if (!open) opener.current?.focus();
  }, [open]);

  const openPalette = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-3 py-6 sm:px-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Scroll the page inside the frame: the first row slips away and only the categories stay, 48px instead of 112px. Below 768px the search field gets a row of its own and the categories scroll sideways.
      </p>
      <div className="relative h-[36rem] overflow-y-auto rounded-xl border border-border bg-background">
        <NavbarTwoRow
          brand={
            <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              Northwind
            </a>
          }
          search={<SearchTrigger onOpen={openPalette} placeholder="Search 4,200 products" className="h-10 max-w-none rounded-lg md:max-w-xl" />}
          utilities={
            <>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Help">
                <IconHelp size={18} />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Account">
                <IconUser size={18} />
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 px-2.5">
                <IconBag size={18} />
                <span className="tabular-nums">2</span>
                <span className="sr-only">items in your bag</span>
              </Button>
            </>
          }
          categories={CATEGORIES}
          catalogue={{ label: "All departments", href: "#all" }}
          currentHref="#outdoor"
        />

        <section className="mx-auto max-w-6xl px-6 pt-12 pb-16">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Outdoor</p>
          <h2 className="mt-3 text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Built for the long way round.</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">Everything here has been worn through a winter before we put it in the shop.</p>
          <p className="mt-3 min-h-5 text-xs text-muted-foreground" role="status">
            {last ? `You picked “${last}” in the palette.` : ""}
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <li key={product.name} className="grid gap-3">
                <div className="aspect-[4/5] rounded-xl bg-muted" />
                <div className="grid gap-0.5">
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">{product.price}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search the shop" description="Type to find a product">
        <CommandInput placeholder="Search products…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          <CommandGroup heading="Products">
            {PRODUCTS.map((product) => (
              <CommandItem
                key={product.name}
                value={product.name}
                onSelect={() => {
                  setLast(product.name);
                  setOpen(false);
                }}
              >
                {product.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
