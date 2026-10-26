import type { ReactNode } from "react";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** "list" shows every office at once; "tabs" shows one office at a time, with its map beside it. */
export type OfficeListLayout = "list" | "tabs";

export interface OfficeHoursRange {
  /** The days this range applies to: ["mon", "tue", "wed", "thu", "fri"]. */
  days: readonly Weekday[];
  /** When the doors open, on the 24-hour clock in the office's own time zone: "09:00". */
  opens: string;
  /** When they close, the same day: "18:00". Add a second range for a lunch break. */
  closes: string;
}

export interface Office {
  /** A stable key: "amsterdam". */
  id: string;
  /** The city, which is the heading: "Amsterdam". */
  city: string;
  /** What this office is called when the city is not enough: "Head office". */
  name?: string;
  /** The postal address, a line each: street, postcode and city, country. */
  address: readonly string[];
  /** Shown as written and becomes a tel link made of its digits and a leading plus. */
  phone?: string;
  /** Becomes a mailto link and is shown as written. */
  email?: string;
  /** The office's IANA time zone: "Europe/Amsterdam". The open-now line and the week are worked out in it. */
  timeZone: string;
  /** When the office is open. A day with no range is closed. */
  hours: readonly OfficeHoursRange[];
  /** Where directions open: a maps link. */
  directionsHref?: string;
  /** A static map or your map component. It sits beside the details in the tabs layout. */
  map?: ReactNode;
}

export interface OfficeListLabels {
  /** The word that starts an open status. */
  open: string;
  /** The word that starts a closed status, and the hours of a closed day. */
  closed: string;
  /** After "Open now": when it closes. {time} is the closing time. */
  until: string;
  /** After "Closed": it opens later today. */
  opensAt: string;
  /** After "Closed": it opens tomorrow. */
  opensTomorrow: string;
  /** After "Closed": it opens on another day. {day} is the weekday. */
  opensOn: string;
  /** Between two times of a range: "09:00 to 18:00". */
  to: string;
  /** Said to a screen reader after today's weekday. */
  today: string;
  /** The small line above the week. */
  hours: string;
  /** The time zone in words. {zone} is the name of the zone. */
  zone: string;
  /** Added once the clock is known. {time} is the time in the office now. */
  localTime: string;
  /** The text of the directions link. */
  directions: string;
  /** The name of the directions link for assistive technology. {city} is the city. */
  directionsTo: string;
}
