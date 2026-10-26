/** What one place in a mask accepts. */
export interface MaskToken {
  /** Tested against one character at a time. */
  pattern: RegExp;
  /** What an accepted character becomes: the default A token turns letters into capitals. */
  transform?: (char: string) => string;
}

/** Your own tokens for the `definitions` prop: a regular expression is enough, or a token when the character should change too. */
export type MaskDefinitions = Record<string, RegExp | MaskToken>;

/** The tokens every mask knows: # a digit, A a letter (made a capital), * a letter or a digit. Any other character in a mask is a literal. */
export const MASK_TOKENS: Readonly<Record<string, MaskToken>> = {
  "#": { pattern: /\d/ },
  A: { pattern: /[a-z]/i, transform: (char) => char.toUpperCase() },
  "*": { pattern: /[a-z\d]/i },
};

export type MaskSlot = { kind: "token"; token: MaskToken } | { kind: "literal"; char: string };

/** A pattern without the g and y flags, which would make `test` remember where the last one stopped. */
function plain(token: RegExp | MaskToken): MaskToken {
  const entry = token instanceof RegExp ? { pattern: token } : token;
  return { ...entry, pattern: new RegExp(entry.pattern.source, entry.pattern.flags.replace(/[gy]/g, "")) };
}

/** A mask as its places, one per character. A backslash makes the next character a literal: "\\#" is a hash sign. */
export function parseMask(mask: string, definitions: MaskDefinitions = {}): MaskSlot[] {
  const tokens: Record<string, MaskToken> = { ...MASK_TOKENS };
  for (const [key, definition] of Object.entries(definitions)) tokens[key] = plain(definition);
  const slots: MaskSlot[] = [];
  for (let index = 0; index < mask.length; index += 1) {
    const char = mask.charAt(index);
    if (char === "\\" && index + 1 < mask.length) {
      index += 1;
      slots.push({ kind: "literal", char: mask.charAt(index) });
      continue;
    }
    const token = tokens[char];
    slots.push(token ? { kind: "token", token } : { kind: "literal", char });
  }
  return slots;
}

/** How many characters a full value has. */
export function maskCapacity(slots: readonly MaskSlot[]): number {
  return slots.filter((slot) => slot.kind === "token").length;
}

/** The text a place stands for in the ghost mask. */
export function ghostChar(slot: MaskSlot): string {
  return slot.kind === "literal" ? slot.char : "_";
}

/**
 * Reads the characters a person meant out of text that may be typed, pasted,
 * half deleted or already formatted. A literal the mask writes for you may be
 * typed too and is taken as written; one that is not typed is skipped; anything
 * a place does not accept is dropped. `before` is how many of the kept
 * characters stood in front of the caret, which is what a caret has to keep when
 * the text around it is rewritten.
 */
export function unmask(text: string, slots: readonly MaskSlot[], caret = text.length): { raw: string; before: number } {
  let raw = "";
  let before = 0;
  let place = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (index === caret) before = raw.length;
    const char = text.charAt(index);
    let written = false;
    for (let slot = slots[place]; slot?.kind === "literal"; slot = slots[place]) {
      place += 1;
      if (slot.char === char) {
        written = true;
        break;
      }
    }
    if (written) continue;
    const slot = slots[place];
    if (slot?.kind === "token" && slot.token.pattern.test(char)) {
      raw += slot.token.transform ? slot.token.transform(char) : char;
      place += 1;
    }
  }
  if (caret >= text.length) before = raw.length;
  return { raw, before };
}

/**
 * Keeps what an app hands over as a value: characters without literals, in
 * order, each tested against the place it lands in.
 */
export function cleanRaw(value: string, slots: readonly MaskSlot[]): string {
  const tokens = slots.flatMap((slot) => (slot.kind === "token" ? [slot.token] : []));
  let raw = "";
  for (const char of value) {
    const token = tokens[raw.length];
    if (token?.pattern.test(char)) raw += token.transform ? token.transform(char) : char;
  }
  return raw;
}

/**
 * The text for a value: the literals are written for you, up to the next place
 * that is still empty. `ends` says where each kept character ends in the text,
 * and `used` how many places the text covers, so the rest of the mask can be shown.
 */
export function applyMask(raw: string, slots: readonly MaskSlot[]): { text: string; ends: number[]; used: number } {
  let text = "";
  const ends: number[] = [];
  let used = 0;
  let kept = 0;
  for (const slot of slots) {
    if (slot.kind === "token") {
      if (kept >= raw.length) break;
      text += raw.charAt(kept);
      kept += 1;
      ends.push(text.length);
    } else {
      if (raw.length === 0) break;
      text += slot.char;
    }
    used += 1;
  }
  return { text, ends, used };
}
