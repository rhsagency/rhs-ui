"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface RouteFocusProps extends Omit<ComponentProps<"div">, "children"> {
  /** The path of the page being shown, from your router (`usePathname()`). Focus moves only when the path changes: the query string and the hash are ignored. */
  pathname: string;
  /** What gets focus after a navigation: a CSS selector, looked up when the new page is in, or a ref to the element. Default "main h1, h1". If nothing matches, the main landmark gets it instead. */
  target?: string | RefObject<HTMLElement | null>;
  /** The page title to announce. Default: the document title once the new page has set it, or the text of the heading that got focus. */
  title?: string;
  /** Do nothing on the first render, because the browser has already placed focus after a full page load. Default true. */
  skipFirst?: boolean;
  /** Scroll to the top of the page before moving focus, for routers that do not. Default false. */
  resetScroll?: boolean;
  /** What the live region says; `{title}` is replaced by the page title. Default "Navigated to {title}". */
  announcement?: string;
}

/** The path without its query string and hash: a filter or an in-page anchor is not a new page. */
const pathOf = (value: string): string => value.split("#", 1)[0]?.split("?", 1)[0] ?? "";

/** True when the person is in a place where they type, which a navigation must never take them out of. */
function isTyping(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return false;
  if (active.isContentEditable || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return true;
  return active instanceof HTMLInputElement && !["button", "submit", "reset", "checkbox", "radio", "range", "file", "image", "color"].includes(active.type);
}

/**
 * Single-page navigation leaves keyboard and screen reader users where they were, on a link of a page that is gone.
 * Mount this once, in the root layout, and give it the pathname: when the path changes it moves focus to the new
 * page's main heading (or the element you name), says the page title once in a polite live region, and does what
 * the browser does after a full load. It does nothing on the first render, ignores hash and query changes, never
 * takes focus from a field the person is typing in, and waits a moment for a heading that is still rendering. The
 * target gets a temporary tabindex of -1, and shows no outline unless focus arrived by keyboard.
 */
export function RouteFocus({ pathname, target = "main h1, h1", title, skipFirst = true, resetScroll = false, announcement = "Navigated to {title}", className, ...props }: RouteFocusProps) {
  const [message, setMessage] = useState("");
  const seen = useRef<string | null>(null);
  const latest = useRef({ target, title, resetScroll, announcement });
  useEffect(() => {
    latest.current = { target, title, resetScroll, announcement };
  });

  const path = pathOf(pathname);
  useEffect(() => {
    const before = seen.current;
    seen.current = path;
    if (before === path || (before === null && skipFirst)) return;

    let frame = 0;
    let attempts = 0;
    let clear = 0;
    const find = (): HTMLElement | null => {
      const wanted = latest.current.target;
      const found = typeof wanted === "string" ? document.querySelector<HTMLElement>(wanted) : wanted.current;
      return found ?? document.querySelector<HTMLElement>("main, [role='main']");
    };
    const arrive = () => {
      const element = find();
      // The heading may still be on its way (a streamed page): look again for about half a second.
      if (!element && attempts++ < 30) {
        frame = requestAnimationFrame(arrive);
        return;
      }
      const { title: given, resetScroll: reset, announcement: template } = latest.current;
      // Instant, even where the page asks for smooth scrolling: focus must not arrive while the page is still gliding.
      if (reset) window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      if (element && !isTyping()) {
        const added = !element.hasAttribute("tabindex");
        if (added) element.setAttribute("tabindex", "-1");
        element.focus({ preventScroll: reset });
        // Only a keyboard arrival earns a ring; a mouse click on a link should not leave one on the heading.
        const quiet = !element.matches(":focus-visible");
        if (quiet) element.style.outline = "none";
        element.addEventListener(
          "blur",
          () => {
            if (added) element.removeAttribute("tabindex");
            if (quiet) element.style.removeProperty("outline");
          },
          { once: true },
        );
      }
      const name = (given ?? document.title) || element?.textContent?.trim() || "";
      if (name) {
        setMessage(template.replace("{title}", name));
        // Said once: the text goes again, so the same page announced twice in a row is still heard.
        clear = window.setTimeout(() => setMessage(""), 4000);
      }
    };
    frame = requestAnimationFrame(arrive);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(clear);
    };
  }, [path, skipFirst]);

  return (
    <div data-slot="route-focus" role="status" aria-live="polite" aria-atomic="true" className={cn("sr-only", className)} {...props}>
      {message}
    </div>
  );
}
