/** The four states a table body can be in besides showing rows. */
export type TableBodyStateKind = "loading" | "empty" | "filtered-empty" | "error";

/** The words the state says on its own, for another language or your own wording. `{noun}` is filled in. */
export interface TableStateLabels {
  /** What a screen reader hears while rows load. Default "Loading {noun}". */
  loading: string;
  /** The button of the failed state. Default "Retry". */
  retry: string;
  /** The button of the no-results state. Default "Clear filters". */
  clear: string;
  /** What a screen reader hears before the list of active filters. Default "Active filters". */
  filters: string;
}

export const DEFAULT_STATE_LABELS = {
  loading: "Loading {noun}",
  retry: "Retry",
  clear: "Clear filters",
  filters: "Active filters",
} satisfies TableStateLabels;

/** Fills `{noun}` in a sentence. */
export const fillNoun = (template: string, noun: string) => template.replace("{noun}", noun);

/** The title and the line under it that a message state shows when you give none, written from the noun of the rows ("orders"). */
export function defaultCopy(state: Exclude<TableBodyStateKind, "loading">, noun: string): { title: string; description: string } {
  switch (state) {
    case "empty":
      return { title: `No ${noun} yet`, description: `${noun.charAt(0).toUpperCase()}${noun.slice(1)} you add will show up here.` };
    case "filtered-empty":
      return { title: `No ${noun} match these filters`, description: "Remove a filter or widen the range to see more." };
    case "error":
      return { title: `We could not load ${noun}`, description: "The request failed before any rows came back. Check your connection and try again." };
  }
}

/** How long each skeleton bar may grow, by column, so a loading table looks like data and not like stripes. A bar is as wide as its cell up to this, so a narrow screen never has to scroll. The first column is the longest: it usually holds a name. */
export const BAR_WIDTHS = ["max-w-32", "max-w-20", "max-w-24", "max-w-14", "max-w-28", "max-w-16"] as const;
