"use client";

import { useRef, useState, type ReactElement } from "react";

import { RoleChangePanel } from "@rhs-ui/application/role-change-dialog/panel";
import type { RoleChange, RoleChangeLabels, RoleInfo, RoleMember } from "@rhs-ui/application/role-change-dialog/roles";
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from "@rhs-ui/primitives/alert-dialog";
import { cn } from "@/lib/utils";

export type {
  Capability,
  RoleCapability,
  RoleChange,
  RoleChangeKind,
  RoleChangeLabels,
  RoleComparison,
  RoleInfo,
  RoleMember,
} from "@rhs-ui/application/role-change-dialog/roles";
export { RoleChangePanel, type RoleChangePanelProps } from "@rhs-ui/application/role-change-dialog/panel";

export interface RoleChangeDialogProps {
  /** The person whose role changes: a name, and an email that is shown under it and typed to confirm a promotion to a powerful role. */
  member: RoleMember;
  /** The role they have now, with everything it allows. */
  fromRole: RoleInfo;
  /** The role they would get, with everything it allows. Set `powerful` on it and the email has to be typed. */
  toRole: RoleInfo;
  /**
   * Makes the change. Return a promise: the field locks and the button shows progress while it runs, and the dialog cannot be
   * closed. When it resolves the form is replaced by "Role changed" and a sentence that names the person and the new role. When it
   * rejects the form stays as it was, with the message above the buttons, so nothing has to be retyped.
   */
  onConfirm: (change: RoleChange) => void | Promise<void>;
  /** Warn that the change takes something away, above the buttons, when it does. Default true. */
  warnOnDowngrade?: boolean;
  /** This person is the only one with the role they are leaving, such as the last owner. A change that takes something away is then refused, and the button stays off with the reason. */
  lastOwner?: boolean;
  /** Any other reason the change cannot be made. It is written above the buttons, the button stays off, and it replaces the last-owner sentence. */
  blockedReason?: string;
  /** The language of the numbers and of "1 permission" against "3 permissions". Default "en-US". */
  locale?: string;
  /** The element that opens the dialog, usually a Button. Focus returns to it when the dialog closes. */
  trigger?: ReactElement;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while the change is made is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: RoleChangeLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/**
 * Confirm a role change by showing what it does. The dialog compares the two roles as "Gains" and "Loses", computed from
 * their capabilities, so nobody has to remember what Editor means before they press the button. A promotion to a powerful
 * role such as Owner asks for the member's email to be typed; the last owner cannot be demoted, which keeps the button off
 * and says why; a change that takes something away is warned about. While the change is made the field locks, the button
 * shows progress and the dialog will not close; a success is one sentence naming the person and the new role, and a failure
 * keeps everything with its message. It is an alert dialog: an outside click does not close it, and focus starts on Cancel.
 */
export function RoleChangeDialog({ trigger, open, defaultOpen = false, onOpenChange, className, ...panel }: RoleChangeDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const busyNow = useRef(false);
  const isOpen = open ?? ownOpen;

  function change(next: boolean) {
    // A change that is half made cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={change}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent
        data-slot="role-change-dialog"
        onEscapeKeyDown={(event) => {
          if (busyNow.current) event.preventDefault();
        }}
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg", className)}
      >
        <RoleChangePanel
          {...panel}
          onBusyChange={(next) => {
            busyNow.current = next;
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}
