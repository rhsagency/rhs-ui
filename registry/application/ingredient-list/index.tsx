"use client";

import { useId, useState, type ComponentProps } from "react";

import { amountText, fill, nameText, type UnitName } from "@rhs-ui/application/ingredient-list/format";
import { IconRotateCcw } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { cn } from "@/lib/utils";

/** One line of a recipe. */
export interface Ingredient {
  /** A stable id: it keys the line and remembers whether it is ticked. */
  id: string;
  /** What it is: "plain flour". Written after the amount and the unit. */
  name: string;
  /** The name when there is more than one, for a counted thing without a unit: name "egg", plural "eggs". With a unit the name never changes. */
  plural?: string;
  /** How much, for `baseServings`. A number scales with the servings; a string ("a pinch", "a handful") is written as it is and never scales. Leave it out for a line with no amount, and put "to taste" in `note`. */
  quantity?: number | string;
  /** The unit: "g", "kg", "ml", "l", "oz", "lb", "cup", "tbsp", "tsp", "clove", "pinch", "slice", "can", "bunch", "sprig" or any word of your own (which is written as it is). */
  unit?: string;
  /** What to do with it, in a few words: "finely chopped". Written after the name in a quieter tone. */
  note?: string;
  /** The heading it sits under: "For the sauce". Lines with the same group are listed together, in the order the group first appears. */
  group?: string;
  /** Set to `false` for a number that must not scale, such as one bay leaf. Default true. */
  scales?: boolean;
}

/** The words the list uses, for translation. `{base}`, `{count}`, `{done}` and `{total}` are filled in. */
export interface IngredientListLabels {
  /** The heading. Default "Ingredients". */
  title?: string;
  /** The name of the servings stepper. Default "Servings". */
  servings?: string;
  /** What the list says under the heading while the amounts are the recipe's own. Default "For {count} servings". */
  makes?: string;
  /** What it says once they are scaled. Default "Scaled from {base} servings". */
  scaled?: string;
  /** The button that brings the recipe's own amounts back. Default "Reset". */
  reset?: string;
  /** How many lines are ticked, said politely when it changes. Default "{done} of {total} ticked". */
  ticked?: string;
  /** The button that clears the ticks. Default "Clear ticks". */
  clear?: string;
  /** What the list says when it has no lines. Default "No ingredients listed yet". */
  empty?: string;
}

export interface IngredientListProps extends Omit<ComponentProps<"section">, "children" | "defaultValue" | "defaultChecked" | "onChange"> {
  /** The lines of the recipe, with their amounts for `baseServings`. */
  ingredients: readonly Ingredient[];
  /** The number of servings the amounts in `ingredients` were written for. */
  baseServings: number;
  /** The servings now, controlled: the amounts follow it. Pair it with `onServingsChange`. */
  servings?: number;
  /** The servings at the start, when you do not control `servings`. Defaults to `baseServings`. */
  defaultServings?: number;
  /** The stepper changed the servings. */
  onServingsChange?: (servings: number) => void;
  /** Show a checkbox on every line. A ticked line is struck through and stays where it is, and the count is announced politely. */
  checkable?: boolean;
  /** The ids that are ticked, controlled. Pair it with `onCheckedChange`. */
  checked?: readonly string[];
  /** The ids ticked at the start, when you do not control `checked`. */
  defaultChecked?: readonly string[];
  /** A line was ticked or unticked. */
  onCheckedChange?: (ids: string[]) => void;
  /** The most servings the stepper allows. Default 99. */
  maxServings?: number;
  /** Your own words for units, or the words of another language: `{ cup: { one: "kopje", other: "kopjes" } }`. They win over the built-in English ones. */
  units?: Readonly<Record<string, UnitName>>;
  /** Heading level of the title; the groups sit one level below. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers and units. Default "en-US". */
  locale?: string;
  /** The words the list uses, for translation. */
  labels?: IngredientListLabels;
}

const DEFAULT_LABELS = {
  title: "Ingredients",
  servings: "Servings",
  makes: "For {count} servings",
  scaled: "Scaled from {base} servings",
  reset: "Reset",
  ticked: "{done} of {total} ticked",
  clear: "Clear ticks",
  empty: "No ingredients listed yet",
};

/**
 * The ingredients of a recipe that scale: change the servings and every amount
 * follows, written the way a kitchen writes it. Cups and spoons become
 * fractions ("1 1/2 cups"), grams and millilitres become decimals that roll over
 * to kilograms and litres, counted things come in quarters, and a unit takes
 * its plural through Intl ("1 cup", "2 cups"). An amount that is words ("a
 * pinch") never scales. Groups such as "For the sauce" are headings, and the
 * amounts line up in one column across them. With `checkable` each line has a
 * checkbox: ticking strikes it through without moving it, and the count of
 * ticked lines is announced politely.
 */
export function IngredientList({
  ingredients,
  baseServings,
  servings: controlled,
  defaultServings,
  onServingsChange,
  checkable = false,
  checked: controlledChecked,
  defaultChecked,
  onCheckedChange,
  maxServings = 99,
  units,
  headingLevel = 2,
  locale = "en-US",
  labels,
  className,
  ...props
}: IngredientListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const stepperId = useId();
  const [ownServings, setOwnServings] = useState(defaultServings ?? baseServings);
  const [ownChecked, setOwnChecked] = useState<readonly string[]>(defaultChecked ?? []);
  const servings = Math.max(1, controlled ?? ownServings);
  const ticked = new Set(controlledChecked ?? ownChecked);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Group = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const factor = baseServings > 0 ? servings / baseServings : 1;
  const scaled = servings !== baseServings;

  const setServings = (next: number) => {
    if (controlled === undefined) setOwnServings(next);
    onServingsChange?.(next);
  };
  const setTicked = (ids: string[]) => {
    if (controlledChecked === undefined) setOwnChecked(ids);
    onCheckedChange?.(ids);
  };
  const toggle = (id: string, on: boolean) => setTicked(on ? [...ticked, id].filter((value, index, all) => all.indexOf(value) === index) : [...ticked].filter((value) => value !== id));

  // Lines with the same group sit together, in the order each group first appears.
  const groups: { name: string | undefined; items: Ingredient[] }[] = [];
  for (const item of ingredients) {
    let group = groups.find((entry) => entry.name === item.group);
    if (!group) {
      group = { name: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  const done = ingredients.filter((item) => ticked.has(item.id)).length;

  const columns = checkable ? "grid-cols-[auto_auto_minmax(0,1fr)]" : "grid-cols-[auto_minmax(0,1fr)]";

  return (
    <section
      data-slot="ingredient-list"
      aria-labelledby={headingId}
      className={cn("w-full rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Heading id={headingId} className="text-base leading-tight font-semibold tracking-[-0.02em]">
          {text.title}
        </Heading>
        <div className="flex items-center gap-3">
          <Label htmlFor={stepperId} className="text-muted-foreground">
            {text.servings}
          </Label>
          <NumberInput id={stepperId} value={servings} min={1} max={maxServings} step={1} locale={locale} onValueChange={setServings} className="w-32" />
        </div>
      </div>
      <p className="mt-2 flex min-h-7 flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted-foreground">
        <span className="tabular-nums">{scaled ? fill(text.scaled, { base: baseServings }) : fill(text.makes, { count: baseServings })}</span>
        {scaled ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setServings(baseServings)} className="h-7 px-2 text-[0.8125rem] text-foreground">
            <IconRotateCcw />
            {text.reset}
          </Button>
        ) : null}
      </p>

      {ingredients.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{text.empty}</p> : null}

      <div className={cn("mt-5 grid gap-x-3", columns, ingredients.length === 0 && "hidden")}>
        {groups.map((group, groupIndex) => (
          <div key={group.name ?? "ungrouped"} className="col-span-full grid grid-cols-subgrid">
            {group.name ? (
              <Group className={cn("col-span-full pb-1 text-[0.8125rem] font-semibold tracking-[-0.005em] text-muted-foreground", groupIndex > 0 && "mt-5")}>{group.name}</Group>
            ) : groupIndex > 0 ? (
              <div aria-hidden="true" className="col-span-full mt-5" />
            ) : null}
            <ul className="col-span-full grid grid-cols-subgrid">
              {group.items.map((item) => {
                const quantity = typeof item.quantity === "number" && item.scales !== false ? item.quantity * factor : item.quantity;
                const amount = quantity === undefined ? null : amountText(quantity, item.unit, locale, units);
                // The name follows the number as it is written: 1.1 eggs is written "1", so it is "1 egg".
                const name = nameText(item.name, item.plural, amount?.value ?? quantity, Boolean(item.unit));
                const on = ticked.has(item.id);
                const row = (
                  <>
                    {checkable ? (
                      <Checkbox checked={on} onCheckedChange={(value) => toggle(item.id, value === true)} className="mt-px" />
                    ) : null}
                    <span className={cn("text-sm leading-5 font-medium whitespace-nowrap tabular-nums transition-colors duration-150 motion-reduce:transition-none", on && "text-muted-foreground line-through decoration-muted-foreground/60")}>
                      {amount ? [amount.amount, amount.unit].filter(Boolean).join(" ") : null}
                    </span>
                    <span className={cn("min-w-0 text-sm leading-5 [overflow-wrap:anywhere] transition-colors duration-150 motion-reduce:transition-none", on && "text-muted-foreground line-through decoration-muted-foreground/60")}>
                      {name}
                      {item.note ? <span className="text-muted-foreground">, {item.note}</span> : null}
                    </span>
                  </>
                );
                return (
                  <li key={item.id} className="col-span-full grid grid-cols-subgrid border-border/70 not-last:border-b">
                    {checkable ? (
                      <label className="col-span-full grid cursor-pointer grid-cols-subgrid items-start py-2.5">{row}</label>
                    ) : (
                      <div className="col-span-full grid grid-cols-subgrid items-start py-2.5">{row}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {checkable && ingredients.length > 0 ? (
        <div className="mt-4 flex min-h-8 items-center justify-between gap-3 border-t border-border pt-4">
          <p role="status" className="text-[0.8125rem] text-muted-foreground tabular-nums">
            {fill(text.ticked, { done, total: ingredients.length })}
          </p>
          {done > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setTicked([])}>
              {text.clear}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
