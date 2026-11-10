/**
 * The code behind an embed: the settings people choose, and the helpers that write them into HTML safely. Plain functions
 * with no state and no hook, so a Server Component can use them too. Write your own `buildSnippet` with `escapeAttribute`,
 * or use `iframeSnippet` as it is.
 */

/** Which colours the embedded content should use: its own light or dark, or whatever the visitor's page prefers. */
export type EmbedTheme = "light" | "dark" | "auto";

/** What the person has chosen: what `buildSnippet` receives each time something changes. */
export interface EmbedSettings {
  /** The width in pixels. Not used in the code of a responsive embed, which fills its container, but the ratio with `height` is. */
  width: number;
  /** The height in pixels. */
  height: number;
  /** The theme of the embedded content. */
  theme: EmbedTheme;
  /** Fill the width of the container and keep the proportions of `width` and `height`, instead of a fixed size. */
  responsive: boolean;
}

/** The options the dialog can show. Leave one out of `controls` and the person cannot change it. */
export type EmbedControl = "width" | "height" | "theme" | "responsive";

/** The words the dialog says, for translation. Use `{ratio}` and `{percent}` where the defaults do. */
export interface EmbedLabels {
  /** The title. Default "Embed". */
  title?: string;
  /** The line under it. Default "Copy the code and paste it into your page where this should appear." */
  description?: string;
  /** The label of the width field. Default "Width". */
  width?: string;
  /** The label of the height field. Default "Height". */
  height?: string;
  /** The unit after both fields. Default "px". */
  unit?: string;
  /** The label of the theme control. Default "Theme". */
  theme?: string;
  /** The name of the light theme on the control. Default "Light". */
  light?: string;
  /** The name of the dark theme on the control. Default "Dark". */
  dark?: string;
  /** The name of the theme that follows the visitor's own setting. Default "Auto". */
  auto?: string;
  /** The label of the responsive switch. Default "Responsive". */
  responsive?: string;
  /** The line under it. `{ratio}` is the shape, like "16:9". Default "Fills the width of its container and keeps a {ratio} shape." */
  responsiveHint?: string;
  /** What the width field shows while the embed is responsive. Default "100%". */
  fullWidth?: string;
  /** The label over the preview. Default "Preview". */
  preview?: string;
  /** Said beside it when the preview is smaller than the embed. `{percent}` is how much of its size it is shown at. Default "Shown at {percent}% of its size". */
  previewScaled?: string;
  /** Said beside it when the embed fills its container. Default "Fills the width". */
  previewFluid?: string;
  /** The label of the code. Default "Embed code". */
  code?: string;
  /** The copy button. Default "Copy code". */
  copy?: string;
  /** The copy button once it worked. Default "Copied". */
  copied?: string;
  /** The button that closes the dialog. Default "Done". */
  done?: string;
  /** The name of the corner button. Default "Close". */
  closeIcon?: string;
}

export const DEFAULT_LABELS = {
  title: "Embed",
  description: "Copy the code and paste it into your page where this should appear.",
  width: "Width",
  height: "Height",
  unit: "px",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  auto: "Auto",
  responsive: "Responsive",
  responsiveHint: "Fills the width of its container and keeps a {ratio} shape.",
  fullWidth: "100%",
  preview: "Preview",
  previewScaled: "Shown at {percent}% of its size",
  previewFluid: "Fills the width",
  code: "Embed code",
  copy: "Copy code",
  copied: "Copied",
  done: "Done",
  closeIcon: "Close",
} satisfies Required<EmbedLabels>;

/** What the settings start as when you give no `defaults`. */
export const DEFAULT_SETTINGS: EmbedSettings = { width: 640, height: 360, theme: "light", responsive: false };

/** The smallest and largest size a field accepts, in pixels. */
export const LIMITS = { min: 120, max: 4000 } as const;

/** Puts values into a template: `fill("Shown at {percent}%", { percent: 74 })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Makes a value safe inside a double-quoted HTML attribute: `&`, `<`, `>` and both kinds of quote become entities. An
 * address with a query string (`?a=1&b=2`) needs the `&` written as `&amp;`, and a title with a quote in it would otherwise
 * end the attribute early and let the rest run as markup.
 */
export function escapeAttribute(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}

/** Adds `name=value` to the query of an address, before any `#fragment`, with both parts encoded. */
export function withParam(address: string, name: string, value: string): string {
  const hash = address.indexOf("#");
  const base = hash < 0 ? address : address.slice(0, hash);
  const tail = hash < 0 ? "" : address.slice(hash);
  return `${base}${base.includes("?") ? "&" : "?"}${encodeURIComponent(name)}=${encodeURIComponent(value)}${tail}`;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** The shape of a size as a ratio in the smallest whole numbers: 640 by 360 is "16:9". */
export function aspectRatio(width: number, height: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const divisor = gcd(w, h);
  return `${w / divisor}:${h / divisor}`;
}

/** A size held between the limits, as a whole number. */
export function clampSize(value: number): number {
  return Math.min(LIMITS.max, Math.max(LIMITS.min, Math.round(value)));
}

export interface IframeSnippetOptions {
  /** The address of the page to embed. The theme is added to it as `?theme=light`. */
  src: string;
  /** What the frame is, for screen readers: "Revenue by region". Every iframe needs one. */
  title: string;
}

/**
 * An iframe, written the way it should be pasted: every value escaped for its attribute, the theme added to the address, lazy
 * loading and a referrer policy. A fixed embed carries its width and height; a responsive one sits in a wrapper that
 * fills the width and keeps the shape.
 */
export function iframeSnippet(settings: EmbedSettings, { src, title }: IframeSnippetOptions): string {
  const address = escapeAttribute(withParam(src, "theme", settings.theme));
  const name = escapeAttribute(title);
  if (settings.responsive) {
    return [
      `<div style="position:relative;width:100%;aspect-ratio:${escapeAttribute(Math.round(settings.width))}/${escapeAttribute(Math.round(settings.height))}">`,
      "  <iframe",
      `    src="${address}"`,
      `    title="${name}"`,
      '    loading="lazy"',
      '    referrerpolicy="strict-origin-when-cross-origin"',
      '    style="position:absolute;inset:0;width:100%;height:100%;border:0"',
      "  ></iframe>",
      "</div>",
    ].join("\n");
  }
  return [
    "<iframe",
    `  src="${address}"`,
    `  title="${name}"`,
    `  width="${escapeAttribute(Math.round(settings.width))}"`,
    `  height="${escapeAttribute(Math.round(settings.height))}"`,
    '  loading="lazy"',
    '  referrerpolicy="strict-origin-when-cross-origin"',
    '  style="border:0"',
    "></iframe>",
  ].join("\n");
}
