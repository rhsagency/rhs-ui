"use client";

import { useRef, useState, type ReactElement } from "react";

import { IconClose } from "@rhs-ui/icons";
import type { DuplicateLabels, DuplicateOption } from "@rhs-ui/application/duplicate-dialog/duplicate";
import { DuplicatePanel, type DuplicateValues } from "@rhs-ui/application/duplicate-dialog/panel";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { DuplicateLabels, DuplicateOption } from "@rhs-ui/application/duplicate-dialog/duplicate";
export { DuplicatePanel, type DuplicatePanelProps, type DuplicateValues } from "@rhs-ui/application/duplicate-dialog/panel";

export interface DuplicateDialogProps {
  /** The name of the thing being copied: "Halcyon launch". The copy starts as "Halcyon launch (copy)". */
  sourceName: string;
  /** What can come along: each with a label, a count, whether it starts ticked, and whether it can be changed. */
  options?: readonly DuplicateOption[];
  /** Names that are already used, so the suggestion steers around them and a clashing name is refused with a way out. */
  existingNames?: readonly string[];
  /** What is being copied, as a lower-case noun: "project", "document", "board". Default "item". */
  kind?: string;
  /**
   * Makes the copy with `{ name, include }`. Return a promise: the fields lock and the button shows progress while it runs, and
   * the dialog cannot be closed. Resolve with the new item's address and the form is replaced by "Copy created" and an Open link;
   * reject and the form stays as it was, with the message above it.
   */
  onDuplicate: (values: DuplicateValues) => void | string | undefined | Promise<void | string | undefined>;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while the copy is made is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the numbers and of the way the list at the foot is joined. Default "en-US". */
  locale?: string;
  /** The words the dialog says, for translation. */
  labels?: DuplicateLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * Duplicate a project, a document or a board. The name starts as a suggestion that steers around names already used, each
 * option says how much it includes ("Tasks, 48"), and the foot states what will happen ("Copies 48 tasks and 12 files"). While
 * the copy is made the fields lock, the button shows progress and the dialog will not close; when it is ready the form is
 * replaced by "Copy created" and a link to it, and when it fails the form stays with its error, so nothing has to be
 * retyped. Everything is fresh each time it opens.
 */
export function DuplicateDialog({ sourceName, options, existingNames, kind, onDuplicate, trigger, open, defaultOpen = false, onOpenChange, locale, labels, className }: DuplicateDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const busyNow = useRef(false);
  const isOpen = open ?? ownOpen;
  const closeName = labels?.closeIcon ?? "Close";

  function change(next: boolean) {
    // A copy that is half made cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent data-slot="duplicate-dialog" showCloseButton={false} className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg", className)}>
        <DuplicatePanel
          sourceName={sourceName}
          options={options}
          existingNames={existingNames}
          kind={kind}
          onDuplicate={onDuplicate}
          locale={locale}
          labels={labels}
          onBusyChange={(next) => {
            busyNow.current = next;
            setBusy(next);
          }}
        />
        <DialogClose asChild>
          <button
            type="button"
            disabled={busy}
            aria-label={closeName}
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
