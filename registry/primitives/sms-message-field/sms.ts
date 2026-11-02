/**
 * The characters of the standard SMS alphabet (GSM 03.38), each worth one
 * place in a message. Any character outside it, and outside the extension
 * table below, makes the whole message Unicode.
 */
export const GSM_BASIC = "@\u00a3$\u00a5\u00e8\u00e9\u00f9\u00ec\u00f2\u00c7\n\u00d8\u00f8\r\u00c5\u00e5\u0394_\u03a6\u0393\u039b\u03a9\u03a0\u03a8\u03a3\u0398\u039e\u00c6\u00e6\u00df\u00c9 !\"#\u00a4%&'()*+,-./0123456789:;<=>?\u00a1ABCDEFGHIJKLMNOPQRSTUVWXYZ\u00c4\u00d6\u00d1\u00dc\u00a7\u00bfabcdefghijklmnopqrstuvwxyz\u00e4\u00f6\u00f1\u00fc\u00e0";

/** The extension table: still the standard alphabet, but each character takes two places. */
export const GSM_EXTENSION = "^{}\\[~]|\u20ac\f";

const BASIC = new Set([...GSM_BASIC]);
const EXTENSION = new Set([...GSM_EXTENSION]);

export type SmsEncoding = "gsm" | "unicode";

/** What a text will cost as text messages. */
export interface SmsCount {
  /** The alphabet the text needs: `gsm` for the standard one, `unicode` as soon as one character is outside it. */
  encoding: SmsEncoding;
  /** How many messages the text takes. 0 for no text. */
  segments: number;
  /** The characters, counted by code point: most emoji are one, an emoji with a skin tone or a joiner is more. The messages are worked out from `units`, not from this. */
  characters: number;
  /** The places used: an extension character or an emoji takes two. */
  units: number;
  /** What one message of this text holds: 160 or 153 (when split) in GSM, 70 or 67 in Unicode. */
  perSegment: number;
  /** The places used in each message. */
  parts: number[];
  /** The places left in the last message. */
  left: number;
  /** The characters that forced Unicode, each once, in the order they appear. */
  forcing: string[];
  /** The extension characters in the text, each once. Empty in Unicode, where they cost nothing extra. */
  doubled: string[];
}

/** True for a character of the standard alphabet or its extension table. */
export function isGsm(character: string): boolean {
  return BASIC.has(character) || EXTENSION.has(character);
}

/**
 * Works out how many text messages a text takes. One message holds 160 places
 * in the standard alphabet and 70 once any character needs Unicode; a text
 * that is split holds 153 and 67 per part, because each part carries a header.
 * Characters from the extension table (the euro sign, brackets, braces and a few more) and emoji take
 * two places, and a character is never split over two parts.
 */
export function countSms(text: string): SmsCount {
  const characters = [...text];
  const forcing: string[] = [];
  for (const character of characters) if (!isGsm(character) && !forcing.includes(character)) forcing.push(character);
  const encoding: SmsEncoding = forcing.length === 0 ? "gsm" : "unicode";
  const widths = characters.map((character) => (encoding === "unicode" ? character.length : BASIC.has(character) ? 1 : 2));
  const units = widths.reduce((sum, width) => sum + width, 0);
  const single = encoding === "gsm" ? 160 : 70;
  const split = encoding === "gsm" ? 153 : 67;
  const doubled = encoding === "gsm" ? [...new Set(characters.filter((character) => EXTENSION.has(character)))] : [];
  const base = { encoding, characters: characters.length, units, forcing, doubled };
  if (characters.length === 0) return { ...base, segments: 0, perSegment: single, parts: [], left: single };
  if (units <= single) return { ...base, segments: 1, perSegment: single, parts: [units], left: single - units };
  const parts = [0];
  for (const width of widths) {
    if ((parts[parts.length - 1] ?? 0) + width > split) parts.push(0);
    parts[parts.length - 1] = (parts[parts.length - 1] ?? 0) + width;
  }
  return { ...base, segments: parts.length, perSegment: split, parts, left: split - (parts[parts.length - 1] ?? 0) };
}

/** What the usual look-alikes turn into: curly quotes, dashes, the ellipsis, a non-breaking space. Built from code points, so the source stays free of the characters themselves. */
const PLAIN = new Map<string, string>(
  (
    [
      [0x2018, "'"],
      [0x2019, "'"],
      [0x201a, "'"],
      [0x00b4, "'"],
      [0x201c, '"'],
      [0x201d, '"'],
      [0x201e, '"'],
      [0x2013, "-"],
      [0x2014, "-"],
      [0x2212, "-"],
      [0x2026, "..."],
      [0x2022, "*"],
      [0x00a0, " "],
      [0x202f, " "],
      [0x2009, " "],
    ] as const
  ).map(([code, plain]) => [String.fromCharCode(code), plain]),
);

/** True when `plainText` has a standard replacement for the character. */
export function hasPlainForm(character: string): boolean {
  return PLAIN.has(character);
}

/** The text with the look-alikes that force Unicode swapped for the standard characters. Letters and emoji are left alone: only the writer knows what to do with those. */
export function plainText(text: string): string {
  return [...text].map((character) => PLAIN.get(character) ?? character).join("");
}

/** A short name for a character that forced Unicode, so a person can find it: "emoji", "curly apostrophe", "letter". */
export function describeCharacter(character: string): string {
  const code = character.codePointAt(0) ?? 0;
  if (code === 0x2018 || code === 0x2019 || code === 0x201a) return "curly apostrophe";
  if (code === 0x201c || code === 0x201d || code === 0x201e) return "curly quote";
  if (code === 0x2013) return "en dash";
  if (code === 0x2014) return "em dash";
  if (code === 0x2026) return "ellipsis";
  if (code === 0x2022) return "bullet";
  if (code === 0x00a0 || code === 0x202f || code === 0x2009) return "special space";
  if (/\p{Extended_Pictographic}/u.test(character)) return "emoji";
  if (/\p{L}/u.test(character)) return "letter";
  return "symbol";
}

/** The words the field says, for another language or your own voice. Each can be replaced. */
export interface SmsLabels {
  /** "2 messages". */
  messages: (count: number) => string;
  /** "214 characters". */
  characters: (count: number) => string;
  /** The standard alphabet, as the counter names it. */
  gsm: string;
  /** The other alphabet, as the counter names it. */
  unicode: string;
  /** What is left in the last message: "28 left in this message", or "62 left before message 4" once the text is split. */
  left: (count: number, segments: number) => string;
  /** The line that names what forced Unicode: `what` is the characters with their names, `single` and `standard` are the two limits. */
  forcedBy: (what: string, single: number, standard: number) => string;
  /** The line that names the characters that take two places. */
  doubled: (what: string) => string;
  /** Added to the Unicode line while the text holds an emoji, which takes two places of the message although the counter counts it once. */
  emojiDoubled: string;
  /** The line when there are more messages than `maxSegments`. */
  over: (segments: number, max: number) => string;
  /** The button that swaps curly quotes and dashes for plain ones. */
  usePlain: string;
  /** What a screen reader hears after it. */
  replaced: string;
  /** What a screen reader hears when the number of messages changes. */
  announce: (segments: number, encoding: SmsEncoding) => string;
  /** The name of the field when it has no label. */
  name: string;
}

const plural = (count: number, one: string, other: string) => (count === 1 ? one : other);

export const DEFAULT_LABELS: SmsLabels = {
  messages: (count) => `${count} ${plural(count, "message", "messages")}`,
  characters: (count) => `${count} ${plural(count, "character", "characters")}`,
  gsm: "GSM",
  unicode: "Unicode",
  left: (count, segments) => (segments <= 1 ? `${count} left in this message` : `${count} left before message ${segments + 1}`),
  forcedBy: (what, single, standard) => `Unicode because of ${what}. A message holds ${single} characters instead of ${standard}.`,
  doubled: (what) => `${what} count as two characters each.`,
  emojiDoubled: "Emoji count as two characters each.",
  over: (segments, max) => `That is ${segments} messages and the limit is ${max}.`,
  usePlain: "Use plain characters",
  replaced: "Replaced with plain characters.",
  announce: (segments, encoding) => `${segments} ${plural(segments, "message", "messages")}${encoding === "unicode" ? ", Unicode" : ""}`,
  name: "Message",
};
