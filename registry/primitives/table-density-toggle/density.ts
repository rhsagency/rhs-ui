/** How tall the rows of a table are: 32, 44 or 56 pixels, with text to match. */
export type TableDensity = "compact" | "comfortable" | "spacious";

/** The densities from the tightest to the loosest, which is the order of the control. */
export const DENSITIES: readonly TableDensity[] = ["compact", "comfortable", "spacious"];

/** What a table is when nobody has chosen. */
export const DEFAULT_DENSITY: TableDensity = "comfortable";

/** Whether a value read from storage or from a form is one of the three. Anything else is ignored. */
export function isDensity(value: unknown): value is TableDensity {
  return value === "compact" || value === "comfortable" || value === "spacious";
}
