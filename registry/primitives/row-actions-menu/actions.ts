import type { ReactNode } from "react";

/** One thing the menu of a row can do. */
export interface RowAction {
  /** What `onAction` is called with. Unique in the menu. */
  id: string;
  /** What the item says: a short verb ("Duplicate", "Delete"). The name of the row is added where a sentence needs it ("Delete Invoice 1042?"). */
  label: string;
  /** An icon element drawn before the label: `<IconEdit />`. It is decoration, so the label has to stand alone. */
  icon?: ReactNode;
  /** The keys that do the same from the keyboard, shown at the end of the item: "⌘D". It is display only: bind the keys yourself. */
  shortcut?: string;
  /** Items with the same group sit together, and a rule divides one group from the next. Groups keep the order in which they first appear. Default: one group. */
  group?: string;
  /** The item asks before it acts: it opens a small popover next to the button with the question, Cancel and the action itself. Cancel has the focus. */
  destructive?: boolean;
  /** The item cannot be used now. It stays in the menu, in the tab order, so its reason can be found. */
  disabled?: boolean;
  /** Why a disabled item cannot be used, in a short sentence: "Already paid". It is written under the label and read with the item. */
  disabledReason?: string;
  /** The line under the question of the confirm popover: "The customer keeps the copy they received." */
  confirmDescription?: string;
}

/** The actions in their groups, in the order the groups first appear, each group in the order of its items. */
export function groupActions(actions: readonly RowAction[]): { key: string; items: RowAction[] }[] {
  const groups = new Map<string, RowAction[]>();
  for (const action of actions) {
    const key = action.group ?? "";
    const list = groups.get(key);
    if (list) list.push(action);
    else groups.set(key, [action]);
  }
  return [...groups].map(([key, items]) => ({ key, items }));
}
