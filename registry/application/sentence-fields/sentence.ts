/**
 * The sentence behind SentenceFields, as plain functions: they hold no state
 * and call no hook, so a Server Component can use them too (to write a rule
 * out as text in an email, a log or a confirmation page, from the same
 * template and the value you saved).
 */

/** One choice of a slot. A plain string is its own label and value. */
export interface SentenceOption {
  /** What the value holds when this option is chosen. */
  value: string;
  /** The words shown in the sentence and in the list. */
  label: string;
}

/** When a slot is shown: while the slot named `slot` holds one of the values in `is`, or none of the values in `not`. */
export interface SlotCondition {
  /** The id of the slot this one depends on. */
  slot: string;
  /** Show this slot only while that slot holds one of these values. */
  is?: string | readonly string[];
  /** Show this slot only while that slot holds none of these values (an empty slot holds none). */
  not?: string | readonly string[];
}

/** A word of the sentence that is a choice. */
export interface SentenceSlot {
  /** The key of its value in the whole value, and the name `template` uses for it. */
  id: string;
  /** What it can be. */
  options: readonly (string | SentenceOption)[];
  /** What it says while nothing is chosen: "how often". Default "choose". */
  placeholder?: string;
  /** What a screen reader calls it, as the first part of "Frequency: every Monday". Without one it is the words in front of it in the sentence ("Email me: every Monday"). */
  label?: string;
  /** Hide the slot, and the words that belong to it, unless this holds. */
  when?: SlotCondition;
}

/** A piece of the template: plain words, a slot, or words that come and go with a slot. */
export type SentencePiece = string | { slot: string } | { text: string; withSlot: string };

/** What is chosen in each slot, by slot id. A slot with no entry is empty. */
export type SentenceValue = Record<string, string>;

/** The sentence as plain text, and whether every slot that is shown has an answer. */
export interface SentenceText {
  text: string;
  complete: boolean;
}

/** The words the sentence says, for translation. A `{name}` mark in a sentence is filled in. */
export interface SentenceFieldsLabels {
  /** The placeholder of a slot that has none of its own. Default "choose". */
  choose?: string;
  /** The accessible name of a slot; `{label}` and `{value}`. Default "{label}: {value}". */
  slotName?: string;
  /** What an empty slot is written as in the plain text of an unfinished sentence. Default "…". */
  blank?: string;
}

export const DEFAULT_LABELS = {
  choose: "choose",
  slotName: "{label}: {value}",
  blank: "…",
} satisfies Required<SentenceFieldsLabels>;

export type Words = Required<SentenceFieldsLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The options as { value, label } pairs. */
export function optionsOf(slot: Pick<SentenceSlot, "options">): SentenceOption[] {
  return slot.options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
}

/** What is chosen in a slot, or "" when nothing is, or when what is held is not one of its options any more. */
export function chosenIn(slot: SentenceSlot, value: SentenceValue): string {
  const held = value[slot.id];
  return held !== undefined && optionsOf(slot).some((option) => option.value === held) ? held : "";
}

/** A template written as one string with `{slot}` marks ("Email me {frequency} about {topic}.") as pieces. */
export function parseTemplate(template: string): SentencePiece[] {
  const pieces: SentencePiece[] = [];
  let last = 0;
  for (const match of template.matchAll(/\{([\w-]+)\}/g)) {
    const at = match.index ?? 0;
    if (at > last) pieces.push(template.slice(last, at));
    pieces.push({ slot: match[1] ?? "" });
    last = at + match[0].length;
  }
  if (last < template.length) pieces.push(template.slice(last));
  return pieces;
}

const listed = (values: string | readonly string[] | undefined): string[] | null => (values === undefined ? null : typeof values === "string" ? [values] : [...values]);

/** Whether a slot is shown for what is chosen now. */
export function isVisible(slot: SentenceSlot, value: SentenceValue): boolean {
  const when = slot.when;
  if (!when) return true;
  const held = value[when.slot] ?? "";
  const is = listed(when.is);
  const not = listed(when.not);
  return (is === null || is.includes(held)) && (not === null || !not.includes(held));
}

export interface TextToken {
  kind: "text";
  text: string;
}

export interface SlotToken {
  kind: "slot";
  slot: SentenceSlot;
  /** The last few words in front of it, the name a screen reader gives it when it has no label. */
  words: string;
}

export type SentenceToken = TextToken | SlotToken;

/** The last few words of a text. */
const tail = (text: string, count = 4) => text.split(/\s+/).slice(-count).join(" ");

/**
 * The sentence for what is chosen now, as a list of words and slots in
 * reading order: the slots that are hidden are left out, and so are the words
 * that belong to them. Spaces are the renderer's to add, so the words carry
 * none.
 */
export function tokensOf(template: string | readonly SentencePiece[], slots: readonly SentenceSlot[], value: SentenceValue): SentenceToken[] {
  const pieces = typeof template === "string" ? parseTemplate(template) : template;
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  const tokens: SentenceToken[] = [];
  let words = "";
  for (const piece of pieces) {
    if (typeof piece === "string") {
      const text = piece.trim();
      if (text) {
        tokens.push({ kind: "text", text });
        words = tail(text);
      }
    } else if ("text" in piece) {
      const owner = byId.get(piece.withSlot);
      const text = piece.text.trim();
      if (text && owner && isVisible(owner, value)) {
        tokens.push({ kind: "text", text });
        words = tail(text);
      }
    } else {
      const slot = byId.get(piece.slot);
      if (slot && isVisible(slot, value)) tokens.push({ kind: "slot", slot, words });
    }
  }
  return tokens;
}

/** Whether a word is closing punctuation, which is written without a space in front of it. */
export const closesSentence = (text: string): boolean => /^[.,;:!?)]/.test(text);

/**
 * The finished sentence as plain text, for a confirmation step or an email.
 * A slot with no answer is written as the blank, so an unfinished sentence
 * still reads as one; `complete` says whether any are left.
 */
export function sentenceText(template: string | readonly SentencePiece[], slots: readonly SentenceSlot[], value: SentenceValue, blank: string = DEFAULT_LABELS.blank): SentenceText {
  let complete = true;
  const parts = tokensOf(template, slots, value).map((token) => {
    if (token.kind === "text") return token.text;
    const held = chosenIn(token.slot, value);
    if (!held) {
      complete = false;
      return blank;
    }
    return optionsOf(token.slot).find((option) => option.value === held)?.label ?? blank;
  });
  const text = parts.reduce((joined, part) => (joined === "" ? part : closesSentence(part) ? `${joined}${part}` : `${joined} ${part}`), "");
  return { text, complete };
}
