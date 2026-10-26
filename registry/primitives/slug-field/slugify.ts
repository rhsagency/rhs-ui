/** Letters that do not come apart into a plain letter and an accent, with what they become. Capitals are lowered first. */
const SPECIAL: Readonly<Record<string, string>> = {
  ß: "ss",
  ẞ: "ss",
  æ: "ae",
  œ: "oe",
  ø: "o",
  đ: "d",
  ð: "d",
  þ: "th",
  ł: "l",
  ħ: "h",
  ŧ: "t",
  ı: "i",
  ĳ: "ij",
  "&": " and ",
};

const SPECIAL_LETTERS = new RegExp(`[${Object.keys(SPECIAL).join("")}]`, "g");

/** Lower case, special letters folded, and every accent taken off its letter. */
function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(SPECIAL_LETTERS, (char) => SPECIAL[char] ?? char)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

/** Apostrophes leave a word whole ("don't" is "dont"), they do not cut it in two. */
const APOSTROPHES = /['‘’`]/g;

/**
 * A title as a URL slug: lower case, accents removed (é is e), the German
 * sharp s and other special letters folded into plain ones (ß is ss, ø is o),
 * every run of anything else turned into one hyphen, no hyphen at either end,
 * and cut at `maxLength`. Letters of other scripts have no plain form and are
 * dropped: transliterate those first if you need them.
 */
export function slugify(text: string, maxLength = 60): string {
  const slug = fold(text.replace(APOSTROPHES, ""))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, Math.max(0, maxLength)).replace(/-+$/g, "");
}

/**
 * The same rules for text that is being typed straight into the slug field.
 * A hyphen at the end stays (the next word is on its way), a second hyphen
 * in a row and one at the start do not. Also says where the caret belongs
 * afterwards, so a dropped key does not throw it to the end of the field.
 */
export function cleanSlugInput(raw: string, caret: number, maxLength: number): { value: string; caret: number } {
  let value = "";
  let next = -1;
  for (let index = 0; index < raw.length; index += 1) {
    if (index === caret) next = value.length;
    for (const char of fold(raw.charAt(index).replace(APOSTROPHES, ""))) {
      if (/[a-z0-9]/.test(char)) {
        if (value.length < maxLength) value += char;
      } else if (value !== "" && !value.endsWith("-") && value.length < maxLength) {
        value += "-";
      }
    }
  }
  return { value, caret: next === -1 ? value.length : next };
}

/** The first of slug-2, slug-3 and so on that is not in `taken`, or null when the first ninety-eight are all used. */
export function nextFreeSlug(slug: string, taken: readonly string[], maxLength = 60): string | null {
  const used = new Set(taken.map((entry) => entry.toLowerCase()));
  for (let count = 2; count < 100; count += 1) {
    const suffix = `-${count}`;
    const candidate = `${slug.slice(0, Math.max(1, maxLength - suffix.length)).replace(/-+$/g, "")}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return null;
}
