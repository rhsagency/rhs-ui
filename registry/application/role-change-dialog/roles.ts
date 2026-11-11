/**
 * The comparison and the words behind RoleChangeDialog, as plain types and
 * functions: they hold no state, so a Server Component can use them too.
 */

/** One thing a role lets someone do. A plain string stands for itself; an object lets the id and the words differ. */
export type RoleCapability = string | { id: string; label: string };

/** A capability in the shape the comparison works with. */
export interface Capability {
  /** What two roles are compared by: the same id on both sides means the same capability. */
  id: string;
  /** The words people read. */
  label: string;
}

/** A role, with everything it allows. */
export interface RoleInfo {
  /** A stable identity from your own data: "editor". */
  id: string;
  /** What people call it: "Editor". */
  name: string;
  /** Everything this role allows, in the order it should be read. Roles are compared by these, so list all of them, not only the extras. */
  capabilities: readonly RoleCapability[];
  /** A role that hands out control, such as Owner. Promoting someone to it asks for their email to be typed first. */
  powerful?: boolean;
}

/** The person whose role changes. */
export interface RoleMember {
  /** Their name. */
  name: string;
  /** Their email address. It is what has to be typed to confirm a promotion to a powerful role, and it is shown under the name. */
  email?: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** What `onConfirm` receives: the whole change. */
export interface RoleChange {
  member: RoleMember;
  fromRole: RoleInfo;
  toRole: RoleInfo;
}

/** How a change moves: it only adds, only takes away, does both, or changes nothing a person could notice. */
export type RoleChangeKind = "upgrade" | "downgrade" | "mixed" | "same";

/** Two roles side by side. */
export interface RoleComparison {
  /** In the new role and not in the old one. */
  gains: Capability[];
  /** In the old role and not in the new one. */
  loses: Capability[];
  /** In both. */
  keeps: Capability[];
  kind: RoleChangeKind;
}

/** The words the dialog says, for translation. `{name}`, `{role}`, `{from}`, `{to}`, `{value}` and `{count}` are filled in. */
export interface RoleChangeLabels {
  /** The title. Default "Change role for {name}". */
  title?: string;
  /** The line under it. Default "Check what changes before you confirm." */
  description?: string;
  /** Read out for the two role chips. Default "Role changes from {from} to {to}". */
  transition?: string;
  /** The heading over what is added. Default "Gains". */
  gains?: string;
  /** The heading over what is taken away. Default "Loses". */
  loses?: string;
  /** Said under "Gains" when there is nothing. Default "Nothing new". */
  nothingGained?: string;
  /** Said under "Loses" when there is nothing. Default "Nothing is taken away". */
  nothingLost?: string;
  /** Under the lists, for one capability both roles have. Default "{count} other permission stays the same." */
  keepsOne?: string;
  /** The same for any other number. Default "{count} other permissions stay the same." */
  keepsMany?: string;
  /** Shown when the change takes something away and `warnOnDowngrade` is on. Default "{name} loses these permissions as soon as you confirm." */
  warning?: string;
  /** Shown above the typed confirmation. Default "{role} is a powerful role. Make sure this is the right person." */
  powerful?: string;
  /** The label of the field. Default "Type {value} to confirm". */
  typeLabel?: string;
  /** Shown in the field once what was typed matches. Default "Matches". */
  typeMatched?: string;
  /** Why the button is off when both roles allow the same. Default "These two roles allow exactly the same things." */
  sameRole?: string;
  /** Why the last owner cannot be demoted. Default "{name} is the last owner. Make someone else an owner first, then change this role." */
  lastOwner?: string;
  /** The button. Default "Change to {role}". */
  confirm?: string;
  /** The button while the change is being made. Default "Changing role". */
  confirming?: string;
  /** The button after a failure. Default "Try again". */
  retry?: string;
  /** The other button. Default "Cancel". */
  cancel?: string;
  /** The title once it worked. Default "Role changed". */
  done?: string;
  /** The line under it. Default "{name} now has the {role} role." */
  doneBody?: string;
  /** The button that closes the dialog afterwards. Default "Done". */
  close?: string;
  /** The title of the message when it failed. Default "The role was not changed". */
  failed?: string;
  /** The message when it failed and the error says nothing. Default "Something went wrong and nothing was changed. Try again in a moment." */
  failedBody?: string;
}

export const DEFAULT_LABELS = {
  title: "Change role for {name}",
  description: "Check what changes before you confirm.",
  transition: "Role changes from {from} to {to}",
  gains: "Gains",
  loses: "Loses",
  nothingGained: "Nothing new",
  nothingLost: "Nothing is taken away",
  keepsOne: "{count} other permission stays the same.",
  keepsMany: "{count} other permissions stay the same.",
  warning: "{name} loses these permissions as soon as you confirm.",
  powerful: "{role} is a powerful role. Make sure this is the right person.",
  typeLabel: "Type {value} to confirm",
  typeMatched: "Matches",
  sameRole: "These two roles allow exactly the same things.",
  lastOwner: "{name} is the last owner. Make someone else an owner first, then change this role.",
  confirm: "Change to {role}",
  confirming: "Changing role",
  retry: "Try again",
  cancel: "Cancel",
  done: "Role changed",
  doneBody: "{name} now has the {role} role.",
  close: "Done",
  failed: "The role was not changed",
  failedBody: "Something went wrong and nothing was changed. Try again in a moment.",
} satisfies Required<RoleChangeLabels>;

/** Puts values into a template: `fill("{name} now has the {role} role.", { name, role })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** `one` for 1 in the locale's own rules, `other` for the rest. */
export function plural(count: number, one: string, other: string, locale: string): string {
  try {
    return new Intl.PluralRules(locale).select(count) === "one" ? one : other;
  } catch {
    return count === 1 ? one : other;
  }
}

/** A capability as an id and a label, whichever way it was given. */
export function capabilityOf(capability: RoleCapability): Capability {
  return typeof capability === "string" ? { id: capability.trim(), label: capability } : capability;
}

/**
 * What changes when someone moves from one role to another: what they gain, what they lose and what stays, worked out from
 * the two lists of capabilities so nobody has to remember what "Editor" means.
 */
export function compareRoles(from: RoleInfo, to: RoleInfo): RoleComparison {
  const before = new Map<string, Capability>();
  for (const capability of from.capabilities) {
    const entry = capabilityOf(capability);
    if (!before.has(entry.id)) before.set(entry.id, entry);
  }
  const after = new Map<string, Capability>();
  for (const capability of to.capabilities) {
    const entry = capabilityOf(capability);
    if (!after.has(entry.id)) after.set(entry.id, entry);
  }
  const gains = [...after.values()].filter((entry) => !before.has(entry.id));
  const loses = [...before.values()].filter((entry) => !after.has(entry.id));
  const keeps = [...after.values()].filter((entry) => before.has(entry.id));
  const kind: RoleChangeKind = gains.length && loses.length ? "mixed" : gains.length ? "upgrade" : loses.length ? "downgrade" : "same";
  return { gains, loses, keeps, kind };
}

/** What has to be typed to confirm: the email address, or the name when there is none. */
export function confirmValueOf(member: RoleMember): string {
  return (member.email ?? member.name).trim();
}

/** Typed text and the expected text, compared without the case and the spaces around them. */
export function sameText(typed: string, expected: string): boolean {
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}

/** The message a refused change carries, when it carries one worth showing: an `Error` with text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message.trim() : "";
}
