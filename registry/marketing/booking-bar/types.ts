/** A stay: the first night and the day of leaving, both calendar days at midnight in the reader's own time zone. */
export interface BookingRange {
  from: Date;
  to: Date;
}

/** A range that is still being chosen: the check-in is there, the check-out may not be. */
export interface DraftRange {
  from: Date | null;
  to: Date | null;
}

export interface BookingLocation {
  /** What is sent to onSearch: "lisbon". */
  value: string;
  /** What the reader sees: "Lisbon, Portugal". */
  label: string;
  /** A second line under it: "Alfama, Baixa and Chiado". */
  description?: string;
}

export interface BookingSearch {
  /** The check-in day and the check-out day. */
  range: BookingRange;
  /** How many nights that is. */
  nights: number;
  /** How many adults. At least one. */
  adults: number;
  /** How many children. Zero when none. */
  children: number;
  /** The `value` of the chosen location, or null when the bar has none or nothing was chosen. */
  location: string | null;
}

export interface BookingBarValue {
  /** The stay the bar starts with. Days are ISO dates ("2026-12-18") or Dates; text is read as that calendar day, which keeps a Server Component's value from shifting with a time zone. */
  range?: { from: Date | string; to: Date | string } | null;
  /** How many adults. 2 by default. */
  adults?: number;
  /** How many children. 0 by default. */
  children?: number;
  /** The `value` of the chosen location. */
  location?: string | null;
}

export interface BookingBarLabels {
  /** The name of the search for assistive technology. */
  search: string;
  /** The label of the location. */
  where: string;
  /** What the location says while nothing is chosen. */
  wherePlaceholder: string;
  /** The placeholder of the search inside the list of locations, which is also its name for assistive technology. */
  whereSearch: string;
  /** Said when no location matches what was typed. */
  whereEmpty: string;
  /** The name of the list of locations for assistive technology. */
  suggestions: string;
  /** Said by assistive technology after the location that is chosen: "Lisbon, selected". */
  selected: string;
  /** The label of the dates, and the name of the calendar. */
  dates: string;
  /** What the dates say while nothing is chosen. */
  addDates: string;
  /** Between the two days of a stay: "18 Dec to 21 Dec". */
  to: string;
  /** What the dates say after the check-in, while the check-out is still to be chosen. */
  addCheckOut: string;
  /** The name of the check-in day, said by assistive technology and in the calendar. */
  checkIn: string;
  /** The name of the check-out day. It also stands in the dates while only the check-in is chosen. */
  checkOut: string;
  /** The label of the guests, and the name of the panel. */
  guests: string;
  /** The label of the adults counter. */
  adults: string;
  /** Under the adults counter. */
  adultsHint: string;
  /** The label of the children counter. */
  children: string;
  /** Under the children counter. */
  childrenHint: string;
  /** The line under the counters. {max} stands for the most guests. */
  maxGuests: string;
  /** The same line once the most is reached. {max} stands for the most guests. */
  maxReached: string;
  /** One adult. {count} stands for the number. */
  adultOne: string;
  /** Several adults. {count} stands for the number. */
  adultOther: string;
  /** One child. {count} stands for the number. */
  childOne: string;
  /** Several children. {count} stands for the number. */
  childOther: string;
  /** One night. {count} stands for the number. */
  nightOne: string;
  /** Several nights. {count} stands for the number. */
  nightOther: string;
  /** The button. */
  submit: string;
  /** Said in the calendar while nothing is chosen. */
  pickIn: string;
  /** Said in the calendar once the check-in is chosen. */
  pickOut: string;
  /** Said when the stay is shorter than the minimum. {count} stands for the number of nights. */
  minStay: string;
  /** Said under the bar when the reader searches without dates. */
  chooseDates: string;
  /** The calendar's summary of a chosen stay. {nights} stands for "3 nights", {from} and {to} for the days. */
  stay: string;
  /** The button that clears the dates. */
  clear: string;
  /** The name of the button to the month before. */
  previousMonth: string;
  /** The name of the button to the month after. */
  nextMonth: string;
}
