"use client";

import { useState } from "react";

import { IconCopy, IconDownload, IconEdit, IconShare, IconTrash } from "@rhs-ui/icons";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@rhs-ui/primitives/context-menu";

export default function Demo(): React.JSX.Element {
  const [pinned, setPinned] = useState(false);
  const [last, setLast] = useState("Right-click the file, or focus it and press Shift+F10.");
  return (
    <div className="flex flex-col items-center gap-3">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button" className="grid h-36 w-64 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            brand-guidelines.pdf {pinned ? "· pinned" : ""}
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel>brand-guidelines.pdf</ContextMenuLabel>
          <ContextMenuItem onSelect={() => setLast("Renaming.")}>
            <IconEdit /> Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLast("Duplicated.")}>
            <IconCopy /> Duplicate <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLast("Link copied.")}>
            <IconShare /> Copy link
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLast("Downloading.")}>
            <IconDownload /> Download
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem checked={pinned} onCheckedChange={(checked) => setPinned(checked === true)}>
            Pin to sidebar
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => setLast("Moved to the bin. Not really: this is a preview.")}>
            <IconTrash /> Move to bin
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last}
      </p>
    </div>
  );
}
