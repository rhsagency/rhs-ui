"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { IconAlertCircle, IconCheck, IconChevronDown, IconGlobe, IconTruck } from "@rhs-ui/icons";
import { Label } from "@rhs-ui/primitives/label";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

/** A country you ship to. */
export interface RegionCountry {
  /** ISO 3166-1 alpha-2 code: "NL". It is what the trigger shows and what `value` carries. */
  code: string;
  /** The name as the shop writes it: "Netherlands". */
  name: string;
  /** The currency that country pays in by default: "EUR". Choosing the country chooses this. */
  currency: string;
  /** The currencies an order to this country can be paid in, besides its own. Without it, every currency in `currencies` is accepted. A currency outside the list gets a hint and cannot be saved. */
  accepts?: readonly string[];
}

/** Where the order goes and what it is paid in. */
export interface RegionValue {
  /** The code of the country the order goes to: "NL". */
  country: string;
  /** The ISO 4217 code of the currency the order is paid in: "EUR". */
  currency: string;
}

export interface RegionSwitcherLabels {
  /** The words before the pair on the trigger. */
  shipTo?: string;
  /** The heading of the panel. */
  title?: string;
  /** The placeholder and the name of the country search. */
  search?: string;
  /** In place of the list when no country matches the search. */
  empty?: string;
  /** The label over the currency choice. */
  currency?: string;
  /** Read out after the country that is chosen. */
  selected?: string;
  /** The hint when the currency cannot be used for the country. `{country}`, `{currency}` and `{accepted}` (a list: "EUR or USD"). */
  notAccepted?: string;
  /** The button that applies the choice. */
  save?: string;
}

const WORDS = {
  shipTo: "Ship to",
  title: "Ship to",
  search: "Search countries",
  empty: "No country found.",
  currency: "Currency",
  selected: ", selected",
  notAccepted: "Orders to {country} cannot be paid in {currency}. Choose {accepted}.",
  save: "Save",
} satisfies Required<RegionSwitcherLabels>;

export interface RegionSwitcherProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The countries you ship to. */
  countries: readonly RegionCountry[];
  /** The currencies on offer. Defaults to the currencies of the countries. */
  currencies?: readonly string[];
  /** The country and currency that apply now, to control the switcher. Update it in `onSave`. */
  value?: RegionValue;
  /** The pair to start with, when you do not control the switcher. Defaults to the first country. */
  defaultValue?: RegionValue;
  /** Called with the pair when Save is pressed. Nothing applies before that, and the component itself never navigates or sets a cookie: what saving means is up to you. */
  onSave?: (value: RegionValue) => void;
  /** One line under the currency, such as a free shipping threshold. */
  note?: ReactNode;
  /** Turns the trigger off. */
  disabled?: boolean;
  /** Whether the panel is open, to control it. */
  open?: boolean;
  /** Whether the panel starts open, when you do not control it. It is shown without taking the focus from the page; a panel the visitor opens takes it as usual. */
  defaultOpen?: boolean;
  /** Called with the new state whenever the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Always pass your application locale, so the server and the browser write the same currency names. */
  locale?: string;
  /** The words, for another language. */
  labels?: RegionSwitcherLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/**
 * The "Ship to" control of a shop's header or footer. The trigger reads "NL, EUR"; its panel has a searchable list of
 * the countries you ship to and a currency choice that follows the country but can be changed, and nothing applies
 * until Save, which hands the pair to `onSave`. Escape or a click outside closes the panel and drops what was
 * chosen. A currency the country cannot be paid in shows a hint and cannot be saved. A `note`, such as the free
 * shipping threshold, sits above the button. It never navigates and sets no cookie, so what saving means is yours.
 */
export function RegionSwitcher({
  countries,
  currencies,
  value,
  defaultValue,
  onSave,
  note,
  disabled = false,
  open,
  defaultOpen = false,
  onOpenChange,
  locale = "en-US",
  labels,
  className,
  ...props
}: RegionSwitcherProps) {
  const words: Required<RegionSwitcherLabels> = { ...WORDS, ...labels };
  const id = useId();
  const first = countries[0];
  const [saved, setSaved] = useState<RegionValue>(defaultValue ?? { country: first?.code ?? "", currency: first?.currency ?? "" });
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const current = value ?? saved;
  const [draft, setDraft] = useState<RegionValue>(current);
  const isOpen = open ?? ownOpen;
  // A panel that starts open (a preview in the docs) is shown without taking the focus from the page; one the visitor opens takes it as usual.
  const visitorOpened = useRef(false);

  const countryOf = (code: string): RegionCountry | undefined => countries.find((country) => country.code === code);
  const names = new Intl.DisplayNames(locale, { type: "currency" });
  const list = new Intl.ListFormat(locale, { type: "disjunction" });
  const offered = [...new Set([...(currencies ?? countries.map((country) => country.currency)), draft.currency])];
  const chosen = countryOf(draft.country);
  const accepted = chosen ? (chosen.accepts ? [...new Set([chosen.currency, ...chosen.accepts])] : offered) : offered;
  const usable = accepted.includes(draft.currency);
  const changed = draft.country !== current.country || draft.currency !== current.currency;
  const now = countryOf(current.country);

  function setOpen(next: boolean) {
    if (next) {
      setDraft(current);
      visitorOpened.current = true;
    }
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }
  function save() {
    if (!usable) return;
    if (value === undefined) setSaved(draft);
    onSave?.(draft);
    setOpen(false);
  }

  return (
    <div data-slot="region-switcher" className={cn("inline-flex max-w-full", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled} className="max-w-full">
            <IconGlobe aria-hidden="true" className="text-muted-foreground" />
            <span className="font-normal text-muted-foreground">{words.shipTo}</span>
            <span className="tabular-nums">
              {current.country}, {current.currency}
            </span>
            {now ? <span className="sr-only">({now.name})</span> : null}
            <IconChevronDown aria-hidden="true" className="-mr-0.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={16}
          aria-label={words.title}
          onOpenAutoFocus={(event) => {
            if (defaultOpen && !visitorOpened.current) event.preventDefault();
          }}
          className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        >
          <p className="px-4 pt-4 pb-3 text-sm leading-none font-medium">{words.title}</p>
          <Command defaultValue={current.country} className="rounded-none bg-transparent">
            <CommandInput placeholder={words.search} aria-label={words.search} className="text-sm" />
            {/* Six whole rows of 2.25rem and the 0.375rem of padding on each side: a row is never cut in half at the bottom. */}
            <CommandList className="max-h-[14.25rem]">
              <CommandEmpty>{words.empty}</CommandEmpty>
              {countries.map((country) => {
                const active = country.code === draft.country;
                return (
                  <CommandItem key={country.code} value={country.code} keywords={[country.name, country.currency]} onSelect={() => setDraft({ country: country.code, currency: country.currency })} className={cn("gap-3", active && "font-medium")}>
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                    <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">{country.currency}</span>
                    <span className="grid size-4 shrink-0 place-items-center">
                      {active ? (
                        <>
                          <IconCheck aria-hidden="true" size={14} className="text-foreground" />
                          <span className="sr-only">{words.selected}</span>
                        </>
                      ) : null}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
          <div className="grid gap-4 border-t border-border p-4">
            <div className="grid gap-2">
              <Label htmlFor={`${id}-currency`}>{words.currency}</Label>
              <Select value={draft.currency} onValueChange={(currency) => setDraft({ ...draft, currency })}>
                <SelectTrigger id={`${id}-currency`} aria-invalid={usable ? undefined : true} aria-describedby={usable ? undefined : `${id}-hint`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {offered.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code} · {names.of(code) ?? code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div role="status" className="empty:-mt-2">
                {usable ? null : (
                  <p id={`${id}-hint`} className="flex items-start gap-1.5 text-xs leading-snug text-destructive">
                    <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                    {fill(words.notAccepted, { country: chosen?.name ?? draft.country, currency: draft.currency, accepted: list.format(accepted) })}
                  </p>
                )}
              </div>
            </div>
            {note ? (
              <p className="flex items-start gap-2 text-xs leading-snug text-muted-foreground">
                <IconTruck aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                <span>{note}</span>
              </p>
            ) : null}
            {/* Quiet until there is something to save, so the first thing in the panel is not a heavy disabled slab. */}
            <Button onClick={save} disabled={!usable || !changed} variant={usable && changed ? "default" : "secondary"} className="w-full">
              {words.save}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
