"use client";

import { useId, useMemo, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconInfo, IconSpinner } from "@rhs-ui/icons";
import { formatMoney } from "@rhs-ui/commerce/money";
import { checkPostcode, postcodeLabel, postcodeRuleFor, tidyPostcode } from "@rhs-ui/commerce/shipping-estimator/postcodes";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { CountrySelect } from "@rhs-ui/primitives/country-select";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface ShippingOption {
  /** Stable id for this method, handed back through `onSelect`. */
  id: string;
  /** The method's name: "Standard delivery". */
  name: string;
  /** When it arrives, already written for the reader: "Arrives Thu 22 Oct to Fri 23 Oct" or "2 to 3 working days". */
  arrival: string;
  /** The price in minor units: 695 is 6.95. Zero shows as "Free". */
  amount: number;
  /** Who delivers or where from, shown small after the arrival: "PostNL", "Pick-up point". */
  carrier?: string;
}

export interface ShippingQuery {
  /** ISO 3166-1 alpha-2 code: "NL". */
  country: string;
  /** Checked and laid out for the country: "1017 AB". Empty for countries without postcodes. */
  postcode: string;
}

export interface ShippingEstimatorProps extends Omit<ComponentProps<"form">, "onSubmit" | "onSelect" | "children" | "title" | "defaultValue"> {
  /** Asks your server for the methods. Resolve with the options, or with an empty list when you do not ship there. Reject for an error: the person can retry. */
  onEstimate: (query: ShippingQuery) => Promise<readonly ShippingOption[]>;
  /** The countries you ship to, as ISO codes. Without it every country is listed. */
  countries?: readonly string[];
  /** The country to start on. */
  defaultCountry?: string;
  /** A postcode to start with, for example one remembered from the last visit. */
  defaultPostcode?: string;
  /** Options to show before anything is asked, for example a remembered estimate. */
  defaultOptions?: readonly ShippingOption[];
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Locale for prices and country names. Always passed, so server and browser agree. */
  locale?: string;
  /**
   * With it the options become a radio group and the choice is reported. It is called with `null` when the choice no longer stands: the
   * country or the postcode was edited, or a new estimate started, so the options it came from are gone. Without `onSelect` the options are a plain list.
   */
  onSelect?: (option: ShippingOption | null) => void;
  /** Controlled choice, by option id. Pair with `onSelect` and clear it when that hands you `null`. A new estimate clears the uncontrolled choice, because the prices belong to the place. */
  selectedId?: string;
  /** Uncontrolled starting choice, by option id. */
  defaultSelectedId?: string;
  /** The form's heading, which also names the form. */
  title?: string;
  /** One line under the heading. */
  description?: ReactNode;
}

type Phase = "idle" | "busy" | "done" | "error";

function regionName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const row = "flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-[border-color,background-color] duration-150 motion-reduce:transition-none";

/**
 * The cart's shipping estimator: a country, a postcode and one button, then
 * the delivery methods that come back with their arrival window and price.
 * The postcode is checked against the country's format before your server is
 * asked, so a typo never costs a request. While it waits the button keeps its
 * place and the list area shows placeholders; when it answers, a polite
 * status says how many options were found, or that you do not ship there. Give
 * it `onSelect` and the options become a radio group the shopper can choose
 * from. Edit the country or the postcode and the options go away, and so does
 * the choice: `onSelect(null)` tells you, so a stored method never outlives
 * the place it was priced for.
 */
export function ShippingEstimator({
  onEstimate,
  countries,
  defaultCountry,
  defaultPostcode = "",
  defaultOptions,
  currency = "EUR",
  locale = "en-US",
  onSelect,
  selectedId,
  defaultSelectedId,
  title = "Estimate shipping",
  description,
  className,
  ...props
}: ShippingEstimatorProps) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const request = useRef(0);
  const [country, setCountry] = useState(defaultCountry ?? "");
  const [postcode, setPostcode] = useState(defaultPostcode);
  const [errors, setErrors] = useState<{ country?: string; postcode?: string }>({});
  const [phase, setPhase] = useState<Phase>(defaultOptions ? "done" : "idle");
  const [options, setOptions] = useState<readonly ShippingOption[]>(defaultOptions ?? []);
  const [answered, setAnswered] = useState<ShippingQuery | null>(defaultOptions ? { country: defaultCountry ?? "", postcode: defaultPostcode } : null);
  const [ownSelected, setOwnSelected] = useState(defaultSelectedId ?? "");
  const suggested = useMemo(() => (!countries && defaultCountry ? [defaultCountry] : []), [countries, defaultCountry]);

  const rule = postcodeRuleFor(country);
  const selected = selectedId ?? ownSelected;
  const busy = phase === "busy";

  /** The prices belong to the place they were asked for. When the place changes the choice is gone, and the parent hears it: it must not keep charging a method nobody can see. */
  function dropChoice() {
    const standing = options.some((option) => option.id === selected);
    if (selectedId === undefined) setOwnSelected("");
    if (standing) onSelect?.(null);
  }

  /** The inputs changed, so what was found no longer describes them. */
  function forget() {
    request.current += 1;
    setPhase("idle");
    setOptions([]);
    dropChoice();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const check = checkPostcode(country, postcode);
    const problems = { country: country ? undefined : "Choose a country.", postcode: check.ok ? undefined : check.message };
    if (problems.country || problems.postcode) {
      setErrors(problems);
      forget();
      const first = problems.country ? form.current?.querySelector<HTMLElement>('[data-slot="combobox-trigger"]') : form.current?.querySelector<HTMLElement>('input[name="postcode"]');
      first?.focus();
      return;
    }
    if (!check.ok) return;
    const query: ShippingQuery = { country, postcode: check.value };
    setErrors({});
    setPostcode(check.value);
    setOptions([]);
    // New prices for a new place: the shopper chooses again, and onSelect(null) says the old choice is gone.
    dropChoice();
    setPhase("busy");
    const ticket = ++request.current;
    try {
      const found = await onEstimate(query);
      if (ticket !== request.current) return;
      setOptions(found);
      setAnswered(query);
      setPhase("done");
    } catch {
      if (ticket !== request.current) return;
      setPhase("error");
    }
  }

  function choose(optionId: string) {
    const option = options.find((candidate) => candidate.id === optionId);
    if (!option) return;
    if (selectedId === undefined) setOwnSelected(optionId);
    onSelect?.(option);
  }

  const countryName = answered ? regionName(answered.country, locale) : "that country";
  const place = answered ? [answered.postcode, countryName].filter(Boolean).join(", ") : "";
  const found = phase === "done" && options.length > 0;
  const unavailable = phase === "done" && options.length === 0;
  const tally = options.length === 1 ? "1 delivery option" : `${options.length} delivery options`;
  // One polite sentence per outcome, said once when it arrives. The visible results carry the detail.
  const announcement = busy ? "Finding delivery options" : found ? `${tally} found${place ? ` for ${place}` : ""}` : unavailable ? `No delivery options for ${countryName}` : phase === "error" ? "Shipping options could not be loaded" : "";

  const details = (option: ShippingOption, index: number) => {
    const key = `${id}-option-${index}`;
    return (
      <>
        <span className="min-w-0 flex-1">
          <span id={`${key}-name`} className="block text-sm leading-snug font-medium">
            {option.name}
          </span>
          <span id={`${key}-arrival`} className="mt-0.5 block text-xs text-muted-foreground">
            {option.arrival}
            {/* The dot travels with the carrier: a narrow line breaks before it, so it is never left at the end of a line on its own. */}
            {option.carrier ? (
              <>
                {" "}
                <span className="whitespace-nowrap">· {option.carrier}</span>
              </>
            ) : null}
          </span>
        </span>
        <span id={`${key}-price`} className="shrink-0 text-sm font-medium whitespace-nowrap tabular-nums">
          {option.amount === 0 ? "Free" : formatMoney({ amount: option.amount, currency }, locale)}
        </span>
      </>
    );
  };

  return (
    <form ref={form} data-slot="shipping-estimator" noValidate aria-labelledby={`${id}-title`} aria-busy={busy || undefined} onSubmit={submit} className={cn("grid grid-cols-[minmax(0,1fr)] gap-5 [overflow-wrap:anywhere]", className)} {...props}>
      <div className="grid gap-1">
        <h3 id={`${id}-title`} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {/* The label names a group, not the trigger: a label tied to a button would replace the chosen country in its name. */}
      <FormField error={errors.country} role="group" aria-labelledby={`${id}-country`}>
        <Label id={`${id}-country`} onClick={() => form.current?.querySelector<HTMLElement>('[data-slot="combobox-trigger"]')?.focus()}>
          Country
        </Label>
        <CountrySelect
          name="country"
          value={country || null}
          onValueChange={(code) => {
            setCountry(code);
            setErrors({});
            forget();
          }}
          only={countries}
          suggested={suggested}
          locale={locale}
        />
      </FormField>

      <FormField error={errors.postcode} described={!errors.postcode && Boolean(rule.example)}>
        <FormLabel>
          {postcodeLabel(rule)}
          {rule.optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
        </FormLabel>
        <div className="flex flex-wrap items-start gap-2">
          <FormControl>
            <Input
              name="postcode"
              value={postcode}
              placeholder={rule.example}
              autoComplete="shipping postal-code"
              inputMode={rule.numeric ? "numeric" : "text"}
              autoCapitalize="characters"
              enterKeyHint="go"
              spellCheck={false}
              onChange={(event) => {
                setPostcode(event.target.value);
                setErrors((current) => ({ ...current, postcode: undefined }));
                if (phase !== "idle") forget();
              }}
              onBlur={() => setPostcode((current) => tidyPostcode(country, current))}
              className="min-w-28 flex-1 basis-28"
            />
          </FormControl>
          {/* Both labels share one cell, so the button is as wide as the longer one and the field beside it never changes size while it waits. */}
          <Button type="submit" aria-disabled={busy || undefined} onClick={(event) => busy && event.preventDefault()} className="shrink-0">
            <span className="inline-grid">
              <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-center", busy && "invisible")}>Estimate</span>
              <span aria-hidden={!busy} className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2", !busy && "invisible")}>
                <IconSpinner />
                Estimating
              </span>
            </span>
          </Button>
        </div>
        {!errors.postcode && rule.example ? <FormDescription>For example {rule.example}</FormDescription> : null}
      </FormField>

      <p data-slot="shipping-estimator-status" role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {phase !== "idle" ? (
        <div data-slot="shipping-estimator-results" className="grid gap-3">
          {busy ? (
            <div aria-hidden="true" className="grid gap-2">
              {[0, 1].map((placeholder) => (
                <div key={placeholder} className={row}>
                  {onSelect ? <Skeleton className="size-[18px] rounded-full" delay={placeholder * 120} /> : null}
                  <div className="grid flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-28" delay={placeholder * 120 + 60} />
                    <Skeleton className="h-3 w-44 max-w-full" delay={placeholder * 120 + 120} />
                  </div>
                  <Skeleton className="h-3.5 w-12" delay={placeholder * 120 + 180} />
                </div>
              ))}
            </div>
          ) : null}

          {found ? (
            <p aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
              {tally}
              {place ? ` to ${place}` : ""}
            </p>
          ) : null}

          {found && onSelect ? (
            <RadioGroup aria-label="Delivery options" value={selected} onValueChange={choose} className="gap-2">
              {options.map((option, index) => {
                const key = `${id}-option-${index}`;
                return (
                  <label key={option.id} htmlFor={key} className={cn(row, "cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/40")}>
                    <RadioGroupItem id={key} value={option.id} aria-labelledby={`${key}-name`} aria-describedby={`${key}-arrival ${key}-price`} />
                    {details(option, index)}
                  </label>
                );
              })}
            </RadioGroup>
          ) : null}

          {found && !onSelect ? (
            <ul aria-label="Delivery options" className="grid gap-2">
              {options.map((option, index) => (
                <li key={option.id} className={row}>
                  {details(option, index)}
                </li>
              ))}
            </ul>
          ) : null}

          {unavailable ? (
            <Alert role="none" tone="info">
              <IconInfo />
              <AlertTitle>We do not ship to {countryName} yet</AlertTitle>
              <AlertDescription>Try another country, or check that the postcode is right.</AlertDescription>
            </Alert>
          ) : null}

          {phase === "error" ? (
            <Alert role="none" tone="destructive">
              <IconAlertCircle />
              <AlertTitle className="text-foreground">We could not get shipping options</AlertTitle>
              <AlertDescription>Something went wrong on our side. Press Estimate to try again.</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
