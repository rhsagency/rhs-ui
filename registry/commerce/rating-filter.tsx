"use client";

import type { ComponentProps } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconCheck } from "@rhs-ui/icons";
import { RadioGroup } from "@rhs-ui/primitives/radio-group";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

/** How many products each choice would leave, by the lowest rating it takes ("4" for 4 stars and up). `any` is the count without a rating filter. Counts are cumulative: 4 and up includes the 5s. */
export interface RatingFilterCounts {
  /** How many products there are without any rating filter: the count beside the "Any rating" row. */
  any?: number;
  /** How many products have a rating of at least this number (key `4` is "4 stars and up"). */
  [minimum: number]: number | undefined;
}

export interface RatingFilterLabels {
  /** Names the group for a screen reader. */
  group?: string;
  /** After the stars, in the row. */
  andUp?: string;
  /** The row that clears the filter. */
  any?: string;
  /** The name of a row that is one star: `{count}` star and up. */
  starOne?: string;
  /** The name of a row of several stars: `{count}` stars and up. */
  starOther?: string;
  /** What follows in a row's name when counts are shown: `{count}` product. */
  productOne?: string;
  /** `{count}` products. */
  productOther?: string;
}

const WORDS = {
  group: "Minimum customer rating",
  andUp: "& up",
  any: "Any rating",
  starOne: "{count} star and up",
  starOther: "{count} stars and up",
  productOne: "{count} product",
  productOther: "{count} products",
} satisfies Required<RatingFilterLabels>;

export interface RatingFilterProps extends Omit<ComponentProps<typeof RadioGroup>, "value" | "defaultValue" | "onValueChange" | "children"> {
  /** The lowest rating that passes, or null for any rating. Pass it (null included) to control the filter. */
  value?: number | null;
  /** The rating to start with, when you do not control the filter. */
  defaultValue?: number | null;
  /** Called with the lowest rating that passes, or with null when "Any rating" is chosen. */
  onValueChange?: (value: number | null) => void;
  /** How many products each row would leave, cumulative. Without it no counts are shown. A row whose count is 0 is disabled. */
  counts?: RatingFilterCounts;
  /** The ratings to offer as "N and up", from the highest. Defaults to 4, 3, 2 and 1. */
  options?: readonly number[];
  /** How many stars a rating has in all. Defaults to 5. */
  max?: number;
  /** Always pass your application locale, so the server and the browser write the same counts. */
  locale?: string;
  /** The words, for another language. */
  labels?: RatingFilterLabels;
}

const ANY = "any";

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/**
 * "4 stars and up" as a filter: one row per rating, each with its stars, the text "& up" and, when you have them,
 * how many products are left, and an "Any rating" row to clear it. Underneath it is a radio group, so arrow keys
 * choose and Tab leaves; the stars are decoration and a row is named in words, "4 stars and up, 128 products". The
 * chosen row is bold and carries a check, never only coloured stars, and a row with no products is disabled and
 * says "0 products". Every row is a 44px target.
 */
export function RatingFilter({ value, defaultValue, onValueChange, counts, options = [4, 3, 2, 1], max = 5, locale = "en-US", labels, className, ...props }: RatingFilterProps) {
  const words: Required<RatingFilterLabels> = { ...WORDS, ...labels };
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const toKey = (rating: number | null | undefined): string | undefined => (rating === undefined ? undefined : rating === null ? ANY : String(rating));

  const rows = [
    ...options.map((minimum) => ({ key: String(minimum), minimum, count: counts?.[minimum] })),
    { key: ANY, minimum: null, count: counts?.any },
  ].map((row) => {
    const count = row.count;
    const stars = row.minimum === null ? words.any : fill(plural.select(row.minimum) === "one" ? words.starOne : words.starOther, { count: numbers.format(row.minimum) });
    const products = count === undefined ? "" : fill(plural.select(count) === "one" ? words.productOne : words.productOther, { count: numbers.format(count) });
    return { ...row, count, name: products ? `${stars}, ${products}` : stars, disabled: count === 0 };
  });

  return (
    <RadioGroup
      data-slot="rating-filter"
      aria-label={words.group}
      value={toKey(value)}
      defaultValue={toKey(defaultValue) ?? ANY}
      onValueChange={(key) => onValueChange?.(key === ANY ? null : Number(key))}
      className={cn("min-w-0 gap-0.5", className)}
      {...props}
    >
      {rows.map((row) => (
        <RadioGroupPrimitive.Item
          key={row.key}
          value={row.key}
          disabled={row.disabled}
          aria-label={row.name}
          className={cn(
            "group/row flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm outline-none transition-colors duration-150",
            "hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=checked]:bg-muted data-[state=checked]:font-semibold",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent motion-reduce:transition-none",
            row.key === ANY && "mt-1",
          )}
        >
          <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
            <RadioGroupPrimitive.Indicator>
              <IconCheck size={16} />
            </RadioGroupPrimitive.Indicator>
          </span>
          <span aria-hidden="true" className="inline-flex min-w-0 items-center gap-2">
            {row.minimum === null ? (
              words.any
            ) : (
              <>
                <Rating readOnly value={row.minimum} max={max} size={16} />
                <span>{words.andUp}</span>
              </>
            )}
          </span>
          {row.count !== undefined ? (
            <span aria-hidden="true" className="ml-auto pl-2 text-xs font-normal text-muted-foreground tabular-nums">
              {numbers.format(row.count)}
            </span>
          ) : null}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroup>
  );
}
