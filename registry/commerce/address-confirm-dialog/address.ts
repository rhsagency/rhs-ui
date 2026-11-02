/** One line of an address, tied to the form field it came from. */
export interface AddressLine {
  /** The id of the form field this line comes from, such as "street" or "postalCode". Lines are matched across the two addresses by id, and `onEdit` names the first line that differs. */
  id: string;
  /** What the line holds: "Keizersgracht 12-B". */
  value: string;
}

/** Which of the two addresses is chosen. */
export type AddressChoice = "suggested" | "entered";

/** A run of words from one line of an address. */
export interface AddressSegment {
  text: string;
  /** True for words the other address does not have. They are set in bold, and a screen reader hears "Changed" before them. */
  changed: boolean;
}

/** One line of an address, cut into the parts that match the other address and the parts that do not. */
export interface AddressLineView {
  id: string;
  segments: readonly AddressSegment[];
  /** True when any part of the line differs, or the other address has no such line. */
  changed: boolean;
}

export interface AddressComparison {
  entered: readonly AddressLineView[];
  suggested: readonly AddressLineView[];
  /** The id of the first line that differs, in the order of the form. Undefined when the two addresses are the same. */
  first: string | undefined;
  /** How many lines differ. */
  count: number;
}

export interface AddressConfirmLabels {
  /** The heading. */
  title?: string;
  /** Names the pair of choices for a screen reader. */
  group?: string;
  /** The heading of the card with the suggestion. */
  suggested?: string;
  /** The heading of the card with what was typed, when it cannot be chosen. */
  entered?: string;
  /** The heading of the card with what was typed, when `allowKeep` lets it be chosen. */
  keep?: string;
  /** Under the typed address when it cannot be chosen. */
  locked?: string;
  /** Said before every changed part, to a screen reader only. */
  changed?: string;
  /** Under the reason, when one line differs. `{count}`. */
  differOne?: string;
  /** Under the reason, when several lines differ. `{count}`. */
  differOther?: string;
  /** Under the reason, when nothing differs. */
  differNone?: string;
  /** The heading of the warning that appears when the typed address is chosen. */
  warningTitle?: string;
  /** The warning itself. */
  warning?: string;
  /** The button that confirms the chosen address. */
  use?: string;
  /** The button that goes back to the form. */
  edit?: string;
}

export const WORDS = {
  title: "Confirm your delivery address",
  group: "Address to use",
  suggested: "Suggested address",
  entered: "What you typed",
  keep: "Keep what I typed",
  locked: "We can only deliver to an address we can verify.",
  changed: "Changed",
  differOne: "{count} line differs. The parts that differ are in bold.",
  differOther: "{count} lines differ. The parts that differ are in bold.",
  differNone: "The two addresses are the same.",
  warningTitle: "Delivery may fail",
  warning: "We could not verify this address, so the courier may not find it. A parcel that comes back may have to be sent again.",
  use: "Use this address",
  edit: "Edit address",
} satisfies Required<AddressConfirmLabels>;

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const wordsOf = (text: string): string[] => text.trim().split(/\s+/).filter(Boolean);

/**
 * Which words of each list are part of the longest run of words the two lists share, in order. The words that are
 * not are the ones that differ.
 */
function sharedWords(a: readonly string[], b: readonly string[]): { a: boolean[]; b: boolean[] } {
  // reach[i][j] is how many words the tails a[i..] and b[j..] share.
  const reach = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  const at = (i: number, j: number): number => reach[i]?.[j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = reach[i];
      if (row) row[j] = a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const sharedA = a.map(() => false);
  const sharedB = b.map(() => false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      sharedA[i] = true;
      sharedB[j] = true;
      i++;
      j++;
    } else if (at(i + 1, j) >= at(i, j + 1)) i++;
    else j++;
  }
  return { a: sharedA, b: sharedB };
}

/** Joins neighbouring words that agree on "changed" into one run, so a changed house number is one bold stretch and not three. */
function segmentsOf(words: readonly string[], shared: readonly boolean[]): AddressSegment[] {
  const segments: AddressSegment[] = [];
  words.forEach((word, index) => {
    const changed = !shared[index];
    const last = segments[segments.length - 1];
    if (last && last.changed === changed) segments[segments.length - 1] = { text: `${last.text} ${word}`, changed };
    else segments.push({ text: word, changed });
  });
  return segments;
}

/** Lines with nothing in them are not part of an address. */
const filled = (lines: readonly AddressLine[]): AddressLine[] => lines.filter((line) => line.value.trim() !== "");

/**
 * Sets the typed address beside the suggestion. Lines are matched by id; within a line the words are compared, so
 * "Keizersgrcht 12" against "Keizersgracht 12" marks the street and leaves the number alone. A line only one of the two
 * has is changed as a whole. The first line that differs, in the order of the form, is the field to send people back to.
 */
export function compareAddresses(entered: readonly AddressLine[], suggested: readonly AddressLine[]): AddressComparison {
  const typed = filled(entered);
  const proposed = filled(suggested);
  const typedById = new Map(typed.map((line) => [line.id, line] as const));
  const proposedById = new Map(proposed.map((line) => [line.id, line] as const));

  const view = (line: AddressLine, other: AddressLine | undefined, side: "a" | "b"): AddressLineView => {
    const words = wordsOf(line.value);
    if (!other) return { id: line.id, segments: words.length ? [{ text: words.join(" "), changed: true }] : [], changed: words.length > 0 };
    const otherWords = wordsOf(other.value);
    const shared = side === "a" ? sharedWords(words, otherWords).a : sharedWords(otherWords, words).b;
    const segments = segmentsOf(words, shared);
    return { id: line.id, segments, changed: segments.some((segment) => segment.changed) || words.length !== otherWords.length };
  };

  const enteredViews = typed.map((line) => view(line, proposedById.get(line.id), "a"));
  const suggestedViews = proposed.map((line) => view(line, typedById.get(line.id), "b"));
  const differing = new Set([...enteredViews, ...suggestedViews].filter((line) => line.changed).map((line) => line.id));
  const first = enteredViews.find((line) => line.changed)?.id ?? suggestedViews.find((line) => line.changed)?.id;
  return { entered: enteredViews, suggested: suggestedViews, first, count: differing.size };
}
