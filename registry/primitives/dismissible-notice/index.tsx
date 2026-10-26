"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconClose, IconInfo } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { clearDismissed, readDismissed, subscribeDismissals, writeDismissed } from "@rhs-ui/primitives/dismissible-notice/store";
import { cn } from "@/lib/utils";

export interface UseDismissedOptions {
  /** The version of what is dismissed. A dismissal only counts for the version it was made at, so changing this (a release number, a revision of the copy) shows the notice again to everyone who closed an earlier one. */
  version?: string | number;
  /** Days after which a dismissed notice comes back. Leave it out and a dismissal lasts until the version changes. */
  remindAfterDays?: number;
}

export interface UseDismissed {
  /** Whether it is dismissed. It is `true` on the server and while the page hydrates, so nothing is drawn that the browser would then take back. */
  dismissed: boolean;
  /** Remembers the dismissal. Every component that asks about the same id, in this tab or another, updates. */
  dismiss: () => void;
  /** Forgets it, so the notice shows again: for a "Show tips again" button in settings. */
  restore: () => void;
}

/**
 * Whether something has been dismissed, and the two calls to change that. It
 * is what DismissibleNotice runs on, and it works for anything else that
 * should stay closed: pass `dismiss` to Banner's `onDismiss`, and render the
 * banner only while `dismissed` is false. The record lives in localStorage
 * under a namespaced key; where storage throws, it lives in memory for the
 * session instead.
 */
export function useDismissed(id: string, { version, remindAfterDays }: UseDismissedOptions = {}): UseDismissed {
  const stamp = version === undefined ? "" : String(version);
  const dismissed = useSyncExternalStore(
    subscribeDismissals,
    () => readDismissed(id, stamp, remindAfterDays),
    () => true,
  );
  const dismiss = useCallback(() => writeDismissed(id, stamp), [id, stamp]);
  const restore = useCallback(() => clearDismissed(id), [id]);
  return { dismissed, dismiss, restore };
}

export interface DismissibleNoticeProps extends Omit<ComponentProps<"div">, "title"> {
  /** Names the notice in storage, so it has to be unique within your app: `"tip-command-bar"`. */
  id: string;
  /** What the notice says first. It also names the close button, "Dismiss: Title", so a screen reader knows which notice a button closes. */
  title: string;
  /** Change it when the notice has something new to say, and everyone who dismissed the old one sees it again. */
  version?: string | number;
  /** Days after which a dismissed notice returns. Leave it out for a dismissal that lasts until the version changes. */
  remindAfterDays?: number;
  /** Called once when the person closes it. The dismissal is already remembered; this is for analytics or a follow-up request. */
  onDismiss?: () => void;
  /** An icon in front of the title, as an element: `<IconIdea />`. It is decorative. Defaults to an info mark; `null` leaves it out. */
  icon?: ReactNode;
  /** One or two buttons or links under the text, for what to do about it. */
  action?: ReactNode;
  /** The text: one to three short sentences. */
  children?: ReactNode;
}

/** How long the card takes to fold away, in ms. Matches duration-200 below, with a frame to spare. */
const COLLAPSE_MS = 220;

/**
 * A tip or a notice that people can close for good: an inline card with an
 * icon, a title, a few lines, an action and a close button. It remembers the
 * dismissal, so it does not nag on the next page or the next visit; it comes
 * back when its `version` changes, or after `remindAfterDays`. It is drawn
 * after the page is live, never in the server HTML, so a person who dismissed
 * it does not see it flash and vanish. Closing folds the card away and takes
 * its margin with it, in the blink of an eye, and instantly when reduced
 * motion is on. The close button is named after the notice ("Dismiss: Title").
 * Put the space below it on the notice itself (`className="mb-4"`) so that
 * space folds away too.
 */
export function DismissibleNotice({ id, title, version, remindAfterDays, onDismiss, icon, action, className, children, ...props }: DismissibleNoticeProps) {
  const { dismissed, dismiss } = useDismissed(id, { version, remindAfterDays });
  // The dismissal is remembered at once; the card stays in the page for the length of its fold.
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const titleId = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (dismissed && !closing) return null;

  function close() {
    dismiss();
    onDismiss?.();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setClosing(true);
    timer.current = window.setTimeout(() => setClosing(false), COLLAPSE_MS);
  }

  const glyph = icon === undefined ? <IconInfo /> : icon;
  return (
    <div
      data-slot="dismissible-notice"
      data-state={closing ? "closing" : "open"}
      inert={closing || undefined}
      className={cn(
        // A grid row folds from 1fr to 0fr, which animates height without measuring anything. `starting:` plays the same fold backwards when the card first appears.
        "grid grid-rows-[1fr] transition-[grid-template-rows,opacity,margin] duration-200 ease-out motion-reduce:transition-none",
        "starting:my-0 starting:grid-rows-[0fr] starting:opacity-0",
        "data-[state=closing]:my-0 data-[state=closing]:grid-rows-[0fr] data-[state=closing]:opacity-0",
        className,
      )}
      {...props}
    >
      {/* The padding gives the card's shadow room inside the clip; the negative margin takes it back out of the layout. */}
      <div className="-m-1 min-h-0 overflow-hidden p-1">
        <div role="group" aria-labelledby={titleId} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
          {glyph ? (
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted text-foreground [&_svg]:size-4">
              {glyph}
            </span>
          ) : null}
          <div className="min-w-0 flex-1 pt-[5px]">
            <p id={titleId} className="text-sm leading-snug font-medium tracking-[-0.01em]">
              {title}
            </p>
            {children ? <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</div> : null}
            {action ? <div className="mt-3.5 flex flex-wrap items-center gap-2">{action}</div> : null}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Dismiss: ${title}`} onClick={close} className="-mr-1.5 size-7 shrink-0 text-muted-foreground hover:text-foreground">
            <IconClose size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
