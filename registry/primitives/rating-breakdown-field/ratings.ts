/**
 * The arithmetic behind the Rating breakdown field, as plain functions with no
 * React: which rows are answered, which are still needed and what the average
 * of the rated ones is.
 */

/** One thing to rate. */
export interface RatingAspect {
  /** A stable key for the row; it is the key in the value and in the form data. */
  id: string;
  /** What is rated: "Cleanliness". */
  label: string;
  /** A line under the label that says what to think of. */
  description?: string;
  /** The review cannot be finished without an answer for this row (a rating, or Not applicable). */
  required?: boolean;
}

/**
 * Every answer by the id of its row: a number is a rating, `null` is "Not
 * applicable", and a row that is missing, or `undefined`, has not been answered.
 */
export type RatingBreakdownValue = Readonly<Record<string, number | null | undefined>>;

export interface RatingSummary {
  /** How many rows have a rating. */
  rated: number;
  /** How many rows there are. */
  total: number;
  /** The mean of the ratings, or null when there is none. Not applicable rows and rows without an answer are left out. */
  average: number | null;
  /** The required rows that have no answer yet. */
  missing: readonly RatingAspect[];
  /** Every required row has an answer, so the average can be given. */
  complete: boolean;
}

/**
 * A locale tag the runtime can use.
 * `en_US`, the usual typo, is read as `en-US`, and anything that is not a
 * language tag becomes `en-US`, so a wrong prop never stops a page from rendering.
 */
export function safeLocale(locale: string | undefined): string {
  try {
    return Intl.getCanonicalLocales((locale ?? "").replace(/_/g, "-"))[0] ?? "en-US";
  } catch {
    return "en-US";
  }
}

/** A rating that can be used: a whole number from 1 up to `max`. */
const isRating = (answer: number | null | undefined, max: number): answer is number => typeof answer === "number" && Number.isInteger(answer) && answer >= 1 && answer <= max;

export function summarizeRatings(aspects: readonly RatingAspect[], value: RatingBreakdownValue, max = 5): RatingSummary {
  const ratings: number[] = [];
  const missing: RatingAspect[] = [];
  for (const aspect of aspects) {
    const answer = value[aspect.id];
    if (isRating(answer, max)) ratings.push(answer);
    else if (aspect.required && answer !== null) missing.push(aspect);
  }
  return {
    rated: ratings.length,
    total: aspects.length,
    average: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
    missing,
    complete: missing.length === 0,
  };
}

/** The mean of the ratings in a value, or null when there are none. */
export function averageRating(value: RatingBreakdownValue, max = 5): number | null {
  const ratings = Object.values(value).filter((answer): answer is number => isRating(answer, max));
  return ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
}

export { isRating };
