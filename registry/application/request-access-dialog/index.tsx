"use client";

import { useRef, useState, type ReactElement } from "react";

import { IconClose } from "@rhs-ui/icons";
import { RequestAccessPanel } from "@rhs-ui/application/request-access-dialog/panel";
import type { AccessOwner, AccessRequest, RequestAccessLabels, RequestLevel, RequestTime } from "@rhs-ui/application/request-access-dialog/request";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type {
  AccessOwner,
  AccessRequest,
  RequestAccessLabels,
  RequestLevel,
  RequestTime,
} from "@rhs-ui/application/request-access-dialog/request";
export { RequestAccessPanel, type RequestAccessPanelProps } from "@rhs-ui/application/request-access-dialog/panel";

export interface RequestAccessDialogProps {
  /** What is locked: "Q4 launch plan". It is named in the first sentence and in the last of the success. */
  resourceName: string;
  /** Who can say yes. They are named as the one who receives the request. */
  owner: AccessOwner;
  /** What can be asked for, such as View and Edit: an id, a label and a line on what each allows. With one level there is nothing to choose, and the choice is left out. */
  levels: readonly RequestLevel[];
  /** The `id` of the level that starts chosen. Default: the first. */
  defaultLevel?: string;
  /**
   * Sends the request with `{ level, message }`. Return a promise: the fields lock and the button shows progress while it runs, and
   * the dialog cannot be closed. When it resolves the form is replaced by "Request sent to Maya Okafor" and what to expect. When it
   * rejects the form stays as it was, with the note still in it and the message above the buttons.
   */
  onRequest: (request: AccessRequest) => void | Promise<void>;
  /** The address the person is signed in with. It says as whom they are asking, and where the answer will go. */
  signedInAs?: string;
  /** When the person already asked: a Date, an ISO string or a timestamp. The dialog then says "Already requested 2 hours ago" and offers to send it again. */
  pendingSince?: RequestTime;
  /** The moment "2 hours ago" is measured from. Leave it out to use the browser's clock once the page is live; pass it for the words in server HTML, in tests and in previews. */
  now?: RequestTime;
  /** The most characters the note takes. Default 280. */
  maxLength?: number;
  /** Show the owner's email address under their name. Off by default: it is theirs to share. */
  showOwnerEmail?: boolean;
  /** The language of the words and the dates. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in before the browser's clock is known, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while the request is sent is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: RequestAccessLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * For someone who lands on a document, a project or a folder they cannot open: ask the owner for access. The dialog says who
 * receives the request and as whom the person is asking ("You are signed in as dana@halcyon.example"), offers the level they
 * need as a short radio group, and takes an optional note with a counter. While it is sent the fields lock and the dialog will
 * not close; a success replaces the form with "Request sent to Maya Okafor" and what happens next; a failure keeps the note.
 * A request that is already out is recognised ("Already requested 2 hours ago") and can be sent again. Everything is fresh each
 * time it opens.
 */
export function RequestAccessDialog({ trigger, open, defaultOpen = false, onOpenChange, labels, className, ...panel }: RequestAccessDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const busyNow = useRef(false);
  const isOpen = open ?? ownOpen;
  const closeName = labels?.closeIcon ?? "Close";

  function change(next: boolean) {
    // A request that is half sent cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent data-slot="request-access-dialog" showCloseButton={false} className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md", className)}>
        <RequestAccessPanel
          {...panel}
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
            className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
          >
            <IconClose size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
