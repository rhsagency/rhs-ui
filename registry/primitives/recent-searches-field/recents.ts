/** What a search is compared as: without capitals and accents, so "Café" and "cafe" are the same search. */
export function foldSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
}

/** A search as it is kept: trimmed, with the spaces inside it single. */
export const tidySearch = (query: string): string => query.trim().replace(/\s+/g, " ");

/**
 * The list with a search added at the top, newest first. The same search from
 * earlier moves up instead of appearing twice (by what it says, not how it was
 * typed), and the list is cut to `max`. An empty query changes nothing.
 */
export function rememberSearch(recent: readonly string[], query: string, max: number): string[] {
  const text = tidySearch(query);
  const kept = [...recent].slice(0, Math.max(1, max));
  if (!text) return kept;
  const same = foldSearch(text);
  return [text, ...recent.filter((item) => foldSearch(tidySearch(item)) !== same)].slice(0, Math.max(1, max));
}

/** The list without one search. */
export const forgetSearch = (recent: readonly string[], query: string): string[] => recent.filter((item) => item !== query);

/** A recent search that begins with what was typed, and how many of its characters that is: the part to set in bold. */
export interface RecentMatch {
  text: string;
  matched: number;
}

/** How many characters of `text` its first `length` folded characters cover. A letter with its accent counts as one, and a mark that follows the last one stays with it. */
function coveredBy(text: string, length: number): number {
  let seen = 0;
  let covered = 0;
  for (const char of text) {
    const folded = foldSearch(char);
    if (seen >= length && folded !== "") break;
    seen += folded.length;
    covered += char.length;
  }
  return covered;
}

/** The recent searches that begin with the typed text, in their order, each with the length of what matched. Nothing typed matches everything, with nothing to mark. */
export function matchRecent(recent: readonly string[], typed: string): RecentMatch[] {
  const wanted = foldSearch(tidySearch(typed));
  if (!wanted) return recent.map((text) => ({ text, matched: 0 }));
  return recent.flatMap((text) => (foldSearch(tidySearch(text)).startsWith(wanted) ? [{ text, matched: coveredBy(text, wanted.length) }] : []));
}
