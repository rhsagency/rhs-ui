import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface Shortcut {
  /** What it does: "Open the command palette". */
  action: string;
  /** Keys pressed together, e.g. ["⌘", "K"]; a sequence uses "then": ["G", "then", "P"]. */
  keys: readonly string[];
}

export interface ShortcutListProps {
  groups: readonly { title: string; shortcuts: readonly Shortcut[] }[];
  className?: string;
}

/**
 * The keyboard cheat sheet for a help panel or a dialog: groups of actions
 * with their keys right-aligned. Sequences show "then" between keys, so
 * "G then P" never reads as a chord.
 */
export function ShortcutList({ groups, className }: ShortcutListProps) {
  return (
    <div data-slot="shortcut-list" className={cn("grid gap-8 sm:grid-cols-2", className)}>
      {groups.map((group) => (
        <section key={group.title}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{group.title}</h3>
          <dl className="divide-y divide-border">
            {group.shortcuts.map((shortcut) => (
              <div key={shortcut.action} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt>{shortcut.action}</dt>
                <dd>
                  <KbdGroup>
                    {shortcut.keys.map((key, index) => (key === "then" ? <span key={index} className="px-0.5 text-xs text-muted-foreground">then</span> : <Kbd key={index}>{key}</Kbd>))}
                  </KbdGroup>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
