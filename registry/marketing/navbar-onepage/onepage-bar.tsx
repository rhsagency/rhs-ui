"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface OnepageSection {
  /** The id of the section on the page, without the #. */
  id: string;
  /** The link's text. */
  label: string;
}

export interface OnepageBarProps extends Omit<ComponentProps<"header">, "children" | "onClick"> {
  /** The mark, already a link to the top of the page. */
  brand: ReactNode;
  /** The sections of the page, in order. */
  sections: readonly OnepageSection[];
  /** The call to action, on the right and at the foot of the phone menu. */
  action?: ReactNode;
  /** The pixels the bar covers: a section counts as current once its top passes this line, and a link scrolls it to rest just below. */
  offset: number;
  /** The section to mark as current. Leave it out and the bar follows the scroll. */
  currentId?: string;
  /** Called with the id of the section a link took the reader to. */
  onNavigate?: (id: string) => void;
  /** Keep the bar at the top of the window as the page scrolls. */
  sticky: boolean;
  /** The name of the menu button, and the title of the sheet. */
  menuLabel: string;
  /** The name of the navigation landmark. */
  navLabel: string;
}

/** The heading of a section, so focus lands on what the reader came for. */
function focusHeading(section: HTMLElement) {
  const heading = /^H[1-6]$/.test(section.tagName) ? section : (section.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6") ?? section);
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

/* A section link: tall as the bar, with a line on the bar's own hairline that grows from the middle for the section in view. */
const linkClass =
  "relative flex h-full items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 outline-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-200 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-[current=location]:font-medium aria-[current=location]:text-foreground aria-[current=location]:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A fragment, decoded; one that is not valid percent-encoding is used as it is rather than throwing on a click. */
function idOf(href: string): string {
  const raw = href.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * The client half of NavbarOnepage: it follows the scroll to mark the section
 * in view, scrolls to a section when a link is chosen (smoothly, or at once
 * under reduced motion), moves focus to that section's heading, and closes
 * the phone menu first. Every link is a real fragment link, so they all work
 * before this script loads; one click handler on the bar covers the mark, the
 * section links and a call to action that points at a section.
 */
export function OnepageBar({ brand, sections, action, offset, currentId, onNavigate, sticky, menuLabel, navLabel, className, ...props }: OnepageBarProps) {
  const [spy, setSpy] = useState("");
  const [open, setOpen] = useState(false);
  const pending = useRef<string | null>(null);
  /** Until this time (ms) the scroll is ours, so the mark does not flicker through every section on the way. */
  const lockUntil = useRef(0);
  const active = currentId ?? spy;
  const ids = sections.map((section) => section.id).join("\n");

  useEffect(() => {
    if (currentId !== undefined) return;
    const known = ids.split("\n").filter(Boolean);
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (performance.now() < lockUntil.current) return;
      const nodes = known.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => node !== null);
      const line = offset + window.innerHeight * 0.2;
      let found = "";
      for (const node of nodes) if (node.getBoundingClientRect().top <= line) found = node.id;
      const last = nodes[nodes.length - 1];
      if (last && document.documentElement.scrollHeight > window.innerHeight + 2 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) found = last.id;
      setSpy(found);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const release = () => {
      lockUntil.current = 0;
      schedule();
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scrollend", release);
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scrollend", release);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids, offset, currentId]);

  /** Scroll to a section (or the top), mark it, and hand focus to its heading. */
  const go = (id: string | null) => {
    const smooth = reducedMotion() ? "auto" : "smooth";
    if (id === null) {
      // The top is a destination like a section: the scroll is ours until it ends, nothing is marked on the way, and the hash of the section
      // the reader came from goes, so a reload or a shared address opens at the top too.
      lockUntil.current = performance.now() + 900;
      window.scrollTo({ top: 0, behavior: smooth });
      if (window.location.hash) window.history.pushState(null, "", window.location.pathname + window.location.search);
      setSpy("");
      return;
    }
    const section = document.getElementById(id);
    if (!section) return;
    lockUntil.current = performance.now() + 900;
    window.scrollTo({ top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - offset), behavior: smooth });
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    setSpy(id);
    focusHeading(section);
    onNavigate?.(id);
  };

  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
    if (!anchor) return;
    const id = idOf(anchor.getAttribute("href") ?? "#");
    const top = id === "" || (id.toLowerCase() === "top" && !document.getElementById(id));
    if (!top && !document.getElementById(id)) return;
    event.preventDefault();
    const target = top ? null : id;
    if (open) {
      // The sheet closes first: its scroll lock and focus return would fight the scroll. It goes on after it has gone.
      pending.current = target ?? "";
      setOpen(false);
    } else {
      go(target);
    }
  };


  return (
    // One click handler for the links inside, which are real anchors: delegation, not a control of its own.
    <header data-slot="navbar-onepage" onClick={onClick} className={cn("z-40 w-full border-b border-border bg-background", sticky && "sticky top-0", className)} {...props}>
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 items-center justify-self-start">{brand}</div>

        <nav aria-label={navLabel} className="hidden h-full md:block">
          <ul className="flex h-full items-center">
            {sections.map((section) => (
              <li key={section.id} className="h-full">
                <a href={`#${section.id}`} aria-current={section.id === active ? "location" : undefined} className={linkClass}>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-self-end">
          {action ? <div className="hidden items-center gap-2 md:flex">{action}</div> : null}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 md:hidden" aria-label={menuLabel}>
                <IconMenu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(22rem,100vw)] gap-0"
              onCloseAutoFocus={(event) => {
                if (pending.current === null) return;
                const target = pending.current === "" ? null : pending.current;
                pending.current = null;
                // Focus goes to the section's heading, not back to the menu button.
                event.preventDefault();
                go(target);
              }}
            >
              <SheetHeader className="border-b border-border">
                <SheetTitle>{menuLabel}</SheetTitle>
                <SheetDescription className="sr-only">The sections of this page. Choosing one closes the menu and takes you there.</SheetDescription>
              </SheetHeader>
              <nav aria-label={navLabel} className="relative grid gap-1 overflow-y-auto p-5">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    aria-current={section.id === active ? "location" : undefined}
                    className="rounded-md px-2 py-2.5 text-base font-medium transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=location]:bg-muted motion-reduce:transition-none"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
              {action ? <div className="mt-auto grid gap-2 border-t border-border p-5 *:w-full">{action}</div> : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
