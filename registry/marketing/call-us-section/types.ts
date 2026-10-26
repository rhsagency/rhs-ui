export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface CallHoursRange {
  /** The days this range applies to: ["mon", "tue", "wed", "thu", "fri"]. */
  days: readonly Weekday[];
  /** When the line opens, on the 24-hour clock in the business's own time zone: "08:00". */
  opens: string;
  /** When it closes, the same day: "17:30". Add a second range for a lunch break; "24:00" closes at midnight. */
  closes: string;
}

export interface CallAfterHours {
  /** What the line is, said in a few words: "Emergency line, every night". */
  label: string;
  /** The number. It is shown as written and becomes a tel link made of its digits and a leading plus. */
  phone: string;
}

export interface CallAlternative {
  /** The text of the link: "Request a callback". */
  label: string;
  /** Where it goes: the callback form. */
  href: string;
  /** The question before the link: "Prefer we call you?". */
  prompt?: string;
}

export interface CallUsLabels {
  /** The word that starts an open status. */
  open: string;
  /** The word that starts a closed status. */
  closed: string;
  /** After "Open now": when the line closes. {time} stands for the closing time. */
  until: string;
  /** After "Closed": it opens later today. */
  opensAt: string;
  /** After "Closed": it opens tomorrow. */
  opensTomorrow: string;
  /** After "Closed": it opens on another day. {day} stands for the weekday. */
  opensOn: string;
  /** The name of the phone link for assistive technology. {phone} stands for the number. */
  call: string;
  /** The button that opens the whole week. */
  hours: string;
  /** Between two times of a range: "08:00 to 17:30". */
  to: string;
  /** The heading of the week panel, and its name for assistive technology. */
  weekTitle: string;
  /** Said in the week for a day with no hours. */
  closedDay: string;
  /** Said by assistive technology after the name of today in the week, in brackets: "Tuesday (today)". */
  today: string;
  /** The line under the week. {zone} stands for the name of the time zone. */
  zone: string;
  /** The tag on the after-hours line while the line is closed. */
  useNow: string;
}
