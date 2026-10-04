"use client";

import { useEffect, useState } from "react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";

export interface SessionTimeoutProps {
  /** Show the warning; you decide when, from your session's expiry. */
  open: boolean;
  /** Seconds left when the warning opens. */
  seconds: number;
  /** Refresh the session. */
  onStay: () => void;
  /** Sign out now, or when the countdown ends. */
  onSignOut: () => void;
}

/**
 * The warning before an idle session ends (WCAG 2.2.1): a dialog with the
 * time left counting down, "Stay signed in" as the default action and sign
 * out as the other, and a sign-out of its own when the time is up. The
 * countdown is announced once a minute, not every second.
 */
export function SessionTimeout({ open, seconds, onStay, onSignOut }: SessionTimeoutProps) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!open) return;
    setLeft(seconds);
    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [open, seconds]);
  useEffect(() => {
    if (open && left === 0) onSignOut();
  }, [open, left, onSignOut]);
  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const spoken = left >= 60 ? `${Math.ceil(left / 60)} minutes` : "less than a minute";
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          <AlertDialogDescription>For your security we sign you out after a while without activity. Anything you saved stays saved.</AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-center text-4xl font-medium tracking-tight tabular-nums" aria-hidden="true">{time}</p>
        <p className="sr-only" aria-live="polite">{`You will be signed out in ${spoken}.`}</p>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onSignOut}>Sign out</AlertDialogCancel>
          <AlertDialogAction onClick={onStay}>Stay signed in</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
