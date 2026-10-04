"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { ShortcutDialog } from "@rhs-ui/primitives/shortcut-dialog";

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex min-h-64 max-w-sm flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
      <Button variant="outline" onClick={() => setOpen(true)}>Keyboard shortcuts</Button>
      <p>Or press <Kbd>?</Kbd> anywhere in this preview.</p>
      <ShortcutDialog
        open={open}
        onOpenChange={setOpen}
        groups={[
          { title: "General", shortcuts: [{ keys: ["⌘", "K"], label: "Search" }, { keys: ["?"], label: "Show shortcuts" }, { keys: ["G", "H"], label: "Go home" }] },
          { title: "Tasks", shortcuts: [{ keys: ["C"], label: "New task" }, { keys: ["E"], label: "Edit task" }, { keys: ["⌘", "Enter"], label: "Save" }] },
          { title: "Board", shortcuts: [{ keys: ["Alt", "←"], label: "Move card left" }, { keys: ["Alt", "→"], label: "Move card right" }] },
        ]}
      />
    </div>
  );
}
