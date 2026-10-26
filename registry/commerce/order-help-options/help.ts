import type { ReactNode } from "react";

/** Where an order is. Packed means it has left the picking shelf: it can no longer be changed or cancelled, and it has not shipped yet. */
export type OrderHelpStatus = "processing" | "packed" | "shipped" | "delivered" | "cancelled";

export interface OrderHelpOrder {
  /** The number the customer knows: "NW-20418". */
  number: string;
  /** Where the order is. It decides which actions are open and what the sentence under the heading says. */
  status: OrderHelpStatus;
  /** When it was delivered, as an ISO date or date-time. */
  deliveredAt?: string;
  /** The last day a return can be started, as an ISO date: "2026-11-14". */
  returnUntil?: string;
}

export interface OrderHelpAction {
  /** Identity of the action, handed to `onSelect`. `track`, `change-address`, `cancel`, `return` and `report` get their own icon. */
  id: string;
  /** What the action is: "Cancel the order". */
  title: string;
  /** One line on what it does. */
  description: string;
  /** Whether it can be used now. An unavailable action stays in the list with its reason, drawn dimmed and marked aria-disabled: Tab still lands on it, so the reason is read out, and pressing it does nothing. */
  available: boolean;
  /** Why it cannot be used, in words, with the date when there is one. Shown under the description of an unavailable action. */
  reason?: string;
  /** Where the action goes, when that is a page. The button is then a link. */
  href?: string;
  /** The words on the button. Defaults to the title. */
  label?: string;
  /** The one action to push: its button is solid, the others are outlined. */
  primary?: boolean;
  /** Your own icon, drawn at 18px. */
  icon?: ReactNode;
}

/** The words of the actions an order starts with. Every one can be replaced through `labels`. */
export interface OrderHelpWords {
  /** The title of the track action. */
  trackTitle: string;
  /** What tracking does, under its title. */
  trackText: string;
  /** The words on the track button. */
  trackLabel: string;
  /** Why tracking is not open yet: the order has not shipped. */
  trackNotShipped: string;
  /** Why tracking is closed: the order has arrived. */
  trackDelivered: string;
  /** The title of the change-address action. */
  addressTitle: string;
  /** What changing the address does, under its title. */
  addressText: string;
  /** The words on the change-address button. */
  addressLabel: string;
  /** Why the address can no longer be changed: the order is packed or on its way. */
  addressClosed: string;
  /** The title of the cancel action. */
  cancelTitle: string;
  /** What cancelling does, under its title. */
  cancelText: string;
  /** The words on the cancel button. */
  cancelLabel: string;
  /** Why cancelling is closed once the order is packed. */
  cancelClosed: string;
  /** Why cancelling is closed once the order has shipped. */
  cancelShipped: string;
  /** Why cancelling is closed once the order has been delivered. */
  cancelDelivered: string;
  /** The title of the return action. */
  returnTitle: string;
  /** What returning does, under its title. */
  returnText: string;
  /** Added to the return text while the window is open. `{date}` is the last day to start a return. */
  returnUntil: string;
  /** The words on the return button. */
  returnLabel: string;
  /** Why a return is not open yet: the order has not been delivered. */
  returnNotYet: string;
  /** Why a return is closed once the window has passed. `{date}` is the day the window closed. */
  returnClosed: string;
  /** The title of the report action. */
  reportTitle: string;
  /** What reporting a problem does, under its title. */
  reportText: string;
  /** The words on the report button. */
  reportLabel: string;
  /** Given for an action that has no use on a cancelled order. */
  orderCancelled: string;
}

export const HELP_WORDS: OrderHelpWords = {
  trackTitle: "Track your order",
  trackText: "See where the parcel is and when it arrives.",
  trackLabel: "Track",
  trackNotShipped: "Tracking starts when the order ships.",
  trackDelivered: "This order has been delivered.",
  addressTitle: "Change the delivery address",
  addressText: "Send this order somewhere else.",
  addressLabel: "Change address",
  addressClosed: "The address can only be changed until the order is packed.",
  cancelTitle: "Cancel the order",
  cancelText: "Stop it before it ships and get a full refund.",
  cancelLabel: "Cancel order",
  cancelClosed: "Cancelling closes when the order is packed.",
  cancelShipped: "It has left us already. You can return it once it arrives.",
  cancelDelivered: "A delivered order cannot be cancelled. You can return items instead.",
  returnTitle: "Return items",
  returnText: "Send something back for a refund or an exchange.",
  returnUntil: "Possible until {date}.",
  returnLabel: "Start return",
  returnNotYet: "You can return items once the order has been delivered.",
  returnClosed: "The return window closed on {date}.",
  reportTitle: "Report a problem",
  reportText: "Something missing, damaged or not as described?",
  reportLabel: "Report",
  orderCancelled: "This order was cancelled.",
};

/**
 * The calendar day of a moment in a time zone, as "2026-11-14". A bare date already is a calendar day and is
 * never shifted by the zone. Null when the value is not a date.
 */
export function dayKeyOf(value: string | number | Date, timeZone: string): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  let zone = timeZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    zone = "UTC";
  }
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export interface HelpContext {
  /** Today as a calendar day in the shop's time zone, "2026-10-26". Null while it is not known (before the browser has loaded): the return window then counts as open. */
  today: string | null;
  /** Writes a date in words. */
  date: (value: string) => string;
  /** The words the actions are written in: the defaults with any `labels` laid over them. */
  words: OrderHelpWords;
}

const fill = (template: string, date: string): string => template.replace("{date}", date);

/**
 * What an order can still do, worked out from where it is: track while it ships, change the address and cancel
 * only until it is packed, return from delivery until the window closes, report a problem always. Every action
 * that is not possible stays in the list with the reason in words, and a date where the reason has one.
 */
export function helpActionsFor(order: OrderHelpOrder, { today, date, words }: HelpContext): OrderHelpAction[] {
  const { status } = order;
  const cancelled = status === "cancelled";
  const beforePacking = status === "processing";
  const closes = order.returnUntil ? dayKeyOf(order.returnUntil, "UTC") : null;
  const returnOpen = status === "delivered" && (closes === null || today === null || today <= closes);

  return [
    {
      id: "track",
      title: words.trackTitle,
      description: words.trackText,
      label: words.trackLabel,
      available: status === "shipped",
      reason: cancelled ? words.orderCancelled : status === "delivered" ? words.trackDelivered : words.trackNotShipped,
      primary: status === "shipped",
    },
    {
      id: "change-address",
      title: words.addressTitle,
      description: words.addressText,
      label: words.addressLabel,
      available: beforePacking,
      reason: cancelled ? words.orderCancelled : words.addressClosed,
    },
    {
      id: "cancel",
      title: words.cancelTitle,
      description: words.cancelText,
      label: words.cancelLabel,
      available: beforePacking,
      reason: cancelled ? words.orderCancelled : status === "packed" ? words.cancelClosed : status === "shipped" ? words.cancelShipped : words.cancelDelivered,
    },
    {
      id: "return",
      title: words.returnTitle,
      description: returnOpen && order.returnUntil ? `${words.returnText} ${fill(words.returnUntil, date(order.returnUntil))}` : words.returnText,
      label: words.returnLabel,
      available: returnOpen,
      reason: cancelled ? words.orderCancelled : status === "delivered" && order.returnUntil ? fill(words.returnClosed, date(order.returnUntil)) : words.returnNotYet,
      primary: returnOpen,
    },
    {
      id: "report",
      title: words.reportTitle,
      description: words.reportText,
      label: words.reportLabel,
      available: true,
    },
  ];
}
