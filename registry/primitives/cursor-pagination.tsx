"use client";

import { useEffect, useRef, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconArrowLeft, IconArrowRight, IconSpinner } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CursorPaginationLabels {
  /** The button that goes back to what came before: newer results. Default "Newer". */
  previous?: string;
  /** The button that goes on to what comes after: older results. Default "Older". */
  next?: string;
  /** What stands where the previous button was at the start of the list. Default "No newer results". */
  noPrevious?: string;
  /** What stands where the next button was at the end of the list. Default "No older results". */
  noNext?: string;
}

export interface CursorPaginationProps extends Omit<ComponentProps<"nav">, "children"> {
  /** There is something before this page. When false the previous button gives way to its end text. */
  hasPrevious: boolean;
  /** There is something after this page. When false the next button gives way to its end text. */
  hasNext: boolean;
  /** Called when the previous button (newer results) is used with a plain click or the keyboard. It is not called while a request is loading. */
  onPrevious?: () => void;
  /** Called when the next button (older results) is used with a plain click or the keyboard. It is not called while a request is loading. */
  onNext?: () => void;
  /** Which way is loading: that button shows a spinner and keeps its width, and the other waits. Default false. */
  loading?: "previous" | "next" | false;
  /** Where you are, in your own words: "21 to 40". It is read out politely whenever it changes, with the end of the list when you are at it. */
  range?: ReactNode;
  /** Real addresses for the two buttons, so the pages can be crawled and opened in a new tab. */
  hrefs?: { previous?: string; next?: string };
  /** The words on the buttons and in the end states, for another language. */
  labels?: CursorPaginationLabels;
}

type Direction = "previous" | "next";

/** A press the browser should handle itself: a modified click opens a new tab. */
const plain = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

interface StepProps {
  direction: Direction;
  label: string;
  href?: string;
  /** This button is the one that is loading. */
  pending: boolean;
  /** The other button is loading, so this one waits. */
  waiting: boolean;
  onPress?: () => void;
  /** Told when the button is used while it has the focus, so the focus can follow it if the button is replaced by its end text. */
  onHold: (direction: Direction) => void;
}

function Step({ direction, label, href, pending, waiting, onPress, onHold }: StepProps) {
  const forward = direction === "next";
  const Icon = forward ? IconArrowRight : IconArrowLeft;
  // aria-disabled, not disabled: a button that is busy keeps focus, so a keyboard user is not thrown out of the list.
  const inert = pending || waiting;
  const press = (event: MouseEvent<HTMLElement>) => {
    if (inert) {
      event.preventDefault();
      return;
    }
    if (document.activeElement === event.currentTarget) onHold(direction);
    // With a handler a link is a button that has an address: the router takes the press, the address is for everything else.
    if (onPress && plain(event)) {
      event.preventDefault();
      onPress();
    }
  };
  const content = (
    <>
      {forward ? null : pending ? <IconSpinner /> : <Icon />}
      {label}
      {forward ? pending ? <IconSpinner /> : <Icon /> : null}
    </>
  );
  const shared = {
    variant: "outline" as const,
    "data-direction": direction,
    "aria-disabled": inert || undefined,
    "aria-busy": pending || undefined,
    className: cn("min-w-24 aria-disabled:cursor-default", waiting && "opacity-50"),
    onClick: press,
  };
  return href ? (
    <Button asChild {...shared}>
      <a href={href}>{content}</a>
    </Button>
  ) : (
    <Button type="button" {...shared}>
      {content}
    </Button>
  );
}

/** What stands in place of a button at the end of the list. It can take focus from code (never from Tab), so the focus has somewhere to land when the button that had it goes away. */
const END = "text-sm text-muted-foreground outline-none";

/**
 * Older and Newer for a feed or an API that pages by cursor: no page numbers and no total, because
 * neither is known. The button that is loading shows a spinner in place of its arrow, so it does not
 * change width, and the other button waits. At the end of the list the button is replaced by plain
 * text ("No older results"), not by a dead control, and if that button had the focus the focus moves
 * onto the text, so a keyboard user stays in the list. The range ("21 to 40") is a polite live region
 * that also says when you are at an end ("16 to 20. No older results."). With `hrefs` the buttons are
 * real links, for pages a crawler can follow and a reader can open in a new tab; with links and no
 * handlers it can be rendered from a Server Component.
 */
export function CursorPagination({ hasPrevious, hasNext, onPrevious, onNext, loading = false, range, hrefs, labels, className, "aria-label": ariaLabel = "Pagination", ...props }: CursorPaginationProps) {
  const words = { previous: labels?.previous ?? "Newer", next: labels?.next ?? "Older", noPrevious: labels?.noPrevious ?? "No newer results", noNext: labels?.noNext ?? "No older results" };
  // The ends are said after the range, as sentences of their own: "16 to 20. No older results."
  const ends = [hasPrevious ? "" : words.noPrevious, hasNext ? "" : words.noNext].filter(Boolean).join(". ");

  // The button that was used while it had the focus. Once the request is over, if that button has been replaced by its end
  // text the focus was dropped on the page (the browser puts it there when the focused element goes away), and it goes to
  // the text. If the button is still there it still has the focus; if the reader moved on, the focus is theirs.
  const held = useRef<Direction | null>(null);
  const previousEnd = useRef<HTMLSpanElement>(null);
  const nextEnd = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const side = held.current;
    if (!side || loading) return;
    held.current = null;
    const dropped = !document.activeElement || document.activeElement === document.body;
    if (dropped && (side === "next" ? !hasNext : !hasPrevious)) (side === "next" ? nextEnd : previousEnd).current?.focus({ preventScroll: true });
  });
  const hold = (direction: Direction) => {
    held.current = direction;
  };

  return (
    <nav data-slot="cursor-pagination" aria-label={ariaLabel} aria-busy={loading ? true : undefined} className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="grid grid-cols-2 items-center gap-x-3 gap-y-3 @sm:grid-cols-[1fr_auto_1fr]">
        <div className="col-start-1 row-start-2 flex justify-start @sm:row-start-1">
          {hasPrevious ? (
            <Step direction="previous" label={words.previous} href={hrefs?.previous} pending={loading === "previous"} waiting={loading === "next"} onPress={onPrevious} onHold={hold} />
          ) : (
            <span ref={previousEnd} tabIndex={-1} className={END}>
              {words.noPrevious}
            </span>
          )}
        </div>
        <p role="status" className="relative col-span-2 row-start-1 text-center text-sm text-muted-foreground tabular-nums @sm:col-span-1 @sm:col-start-2">
          {range}
          {ends ? (
            <span className="sr-only">
              {range ? ". " : ""}
              {ends}
            </span>
          ) : null}
        </p>
        <div className="col-start-2 row-start-2 flex justify-end @sm:col-start-3 @sm:row-start-1">
          {hasNext ? (
            <Step direction="next" label={words.next} href={hrefs?.next} pending={loading === "next"} waiting={loading === "previous"} onPress={onNext} onHold={hold} />
          ) : (
            <span ref={nextEnd} tabIndex={-1} className={END}>
              {words.noNext}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
