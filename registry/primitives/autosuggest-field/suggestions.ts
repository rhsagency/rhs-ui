/** A suggestion: the text it fills in, or the text with a quiet word beside it ("Berlin", "Germany"). */
export type Suggestion = string | { value: string; hint?: string };

export interface RankedSuggestion {
  /** The text a click on the suggestion puts in the field. */
  value: string;
  /** The quiet word beside it. */
  hint?: string;
  /** The characters of `value` that match what was typed, as [from, to) in its own characters, or null when nothing was typed. */
  match: [number, number] | null;
  /** How it matched: 0 begins with the text, 1 a word in it begins with the text, 2 it contains the text. */
  tier: 0 | 1 | 2;
}

/** What a character counts as when text is compared: without its accents and capitals. */
const foldChar = (char: string) => char.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

/** The same comparison for a whole text. */
export const foldText = (text: string) => [...text].map(foldChar).join("");

/** `text` folded, and for every folded character where its original starts and ends, so a match found in the folded text can be marked in the original. */
function foldWithMap(text: string): { folded: string; starts: number[]; ends: number[] } {
  let folded = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const char of text) {
    const f = foldChar(char);
    for (let unit = 0; unit < f.length; unit += 1) {
      starts.push(offset);
      ends.push(offset + char.length);
    }
    folded += f;
    offset += char.length;
  }
  return { folded, starts, ends };
}

/** A suggestion as an object. */
export const toSuggestion = (option: Suggestion): { value: string; hint?: string } => (typeof option === "string" ? { value: option } : option);

const WORD_EDGE = /[\s\-_/.,()&:]/;

/**
 * The options that fit what was typed, best first: the ones that begin with it,
 * then the ones with a word that begins with it ("designer" finds "Product
 * Designer"), then the ones that only contain it. Capitals and accents are
 * ignored ("zurich" finds "Zürich"), and options of the same rank keep the order
 * you gave them. Each comes with the part to set in bold. With nothing typed,
 * the first `limit` options come back as they are.
 */
export function rankSuggestions(options: readonly Suggestion[], query: string, limit: number): RankedSuggestion[] {
  const wanted = foldText(query.trim()).replace(/\s+/g, " ");
  if (!wanted) return options.slice(0, limit).map((option) => ({ ...toSuggestion(option), match: null, tier: 0 }));
  const ranked: (RankedSuggestion & { index: number })[] = [];
  options.forEach((option, index) => {
    const { value, hint } = toSuggestion(option);
    const { folded, starts, ends } = foldWithMap(value);
    let at = folded.indexOf(wanted);
    if (at === -1) return;
    let tier: 0 | 1 | 2 = at === 0 ? 0 : 2;
    // A later place where a word begins is better than an earlier one in the middle of a word.
    for (let next = at; tier === 2 && next !== -1; next = folded.indexOf(wanted, next + 1)) {
      if (WORD_EDGE.test(folded.charAt(next - 1))) {
        at = next;
        tier = 1;
      }
    }
    const from = starts[at] ?? 0;
    let to = ends[at + wanted.length - 1] ?? value.length;
    // A mark that follows the last matched letter stays inside the bold part.
    to += /^\p{M}*/u.exec(value.slice(to))?.[0].length ?? 0;
    ranked.push({ value, hint, match: [from, to], tier, index });
  });
  ranked.sort((a, b) => a.tier - b.tier || a.index - b.index);
  return ranked.slice(0, limit).map(({ index: _index, ...rest }) => rest);
}
