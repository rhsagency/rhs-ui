/** Where an image address stands: nothing typed, on its way, shown, refused by the browser, or refused here before any request was made. */
export type ImageUrlStatus = "empty" | "loading" | "loaded" | "failed" | "invalid";

/** What is known about the address in the field. The size is the image's own, in pixels, once it has loaded. */
export interface ImageUrlState {
  status: ImageUrlStatus;
  width: number | null;
  height: number | null;
}

/** The words the field says, for another language or your own voice. Each can be replaced. */
export interface ImageUrlLabels {
  /** The name of the field for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** The line under the field while it is empty. */
  hint: string;
  /** The line while the image is on its way. */
  loading: string;
  /** The line when the image is shown; the size is in pixels. */
  loaded: (width: number | null, height: number | null) => string;
  /** The line when the address did not load as an image. */
  failed: string;
  /** The line when an address that starts with http:// is not accepted. */
  insecure: string;
  /** The line when a data: address is not accepted. */
  data: string;
  /** The line when what was typed is not an address of an image. */
  address: string;
  /** The name of the button that empties the field. */
  clear: string;
}

export const DEFAULT_LABELS: ImageUrlLabels = {
  name: "Image address",
  hint: "Paste the address of an image.",
  loading: "Loading the image...",
  loaded: (width, height) => (width && height ? `Image found, ${width} \u00d7 ${height} px.` : "Image found."),
  failed: "That address did not load as an image.",
  insecure: "Use an address that starts with https://. Plain http:// is not accepted here.",
  data: "Data addresses are not accepted here.",
  address: "That is not an image address. It should start with https://.",
  clear: "Clear the address",
};

/** Why an address was turned down before any request was made. */
export type Refusal = "insecure" | "data" | "address";

export interface AddressRules {
  requireHttps: boolean;
  allowData: boolean;
}

/**
 * Reads what was typed as the address of an image: null when it is empty,
 * `{ src }` with the address the browser should load, or `{ refusal }` with the
 * reason it never will be. Only https:// (and http:// unless `requireHttps`)
 * and, when allowed, data:image/ addresses are ever passed on; javascript:,
 * file:, ftp: and the rest are refused without a request.
 */
export function readAddress(raw: string, rules: AddressRules): { src: string } | { refusal: Refusal } | null {
  const text = raw.trim();
  if (text === "") return null;
  if (/^data:/i.test(text)) {
    if (!rules.allowData) return { refusal: "data" };
    return /^data:image\//i.test(text) ? { src: text } : { refusal: "address" };
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { refusal: "address" };
  }
  if (url.protocol === "https:") return { src: url.href };
  if (url.protocol === "http:") return rules.requireHttps ? { refusal: "insecure" } : { src: url.href };
  return { refusal: "address" };
}
