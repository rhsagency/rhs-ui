"use client";

import { useRef, useState, type ReactElement } from "react";

import { IconClose } from "@rhs-ui/icons";
import type { FolderNode, MoveToLabels } from "@rhs-ui/application/move-to-dialog/folders";
import { MoveToPanel } from "@rhs-ui/application/move-to-dialog/panel";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { FolderNode, MoveToLabels } from "@rhs-ui/application/move-to-dialog/folders";
export { MoveToPanel, type MoveToPanelProps } from "@rhs-ui/application/move-to-dialog/panel";
export { FolderTree, type FolderCreation, type FolderTreeProps } from "@rhs-ui/application/move-to-dialog/tree";

export interface MoveToDialogProps {
  /** The tree of folders, as nested nodes: `{ id, name, children, disabled, reason }`. Folders made in the dialog are added to it until your own list holds them too. */
  folders: readonly FolderNode[];
  /** The folder the items are in now. While moving it is marked "Already here" and cannot be chosen; while copying it is only marked. Its branch starts open. */
  currentFolderId?: string;
  /** The ids of folders that are themselves among the items. They, and everything inside them, cannot be the destination, and each says why. */
  movingIds?: readonly string[];
  /** How many items are on their way: it is in the title and in the sentence at the foot. Default 1. */
  itemCount?: number;
  /** Moving or copying. Default "move". */
  mode?: "move" | "copy";
  /** Does it, with the id of the chosen folder, for both modes. Return a promise: the dialog locks while it runs and closes when it resolves; when it rejects the dialog stays open with the message above the tree. */
  onMove: (folderId: string) => void | Promise<void>;
  /** Adds "New folder" and makes the folder, inside `parentId` (null for the top level) and named `name`. Resolve with the new folder's id, or the folder itself, so it can be chosen; reject to show why it failed. */
  onCreateFolder?: (parentId: string | null, name: string) => string | FolderNode | undefined | void | Promise<string | FolderNode | undefined | void>;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while the items are on their way is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the numbers and of "1 item" against "3 items". Default "en-US". */
  locale?: string;
  /** The words the dialog says, for translation. */
  labels?: MoveToLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * Pick the destination folder for one item or many. A searchable tree with a file manager's keyboard, where the search expands
 * the matching branches; the folder the items are in is marked "Already here", and folders that cannot take them (the items
 * themselves and what is inside them) are disabled with the reason. New folder adds a field under the selection without leaving
 * the dialog. The foot spells the destination out as a path ("Moving 3 items to Projects / 2026 / Halcyon") and the button
 * names the folder, and the folder that is chosen is always in view in the tree. On a narrow dialog the reason a folder cannot be
 * chosen takes a second line under its name. Moving or copying, the dialog locks while it works and says why when it fails.
 */
export function MoveToDialog({ folders, currentFolderId, movingIds, itemCount, mode, onMove, onCreateFolder, trigger, open, defaultOpen = false, onOpenChange, locale, labels, className }: MoveToDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const busyNow = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const isOpen = open ?? ownOpen;

  function change(next: boolean) {
    // Items that are on their way cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        ref={content}
        data-slot="move-to-dialog"
        showCloseButton={false}
        // Focus starts in the tree, on the folder the arrow keys start from: the keyboard is at work at once, and a phone is not made to raise its keyboard for the search field.
        onOpenAutoFocus={(event) => {
          const row = content.current?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]');
          if (!row) return;
          event.preventDefault();
          row.focus({ preventScroll: true });
        }}
        // A field that is in the middle of something (a new folder's name, a search with text) takes Escape for itself and gives that up first; the dialog closes on the next one.
        onEscapeKeyDown={(event) => {
          if (busyNow.current || document.activeElement?.closest("[data-escape-local]")) event.preventDefault();
        }}
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg", className)}
      >
        <MoveToPanel
          folders={folders}
          currentFolderId={currentFolderId}
          movingIds={movingIds}
          itemCount={itemCount}
          mode={mode}
          onMove={onMove}
          onCreateFolder={onCreateFolder}
          locale={locale}
          labels={labels}
          onClose={() => change(false)}
          onBusyChange={(next) => {
            busyNow.current = next;
            setBusy(next);
          }}
        />
        <DialogClose asChild>
          <button
            type="button"
            disabled={busy}
            aria-label={labels?.closeIcon ?? "Close"}
            // Level with the title: the header starts 8px lower from sm up (sm:pt-6), and the button goes down with it.
            className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 sm:top-[1.3125rem]"
          >
            <IconClose size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
