/** One notch of the text size slider: its name and the factor to apply to your root font size. */
export interface TextSizeStep {
  label: string;
  /** Multiplier for the base font size: 1 is the size your design was made at. */
  scale: number;
}

/**
 * The five text sizes, smallest first. `value.textSize` is an index into this
 * list; apply `TEXT_SIZE_STEPS[value.textSize].scale` to your root font size
 * (for example as a CSS variable) so text and everything sized in rem follows.
 */
export const TEXT_SIZE_STEPS: readonly TextSizeStep[] = [
  { label: "Small", scale: 0.9 },
  { label: "Default", scale: 1 },
  { label: "Large", scale: 1.1 },
  { label: "Larger", scale: 1.25 },
  { label: "Largest", scale: 1.5 },
];

/** Follow the operating system, always reduce, or always allow motion. */
export type MotionPreference = "system" | "reduce" | "allow";

/** The normal contrast of your theme, or a stronger one. */
export type ContrastPreference = "standard" | "more";

export interface AccessibilityPreferencesValue {
  /** Index into TEXT_SIZE_STEPS, 0 to 4. */
  textSize: number;
  motion: MotionPreference;
  contrast: ContrastPreference;
  /** Underline every link instead of only on hover and focus. */
  underlineLinks: boolean;
  /** Show shortcut hints next to buttons and menu items. */
  keyboardHints: boolean;
}

/** A starting point: default size, motion follows the system, standard contrast, nothing extra. */
export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferencesValue = {
  textSize: 1,
  motion: "system",
  contrast: "standard",
  underlineLinks: false,
  keyboardHints: false,
};
