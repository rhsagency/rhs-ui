/**
 * The letters a device code is made of by default: twenty consonants. No
 * vowels, so a code never spells a word anyone would be embarrassed by, and
 * no digits, so the letter O and the digit 0 (or I, l and 1) can never be
 * confused. It is the alphabet RFC 8628 suggests for codes people type.
 */
export const DEFAULT_DEVICE_ALPHABET = "BCDFGHJKLMNPQRSTVWXZ";

/** The separators of a code: white space, the hyphen and the other dashes (U+2010 to U+2015) that a word processor or a chat app turns it into. */
const SEPARATOR = new RegExp(`[\\s\\-${String.fromCharCode(0x2010)}-${String.fromCharCode(0x2015)}]`);

/** What typing or pasting into the code field left: the characters that belong, and the ones that were turned away. */
export interface CleanedDeviceCode {
  /** The code so far, upper case, without separators, cut to the length. */
  code: string;
  /** The characters that are not in the alphabet, each once, in the order they came. Separators never count. */
  rejected: string[];
}

/**
 * A code as typed or pasted: upper-cased, with separators taken out (so
 * "wdjb-mjht", "WDJB MJHT" and "WDJBMJHT" are the same code), anything outside
 * the alphabet turned away and remembered, and cut to the length.
 */
export function cleanDeviceCode(raw: string, alphabet: string = DEFAULT_DEVICE_ALPHABET, length = 8): CleanedDeviceCode {
  const allowed = new Set(alphabet.toUpperCase());
  let code = "";
  const rejected: string[] = [];
  for (const character of raw.toUpperCase()) {
    if (SEPARATOR.test(character)) continue;
    if (allowed.has(character)) {
      if (code.length < length) code += character;
    } else if (!rejected.includes(character)) {
      rejected.push(character);
    }
  }
  return { code, rejected };
}

/** A code as the device shows it, in groups: "WDJBMJHT" is "WDJB-MJHT". A code that is not complete yet is grouped as far as it goes. */
export function formatDeviceCode(code: string, groupAfter = 4): string {
  if (groupAfter <= 0 || code.length <= groupAfter) return code;
  const groups: string[] = [];
  for (let at = 0; at < code.length; at += groupAfter) groups.push(code.slice(at, at + groupAfter));
  return groups.join("-");
}
