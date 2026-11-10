"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { IconClose } from "@rhs-ui/icons";
import {
  countPageView,
  isBusy,
  isSuppressed,
  isTyping,
  localStorageSuppression,
  scrollDepth,
  type NewsletterDismissal,
  type NewsletterLabels,
  type NewsletterStorage,
  type NewsletterTrigger,
} from "@rhs-ui/application/newsletter-dialog/newsletter";
import { NewsletterPanel } from "@rhs-ui/application/newsletter-dialog/panel";
import { Dialog, DialogClose, DialogContent } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export type { NewsletterDismissal, NewsletterLabels, NewsletterStorage, NewsletterTrigger } from "@rhs-ui/application/newsletter-dialog/newsletter";
export { NewsletterPanel, type NewsletterPanelProps } from "@rhs-ui/application/newsletter-dialog/panel";

export interface NewsletterDialogProps {
  /** Signs the address up. Return a promise: the field locks and the button shows progress while it runs and the dialog cannot be closed; a rejection keeps the address and shows the message; success replaces the form with a confirmation. */
  onSubscribe: (email: string) => void | Promise<void>;
  /** When it opens by itself: "delay" after `delayMs`, "scroll" at `scrollDepth`, or "manual" never (you open it with `open`). Default "delay". */
  trigger?: NewsletterTrigger;
  /** For "delay": how long after the page loads, in milliseconds. Default 20000. */
  delayMs?: number;
  /** For "scroll": how far down the page, as a percentage of its height. Default 60. */
  scrollDepth?: number;
  /** How many days it keeps away after a dismissal (and after a sign-up). Default 30. */
  suppressDays?: number;
  /** Called when it is dismissed, with how: "decline" (No thanks), "close" (the corner button), "escape" or "outside". The moment is stored first. */
  onDismiss?: (reason: NewsletterDismissal) => void;
  /** Where the moment of the last dismissal is kept: `{ read, write }`. Default: localStorage. Use a cookie, or your own store, by passing your own pair; `read` may return `Infinity` for someone who must never be asked. */
  storage?: NewsletterStorage;
  /** A line about what people get, in place of the default description: "One email a week: what we shipped, what we learned." */
  incentive?: string;
  /** How many pages the visitor has seen in this session, if you count them (a router can). Default: the pages this component has been on in this tab's session, so it never opens on the first. */
  pageViews?: number;
  /** The least number of pages in the session before it may open. Default 2: never on the first page view. */
  minPageViews?: number;
  /** Whether the dialog is open, when you control it. A controlled dialog never opens by itself. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. A close that is refused while the sign-up is on its way is not reported. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: NewsletterLabels;
  /** Classes for the dialog panel, for a different width. */
  className?: string;
}

/** How often to look again when somebody is in the middle of something. */
const RETRY_MS = 1500;

/**
 * A newsletter invitation with the manners of a good guest. It opens after a delay or a depth of scrolling, and only when
 * it is welcome: never on the first page view of a session, never while somebody is typing in a field or another dialog is
 * open, never in a background tab, and never again inside `suppressDays` after it was dismissed or answered. It asks for one
 * email with a plain line about privacy; Escape, the corner button, "No thanks" and a click outside are all as easy as
 * Subscribe, and success replaces the form in place and closes after a moment, with focus going back to whatever had it when it
 * opened. `storage` is a pair of functions, so you choose where "not again" is remembered.
 */
export function NewsletterDialog({
  onSubscribe,
  trigger = "delay",
  delayMs = 20_000,
  scrollDepth: depth = 60,
  suppressDays = 30,
  onDismiss,
  storage = localStorageSuppression,
  incentive,
  pageViews,
  minPageViews = 2,
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
}: NewsletterDialogProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const busyNow = useRef(false);
  const reason = useRef<NewsletterDismissal | null>(null);
  const answered = useRef(false);
  const counted = useRef<number | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const latest = useRef({ storage, onDismiss, onOpenChange, open });
  useEffect(() => {
    latest.current = { storage, onDismiss, onOpenChange, open };
  });
  const isOpen = open ?? ownOpen;
  const auto = trigger !== "manual" && open === undefined;

  // There is no DialogTrigger here, so the dialog has nowhere of its own to give focus back to: it remembers who had it at the moment it
  // opened (the visitor's own button, or a link they were on), before the dialog takes focus into itself.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, [isOpen]);

  function change(next: boolean) {
    // A sign-up that is on its way cannot be walked away from.
    if (!next && busyNow.current) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
    if (next) return;
    // Anything but a sign-up that worked is a "not now": remember it, and say how it happened.
    if (!answered.current) {
      storage.write(Date.now());
      onDismiss?.(reason.current ?? "close");
    }
    reason.current = null;
  }

  // The moment to open: found by the delay or by the scrolling, and then only if it is welcome.
  useEffect(() => {
    if (!auto) return;
    // Counted once per mount, so React's strict mode (which runs this twice) does not make a first view look like a second.
    counted.current ??= countPageView();
    const views = pageViews ?? counted.current;
    if (views < minPageViews || isSuppressed(latest.current.storage, suppressDays, Date.now())) return;

    let retry: number | undefined;
    let waiting = true;
    const welcome = () => {
      window.clearTimeout(retry);
      if (!waiting) return;
      // Looked at again at the very last moment: another tab may have been dismissed while this one waited.
      if (isTyping() || isBusy()) {
        retry = window.setTimeout(welcome, RETRY_MS);
        return;
      }
      if (isSuppressed(latest.current.storage, suppressDays, Date.now())) return;
      waiting = false;
      setOwnOpen(true);
      latest.current.onOpenChange?.(true);
    };

    let cleanup = () => {};
    if (trigger === "delay") {
      const timer = window.setTimeout(welcome, delayMs);
      cleanup = () => window.clearTimeout(timer);
    } else {
      const check = () => {
        if (scrollDepth() < depth) return;
        window.removeEventListener("scroll", check);
        welcome();
      };
      window.addEventListener("scroll", check, { passive: true });
      check();
      cleanup = () => window.removeEventListener("scroll", check);
    }
    return () => {
      waiting = false;
      window.clearTimeout(retry);
      cleanup();
    };
  }, [auto, trigger, delayMs, depth, suppressDays, pageViews, minPageViews]);

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      <DialogContent
        ref={content}
        data-slot="newsletter-dialog"
        showCloseButton={false}
        onEscapeKeyDown={() => {
          reason.current = "escape";
        }}
        onPointerDownOutside={() => {
          reason.current = "outside";
        }}
        onCloseAutoFocus={(event) => {
          // Back to whoever had focus when it opened, if they are still on the page; without a trigger Radix would leave focus on the document.
          event.preventDefault();
          const back = returnTo.current;
          returnTo.current = null;
          if (back?.isConnected) back.focus({ preventScroll: true });
        }}
        onOpenAutoFocus={(event) => {
          // A dialog nobody asked for does not raise the keyboard on a phone: on a touch screen focus rests on the dialog until a finger goes to the field.
          if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) {
            event.preventDefault();
            content.current?.focus({ preventScroll: true });
          }
        }}
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md", className)}
      >
        <NewsletterPanel
          onSubscribe={onSubscribe}
          incentive={incentive}
          labels={labels}
          onDecline={() => {
            reason.current = "decline";
          }}
          onSubscribed={() => {
            // Someone who signed up is not asked again for the same days as someone who said no.
            answered.current = true;
            storage.write(Date.now());
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
            onClick={() => {
              reason.current = "close";
            }}
            // Level with the title: the header starts 8px lower from sm up (sm:pt-6), and the button goes down with it.
            className="absolute top-[1.1rem] right-4 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 sm:top-[1.4rem]"
          >
            <IconClose size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
