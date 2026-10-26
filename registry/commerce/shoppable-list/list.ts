/** A product the list can send to the cart. */
export interface ShoppableProduct {
  /** Identity of the product in your shop: what goes into the cart. */
  id: string;
  /** What it is called: "Spaghetti". */
  name: string;
  /** Brand and pack, on a second line: "Kestrel Mill, 500 g". */
  detail?: string;
  /** A picture: a URL or a data URI. Without one the line has none. */
  image?: string;
  /** The price of one pack, in minor units: 210 is 2.10. */
  price: number;
  /** How much one pack holds, in the unit of the item: 500 for a 500 g pack. Without it, one pack covers any amount (a jar, a bunch). */
  packSize?: number;
}

/** One line of the list: what the recipe or the project needs, and the product that provides it. */
export interface ShoppableItem extends ShoppableProduct {
  /** How much is needed for the base number of servings, in `unit`: 400 for 400 g. Leave it out for something that is not measured ("to taste") and it is never scaled. */
  amount?: number;
  /** What `amount` counts: "g", "ml", "tbsp", "cloves". Leave it out to count pieces. */
  unit?: string;
  /** Said instead of the amount, for a line that is not measured: "to taste", "a handful". */
  note?: string;
  /** False when the product is sold out. The line is then unchecked and says so, and offers the substitute. Defaults to true. */
  inStock?: boolean;
  /** What to buy when the product is not available. */
  substitute?: ShoppableProduct;
  /** False when the reader is likely to have it already: the line starts unchecked. Defaults to true. */
  defaultChecked?: boolean;
}

/** What goes into the cart for one checked line. */
export interface ShoppableLine {
  /** The product to add: the substitute's id when the shopper swapped. */
  id: string;
  /** The id of the line it came from. */
  itemId: string;
  name: string;
  /** How many packs. */
  quantity: number;
  /** The price of one pack, in minor units. */
  price: number;
  /** quantity times price, in minor units. */
  total: number;
  /** True when the substitute was chosen. */
  substituted: boolean;
}

/** One line as it stands: with the servings applied, the product chosen, and whether it counts. */
export interface ShoppableRow {
  /** The line as it was given. */
  item: ShoppableItem;
  /** The product that will be bought: the item, or its substitute once swapped. */
  product: ShoppableProduct;
  /** How much is needed at the chosen number of servings; undefined for a line that is not measured. */
  needed: number | undefined;
  /** How many packs that takes. */
  packs: number;
  /** Whether anything can be bought: the product is in stock, or the substitute was chosen. */
  available: boolean;
  /** Whether the substitute was chosen. */
  swapped: boolean;
  /** Whether the line is checked and available, so it goes into the cart. */
  on: boolean;
  /** packs times the price of one pack, in minor units. */
  total: number;
}

export interface ShoppableState {
  /** The servings the reader asked for. */
  servings: number;
  /** The servings the amounts are written for. */
  base: number;
  /** The ids of the lines the reader unchecked. Everything else is checked. */
  unchecked: ReadonlySet<string>;
  /** The ids of the lines the reader swapped for their substitute. */
  swapped: ReadonlySet<string>;
}

/** An amount for another number of servings: 400 g for 4 is 600 g for 6. */
export const scaledAmount = (amount: number, servings: number, base: number): number => (amount * servings) / base;

/** How many packs cover an amount. A pack size of 500 and a need of 600 is 2; a line without a pack size is always 1. */
export function packsNeeded(needed: number | undefined, packSize: number | undefined): number {
  if (needed === undefined || !(packSize && packSize > 0)) return 1;
  // The small allowance stops 2 x 0.1 from asking for a second pack of 0.2.
  return Math.max(1, Math.ceil(needed / packSize - 1e-9));
}

const FRACTIONS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

/** Weights, volumes and lengths are written in decimals: 187.5 g. Everything else, such as cloves and tablespoons, reads better in fractions. */
const DECIMAL_UNITS = /^(mg|g|kg|ml|cl|dl|l|mm|cm|m)$/i;

/** 2.25 as "2¼", for the amounts a cook reads that way. Null when it is not a plain fraction, or not that kind of amount. */
function fractionOf(value: number, unit: string | undefined, locale: string): string | null {
  if (value >= 10 || (unit !== undefined && DECIMAL_UNITS.test(unit.trim()))) return null;
  const whole = Math.floor(value + 1e-9);
  const rest = value - whole;
  const match = FRACTIONS.find(([fraction]) => Math.abs(rest - fraction) < 0.01);
  if (!match) return null;
  return `${whole > 0 ? new Intl.NumberFormat(locale).format(whole) : ""}${match[1]}`;
}

/** An amount in words: 600 g, 1.5 tbsp, 2¼ cloves. Fractions for what is counted or spooned, at most two decimals for the rest. */
export function formatAmount(value: number, unit: string | undefined, locale: string): string {
  const text = fractionOf(value, unit, locale) ?? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  return unit ? `${text}\u00a0${unit}` : text;
}

/** Works out every line, the lines for the cart and the total. */
export function buildList(items: readonly ShoppableItem[], state: ShoppableState): { rows: ShoppableRow[]; lines: ShoppableLine[]; total: number } {
  const rows = items.map((item): ShoppableRow => {
    const swapped = state.swapped.has(item.id) && item.substitute !== undefined;
    const product = swapped && item.substitute ? item.substitute : item;
    const available = swapped || item.inStock !== false;
    const needed = item.amount === undefined ? undefined : scaledAmount(item.amount, state.servings, state.base);
    const packs = packsNeeded(needed, product.packSize);
    const on = available && !state.unchecked.has(item.id);
    return { item, product, needed, packs, available, swapped, on, total: packs * product.price };
  });
  const lines = rows.filter((row) => row.on).map((row): ShoppableLine => ({ id: row.product.id, itemId: row.item.id, name: row.product.name, quantity: row.packs, price: row.product.price, total: row.total, substituted: row.swapped }));
  return { rows, lines, total: lines.reduce((sum, line) => sum + line.total, 0) };
}
