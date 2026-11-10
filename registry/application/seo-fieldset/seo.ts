/** What a page tells search engines about itself. */
export interface SeoValue {
  /** The headline of the search result. */
  title: string;
  /** The text under the headline. */
  description: string;
  /** The page's path under the site address: "journal/how-we-price-a-website". */
  slug: string;
}

/** The words the fieldset says, for translation. A `{name}` mark in a sentence is filled in. */
export interface SeoFieldsetLabels {
  /** The label of the title field. Default "Search title". */
  titleLabel?: string;
  /** The label of the description field. Default "Search description". */
  descriptionLabel?: string;
  /** The label of the slug field. Default "URL slug". */
  slugLabel?: string;
  /** The line under the title label. Default "The headline of your page in search results." */
  titleHint?: string;
  /** The line under the description label. Default "The text under the headline. Say what the page offers." */
  descriptionHint?: string;
  /** Names a meter for a screen reader; `{field}` is the label of its field. Default "{field} length". */
  meterLabel?: string;
  /** The meter while the text is shorter than recommended; `{count}` and `{limit}`. Default "{count} of {limit}, a little short". */
  short?: string;
  /** The meter while the length is in the recommended range; `{count}` and `{limit}`. Default "{count} of {limit}, good". */
  good?: string;
  /** The meter once the text would be cut off; `{limit}`. Default "Too long, cut off at {limit}". */
  long?: string;
  /** The meter while the field is empty. Default "Empty, the preview shows the fallback". */
  empty?: string;
  /** What the meter announces when the length turns good, as a state and not a count. Default "Good length". */
  goodState?: string;
  /** The recommended range, beside the meter; `{min}` and `{limit}`. Default "Aim for {min} to {limit}". */
  range?: string;
  /** How far over the limit, beside the meter; `{count}`. Default "{count} over". */
  over?: string;
  /** The caption of the preview card. Default "Search preview". */
  previewTitle?: string;
  /** The badge on the preview card. Default "Example". */
  previewBadge?: string;
  /** What a screen reader calls the preview. Default "Example of a search result; search engines may show something different". */
  previewLabel?: string;
  /** Under the preview while a field is empty. Default "Empty fields show the page's own text, in grey, as a search engine would fill them in." */
  fallbackNote?: string;
  /** The title in the preview when the field is empty and no `fallbackTitle` is passed. Default "Untitled page". */
  untitled?: string;
  /** The description in the preview when the field is empty and no `fallbackDescription` is passed. Default "No description yet. Search engines will pick a snippet from the page." */
  undescribed?: string;
}

export const DEFAULT_LABELS = {
  titleLabel: "Search title",
  descriptionLabel: "Search description",
  slugLabel: "URL slug",
  titleHint: "The headline of your page in search results.",
  descriptionHint: "The text under the headline. Say what the page offers.",
  meterLabel: "{field} length",
  short: "{count} of {limit}, a little short",
  good: "{count} of {limit}, good",
  long: "Too long, cut off at {limit}",
  empty: "Empty, the preview shows the fallback",
  goodState: "Good length",
  range: "Aim for {min} to {limit}",
  over: "{count} over",
  previewTitle: "Search preview",
  previewBadge: "Example",
  previewLabel: "Example of a search result; search engines may show something different",
  fallbackNote: "Empty fields show the page's own text, in grey, as a search engine would fill them in.",
  untitled: "Untitled page",
  undescribed: "No description yet. Search engines will pick a snippet from the page.",
} satisfies Required<SeoFieldsetLabels>;

export type Words = Required<SeoFieldsetLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** What a search engine reads: runs of spaces and line breaks become one space, and the ends are trimmed. */
export function tidy(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** The text as the characters a person sees: an emoji or an accented letter is one, not two or three code units. */
export function glyphs(text: string, locale: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

/** The length of a text in characters, after `tidy`. */
export function lengthOf(text: string, locale: string): number {
  return glyphs(tidy(text), locale).length;
}

/** The text as a search result shows it: whole when it fits, else cut after exactly `limit` characters and closed with an ellipsis. */
export function cutOff(text: string, limit: number, locale: string): string {
  const parts = glyphs(tidy(text), locale);
  return parts.length > limit ? `${parts.slice(0, limit).join("").trimEnd()}…` : parts.join("");
}

export type Fit = "empty" | "short" | "good" | "long";

/** Where a length stands against the recommended range: nothing yet, under it, inside it, or over the limit. */
export function fitOf(count: number, min: number, limit: number): Fit {
  if (count === 0) return "empty";
  if (count > limit) return "long";
  return count < min ? "short" : "good";
}

/** A slug while it is being typed: lower case, spaces and stray marks become a hyphen, slashes keep the path. Hyphens at the ends stay, so a word can be finished. */
export function typingSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/^[-/]+/, "");
}

/** A finished slug: every segment trimmed of hyphens, and empty segments dropped. */
export function finishSlug(raw: string): string {
  return typingSlug(raw)
    .split("/")
    .map((segment) => segment.replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("/");
}

/** The address of a page in the breadcrumb style of a search result: the host, then each part of the path. */
export function trail(baseUrl: string, slug: string): { host: string; parts: string[]; url: string } {
  let host = baseUrl.replace(/^[a-z]+:\/\//i, "").replace(/\/.*$/, "");
  let path: string[] = [];
  try {
    const parsed = new URL(baseUrl);
    host = parsed.host;
    path = parsed.pathname.split("/").filter(Boolean);
  } catch {
    // An address without a scheme or a malformed one: the host is whatever came before the first slash.
  }
  const parts = [...path, ...slug.split("/").filter(Boolean)];
  return { host, parts, url: `${host}${parts.length ? `/${parts.join("/")}` : ""}` };
}

/** The first letter of a name, for the round mark before the site name. */
export function initialOf(name: string): string {
  return glyphs(name.trim(), "en-US")[0]?.toUpperCase() ?? "";
}
