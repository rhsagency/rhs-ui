/**
 * What the video dialog does with an embed address, as a plain function with no state and no hook, so a Server Component can
 * check an address it was given before it hands it over.
 */

/**
 * The address to put in the iframe, or null when it is not one to trust with a frame: only http, https and an address on
 * your own site (`/embed/tour`) pass, never `javascript:` or `data:`. With `autoPlay` an `autoplay=1` is added when the address
 * says nothing about it, which the common players (YouTube, Vimeo, Wistia, Loom) all read.
 */
export function embedSource(url: string, autoPlay: boolean): string | null {
  const text = url.trim();
  if (!text) return null;
  // An address on this site, written with a slash and no scheme.
  if (text.startsWith("/") && !text.startsWith("//")) return autoPlay && !/[?&]autoplay=/.test(text) ? `${text}${text.includes("?") ? "&" : "?"}autoplay=1` : text;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (autoPlay && !parsed.searchParams.has("autoplay")) parsed.searchParams.set("autoplay", "1");
    return parsed.toString();
  } catch {
    return null;
  }
}
