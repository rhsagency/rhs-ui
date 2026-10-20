export type AppearanceTheme = "light" | "dark" | "system";
export type AppearanceDensity = "comfortable" | "compact";

export interface AppearanceValue {
  theme: AppearanceTheme;
  density: AppearanceDensity;
  /** The `value` of one of the fonts offered. */
  font: string;
}

export interface AppearanceFont {
  value: string;
  label: string;
  /** The CSS font-family stack the sample line is set in. Use "inherit" for the page's own font. */
  family: string;
}

/** Your page's own font, a serif and a monospace, each as a system stack so nothing has to load. */
export const DEFAULT_FONTS: readonly AppearanceFont[] = [
  { value: "default", label: "Default", family: "inherit" },
  { value: "serif", label: "Serif", family: 'ui-serif, Georgia, Cambria, "Times New Roman", serif' },
  { value: "mono", label: "Mono", family: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
];

/**
 * The colours the theme previews paint with. They are written out here, not
 * read from the page's tokens, so the Light preview stays light and the Dark
 * preview stays dark whichever theme the page itself is in.
 */
export const PREVIEW_PALETTE = {
  light: { page: "#fcfcfc", panel: "#ffffff", line: "#e4e4e4", soft: "#d4d4d4", strong: "#171717" },
  dark: { page: "#0e0e0e", panel: "#1c1c1c", line: "#2e2e2e", soft: "#555555", strong: "#f5f5f5" },
} as const;
