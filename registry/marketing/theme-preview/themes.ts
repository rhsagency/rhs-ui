/** A set of CSS custom properties: the semantic tokens a theme redefines, such as "--background". */
export type ThemeTokens = Record<`--${string}`, string>;

export interface PreviewTheme {
  /** Set as data-theme on the preview, and the key of the theme. "light", "dark" and "high-contrast" have colours built in; any other id brings its own `tokens`, or leaves them to your own CSS, which can match [data-theme="sepia"]. */
  id: string;
  /** What the switch says: "High contrast". */
  label: string;
  /** Whether native form controls and scrollbars inside the preview are drawn light or dark (color-scheme). Dark for "dark", light for everything else, unless you say so. */
  scheme?: "light" | "dark";
  /** The tokens of this theme. Bring your own to show your real palette; built-in themes use RHS UI's neutral ones. */
  tokens?: ThemeTokens;
}

const LIGHT: ThemeTokens = {
  "--background": "oklch(0.992 0 0)",
  "--foreground": "oklch(0.165 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.165 0 0)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.165 0 0)",
  "--primary": "oklch(0.165 0 0)",
  "--primary-foreground": "oklch(1 0 0)",
  "--secondary": "oklch(0.955 0 0)",
  "--secondary-foreground": "oklch(0.225 0 0)",
  "--muted": "oklch(0.955 0 0)",
  "--muted-foreground": "oklch(0.42 0 0)",
  "--accent": "oklch(0.955 0 0)",
  "--accent-foreground": "oklch(0.165 0 0)",
  "--destructive": "oklch(0.58 0.21 25)",
  "--destructive-foreground": "oklch(1 0 0)",
  "--border": "oklch(0.905 0 0)",
  "--input": "oklch(0.905 0 0)",
  "--ring": "oklch(0.165 0 0)",
};

const DARK: ThemeTokens = {
  "--background": "oklch(0.165 0 0)",
  "--foreground": "oklch(0.992 0 0)",
  "--card": "oklch(0.225 0 0)",
  "--card-foreground": "oklch(0.992 0 0)",
  "--popover": "oklch(0.225 0 0)",
  "--popover-foreground": "oklch(0.992 0 0)",
  "--primary": "oklch(0.992 0 0)",
  "--primary-foreground": "oklch(0.165 0 0)",
  "--secondary": "oklch(0.3 0 0)",
  "--secondary-foreground": "oklch(0.955 0 0)",
  "--muted": "oklch(0.3 0 0)",
  "--muted-foreground": "oklch(0.83 0 0)",
  "--accent": "oklch(0.3 0 0)",
  "--accent-foreground": "oklch(0.992 0 0)",
  "--destructive": "oklch(0.7 0.19 25)",
  "--destructive-foreground": "oklch(0.165 0 0)",
  "--border": "oklch(0.3 0 0)",
  "--input": "oklch(0.3 0 0)",
  "--ring": "oklch(0.83 0 0)",
};

/** Pure black on pure white, text at 7:1 or better everywhere, and borders and focus rings dark enough to find without squinting. */
const HIGH_CONTRAST: ThemeTokens = {
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0 0 0)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0 0 0)",
  "--primary": "oklch(0 0 0)",
  "--primary-foreground": "oklch(1 0 0)",
  "--secondary": "oklch(0.9 0 0)",
  "--secondary-foreground": "oklch(0 0 0)",
  "--muted": "oklch(0.93 0 0)",
  "--muted-foreground": "oklch(0.3 0 0)",
  "--accent": "oklch(0.9 0 0)",
  "--accent-foreground": "oklch(0 0 0)",
  "--destructive": "oklch(0.45 0.2 27)",
  "--destructive-foreground": "oklch(1 0 0)",
  "--border": "oklch(0.3 0 0)",
  "--input": "oklch(0.3 0 0)",
  "--ring": "oklch(0 0 0)",
};

const BUILT_IN: Record<string, { scheme: "light" | "dark"; tokens: ThemeTokens }> = {
  light: { scheme: "light", tokens: LIGHT },
  dark: { scheme: "dark", tokens: DARK },
  "high-contrast": { scheme: "light", tokens: HIGH_CONTRAST },
};

/** The switch's default: the three themes whose colours are built in. */
export const DEFAULT_THEMES: readonly PreviewTheme[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "high-contrast", label: "High contrast" },
];

/** What a theme is drawn with: its own tokens, else the built-in ones for its id, else none (the page's). The scheme follows the same order, then the id. */
export function resolveTheme(theme: PreviewTheme): { scheme: "light" | "dark"; tokens: ThemeTokens } {
  const known = BUILT_IN[theme.id];
  return {
    scheme: theme.scheme ?? known?.scheme ?? (/dark/i.test(theme.id) ? "dark" : "light"),
    tokens: theme.tokens ?? known?.tokens ?? {},
  };
}
