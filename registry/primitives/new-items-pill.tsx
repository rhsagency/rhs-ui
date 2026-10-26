"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type RefObject } from "react";

import { IconArrowDown, IconArrowUp } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The pill's words: one string for every count, or one string per plural form. {count} stands for the number. */
export type NewItemsLabel = string | (Partial<Record<Intl.LDMLPluralRule, string>> & { other: string });

export interface NewItemsPillProps extends Omit<ComponentProps<"div">, "children" | "onClick"> {
  /** How many items arrived while the reader was away. The pill shows only while this is above zero and the reader is not at the new content. */
  count: number;
  /** Where the new items are: `up` for a feed that gets new posts at the top, `down` for a chat that gets them at the bottom. Default "up". */
  direction?: "up" | "down";
  /** What arrived, with the number in it. Pass one string per plural form to get the singular right: { one: "{count} new message", other: "{count} new messages" }. Default "{count} new post" and "{count} new posts". */
  label?: NewItemsLabel;
  /** Said before the label to a screen reader, so the button's name is an instruction: "Show 12 new posts". Default "Show". */
  action?: string;
  /** Called when the pill is pressed, before it scrolls. Merge the items you held back here. Call preventDefault() to do the scrolling yourself. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Called when the reader gets to the new content by themselves, with items waiting. Merge them and reset the count here. */
  onReach?: () => void;
  /** The element that scrolls. Without it the page itself is watched and scrolled, and the pill wants `className="fixed top-4"` (or `bottom-4`) to stay in view. */
  scrollRef?: RefObject<HTMLElement | null>;
  /** How far from the new content still counts as being at it, in px. Default 48. */
  threshold?: number;
  /** The least time between two announcements of the count, in ms, so a busy feed does not shout. Default 4000. */
  announceEvery?: number;
  /** The locale the number and the plural form follow. Default "en-US". */
  locale?: string;
}

const DEFAULT_LABEL: NewItemsLabel = { one: "{count} new post", other: "{count} new posts" };

/** How far the reader is from the new content, in px. */
function distanceFromNew(scroller: HTMLElement | null, direction: "up" | "down"): number {
  if (scroller) return direction === "up" ? scroller.scrollTop : scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
  const page = document.documentElement;
  return direction === "up" ? window.scrollY : page.scrollHeight - window.innerHeight - window.scrollY;
}

/** The text, said at most once in `every` ms: the first change as soon as it comes, the rest on that beat, always the latest. An emptied text is cleared at once. */
function useThrottledText(text: string, every: number): string {
  const [said, setSaid] = useState("");
  const last = useRef(Number.NEGATIVE_INFINITY);
  useEffect(() => {
    if (!text) {
      setSaid("");
      return;
    }
    const wait = last.current + every - Date.now();
    if (wait <= 0) {
      last.current = Date.now();
      setSaid(text);
      return;
    }
    const timer = window.setTimeout(() => {
      last.current = Date.now();
      setSaid(text);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [text, every]);
  return said;
}

/**
 * The floating "12 new posts" pill over a live list. It counts what arrived
 * while the reader was away, appears only while they are scrolled away from
 * where the new items are, and goes by itself once they get there. Press it and
 * the list scrolls to the new items, smoothly or at once under reduced motion;
 * the press does not take focus from whatever the reader was typing in, and a
 * keyboard user who presses it is handed to the list instead of losing their
 * place. Its name reads "Show 12 new posts", and the count is announced politely
 * at most every few seconds, so a busy feed does not shout. A halo in the page
 * colour keeps it apart from whatever scrolls under it. Put it next to the
 * scroller inside a `relative` wrapper, at the top for a feed (`up`) or at the
 * bottom for a chat (`down`).
 */
export function NewItemsPill({
  count,
  direction = "up",
  label = DEFAULT_LABEL,
  action = "Show",
  onClick,
  onReach,
  scrollRef,
  threshold = 48,
  announceEvery = 4000,
  locale = "en-US",
  className,
  ...props
}: NewItemsPillProps) {
  // null until it has been measured: the server and the first paint never guess where the reader is.
  const [away, setAway] = useState<boolean | null>(null);
  const visible = count > 0 && away === true;

  useEffect(() => {
    const scroller = scrollRef?.current ?? null;
    const target: HTMLElement | Window = scroller ?? window;
    const measure = () => setAway(distanceFromNew(scroller, direction) > threshold);
    measure();
    target.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(scroller ?? document.documentElement);
    // New items change how tall the list is without a scroll or a resize, so the count is a reason to look again.
    return () => {
      target.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      resize?.disconnect();
    };
  }, [scrollRef, direction, threshold, count]);

  const reach = useRef(onReach);
  useEffect(() => {
    reach.current = onReach;
  });
  useEffect(() => {
    if (count <= 0) return;
    const scroller = scrollRef?.current ?? null;
    // A scroller that was asked for and is not there yet cannot have been reached.
    if (scrollRef && !scroller) return;
    // Measured again here and not read from `away`: that state was taken before these items came, so right after mount it can still say "at the new content" for a list that has just been scrolled away from it.
    if (distanceFromNew(scroller, direction) <= threshold) reach.current?.();
  }, [count, away]);

  const text = useMemo(() => {
    const forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string } = typeof label === "string" ? { other: label } : label;
    const form = forms[new Intl.PluralRules(locale).select(count)] ?? forms.other;
    return form.replace("{count}", new Intl.NumberFormat(locale).format(count));
  }, [label, count, locale]);
  const said = useThrottledText(visible ? text : "", announceEvery);

  function press(event: MouseEvent<HTMLButtonElement>) {
    // Pressed from the keyboard, it holds focus; it is about to hide, so give focus to the list.
    const heldFocus = document.activeElement === event.currentTarget;
    onClick?.(event);
    if (event.defaultPrevented) return;
    const scroller = scrollRef?.current ?? null;
    if (heldFocus && scroller) {
      if (!scroller.hasAttribute("tabindex")) scroller.setAttribute("tabindex", "-1");
      scroller.focus({ preventScroll: true });
    }
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    // A frame later, so the items merged in onClick are in the list when the end is measured.
    window.requestAnimationFrame(() => {
      if (scroller) scroller.scrollTo({ top: direction === "up" ? 0 : scroller.scrollHeight, behavior });
      else window.scrollTo({ top: direction === "up" ? 0 : document.documentElement.scrollHeight, behavior });
    });
  }

  return (
    <div
      data-slot="new-items-pill"
      data-direction={direction}
      data-state={visible ? "visible" : "hidden"}
      className={cn("pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4", direction === "up" ? "top-3" : "bottom-3", className)}
      {...props}
    >
      <Button
        type="button"
        size="sm"
        inert={!visible}
        // A press that does not take focus: whatever the reader was typing in keeps it.
        onMouseDown={(event) => event.preventDefault()}
        onClick={press}
        className={cn(
          // The ring is a halo in the page colour: it sets the pill apart from whatever scrolls under it, such as a message in the same colour.
          "pointer-events-auto rounded-full pr-3.5 pl-3 shadow-sm ring-[3px] ring-background tabular-nums transition-[opacity,translate,background-color] duration-200 motion-reduce:transition-none",
          visible ? "translate-y-0 opacity-100" : direction === "up" ? "-translate-y-2 opacity-0" : "translate-y-2 opacity-0",
        )}
      >
        {direction === "up" ? <IconArrowUp /> : <IconArrowDown />}
        <span className="sr-only">{action} </span>
        {text}
      </Button>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
