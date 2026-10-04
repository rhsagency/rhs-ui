import { ShortcutList } from "@rhs-ui/application/shortcut-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <ShortcutList
        groups={[
          { title: "General", shortcuts: [{ action: "Open the command palette", keys: ["⌘", "K"] }, { action: "Search", keys: ["/"] }, { action: "Show shortcuts", keys: ["?"] }] },
          { title: "Navigation", shortcuts: [{ action: "Go to projects", keys: ["G", "then", "P"] }, { action: "Go to inbox", keys: ["G", "then", "I"] }, { action: "Back", keys: ["⌘", "["] }] },
          { title: "Tasks", shortcuts: [{ action: "New task", keys: ["C"] }, { action: "Assign to me", keys: ["I"] }, { action: "Mark done", keys: ["⌘", "Enter"] }] },
        ]}
      />
    </div>
  );
}
