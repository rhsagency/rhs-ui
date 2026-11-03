"use client";

import { useId, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { countText, fill, LABELS, moneyText, plural, type PropertySearchHeroLabels } from "@rhs-ui/marketing/property-search-hero/format";
import { Button } from "@rhs-ui/primitives/button";
import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export type { PropertySearchHeroLabels } from "@rhs-ui/marketing/property-search-hero/format";

export interface PropertyMode {
  /** Stable and URL-safe: "buy". The keys of `priceSteps` and `popular` are these. */
  value: string;
  /** The tab: "Buy". */
  label: string;
  /** What the price is called in this mode: "Price", "Rent per month". It labels the price fields and is announced when the tab changes. */
  priceLabel?: string;
}

export interface PropertyPlace {
  /** What `onSearch` reports: "amsterdam". */
  value: string;
  /** What the list shows and the search matches: "Amsterdam". */
  label: string;
  /** A second line under the name: "North Holland". */
  description?: string;
  /** Extra words the search matches: a postcode, a former name. */
  keywords?: readonly string[];
  /** Places with the same group are listed under that heading, in order of first appearance: "Cities", "Neighbourhoods". */
  group?: string;
}

export interface PropertyPopular {
  /** The place: "Amsterdam". */
  label: string;
  /** Where its listings are. */
  href: string;
  /** How many listings there are. */
  count: number;
}

/** What the visitor chose, handed to you when they press Search. Searching is yours. */
export interface PropertySearch {
  /** The `value` of the chosen tab. */
  mode: string;
  /** The `value` of the chosen place, or null for anywhere. */
  place: string | null;
  /** The lowest price in whole currency units, or null for no lowest. */
  min: number | null;
  /** The highest price in whole currency units, or null for no highest. */
  max: number | null;
  /** The fewest bedrooms, or null for any. */
  beds: number | null;
}

export interface PropertySearchHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The headline: "Find a home you will love living in". */
  title: string;
  /** One line under it. */
  description?: string;
  /** The tabs, in order: Buy, Rent, Sold. At least one. */
  modes: readonly PropertyMode[];
  /** The `value` of the tab to start on. Default: the first. */
  defaultMode?: string;
  /** The places to choose from. The list is searchable, so it can be long. */
  places: readonly PropertyPlace[];
  /** The prices the two price fields offer, in whole currency units, for each mode by its `value`: purchase prices for Buy, monthly rent for Rent. Switching tab swaps the list, keeps a price the new list has and clears one it does not. */
  priceSteps: Readonly<Record<string, readonly number[]>>;
  /** The bedroom counts offered, each as "n+". Default 1 to 5. */
  bedrooms?: readonly number[];
  /** The popular places under the row, as links with their listing counts: one list, or one list per mode by its `value`, because the counts differ between buying and renting. */
  popular?: readonly PropertyPopular[] | Readonly<Record<string, readonly PropertyPopular[]>>;
  /** Called when the visitor presses Search. With no place chosen the button says "Search everywhere" and still searches, so a search never dead-ends. Searching is yours. A function cannot be passed from a Server Component: use the hero inside a Client Component. */
  onSearch: (search: PropertySearch) => void;
  /** A photograph behind the panel, as an element: an <img> or an inline SVG. It fills the block behind the search, which grows a band of picture above the panel. Hidden from assistive technology, so it must only decorate. */
  background?: ReactNode;
  /** The ISO 4217 code of the currency of the prices. Default "EUR". */
  currency?: string;
  /** The language of the prices and counts. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PropertySearchHeroLabels>;
}

/** The value of the "any" option of a select: Radix does not allow an empty value on an item, and an empty `value` on the select is what shows its placeholder. */
const ANY = "__any__";

const NO_POPULAR: readonly PropertyPopular[] = [];
const BEDROOMS: readonly number[] = [1, 2, 3, 4, 5];

const TRIGGER = "data-[size=default]:h-11";

/**
 * A real-estate opening with the search on the first screen: a centred
 * headline over a muted panel that holds Buy, Rent and Sold tabs and, under
 * them, one search row: a searchable list of places, a lowest and a highest
 * price, the bedrooms and the Search button, with popular places below as
 * links with their listing counts. Switching tab swaps the price steps (rent
 * per month against a purchase price), keeps a price the new list has, clears
 * one it does not, and announces the change politely. The row is one line
 * when there is room, two lines on a tablet and one field per line on a phone,
 * by the width of the panel. A search with no place is allowed and the button
 * says "Search everywhere", so it never ends in nothing. A photograph can sit
 * behind the panel through the `background` slot.
 */
export function PropertySearchHero({
  titleAs: Title = "h2",
  title,
  description,
  modes,
  defaultMode,
  places,
  priceSteps,
  bedrooms = BEDROOMS,
  popular = NO_POPULAR,
  onSearch,
  background,
  currency = "EUR",
  locale = "en-US",
  labels,
  className,
  ...props
}: PropertySearchHeroProps) {
  const words = { ...LABELS, ...labels, listings: { ...LABELS.listings, ...labels?.listings } };
  const id = useId();
  const [mode, setMode] = useState(() => (defaultMode !== undefined && modes.some((entry) => entry.value === defaultMode) ? defaultMode : (modes[0]?.value ?? "")));
  const [place, setPlace] = useState<string | null>(null);
  const [min, setMin] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const [beds, setBeds] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const current = modes.find((entry) => entry.value === mode);
  const steps = priceSteps[mode] ?? [];
  const money = (value: number) => moneyText(value, currency, locale);
  const links = Array.isArray(popular) ? popular : ((popular as Readonly<Record<string, readonly PropertyPopular[]>>)[mode] ?? NO_POPULAR);
  const options: ComboboxOption[] = [{ value: ANY, label: words.anywhere, description: words.anywhereHint }, ...places];

  function changeMode(next: string) {
    if (next === mode) return;
    const target = modes.find((entry) => entry.value === next);
    const list = priceSteps[next] ?? [];
    // A price that the new list has stays; one it does not have is cleared, and the announcement says so.
    const keepMin = min === null || list.includes(min);
    const keepMax = max === null || list.includes(max);
    setMode(next);
    if (!keepMin) setMin(null);
    if (!keepMax) setMax(null);
    const price = target?.priceLabel ?? words.price;
    setAnnouncement(`${fill(words.modeChanged, { mode: target?.label ?? next, price })}${keepMin && keepMax ? "" : ` ${words.priceReset}`}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({ mode, place, min, max, beds });
  }

  return (
    <section data-slot="property-search-hero" aria-labelledby={`${id}-title`} className={cn("py-14 sm:py-20", className)} {...props}>
      <header className="mx-auto max-w-3xl text-center">
        <Title id={`${id}-title`} className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
          {title}
        </Title>
        {description ? <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
      </header>

      {/* With a photograph the panel overlaps it: the picture is a band at the top, and a tall panel (a phone stacks every field) hangs out below it instead of stretching the picture. From lg the panel is a single row and sits wholly inside the picture. */}
      <div data-slot="property-search-hero-stage" className={cn("relative isolate mt-10 sm:mt-12", background && "px-3 pt-32 sm:px-8 sm:pt-44 lg:px-12 lg:pt-56 lg:pb-12")}>
        {background ? (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-[22rem] overflow-hidden rounded-3xl border border-border bg-muted sm:h-[32rem] lg:inset-y-0 lg:h-auto [&>img]:size-full [&>img]:object-cover [&>svg]:size-full"
          >
            {background}
          </div>
        ) : null}

        <div data-slot="property-search-hero-panel" className="rounded-2xl border border-border bg-muted p-3 shadow-sm sm:p-4">
          <Tabs value={mode} onValueChange={changeMode} className="gap-4">
            <TabsList variant="pill" aria-label={words.mode} className="h-10 bg-background p-1">
              {modes.map((entry) => (
                <TabsTrigger
                  key={entry.value}
                  value={entry.value}
                  className="group-data-[variant=pill]/list:h-8 group-data-[variant=pill]/list:px-4 group-data-[variant=pill]/list:data-[state=active]:bg-foreground group-data-[variant=pill]/list:data-[state=active]:text-background group-data-[variant=pill]/list:data-[state=active]:shadow-none"
                >
                  {entry.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* The panel holds the controls, so it is not a tab stop of its own: Tab goes from the tabs straight to the first field. */}
            <TabsContent value={mode} tabIndex={-1}>
              <form aria-label={words.form} noValidate onSubmit={submit} className="@container">
                <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_12.5rem] @4xl:items-end">
                  {/* A group, not a <label for>: a label would become the whole name of the button and hide the chosen place from a screen reader. */}
                  <div role="group" aria-labelledby={`${id}-where`} className="min-w-0">
                    <p id={`${id}-where`} className="mb-2.5 text-sm leading-none font-medium">
                      {words.where}
                    </p>
                    <Combobox
                      id={`${id}-place`}
                      label={words.place}
                      options={options}
                      value={place}
                      onValueChange={(next) => setPlace(next === ANY ? null : next)}
                      placeholder={words.anywhere}
                      searchPlaceholder={words.searchPlaces}
                      emptyText={words.noPlace}
                      className="h-11"
                    />
                  </div>

                  <div role="group" aria-labelledby={`${id}-price`} className="min-w-0">
                    <p id={`${id}-price`} className="mb-2.5 text-sm leading-none font-medium">
                      {current?.priceLabel ?? words.price}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={min === null ? "" : String(min)} onValueChange={(next) => setMin(next === ANY ? null : Number(next))}>
                        <SelectTrigger aria-label={words.minPrice} className={TRIGGER}>
                          <SelectValue placeholder={words.noMin} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ANY}>{words.noMin}</SelectItem>
                          {steps.map((step) => (
                            <SelectItem key={step} value={String(step)} disabled={max !== null && step >= max}>
                              {money(step)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={max === null ? "" : String(max)} onValueChange={(next) => setMax(next === ANY ? null : Number(next))}>
                        <SelectTrigger aria-label={words.maxPrice} className={TRIGGER}>
                          <SelectValue placeholder={words.noMax} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ANY}>{words.noMax}</SelectItem>
                          {steps.map((step) => (
                            <SelectItem key={step} value={String(step)} disabled={min !== null && step <= min}>
                              {money(step)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor={`${id}-beds`} className="mb-2.5">
                      {words.bedrooms}
                    </Label>
                    <Select value={beds === null ? "" : String(beds)} onValueChange={(next) => setBeds(next === ANY ? null : Number(next))}>
                      <SelectTrigger id={`${id}-beds`} className={TRIGGER}>
                        <SelectValue placeholder={words.anyBedrooms} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY}>{words.anyBedrooms}</SelectItem>
                        {bedrooms.map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {fill(words.bedsAtLeast, { count })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" size="lg" className="h-11 w-full px-5">
                    <IconSearch />
                    {place === null ? words.searchEverywhere : words.search}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {links.length ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
              <p id={`${id}-popular`} className="text-muted-foreground">
                {words.popular}
              </p>
              <ul aria-labelledby={`${id}-popular`} className="flex flex-wrap gap-x-5 gap-y-2">
                {links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <a
                      href={link.href}
                      className="group/place rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      <span className="font-medium underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 group-hover/place:decoration-foreground motion-reduce:transition-none">{link.label}</span>{" "}
                      <span aria-hidden="true" className="text-muted-foreground tabular-nums">
                        {countText(link.count, locale)}
                      </span>
                      <span className="sr-only">, {fill(plural(words.listings, link.count, locale), { count: countText(link.count, locale) })}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
