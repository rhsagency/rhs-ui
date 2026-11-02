"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconStar } from "@rhs-ui/icons";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { Rating } from "@rhs-ui/primitives/rating";
import { isRating, safeLocale, summarizeRatings, type RatingAspect, type RatingBreakdownValue } from "@rhs-ui/primitives/rating-breakdown-field/ratings";
import { cn } from "@/lib/utils";

export type { RatingAspect, RatingBreakdownValue } from "@rhs-ui/primitives/rating-breakdown-field/ratings";

export interface RatingBreakdownFieldProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children" | "name"> {
  /** The things to rate, in order: `{ id, label, description, required }`. The `id` is the key in the value and in the form data. */
  aspects: readonly RatingAspect[];
  /** Every answer by the id of its row, when you control it: a number from 1 to `max` is a rating, `null` is Not applicable, and a row that is missing has not been answered. */
  value?: RatingBreakdownValue;
  /** The answers to start with, when you do not control the field. */
  defaultValue?: RatingBreakdownValue;
  /** Called with all the answers whenever one changes. A row that was answered and then un-answered is dropped. */
  onValueChange?: (value: Record<string, number | null>) => void;
  /** How many stars a row has. Default 5. */
  max?: number;
  /** The name of the group, shown above the rows and read out with each of them. Default "Rate your experience". */
  label?: string;
  /** A line under the label that says what to do, read out with the group. */
  description?: string;
  /** Show the overall score under the rows. Default true. */
  showOverall?: boolean;
  /** The field's name for a plain form submit: each row posts `<name>-<id>` as its rating (1 to `max`), or "na" for Not applicable. */
  name?: string;
  /** Writes the average. Default "en-US". */
  locale?: string;
}

/** Stars filled to the exact fraction of a score: 4.3 is four full stars and a third of the fifth. */
function PartialStars({ value, max, size }: { value: number; max: number; size: number }): React.JSX.Element {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, index) => {
        const fill = Math.max(0, Math.min(1, value - index));
        return (
          <span key={index} className="relative inline-flex" style={{ width: size, height: size }}>
            <IconStar size={size} className="text-muted-foreground/40" />
            {fill > 0 ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <IconStar size={size} fill="currentColor" className="text-foreground" />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

/** The text, once it has stopped changing for `delay` ms. Starting text is never said, and an emptied one is cleared at once. */
function useSettled(text: string, delay: number): string {
  const [said, setSaid] = useState("");
  const last = useRef(text);
  useEffect(() => {
    if (text === last.current) return;
    last.current = text;
    if (!text) {
      setSaid("");
      return;
    }
    const timer = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timer);
  }, [text, delay]);
  return said;
}

/**
 * Rates several things at once: Cleanliness, Location and Value, with a row of
 * stars for each, a Not applicable box for the one that does not fit, and the
 * overall score underneath. One star rating hides what went right and what went
 * wrong; this keeps both, for hotel, marketplace and service reviews. Each row
 * is a group a screen reader announces by name ("Cleanliness, 4 stars"), keeps
 * one tab stop, and changes with the arrow keys. The overall score is the mean
 * of the rows that have a rating, with one decimal and partial stars, and until
 * every required row has an answer it says how many are rated ("3 of 5 rated")
 * and which are still needed instead of showing a number. A required row can be
 * answered with a rating or with Not applicable. The average and the counts are
 * plain functions in `rating-breakdown-field/ratings`, for the server.
 */
export function RatingBreakdownField({
  aspects,
  value,
  defaultValue,
  onValueChange,
  max = 5,
  label = "Rate your experience",
  description,
  showOverall = true,
  name,
  locale = "en-US",
  disabled,
  className,
  "aria-describedby": describedBy,
  ...props
}: RatingBreakdownFieldProps) {
  const base = useId();
  const [own, setOwn] = useState<RatingBreakdownValue>(defaultValue ?? {});
  const answers = value ?? own;
  const summary = summarizeRatings(aspects, answers, max);
  const anyRequired = aspects.some((aspect) => aspect.required);
  const digits = new Intl.NumberFormat(safeLocale(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function answer(id: string, next: number | null | undefined) {
    const record: Record<string, number | null> = {};
    for (const [key, entry] of Object.entries(answers)) if (key !== id && entry !== undefined) record[key] = entry;
    if (next !== undefined) record[id] = next;
    if (value === undefined) setOwn(record);
    onValueChange?.(record);
  }

  const average = summary.complete && summary.average !== null ? summary.average : null;
  const counts = `${summary.rated} of ${summary.total} rated`;
  const needed = summary.missing.map((aspect) => aspect.label);
  const spoken = average !== null ? `Overall ${digits.format(average)} out of ${max}, from ${counts}.` : `${counts}.${needed.length ? ` Still needed: ${needed.join(", ")}.` : ""}`;
  const said = useSettled(showOverall ? spoken : "", 900);

  return (
    <fieldset
      data-slot="rating-breakdown-field"
      disabled={disabled}
      aria-describedby={[describedBy, description ? `${base}-description` : undefined].filter(Boolean).join(" ") || undefined}
      className={cn("@container m-0 grid min-w-0 gap-0 border-0 p-0", className)}
      {...props}
    >
      <legend className={cn("p-0 text-sm font-medium tracking-[-0.01em]", description ? "mb-0.5" : "mb-1")}>{label}</legend>
      {description ? (
        <p id={`${base}-description`} className="mb-1 text-xs leading-snug text-muted-foreground">
          {description}
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {aspects.map((aspect) => {
          const current = answers[aspect.id];
          const rated = isRating(current, max) ? current : 0;
          const notApplicable = current === null;
          const naId = `${base}-${aspect.id}-na`;
          const field = name ? `${name}-${aspect.id}` : undefined;
          // With some rows required, the others say so: in the words on the page, and in the name a screen reader reads.
          const optional = anyRequired && !aspect.required;
          return (
            <li key={aspect.id} className="grid gap-x-6 gap-y-2.5 py-3.5 @lg:grid-cols-[minmax(0,1fr)_auto] @lg:items-center">
              <div className="min-w-0">
                {/* The group below is named with the same words, so the page is not read twice. */}
                <p aria-hidden="true" className="text-sm leading-snug font-medium">
                  {aspect.label}
                  {optional ? <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span> : null}
                </p>
                {aspect.description ? <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{aspect.description}</p> : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 @lg:justify-end">
                {/* Not applicable switches the stars off: they cannot be focused or pressed, and are left out of the page for a screen reader, since the box says why. */}
                <div inert={notApplicable} className={cn("transition-opacity duration-150 motion-reduce:transition-none", notApplicable && "opacity-35")}>
                  <Rating
                    value={rated}
                    max={max}
                    size={22}
                    label={optional ? `${aspect.label}, optional` : aspect.label}
                    name={field}
                    onValueChange={(next) => answer(aspect.id, next)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={naId}
                    checked={notApplicable}
                    aria-label={`Not applicable: ${aspect.label}`}
                    onCheckedChange={(checked) => answer(aspect.id, checked === true ? null : undefined)}
                  />
                  <Label htmlFor={naId} className="text-xs font-normal text-muted-foreground">
                    Not applicable
                  </Label>
                </div>
                {field && notApplicable ? <input type="hidden" name={field} value="na" /> : null}
              </div>
            </li>
          );
        })}
      </ul>

      {showOverall ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-border bg-muted/40 px-4 py-4">
          <div className="grid gap-1">
            <span className="text-xs text-muted-foreground">Overall</span>
            <span className="flex items-baseline gap-1.5 tabular-nums">
              <span className={cn("text-3xl leading-none font-semibold tracking-[-0.04em]", average === null && "text-muted-foreground")}>{average !== null ? digits.format(average) : "–"}</span>
              <span className="text-sm text-muted-foreground">/ {max}</span>
            </span>
          </div>
          <div className="grid justify-items-start gap-1.5 @lg:justify-items-end">
            <PartialStars value={average ?? 0} max={max} size={18} />
            <p className="text-xs text-muted-foreground tabular-nums">
              {counts}
              {average === null && needed.length ? <span className="text-foreground"> · Still needed: {needed.join(", ")}</span> : null}
            </p>
          </div>
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </fieldset>
  );
}
