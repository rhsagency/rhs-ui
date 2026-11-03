"use client";

import { useState } from "react";

import { IconFilter } from "@rhs-ui/icons";
import { CollectionHero } from "@rhs-ui/marketing/collection-hero";
import { Button } from "@rhs-ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Switch } from "@rhs-ui/primitives/switch";

/* The picture is drawn for the demo, so it needs no file. In your shop: the collection's real photograph. */
const picture =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 1000'>` +
      `<rect width='800' height='1000' fill='#d9d3c6'/>` +
      `<path d='M230 640V380a170 170 0 0 1 340 0v260z' fill='#ece7dc'/>` +
      `<path d='M230 640V380a170 170 0 0 1 340 0v260z' fill='none' stroke='#c9c1b0' stroke-width='10'/>` +
      `<path d='M400 210v430M230 430h340' stroke='#c9c1b0' stroke-width='8'/>` +
      `<rect x='90' y='690' width='620' height='30' rx='4' fill='#a98d68'/>` +
      `<rect x='90' y='720' width='620' height='18' fill='#000' opacity='.1'/>` +
      `<rect y='800' width='800' height='200' fill='#cdc5b5'/>` +
      `<rect x='130' y='640' width='230' height='50' rx='9' fill='#f4f0e7'/>` +
      `<rect x='140' y='594' width='210' height='48' rx='9' fill='#e6e0d2'/>` +
      `<rect x='150' y='550' width='190' height='46' rx='9' fill='#d4ccba'/>` +
      `<path d='M130 666h230M140 619h210M150 573h190' stroke='#000' stroke-opacity='.07' stroke-width='2'/>` +
      `<rect x='390' y='652' width='170' height='38' rx='9' fill='#cbbda3'/>` +
      `<rect x='398' y='616' width='154' height='38' rx='9' fill='#b9a98c'/>` +
      `<path d='M390 671h170M398 635h154' stroke='#000' stroke-opacity='.08' stroke-width='2'/>` +
      `<rect x='600' y='590' width='76' height='100' rx='30' fill='#8d8472'/>` +
      `<path d='M638 592c-4-60 6-110 30-150M638 592c-2-40-20-80-52-110' stroke='#6b6350' stroke-width='5' fill='none' stroke-linecap='round'/>` +
      `<ellipse cx='672' cy='436' rx='11' ry='26' fill='#6b6350' transform='rotate(24 672 436)'/>` +
      `<ellipse cx='584' cy='474' rx='11' ry='26' fill='#6b6350' transform='rotate(-30 584 474)'/>` +
      `</svg>`,
  );

export default function Demo(): React.JSX.Element {
  const [inStock, setInStock] = useState(false);
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">A long intro cut at three lines, a tall picture, sub-collections and a toolbar of your own.</p>
      <CollectionHero
        className="py-8 sm:py-10"
        titleAs="h2"
        title="Autumn linen"
        count={inStock ? 31 : 48}
        intro="Washed linen that starts soft and only gets softer. Bed sets, throws, tablecloths and napkins in six natural shades, woven in Portugal and finished in our own studio. Every piece is OEKO-TEX certified, pre-washed before it reaches you and made to see out a decade of slow Sunday mornings."
        image={{ src: picture, alt: "A shelf with folded linen, a vase and an arched window behind it", caption: "The autumn edit, photographed at our studio in Porto.", width: 800, height: 1000 }}
        breadcrumbs={[
          { label: "Home", href: "#" },
          { label: "Bedroom", href: "#bedroom" },
          { label: "Autumn linen" },
        ]}
        subcollections={[
          { label: "New in", href: "#new", count: 12 },
          { label: "Under €50", href: "#under-50", count: 18 },
          { label: "Bed sets", href: "#bed-sets", count: 14 },
          { label: "Throws", href: "#throws", count: 9 },
          { label: "Tablecloths", href: "#tablecloths", count: 7 },
          { label: "Napkins", href: "#napkins", count: 6 },
        ]}
      >
        {/* One grid on a phone, so the three controls share the same edges: Filters and the switch side by side, Sort across the full width. From sm they are one row, with Sort at the end. */}
        <div className="grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap sm:gap-x-5">
          <Button type="button" variant="outline" size="sm">
            <IconFilter />
            Filters
          </Button>
          <label className="inline-flex items-center gap-2.5 justify-self-end text-sm">
            <Switch checked={inStock} onCheckedChange={setInStock} />
            In stock only
          </label>
          <Select defaultValue="featured">
            <SelectTrigger size="sm" aria-label="Sort products" className="col-span-2 w-full sm:ml-auto sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Sort: Featured</SelectItem>
              <SelectItem value="newest">Sort: Newest</SelectItem>
              <SelectItem value="price-asc">Price, low to high</SelectItem>
              <SelectItem value="price-desc">Price, high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollectionHero>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A short intro on a plainer page, with no picture and no toolbar. It fits in three lines on a desktop, so no button; on a phone it is cut and offers Read more.</p>
      <CollectionHero
        className="py-8 sm:py-10"
        titleAs="h2"
        title="Stoneware"
        count={24}
        intro="Hand-thrown stoneware, glazed in our studio in Porto and fired in small batches, so every mug, bowl and plate is a little different and made to last."
        breadcrumbs={[
          { label: "Home", href: "#" },
          { label: "Kitchen", href: "#kitchen" },
          { label: "Stoneware" },
        ]}
      />
    </div>
  );
}
