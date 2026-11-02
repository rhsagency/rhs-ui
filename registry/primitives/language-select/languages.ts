/**
 * The languages a product is most often offered in, as BCP 47 codes. Only the codes are here: the names come
 * from the browser (Intl.DisplayNames), in the reader's language and in each language's own.
 */
export const DEFAULT_LANGUAGES: readonly string[] = [
  "ar",
  "bg",
  "bn",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "en-GB",
  "es",
  "es-MX",
  "fa",
  "fi",
  "fr",
  "fr-CA",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "ms",
  "nb",
  "nl",
  "pl",
  "pt",
  "pt-BR",
  "ro",
  "ru",
  "sk",
  "sr",
  "sv",
  "th",
  "tr",
  "uk",
  "ur",
  "vi",
  "zh-Hans",
  "zh-Hant",
];

export interface LanguageEntry {
  /** The BCP 47 code, as given. */
  code: string;
  /** The language's name in itself, with a capital: "Deutsch". */
  native: string;
  /** The language's name in the reader's language, with a capital: "German". */
  translated: string;
  /** The name of the language without its region or script, in the reader's language: "Portuguese" for pt-BR. Variants sort next to their language. */
  family: string;
  /** The code names a region or a script (pt-BR, zh-Hans) and not just a language. */
  variant: boolean;
  /** Every name the search matches, folded: no capitals, no accents. */
  haystack: readonly string[];
}

/** Lower case with the accents taken off, so "espanol" finds "Español" and "ECOLE" finds "école". */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

const cache = new Map<string, Intl.DisplayNames | null>();

function namesIn(locale: string): Intl.DisplayNames | null {
  if (cache.has(locale)) return cache.get(locale) ?? null;
  let made: Intl.DisplayNames | null = null;
  try {
    made = new Intl.DisplayNames([locale], { type: "language", languageDisplay: "dialect", fallback: "none" });
  } catch {
    made = null;
  }
  cache.set(locale, made);
  return made;
}

/** The name of a language in a locale, or nothing when the browser does not know it. */
function nameOf(code: string, locale: string): string | undefined {
  try {
    return namesIn(locale)?.of(code) ?? undefined;
  } catch {
    return undefined;
  }
}

/** A name begins with a capital in a list, in the rules of its own language ("deutsch" to "Deutsch", "i" in Turkish to "I with a dot"). */
function capital(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * What the list needs to know about a language: its name in itself, its name in `locale`, and the folded
 * names the search matches (those two, the code, and the name in each of `alsoSearch`). A code the browser
 * cannot name is listed under the code itself, so a typo is visible and never crashes.
 */
export function describeLanguage(code: string, locale: string, alsoSearch: readonly string[]): LanguageEntry {
  const native = capital(nameOf(code, code) ?? code, code);
  const translated = capital(nameOf(code, locale) ?? native, locale);
  const base = code.split("-")[0] ?? code;
  const family = capital(nameOf(base, locale) ?? translated, locale);
  const others = alsoSearch.map((other) => nameOf(code, other)).filter((name): name is string => Boolean(name));
  return { code, native, translated, family, variant: code !== base, haystack: [...new Set([native, translated, code, ...others].map(fold))] };
}

/**
 * How well a language matches what was typed: 0 for a name or a code that begins with it, 1 for a name that has
 * a word beginning with it, 2 for a name that only contains it, and nothing when it does not match. The
 * languages are then in the order of their rank and, within a rank, in the order they were given.
 */
export function rankLanguage(entry: LanguageEntry, query: string): number | null {
  const wanted = fold(query.trim());
  if (!wanted) return 0;
  let best: number | null = null;
  for (const name of entry.haystack) {
    const at = name.indexOf(wanted);
    if (at < 0) continue;
    const rank = at === 0 ? 0 : /[\s\-(]/.test(name.charAt(at - 1)) ? 1 : 2;
    if (best === null || rank < best) best = rank;
  }
  return best;
}
