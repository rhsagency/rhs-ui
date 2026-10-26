/** One emoji a person can react with, and the words that name it for a screen reader. */
export interface PaletteEmoji {
  emoji: string;
  /** "Thumbs up". Read out instead of the emoji's own name, which differs per platform. */
  label: string;
}

/** One reaction on a message or a comment. The emoji is its identity: one chip per emoji. */
export interface Reaction {
  /** The emoji itself: "🎉". */
  emoji: string;
  /** Its name for screen readers. Falls back to the palette's name for this emoji, then to the emoji. */
  label?: string;
  /** How many people used it, you included when `reacted` is true. */
  count: number;
  /** You reacted with it. */
  reacted?: boolean;
  /** Names of the other people who reacted, for the tooltip. It may list only the first few: the count is the truth. */
  users?: readonly string[];
}

/** Sixteen reactions that cover most conversations, in the order people reach for them. */
export const REACTION_PALETTE: readonly PaletteEmoji[] = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "👎", label: "Thumbs down" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Laughing" },
  { emoji: "🎉", label: "Celebration" },
  { emoji: "😮", label: "Surprised" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🙏", label: "Thanks" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👀", label: "Eyes" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "✅", label: "Done" },
  { emoji: "💯", label: "Hundred" },
  { emoji: "🤔", label: "Thinking" },
  { emoji: "👏", label: "Applause" },
  { emoji: "😍", label: "Love it" },
];

/** The name of a reaction for screen readers: its own label, the palette's, or the emoji. */
export function reactionName(reaction: Pick<Reaction, "emoji" | "label">, palette: readonly PaletteEmoji[] = REACTION_PALETTE): string {
  return reaction.label ?? palette.find((item) => item.emoji === reaction.emoji)?.label ?? reaction.emoji;
}

/**
 * Sets whether you reacted with an emoji, and keeps the count honest: a new
 * emoji starts a chip, and a chip nobody is left on disappears. It sets a
 * state rather than flipping one, so applying the same change twice (the
 * optimistic copy and then the server's answer) changes nothing the second
 * time. Use it in your own `onToggle` for the plain case.
 */
export function applyReaction(list: readonly Reaction[], emoji: string, reacted: boolean, label?: string): Reaction[] {
  const found = list.find((item) => item.emoji === emoji);
  if (!found) return reacted ? [...list, { emoji, ...(label ? { label } : {}), count: 1, reacted: true }] : [...list];
  if (Boolean(found.reacted) === reacted) return [...list];
  const count = found.count + (reacted ? 1 : -1);
  if (count <= 0) return list.filter((item) => item.emoji !== emoji);
  return list.map((item) => (item.emoji === emoji ? { ...item, reacted, count } : item));
}

/**
 * Who reacted, as one line for the tooltip: "You, Ana Reyes and 2 others".
 * At most three names are written out; the rest are counted. Without any
 * names it says how many people there are.
 */
export function whoReacted(reaction: Reaction, locale = "en-US"): string {
  const names = [...(reaction.reacted ? ["You"] : []), ...(reaction.users ?? [])];
  const shown = names.slice(0, 3);
  const rest = Math.max(reaction.count, names.length) - shown.length;
  if (!shown.length) return `${reaction.count} ${reaction.count === 1 ? "person" : "people"}`;
  const parts = rest > 0 ? [...shown, `${rest} ${rest === 1 ? "other" : "others"}`] : shown;
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts);
}
