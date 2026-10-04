"use client";

import { useId, useMemo, useState, type ComponentProps } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface PhoneCountry {
  /** ISO code: "NL". */
  code: string;
  name: string;
  /** Dialling code without the plus: "31". */
  dial: string;
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "NL", name: "Netherlands", dial: "31" },
  { code: "BE", name: "Belgium", dial: "32" },
  { code: "DE", name: "Germany", dial: "49" },
  { code: "FR", name: "France", dial: "33" },
  { code: "GB", name: "United Kingdom", dial: "44" },
  { code: "ES", name: "Spain", dial: "34" },
  { code: "IT", name: "Italy", dial: "39" },
  { code: "US", name: "United States", dial: "1" },
];

export interface PhoneInputProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> {
  /** The full number in E.164 form: "+31612345678". */
  value?: string;
  onValueChange?: (e164: string) => void;
  countries?: readonly PhoneCountry[];
  defaultCountry?: string;
}

/**
 * A phone number field with a searchable country list for the dialling
 * code. The value it reports is E.164 (+31612345678), whatever spacing the
 * person types; a leading 0 is dropped the way the network does.
 */
export function PhoneInput({ value, onValueChange, countries = PHONE_COUNTRIES, defaultCountry = "NL", className, id, ...props }: PhoneInputProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const initial = useMemo(() => countries.find((country) => value?.startsWith(`+${country.dial}`)) ?? countries.find((country) => country.code === defaultCountry) ?? countries[0]!, [countries, defaultCountry, value]);
  const [country, setCountry] = useState(initial);
  const [local, setLocal] = useState(value ? value.slice(initial.dial.length + 1) : "");
  const [open, setOpen] = useState(false);
  function report(nextCountry: PhoneCountry, nextLocal: string) {
    const digits = nextLocal.replace(/\D/g, "").replace(/^0+/, "");
    onValueChange?.(digits ? `+${nextCountry.dial}${digits}` : "");
  }
  return (
    <div data-slot="phone-input" className={cn("flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={cn(fieldSurface, "flex h-9 w-auto shrink-0 items-center gap-1.5 rounded-r-none border-r-0 px-3 text-sm tabular-nums")} aria-label={`Country code: ${country.name} +${country.dial}`}>
          <span className="font-medium">{country.code}</span>
          <span className="text-muted-foreground">+{country.dial}</span>
          <IconChevronDown className="size-3.5 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search country" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              {countries.map((option) => (
                <CommandItem key={option.code} value={`${option.name} ${option.dial}`} onSelect={() => { setCountry(option); setOpen(false); report(option, local); }}>
                  <span className="w-7 font-medium">{option.code}</span>
                  <span className="flex-1">{option.name}</span>
                  <span className="text-muted-foreground tabular-nums">+{option.dial}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        id={inputId}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={local}
        onChange={(event) => { setLocal(event.target.value); report(country, event.target.value); }}
        className={cn(fieldSurface, "h-9 min-w-0 flex-1 rounded-l-none px-3 placeholder:text-muted-foreground")}
        {...props}
      />
    </div>
  );
}
