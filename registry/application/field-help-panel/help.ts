import type { ReactNode } from "react";

/**
 * What the panel says about one field. The keys of the `help` record are the
 * ids that fields carry in their `data-help-id` attribute.
 */
export interface FieldHelp {
  /** The heading of the help: "Why we ask for your tax number". It is also the title of the help's bar below 1024px, where it takes a line or two until the bar is opened. */
  title: string;
  /** Why the field is asked, in a sentence or two. Paragraphs, a list or a link are fine. */
  body: ReactNode;
  /** An example of a good answer, set in a quiet box labelled "Example": "NL123456789B01". */
  example?: string;
  /** What happens to the answer next: "We check it against the register within a minute." */
  next?: string;
  /** A link to the longer explanation. An address that starts with http opens in a new tab. */
  link?: { label: string; href: string };
}

/** The words the panel says, for translation. */
export interface FieldHelpPanelLabels {
  /** The small heading that names the panel, a complementary region. Default "About this question". */
  region?: string;
  /** The pin button. Its name stays the same and it reports aria-pressed while the help is pinned; the pin is drawn filled and the button tinted. Default "Pin". */
  pin?: string;
  /** What is said politely when the help is pinned. Default "Help pinned. It stays until you unpin it." */
  pinnedNote?: string;
  /** What is said politely when the help is released. Default "Help unpinned." */
  unpinnedNote?: string;
  /** The label over an example. Default "Example". */
  example?: string;
  /** The label over what happens next. Default "What happens next". */
  next?: string;
}

export const DEFAULT_LABELS = {
  region: "About this question",
  pin: "Pin",
  pinnedNote: "Help pinned. It stays until you unpin it.",
  unpinnedNote: "Help unpinned.",
  example: "Example",
  next: "What happens next",
} satisfies Required<FieldHelpPanelLabels>;

export type Words = Required<FieldHelpPanelLabels>;
