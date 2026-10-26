import type { ReactNode } from "react";

import { IconDoor, IconMailbox, IconUserCheck, IconUsers } from "@rhs-ui/icons";

/** The extra fields a choice can ask for. */
export type DeliveryField = "neighbour" | "code" | "phone" | "note";

/** What the customer filled in. It is what `onChange` receives. */
export interface DeliveryInstructionsValue {
  /** The `value` of the drop-off choice that is selected. */
  dropOff: string;
  /** Where the neighbour lives: "14, Van Dijk". */
  neighbour: string;
  /** The access or gate code. */
  code: string;
  /** A number the courier can call. */
  phone: string;
  /** Anything else the courier should know. */
  note: string;
  /** True once "Save as default" is ticked: the same instructions are used for the next orders. */
  saveAsDefault: boolean;
}

/** One way to receive the parcel. */
export interface DeliveryOption {
  /** What `dropOff` becomes when this card is chosen. */
  value: string;
  /** The name on the card: "Leave at the door". */
  title: string;
  /** The line about the risk it carries: say what could go wrong. */
  description: string;
  /** A small icon, drawn at 16px. */
  icon?: ReactNode;
  /** A short word on the card, for the safe choice: "Safest". */
  flag?: string;
  /** The extra fields this choice needs. They appear when it is chosen and go when it is not. Defaults to all of them. */
  fields?: readonly DeliveryField[];
}

export const ALL_FIELDS: readonly DeliveryField[] = ["neighbour", "code", "phone", "note"];

/** The four usual ways, with the safest first. */
export const DEFAULT_OPTIONS: readonly DeliveryOption[] = [
  { value: "hand", title: "Hand it to me", description: "Someone has to be home, so nothing is left outside.", flag: "Safest", icon: <IconUserCheck />, fields: ["code", "phone", "note"] },
  { value: "door", title: "Leave at the door", description: "Quickest, but the parcel sits outside until you find it.", icon: <IconDoor />, fields: ["code", "phone", "note"] },
  { value: "neighbour", title: "Give to a neighbour", description: "A neighbour signs for it, so make sure they know it is coming.", icon: <IconUsers />, fields: ["neighbour", "code", "phone", "note"] },
  { value: "locker", title: "Use a parcel locker", description: "Collect it with a code within 3 days. Nobody has to be home.", icon: <IconMailbox />, fields: [] },
];

export const EMPTY: DeliveryInstructionsValue = { dropOff: "", neighbour: "", code: "", phone: "", note: "", saveAsDefault: false };

/** The fields a choice shows, in the order of the form, leaving out the phone when the shop does not ask for one. Nothing is shown until a choice is made. */
export function fieldsOf(option: DeliveryOption | undefined, showPhone: boolean): readonly DeliveryField[] {
  if (!option) return [];
  const wanted = option.fields ?? ALL_FIELDS;
  return ALL_FIELDS.filter((field) => wanted.includes(field) && (field !== "phone" || showPhone));
}
