"use client";

import { useRef, useState, type ReactElement, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import type { FeedbackDraft, FeedbackLabels, FeedbackType, FeedbackValues } from "@rhs-ui/application/feedback-dialog/feedback";
import { FeedbackPanel } from "@rhs-ui/application/feedback-dialog/panel";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { FeedbackDraft, FeedbackLabels, FeedbackType, FeedbackValues } from "@rhs-ui/application/feedback-dialog/feedback";
export { FeedbackPanel, type FeedbackPanelProps } from "@rhs-ui/application/feedback-dialog/panel";

export interface FeedbackDialogProps {
  /** Sends the feedback with `{ type, message, email, metadata }`. Return a promise: the fields lock and the button shows progress while it runs and the dialog cannot be closed; a rejection keeps the text and offers a retry; success shows the thank-you. */
  onSubmit: (values: FeedbackValues) => void | Promise<void>;
  /** The kinds of feedback, each with the prompt that becomes the hint in the message field. Default: idea, problem, praise and other. */
  types?: readonly FeedbackType[];
  /** The most characters a message can have. The counter only shows once there are few left. Default 1000. */
  maxLength?: number;
  /** Whether to ask for an email address: "optional", "required", or false to leave the field out. Default "optional". */
  askEmail?: "optional" | "required" | false;
  /** The email the field starts with, such as the signed-in person's. */
  defaultEmail?: string;
  /** A line under the email field about what the address is used for. A string, or an element with a link to your privacy policy. */
  privacyNote?: ReactNode;
  /** Facts that go along with the message, such as the page address or the app version. They are listed in plain words above the button, so what is read is what is sent. */
  metadata?: Record<string, string>;
  /** How long the thank-you stays before the dialog closes, in milliseconds. 0 keeps it until it is closed. Default 5000. */
  closeAfterMs?: number;
  /** The element that opens the dialog: the Feedback button of a header or a footer. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while the message is on its way is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: FeedbackLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * Collect product feedback in a small dialog for the Feedback button of a header or a footer. The kind of feedback is a
 * segmented control that changes the hint in the message field, the counter only appears near the limit, Send stays off
 * until there is a message, and anything in `metadata` (such as the page address) is shown in plain words before it is
 * sent. A failure keeps the text and offers a retry; a message half typed survives an accidental close; success is a
 * thank-you that says where replies go and closes by itself after a few seconds, or on Escape.
 */
export function FeedbackDialog({
  onSubmit,
  types,
  maxLength,
  askEmail,
  defaultEmail,
  privacyNote,
  metadata,
  closeAfterMs,
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
}: FeedbackDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const busyNow = useRef(false);
  const draft = useRef<FeedbackDraft | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const isOpen = open ?? ownOpen;

  function change(next: boolean) {
    // A message that is on its way cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        ref={content}
        data-slot="feedback-dialog"
        showCloseButton={false}
        // Focus starts in the message, not on the kind of feedback that comes first in the page: a person who knows what to say can start saying it.
        onOpenAutoFocus={(event) => {
          const field = content.current?.querySelector("textarea");
          if (!field) return;
          event.preventDefault();
          field.focus({ preventScroll: true });
        }}
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md", className)}
      >
        <FeedbackPanel
          onSubmit={onSubmit}
          types={types}
          maxLength={maxLength}
          askEmail={askEmail}
          defaultEmail={defaultEmail}
          privacyNote={privacyNote}
          metadata={metadata}
          closeAfterMs={closeAfterMs}
          labels={labels}
          // Closing by accident does not lose what was typed: it is here again the next time.
          defaultDraft={draft.current ?? undefined}
          onDraftChange={(next) => {
            draft.current = next;
          }}
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
