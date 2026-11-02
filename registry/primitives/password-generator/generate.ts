/**
 * How the Password generator makes and rates a password, as plain functions
 * with no React. Randomness comes from `crypto.getRandomValues` and nothing
 * else; a number is drawn by rejection sampling, so no value is likelier than
 * another. Nothing here sends or stores anything.
 */

/** Draws a whole number from 0 up to, not including, `max`, every one equally likely. */
export type RandomSource = (max: number) => number;

const RANGE = 2 ** 32;

/**
 * A uniform random whole number below `max`, from the browser's secure random
 * source. A plain `value % max` would favour the small numbers whenever `max`
 * does not divide 2^32 evenly, so the draws that fall in the uneven tail at the
 * top are thrown away and drawn again.
 */
export const secureRandom: RandomSource = (max) => {
  if (!Number.isInteger(max) || max < 1 || max > RANGE) throw new RangeError("max must be a whole number from 1 to 2^32");
  if (max === 1) return 0;
  const limit = RANGE - (RANGE % max);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);
  return value % max;
};

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}:;,.?";
/** The characters that are easy to mistake for one another in many typefaces: I, l, 1, |, O, 0 and o. */
export const LOOKALIKES = "Il1|O0o";

export interface PasswordOptions {
  /** How many characters. */
  length: number;
  /** Include the digits 0 to 9. */
  numbers: boolean;
  /** Include punctuation and symbols. */
  symbols: boolean;
  /** Leave out the characters that look like one another (`I l 1 | O 0 o`). */
  avoidLookalikes: boolean;
}

/** The sets of characters a password may use, each of which it will use at least once. */
function setsFor({ numbers, symbols, avoidLookalikes }: Omit<PasswordOptions, "length">): string[] {
  const keep = (set: string) => (avoidLookalikes ? [...set].filter((char) => !LOOKALIKES.includes(char)).join("") : set);
  return [LOWERCASE, UPPERCASE, ...(numbers ? [NUMBERS] : []), ...(symbols ? [SYMBOLS] : [])].map(keep);
}

/** How many different characters a password with these options can draw from. */
export function passwordPoolSize(options: Omit<PasswordOptions, "length">): number {
  return setsFor(options).reduce((total, set) => total + set.length, 0);
}

/**
 * A random password. Each set that is switched on is used at least once, so a
 * password with numbers always has a number in it, and the characters are
 * shuffled so the guaranteed ones do not sit at the front.
 */
export function generatePassword(options: PasswordOptions, random: RandomSource = secureRandom): string {
  const sets = setsFor(options);
  const pool = sets.join("");
  const chars = sets.map((set) => set[random(set.length)] ?? "");
  while (chars.length < options.length) chars.push(pool[random(pool.length)] ?? "");
  // Fisher-Yates, drawing with the same unbiased source.
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const other = random(index + 1);
    [chars[index], chars[other]] = [chars[other] ?? "", chars[index] ?? ""];
  }
  return chars.join("");
}

export interface PassphraseOptions {
  /** How many words. */
  words: number;
  /** The words to draw from. */
  wordlist: readonly string[];
  /** Start every word with a capital. */
  capitalize: boolean;
  /** Add one digit to the end of one of the words. */
  number: boolean;
  /** What goes between the words. Default "-". */
  separator?: string;
}

/** A random passphrase: words chosen independently from the list, so a word can come twice. */
export function generatePassphrase(options: PassphraseOptions, random: RandomSource = secureRandom): string {
  const { words, wordlist, capitalize, number, separator = "-" } = options;
  if (wordlist.length === 0) return "";
  const picked = Array.from({ length: words }, () => wordlist[random(wordlist.length)] ?? "");
  const parts = capitalize ? picked.map((word) => word.charAt(0).toUpperCase() + word.slice(1)) : picked;
  if (number && parts.length) {
    const at = random(parts.length);
    parts[at] = `${parts[at] ?? ""}${random(10)}`;
  }
  return parts.join(separator);
}

/** The bits of entropy of a password: its length times the bits of one character drawn from the pool. */
export function passwordEntropy(options: PasswordOptions): number {
  return options.length * Math.log2(Math.max(1, passwordPoolSize(options)));
}

/** The bits of entropy of a passphrase: the bits of a word times the number of words, plus where the digit went and which digit it was. Repeats in the list are not counted twice. */
export function passphraseEntropy(options: Pick<PassphraseOptions, "words" | "wordlist" | "number">): number {
  const size = new Set(options.wordlist).size;
  if (size === 0) return 0;
  return options.words * Math.log2(size) + (options.number && options.words > 0 ? Math.log2(options.words * 10) : 0);
}

/**
 * How long the words of a passphrase usually are: the mean length plus one
 * standard deviation, rounded up. A result is not drawn yet while it is being
 * laid out, so a field that keeps room for it can reserve it with this.
 */
export function typicalWordLength(wordlist: readonly string[]): number {
  if (wordlist.length === 0) return 0;
  const lengths = wordlist.map((word) => word.length);
  const mean = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const deviation = Math.sqrt(lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0) / lengths.length);
  return Math.ceil(mean + deviation);
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

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;
const YEAR = 31_557_600;
const UNIVERSE = 1.38e10 * YEAR;

/** "a billion", "a million", or the number itself. */
function rateWords(guessesPerSecond: number, locale: string): string {
  const named: [number, string][] = [
    [1e3, "a thousand"],
    [1e6, "a million"],
    [1e9, "a billion"],
    [1e12, "a trillion"],
  ];
  return named.find(([rate]) => rate === guessesPerSecond)?.[1] ?? new Intl.NumberFormat(locale).format(guessesPerSecond);
}

export interface GuessTimeOptions {
  /** How fast the attacker guesses. Default a billion a second, what a determined attacker with fast hardware can do against a leaked, quickly hashed password. */
  guessesPerSecond?: number;
  /** Writes the numbers in the sentence. Default "en-US". */
  locale?: string;
}

/**
 * How long it takes, in a sentence: "Would take centuries at a billion guesses
 * a second". An attacker finds a password on average after trying half of all
 * the possibilities, and that is the time given. Anything beyond the age of the
 * universe says so rather than printing a number nobody can picture.
 */
export function guessTime(bits: number, options: GuessTimeOptions = {}): string {
  const { guessesPerSecond = 1e9 } = options;
  const locale = safeLocale(options.locale);
  const rate = rateWords(guessesPerSecond, locale);
  const seconds = 2 ** (bits - 1) / guessesPerSecond;
  const count = (value: number, unit: string) => {
    const rounded = Math.max(1, Math.round(value));
    return `about ${new Intl.NumberFormat(locale).format(rounded)} ${unit}${rounded === 1 ? "" : "s"}`;
  };
  let span: string;
  if (seconds < 1) return `Would be guessed in less than a second at ${rate} guesses a second`;
  if (seconds < MINUTE) span = count(seconds, "second");
  else if (seconds < HOUR) span = count(seconds / MINUTE, "minute");
  else if (seconds < DAY) span = count(seconds / HOUR, "hour");
  else if (seconds < 30 * DAY) span = count(seconds / DAY, "day");
  else if (seconds < YEAR) span = count(seconds / (30.44 * DAY), "month");
  else if (seconds < 100 * YEAR) span = count(seconds / YEAR, "year");
  else if (seconds < 1000 * YEAR) span = "centuries";
  else if (seconds < 1e6 * YEAR) span = "thousands of years";
  else if (seconds < 1e9 * YEAR) span = "millions of years";
  else if (seconds < UNIVERSE) span = "billions of years";
  else span = "longer than the universe has existed";
  return `Would take ${span} at ${rate} guesses a second`;
}

/** The rating of a number of bits, from 1 (weak) to 4 (very strong), with its word. */
export function strengthOf(bits: number): { level: 1 | 2 | 3 | 4; label: string } {
  if (bits < 40) return { level: 1, label: "Weak" };
  if (bits < 60) return { level: 2, label: "Fair" };
  if (bits < 80) return { level: 3, label: "Strong" };
  return { level: 4, label: "Very strong" };
}

export type CharacterKind = "letter" | "digit" | "symbol";

/** The text cut into runs of letters, digits and symbols, so each kind can be shown its own way. */
export function characterRuns(text: string): { kind: CharacterKind; text: string }[] {
  const runs: { kind: CharacterKind; text: string }[] = [];
  for (const char of text) {
    const kind: CharacterKind = /\d/.test(char) ? "digit" : /\p{L}/u.test(char) ? "letter" : "symbol";
    const last = runs[runs.length - 1];
    if (last && last.kind === kind) last.text += char;
    else runs.push({ kind, text: char });
  }
  return runs;
}
