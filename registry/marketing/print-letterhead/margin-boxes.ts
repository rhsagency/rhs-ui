/** A text as a CSS string: quotes, backslashes and line breaks are escaped, and so is `<`, so the text can never close the style element it sits in. */
export const cssString = (text: string): string => text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r\n|[\n\r\f]/g, "\\A ").replace(/</g, "\\3C ");

/** What both margin boxes of the running footer share: small, grey, and set 5mm under the text area, so the page text and the footer can never meet. */
export const BOX_STYLE = "font:8pt/1.35 ui-sans-serif,system-ui,sans-serif;color:#555;vertical-align:top;padding-top:5mm";

/**
 * The value of `content` for the right-hand margin box: "Page 2 of 5", with the
 * page counters the browser fills in, and in front of it, when there is one, the
 * date: "Printed 10 November 2026 · Page 2 of 5".
 */
export function pageNumbers(pageLabel: string, pageOfLabel: string, printed?: string): string {
  const lead = printed ? `${printed} · ` : "";
  return `"${cssString(lead + pageLabel)} " counter(page) " ${cssString(pageOfLabel)} " counter(pages)`;
}
