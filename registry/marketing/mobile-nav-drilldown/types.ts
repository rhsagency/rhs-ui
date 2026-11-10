/** A link inside the panel of a group. */
export interface DrilldownLink {
  label: string;
  href: string;
  /** One line under the label, such as what the page is for. */
  description?: string;
}

/**
 * A row of the root list. With `links` it opens a panel of its own; without,
 * it is a plain link to `href`. The shape is the one MobileMenu takes, so one
 * list of data can feed both menus.
 */
export interface DrilldownGroup {
  label: string;
  /** The group's own page. A group with links offers it as the first row of its panel; a group without links needs it. */
  href?: string;
  links?: readonly DrilldownLink[];
}

/** The fixed words, for a site that is not in English. */
export interface DrilldownLabels {
  /** The name of the menu: the title of the sheet, the label of the root panel and what the Back row of a group says. */
  menu: string;
  /** What the sheet is for, read to a screen reader when it opens. */
  description: string;
  /** The name of the button that opens the sheet. */
  open: string;
  /** The name of the button that closes it. */
  close: string;
  /** The name of the Back row for a screen reader. {name} is the panel it returns to. */
  back: string;
  /** The first row of a group's panel, a link to the group's own page. {name} is the group. */
  all: string;
  /** Said after a group that holds the page you are on. */
  currentSection: string;
}

export const DRILLDOWN_LABELS: DrilldownLabels = {
  menu: "Menu",
  description: "Every page of this site. A row with a chevron opens its own panel.",
  open: "Open the menu",
  close: "Close the menu",
  back: "Back to {name}",
  all: "All {name}",
  currentSection: "holds the current page",
};

/** The id of the first panel, the one that lists the groups. */
export const ROOT_PANEL = "root";
