/** Where a person's story stands: a new one to see, one already seen, a live broadcast, or no story at all. */
export type StoryState = "unseen" | "seen" | "live" | "none";

/** The sizes of the ring: 48, 64 and 80px across. */
export type StoryRingSize = "sm" | "md" | "lg";

/** The words of the ring, for another language. `{name}` stands for the person's name. */
export interface StoryRingLabels {
  /** The name of the button while the story is new. Default "{name}, new story". */
  unseen: string;
  /** The name once it has been seen. Default "{name}, story seen". */
  seen: string;
  /** The name while the person is live. Default "{name}, live now". */
  live: string;
  /** The name when there is no story. Default "{name}". */
  none: string;
  /** The small tag on a live ring. Default "Live". */
  liveTag: string;
  /** The caption of the viewer's own slot in a row. Default "Your story". */
  you: string;
  /** The name of the viewer's own slot when it has no story yet and adds one. Default "Add to your story". */
  add: string;
  /** The name of the list of rings. Default "Stories". */
  stories: string;
}

export const DEFAULT_STORY_LABELS: StoryRingLabels = {
  unseen: "{name}, new story",
  seen: "{name}, story seen",
  live: "{name}, live now",
  none: "{name}",
  liveTag: "Live",
  you: "Your story",
  add: "Add to your story",
  stories: "Stories",
};

/** What the button is called: the person, and where their story stands, in words, so the ring never depends on colour. */
export function storyLabel(name: string, state: StoryState, labels: StoryRingLabels = DEFAULT_STORY_LABELS): string {
  return labels[state].replace("{name}", name);
}

/** Diameter of the ring, its thickness when it is a bold one, and the gap between it and the picture, in px. */
export const RING_SIZES: Record<StoryRingSize, { outer: number; stroke: number; gap: number }> = {
  sm: { outer: 48, stroke: 2, gap: 2 },
  md: { outer: 64, stroke: 3, gap: 3 },
  lg: { outer: 80, stroke: 3, gap: 3 },
};
