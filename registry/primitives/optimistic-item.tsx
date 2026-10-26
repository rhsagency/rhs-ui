"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** Whether the server has confirmed the item. */
export type OptimisticStatus = "confirmed" | "pending" | "failed";

/** The words of the item, for another language or your own wording. */
export interface OptimisticItemLabels {
  /** What a screen reader hears while the item is being saved. Default "Saving". */
  saving: string;
  /** The line that says it was not saved. Default "Could not save". */
  failed: string;
  /** The text on the first button. Default "Retry". */
  retry: string;
  /** The text on the second. Default "Discard". */
  discard: string;
}

export interface OptimisticItemProps extends ComponentProps<"div"> {
  /** `confirmed` once the server has it, `pending` while it is being saved, `failed` when it could not be. Default "confirmed". */
  status?: OptimisticStatus;
  /** Why it failed, in words someone can act on: "You are offline. Your comment is still here." Shown after "Could not save". */
  error?: ReactNode;
  /** Adds a Retry button to the failure line. Set the status back to `pending` here and send it again. */
  onRetry?: () => void;
  /** Adds a Discard button. Remove the item from your list here. */
  onDiscard?: () => void;
  /** The words of the item. */
  labels?: Partial<OptimisticItemLabels>;
  /** The row, comment or card that is being saved. */
  children: ReactNode;
}

const LABELS: OptimisticItemLabels = { saving: "Saving", failed: "Could not save", retry: "Retry", discard: "Discard" };

/**
 * Wraps anything you add before the server has said yes: a new comment, a todo,
 * a rename. While it is `pending` the item is dimmed a little and a quiet
 * spinner sits in its top right corner, and it is marked busy so a screen reader
 * knows it is still being saved; it is never blocked, and everything on it can
 * still be read. When it is `confirmed` the wrapper adds nothing, and the move
 * from pending is instant and silent. When it `failed` the item stays where it
 * is, with "Could not save", the reason, and Retry and Discard under it. A
 * failure is announced once as an alert, and focus is never moved by it; after
 * Retry it rests on the item, so it is not lost when the buttons go. Keep the
 * top right corner of what you wrap free of text, for the spinner.
 */
export function OptimisticItem({ status = "confirmed", error, onRetry, onDiscard, labels, className, children, onBlur, ...props }: OptimisticItemProps) {
  const words = { ...LABELS, ...labels };
  const pending = status === "pending";
  const failed = status === "failed";
  // After Retry, focus rests on the item itself until the person moves on, so it can be focused for as long as it is needed.
  const [parked, setParked] = useState(false);
  return (
    <div
      data-slot="optimistic-item"
      data-status={status}
      aria-busy={pending || undefined}
      tabIndex={failed || parked ? -1 : undefined}
      onBlur={(event) => {
        onBlur?.(event);
        if (event.target === event.currentTarget) setParked(false);
      }}
      // The ring is for focus parked here after Retry, so a keyboard user can see where they are. It follows the item's corners: pass your own radius in `className` if it is not rounded-xl.
      className={cn("relative rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
      {...props}
    >
      {/* The transition is only there while pending, so the move to confirmed is instant. */}
      <div className={pending ? "opacity-80 transition-opacity duration-200 motion-reduce:transition-none" : undefined}>{children}</div>
      {pending ? (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 text-muted-foreground">
            <Spinner size={16} label="" aria-hidden="true" role="presentation" />
          </span>
          <span className="sr-only">{words.saving}</span>
        </>
      ) : null}
      {failed ? (
        <div data-slot="optimistic-item-error" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-destructive/30 bg-destructive/5 py-2 pr-2 pl-3 text-sm motion-safe:animate-rhs-fade-in">
          <p role="alert" className="flex min-w-0 flex-1 basis-52 items-start gap-2">
            <IconAlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              <span className="font-medium">{words.failed}.</span>
              {error ? <span className="text-muted-foreground"> {error}</span> : null}
            </span>
          </p>
          {onRetry || onDiscard ? (
            <div className="flex shrink-0 gap-1.5">
              {onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    // The button is about to go: park focus on the item so a keyboard user keeps their place.
                    setParked(true);
                    event.currentTarget.closest<HTMLElement>('[data-slot="optimistic-item"]')?.focus({ preventScroll: true });
                    onRetry();
                  }}
                >
                  <IconRefresh />
                  {words.retry}
                </Button>
              ) : null}
              {onDiscard ? (
                <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>
                  {words.discard}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
