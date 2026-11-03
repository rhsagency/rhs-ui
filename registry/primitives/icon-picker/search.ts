/** What the picker searches in: lower case, with accents folded away, so "cafe" finds "Café". */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** The name of an icon for people: "arrow-up-right" becomes "Arrow up right". Used when no label was given. */
export function humanize(name: string): string {
  const words = name
    .replace(/^icon(?=[A-Z])/, "")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[-_.]+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : name;
}

export interface IconEntry<T> {
  /** The key in the icons record: what `value` is. */
  name: string;
  /** The name for people, for the search and for the accessible name. */
  label: string;
  /** Everything a search looks at: the label, the key and the keywords, folded. */
  haystack: string;
  /** The rendered icon. */
  icon: T;
}

/** The entries every word of the query matches. The words may sit anywhere and in any order, so "up arrow" finds "Arrow up". */
export function filterIcons<T>(entries: readonly IconEntry<T>[], query: string): readonly IconEntry<T>[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return words.length === 0 ? entries : entries.filter((entry) => words.every((word) => entry.haystack.includes(word)));
}

/** The width a scrollbar takes in this browser: 0 where scrollbars float over the content. Only call it in the browser. */
export function scrollbarWidth(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;width:50px;height:50px;overflow:scroll;scrollbar-width:thin";
  document.body.appendChild(probe);
  const width = probe.offsetWidth - probe.clientWidth;
  probe.remove();
  return width;
}
