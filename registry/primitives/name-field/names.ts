/**
 * Words that sit between a given name and a family name and are written in
 * lower case: "van der Berg", "de la Cruz", "von Trapp". Lower case, one word
 * each. A prop of NameField, so a product can add the ones its customers have.
 */
export const DEFAULT_PARTICLES: readonly string[] = ["van", "von", "der", "den", "de", "het", "'t", "ter", "ten", "te", "la", "le", "du", "des", "di", "da", "del", "della", "dos", "das", "do", "zu", "af", "bin", "ibn", "al", "el"];

export interface NameParts {
  /** The whole name in one string, the way it is shown. */
  full: string;
  /** Everything before the particle and the family name: "Anna Maria". */
  given: string;
  /** The words between them that stay lower case: "van der". Empty when there are none. */
  particle: string;
  /** The last word: "Berg". Empty for a single name. */
  family: string;
}

const same = (word: string) => word.toLowerCase().replace(/’/g, "'");

/** Spaces collapsed and trimmed, nothing else touched. */
export function tidyName(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * A name in parts. The last word is the family name and the particles right
 * before it (van, der, de, la) go in `particle`; the first word is always a
 * given name, so "Van Gogh" typed alone stays whole. One word is a given
 * name only. It is a convention, not a rule: a person with two family names
 * will want to correct it, which is what the part fields are for.
 */
export function splitName(text: string, particles: readonly string[] = DEFAULT_PARTICLES): NameParts {
  const words = tidyName(text).split(" ").filter(Boolean);
  const full = words.join(" ");
  if (words.length < 2) return { full, given: full, particle: "", family: "" };
  const known = new Set(particles.map(same));
  let cut = words.length - 1;
  while (cut > 1 && known.has(same(words[cut - 1] ?? ""))) cut -= 1;
  return { full, given: words.slice(0, cut).join(" "), particle: words.slice(cut, words.length - 1).join(" "), family: words[words.length - 1] ?? "" };
}

/** The parts back into one string, skipping the empty ones. */
export function joinName(parts: Pick<NameParts, "given" | "particle" | "family">): string {
  return tidyName([parts.given, parts.particle, parts.family].join(" "));
}

/** A word with a capital at its start and after a hyphen, an apostrophe or a dot: jean-luc is Jean-Luc, o'brien is O'Brien, j.r.r. is J.R.R. */
function capitalise(word: string): string {
  return word.toLowerCase().replace(/(^|[-'’.])(\p{L})/gu, (_, lead: string, letter: string) => lead + letter.toUpperCase());
}

/**
 * Puts right only what is obviously wrong: a name typed all in lower case or
 * all in capitals. Every word gets its capital, except the particles after the
 * first word, which stay lower case. Anything with a mix of cases (McDonald,
 * Marit de Vries, DeShawn) is the person's own writing and is left alone. Extra
 * spaces are removed either way.
 */
export function fixNameCase(text: string, particles: readonly string[] = DEFAULT_PARTICLES): string {
  const name = tidyName(text);
  if (!/\p{L}/u.test(name)) return name;
  if (name !== name.toLowerCase() && name !== name.toUpperCase()) return name;
  const known = new Set(particles.map(same));
  return name
    .split(" ")
    .map((word, index) => (index > 0 && known.has(same(word)) ? word.toLowerCase() : capitalise(word)))
    .join(" ");
}
