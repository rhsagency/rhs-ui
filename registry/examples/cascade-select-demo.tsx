"use client";

import { Fragment, useState, type ReactNode } from "react";

import { CascadeSelect, type CascadeOption } from "@rhs-ui/primitives/cascade-select";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A line of JSON that may wrap after a comma. */
function Json({ value }: { value: unknown }): React.JSX.Element {
  return (
    <>
      {JSON.stringify(value)
        .split(",")
        .map((part, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <>
                ,<wbr />
              </>
            ) : null}
            {part}
          </Fragment>
        ))}
    </>
  );
}

const card = "grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-xs";

const CATEGORIES: readonly CascadeOption[] = [
  {
    value: "electronics",
    label: "Electronics",
    children: [
      {
        value: "phones",
        label: "Phones",
        children: [
          { value: "android", label: "Android" },
          { value: "ios", label: "iOS" },
          { value: "feature", label: "Feature phones" },
          { value: "refurbished", label: "Refurbished", disabled: true },
        ],
      },
      {
        value: "laptops",
        label: "Laptops",
        children: [
          { value: "ultrabooks", label: "Ultrabooks" },
          { value: "gaming", label: "Gaming laptops" },
          { value: "chromebooks", label: "Chromebooks" },
        ],
      },
      {
        value: "audio",
        label: "Audio",
        children: [
          { value: "headphones", label: "Headphones" },
          { value: "speakers", label: "Speakers" },
          { value: "microphones", label: "Microphones" },
        ],
      },
    ],
  },
  {
    value: "home",
    label: "Home and garden",
    children: [
      {
        value: "kitchen",
        label: "Kitchen",
        children: [
          { value: "cookware", label: "Cookware" },
          { value: "knives", label: "Knives" },
          { value: "coffee", label: "Coffee and tea" },
        ],
      },
      {
        value: "garden",
        label: "Garden",
        children: [
          { value: "tools", label: "Tools" },
          { value: "furniture", label: "Garden furniture" },
        ],
      },
    ],
  },
  {
    value: "outdoor",
    label: "Outdoor",
    children: [
      {
        value: "camping",
        label: "Camping",
        children: [
          { value: "tents", label: "Tents" },
          { value: "sleeping", label: "Sleeping bags and mats" },
          { value: "stoves", label: "Stoves" },
        ],
      },
      {
        value: "hiking",
        label: "Hiking",
        children: [
          { value: "boots", label: "Boots" },
          { value: "backpacks", label: "Backpacks" },
        ],
      },
    ],
  },
  { value: "gift-cards", label: "Gift cards" },
];

const PLACES: readonly CascadeOption[] = [
  {
    value: "nl",
    label: "Netherlands",
    children: [
      {
        value: "utrecht",
        label: "Utrecht",
        children: [
          { value: "utrecht-city", label: "Utrecht" },
          { value: "amersfoort", label: "Amersfoort" },
          { value: "veenendaal", label: "Veenendaal" },
        ],
      },
      {
        value: "zuid-holland",
        label: "South Holland",
        children: [
          { value: "rotterdam", label: "Rotterdam" },
          { value: "the-hague", label: "The Hague" },
          { value: "leiden", label: "Leiden" },
        ],
      },
      {
        value: "noord-holland",
        label: "North Holland",
        children: [
          { value: "amsterdam", label: "Amsterdam" },
          { value: "haarlem", label: "Haarlem" },
        ],
      },
    ],
  },
  {
    value: "be",
    label: "Belgium",
    children: [
      {
        value: "flanders",
        label: "Flanders",
        children: [
          { value: "antwerp", label: "Antwerp" },
          { value: "ghent", label: "Ghent" },
          { value: "bruges", label: "Bruges" },
        ],
      },
      {
        value: "wallonia",
        label: "Wallonia",
        children: [
          { value: "liege", label: "Liège" },
          { value: "namur", label: "Namur" },
        ],
      },
    ],
  },
  {
    value: "de",
    label: "Germany",
    children: [
      {
        value: "bavaria",
        label: "Bavaria",
        children: [
          { value: "munich", label: "Munich" },
          { value: "nuremberg", label: "Nuremberg" },
        ],
      },
      { value: "berlin-state", label: "Berlin", children: [{ value: "berlin", label: "Berlin" }] },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const [category, setCategory] = useState<string[]>(["electronics", "phones", "android"]);
  const [place, setPlace] = useState<string[]>(["nl", "utrecht"]);
  // The first panel starts open, as a picture of the thing, so room is kept for it under the field until it has been closed once.
  const [reserved, setReserved] = useState(true);
  return (
    <div className="grid w-full max-w-4xl gap-9">
      <Example caption="Try it: Right opens a choice and Left goes back, Enter picks, and typing anywhere searches every level. On a phone the panel is a drill-down list.">
        <div className={cn(card, "content-start transition-[min-height] duration-200 motion-reduce:transition-none", reserved && "min-h-[36rem] md:min-h-[30rem]")}>
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
            <div className="grid gap-1">
              <h2 className="text-sm font-medium tracking-[-0.01em]">New listing</h2>
              <p className="text-xs text-muted-foreground">Northwind Marketplace files it under one category.</p>
            </div>
            <p role="status" className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Reported</span>
              <code className="font-mono text-[0.6875rem] break-words text-foreground">
                <Json value={category} />
              </code>
            </p>
          </div>
          <div className="grid max-w-md gap-2">
            <Label htmlFor="listing-category">Category</Label>
            <CascadeSelect
              id="listing-category"
              label="Category"
              options={CATEGORIES}
              value={category}
              onValueChange={setCategory}
              name="category"
              defaultOpen
              onOpenChange={(open) => {
                if (!open) setReserved(false);
              }}
            />
          </div>
        </div>
      </Example>

      <div className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
        <div className="grid min-w-0 content-start gap-9">
          <Example caption="Any step can be the answer: a country alone, or a country and a region. A click picks and opens, so the panel stays open until you leave it.">
            <div className={card}>
              <div className="grid gap-2">
                <Label htmlFor="ship-from">Ship from</Label>
                <CascadeSelect id="ship-from" label="Ship from" options={PLACES} value={place} onValueChange={setPlace} changeOnSelect separator=" › " />
              </div>
              <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
                <span>Reported</span>
                <code className="font-mono text-[0.6875rem] break-words text-foreground">
                  <Json value={place} />
                </code>
              </p>
            </div>
          </Example>
        </div>

        <div className="grid min-w-0 content-start gap-9">
          <Example caption="In a narrow field the front of the path gives way and the last step stays">
            <div className={card}>
              <div className="grid max-w-[17rem] gap-2">
                <Label htmlFor="narrow-category">Category</Label>
                <CascadeSelect id="narrow-category" label="Category" options={CATEGORIES} defaultValue={["outdoor", "camping", "sleeping"]} />
              </div>
            </div>
          </Example>
          <Example caption="Nothing chosen, and disabled">
            <div className={card}>
              <div className="grid gap-2">
                <Label htmlFor="fresh-category">Category</Label>
                <CascadeSelect id="fresh-category" label="Category" options={CATEGORIES} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locked-category">Locked category</Label>
                <CascadeSelect id="locked-category" label="Locked category" options={CATEGORIES} disabled defaultValue={["home", "kitchen", "knives"]} />
              </div>
            </div>
          </Example>
        </div>
      </div>
    </div>
  );
}
