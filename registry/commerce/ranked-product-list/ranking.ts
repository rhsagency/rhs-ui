/** A product's picture. */
export interface RankedProductImage {
  /** The picture: a URL or a data URI. */
  src: string;
  /** What the picture shows. Leave it empty when the name beside it says it all, which is usual in a list. */
  alt?: string;
  /** The picture's width in pixels, so the page does not jump while it loads. */
  width?: number;
  /** The picture's height in pixels. */
  height?: number;
}

/** How a product moved since the last period: it is new, it went up or down some places, or it stayed. */
export type RankedMovement = { kind: "new" } | { kind: "same" } | { kind: "up" | "down"; by: number };

/** One product in the list. Its rank is its place in the array. */
export interface RankedProduct {
  /** Identity of the product in your shop: it is what the row is keyed on. */
  id: string;
  /** What it is called. */
  name: string;
  /** The product page. The whole row is this link. */
  href: string;
  /** A line under the name: the material, the size, the colour. */
  subtitle?: string;
  /** The price, in minor units: 8900 is 89.00. */
  price: number;
  /** What it cost before, in minor units, for a product on sale. It is written struck through. */
  compareAtPrice?: number;
  /** The product's picture. Without one the row shows a plain placeholder. */
  image?: RankedProductImage;
  /** The line of proof, already written the way you want it: "1,240 sold this week". */
  proof?: string;
  /** The average rating, from 0 to 5. Shown with a star beside, or under, the proof. */
  rating?: number;
  /** How many ratings it rests on. */
  ratingCount?: number;
  /** How the product moved since the last period: new, up or down some places, or steady. It is written as a word and, for a direction, an arrow. */
  movement?: RankedMovement;
  /** False for a product that cannot be bought now: it keeps its place, its Add button says so and is off. */
  available?: boolean;
}

/** One period the list can show: a week, a month, all time. */
export interface RankedPeriod {
  /** What `period` and `onPeriodChange` carry: "week". */
  value: string;
  /** What the control says: "This week". */
  label: string;
}

export const DEFAULT_PERIODS: readonly RankedPeriod[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export interface RankedProductListLabels {
  /** The heading when you gave none. */
  title?: string;
  /** The line under it. */
  description?: string;
  /** What a screen reader hears for the period control. */
  period?: string;
  /** What a screen reader hears for the list. `{period}`. */
  list?: string;
  /** What a screen reader hears before a name. `{rank}`. */
  rank?: string;
  /** The movement words. `{count}` places. */
  movementNew?: string;
  movementUp?: string;
  movementDown?: string;
  movementSame?: string;
  /** Before a price that was lowered, for a screen reader. */
  was?: string;
  /** The button on a row. */
  add?: string;
  /** What a screen reader hears on it. `{name}`. */
  addName?: string;
  /** The button while it works, and once the product is in the bag. */
  adding?: string;
  added?: string;
  /** What a screen reader hears on it once the product is in the bag. `{name}`. */
  addedName?: string;
  /** The button of a product that cannot be bought. */
  soldOut?: string;
  /** What a screen reader hears on that button: it holds the visible words, so the name says the product is sold out. `{name}`. */
  soldOutName?: string;
  /** The button for a moment after an add that failed. */
  retry?: string;
  /** What a screen reader hears on it, and the polite message when the add fails. It holds the visible words. `{name}`. */
  failedName?: string;
  /** What a screen reader hears for a rating. `{rating}` out of five, `{count}` ratings. */
  ratingName?: string;
  /** The polite status when the period changes. `{period}` and `{count}` products. */
  status?: string;
  statusOne?: string;
  /** The list when there is nothing in it. */
  empty?: string;
}

export const WORDS = {
  title: "Best sellers",
  description: "What people buy most, from the first place down.",
  period: "Period",
  list: "Best sellers, {period}",
  rank: "Number {rank}",
  movementNew: "New",
  movementUp: "Up {count}",
  movementDown: "Down {count}",
  movementSame: "Steady",
  was: "was",
  add: "Add",
  addName: "Add {name} to your bag",
  adding: "Adding",
  added: "Added",
  addedName: "{name} is in your bag",
  soldOut: "Sold out",
  soldOutName: "{name} is sold out",
  retry: "Try again",
  failedName: "{name} could not be added. Try again.",
  ratingName: "Rated {rating} out of 5 from {count} ratings",
  status: "Showing the best sellers for {period}: {count} products.",
  statusOne: "Showing the best seller for {period}: 1 product.",
  empty: "Nothing has sold in this period yet.",
} satisfies Required<RankedProductListLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The words of a movement and whether it points up, down or nowhere. `by` is rounded to whole places and must be at least one, or the movement is a plain "steady". */
export function movementOf(movement: RankedMovement | undefined, numbers: Intl.NumberFormat, words: { movementNew: string; movementUp: string; movementDown: string; movementSame: string }): { text: string; kind: "new" | "up" | "down" | "same" } | null {
  if (!movement) return null;
  if (movement.kind === "new") return { text: words.movementNew, kind: "new" };
  if (movement.kind === "same") return { text: words.movementSame, kind: "same" };
  const places = Math.round(movement.by);
  if (!Number.isFinite(places) || places < 1) return { text: words.movementSame, kind: "same" };
  return { text: fill(movement.kind === "up" ? words.movementUp : words.movementDown, { count: numbers.format(places) }), kind: movement.kind };
}
