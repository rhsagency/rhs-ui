"use client";

import { useId } from "react";

import { CountrySelect } from "@rhs-ui/primitives/country-select";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface Address {
  country: string;
  street: string;
  number: string;
  addition: string;
  postcode: string;
  city: string;
}

export interface AddressFieldsProps {
  value: Address;
  onValueChange: (address: Address) => void;
  /** "shipping" or "billing": sets the autocomplete section so both can be filled on one page. */
  section?: "shipping" | "billing";
  /** Countries you ship to, if not all. */
  countries?: readonly string[];
  legend?: string;
  locale?: string;
  className?: string;
}

/** Countries where the house number is its own field and the postcode comes before the city. */
const SPLIT_NUMBER = new Set(["NL", "BE", "DE", "AT", "CH", "DK", "PL"]);

/**
 * An address the way the country writes it: street and house number apart
 * where that is the custom (Netherlands, Belgium, Germany), postcode before
 * or after the city, and autocomplete tokens per section so a browser can
 * fill shipping and billing on the same page. Country first, so the rest
 * can follow it.
 */
export function AddressFields({ value, onValueChange, section = "shipping", countries, legend = "Address", locale = "en-GB", className }: AddressFieldsProps) {
  const id = useId();
  const set = (patch: Partial<Address>) => onValueChange({ ...value, ...patch });
  const split = SPLIT_NUMBER.has(value.country);
  const ac = (token: string) => `section-${section} ${section} ${token}`;
  const field = (key: keyof Address, label: string, token: string, extra?: { inputMode?: "numeric" | "text"; className?: string; required?: boolean }) => (
    <div className={cn("grid gap-1.5", extra?.className)}>
      <label htmlFor={`${id}-${key}`} className="text-sm font-medium">{label}{extra?.required === false ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}</label>
      <Input id={`${id}-${key}`} name={`${section}-${key}`} value={value[key]} onChange={(event) => set({ [key]: event.target.value })} autoComplete={ac(token)} inputMode={extra?.inputMode} required={extra?.required !== false} />
    </div>
  );
  return (
    <fieldset data-slot="address-fields" className={cn("grid gap-4", className)}>
      <legend className="mb-1 text-base font-medium">{legend}</legend>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-country`} className="text-sm font-medium">Country</label>
        <CountrySelect id={`${id}-country`} name={`${section}-country`} value={value.country} onValueChange={(country) => set({ country })} only={countries} locale={locale} suggested={["NL", "BE", "DE"]} />
      </div>
      {split ? (
        <div className="grid grid-cols-[1fr_6rem_6rem] items-end gap-3">
          {field("street", "Street", "address-line1")}
          {field("number", "Number", "address-line2", { inputMode: "numeric" })}
          {field("addition", "Addition", "address-line3", { required: false })}
        </div>
      ) : (
        <>
          {field("street", "Street address", "address-line1")}
          {field("addition", "Apartment, suite", "address-line2", { required: false })}
        </>
      )}
      <div className={cn("grid items-end gap-3", split ? "grid-cols-[8rem_1fr]" : "grid-cols-[1fr_9rem]")}>
        {split ? field("postcode", "Postcode", "postal-code") : field("city", "City", "address-level2")}
        {split ? field("city", "City", "address-level2") : field("postcode", "Postcode", "postal-code")}
      </div>
    </fieldset>
  );
}
