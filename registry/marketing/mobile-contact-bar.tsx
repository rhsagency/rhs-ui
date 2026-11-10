"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";

import { IconCalendar, IconMail, IconMessageCircle, IconNavigation, IconPhone } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type ContactBarKind = "call" | "whatsapp" | "directions" | "book" | "email";

export interface ContactBarAction {
  /** What the action is. It picks the icon: a handset, a speech bubble, a compass needle, a calendar, an envelope. */
  kind: ContactBarKind;
  /** The short name under the icon: "Call", "WhatsApp", "Directions", "Book". It is part of the link's name. */
  label: string;
  /** A second, smaller line under the label: the number or the address. Writing it out means the action is clear to everyone, not only to people who read the icon. */
  detail?: string;
  /** Where it goes: tel:, a wa.me address, a maps URL, your booking page. A real link, so it works before any script loads. */
  href: string;
  /** Opens in a new tab with rel="noopener noreferrer", and says so to a screen reader. For the maps and booking pages that leave your site. */
  external?: boolean;
  /** Your own icon in place of the one the kind picks, 20px. */
  icon?: ReactNode;
}

export interface MobileContactBarLabels {
  /** The name of the navigation landmark. */
  nav: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface MobileContactBarProps extends Omit<ComponentProps<"nav">, "children"> {
  /** Two to four actions, shown as equal columns. More than four are left out. */
  actions: readonly ContactBarAction[];
  /** How far the page scrolls, in pixels, before the bar slides in. 0 shows it from the first paint. */
  showAfter?: number;
  /** The breakpoint from which the bar is hidden: a desktop visitor does not call from the keyboard. "never" keeps it at every width. */
  hideFrom?: "sm" | "md" | "lg" | "xl" | "never";
  /** Adds the bar's height to the bottom of the page while it shows, so it never covers the last line. Turn it off when your footer pads itself with var(--contact-bar-height). */
  reserve?: boolean;
  /**
   * The element that scrolls, when it is not the window: a preview frame, an app pane. The bar is then positioned inside the nearest
   * positioned ancestor instead of fixed to the screen, and the room it needs is added to this element. Leave it out for a page that scrolls normally.
   */
  scrollRoot?: RefObject<HTMLElement | null>;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<MobileContactBarLabels>;
}

const LABELS: MobileContactBarLabels = { nav: "Contact", newTab: "opens in a new tab" };

const ICONS = { call: IconPhone, whatsapp: IconMessageCircle, directions: IconNavigation, book: IconCalendar, email: IconMail } as const;

/** Every class written out, because Tailwind only generates what it can read in the source. */
const HIDE_FROM = { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden", never: "" } as const;

/**
 * The bar of a local business's site on a phone: Call, WhatsApp, Directions
 * and Book as equal columns, each an icon over a short label with the number
 * or address written under it, fixed to the bottom of the screen and hidden
 * from md up. Every action is a real link (tel:, a WhatsApp or maps address,
 * your booking page), so it works without script. It respects the safe area
 * of a phone, adds its own height to the end of the page while it shows (or
 * leave that to your footer: the height is also published as
 * --contact-bar-height on the root), can wait until the visitor has scrolled
 * past the first screen, and is out of the tab order and the accessibility
 * tree whenever it is hidden. Under reduced motion it fades instead of sliding.
 */
export function MobileContactBar({ actions, showAfter = 0, hideFrom = "md", reserve = true, scrollRoot, labels: custom, className, ...props }: MobileContactBarProps) {
  const words = { ...LABELS, ...custom };
  const bar = useRef<HTMLElement>(null);
  const [past, setPast] = useState(showAfter <= 0);
  const visible = showAfter <= 0 || past;
  const shown = actions.slice(0, 4);

  // The distance scrolled, read on the window or on the element that scrolls instead of it.
  useEffect(() => {
    if (showAfter <= 0) return;
    const source: HTMLElement | Window = scrollRoot?.current ?? window;
    const read = () => setPast((source instanceof Window ? source.scrollY : source.scrollTop) >= showAfter);
    read();
    source.addEventListener("scroll", read, { passive: true });
    return () => source.removeEventListener("scroll", read);
  }, [showAfter, scrollRoot]);

  // The bar's height, for the page: published as --contact-bar-height and, unless asked not to, added to the bottom padding of the page.
  // Hidden by a breakpoint the bar measures zero, so a window that grows past it gives the room back.
  useEffect(() => {
    const node = bar.current;
    if (!node) return;
    const root = scrollRoot?.current ?? null;
    const host = root ?? document.body;
    const vars = root ?? document.documentElement;
    const before = host.style.paddingBottom;
    const base = Number.parseFloat(getComputedStyle(host).paddingBottom) || 0;
    const apply = () => {
      const height = visible ? node.offsetHeight : 0;
      vars.style.setProperty("--contact-bar-height", `${height}px`);
      if (reserve) host.style.paddingBottom = height ? `${base + height}px` : before;
    };
    apply();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(apply);
    resize?.observe(node);
    return () => {
      resize?.disconnect();
      vars.style.removeProperty("--contact-bar-height");
      host.style.paddingBottom = before;
    };
  }, [visible, reserve, scrollRoot]);

  return (
    <nav
      ref={bar}
      data-slot="mobile-contact-bar"
      data-state={visible ? "visible" : "hidden"}
      aria-label={words.nav}
      inert={!visible}
      className={cn(
        "inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] text-foreground print:hidden",
        scrollRoot ? "absolute" : "fixed",
        "transition-[translate,opacity,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150",
        "data-[state=hidden]:invisible data-[state=hidden]:opacity-0 motion-safe:data-[state=hidden]:translate-y-full",
        HIDE_FROM[hideFrom],
        className,
      )}
      {...props}
    >
      <ul className="mx-auto grid max-w-xl auto-cols-fr grid-flow-col divide-x divide-border">
        {shown.map((action) => {
          const Icon = ICONS[action.kind];
          return (
            <li key={`${action.kind}-${action.label}`} className="min-w-0">
              <a
                href={action.href}
                {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex h-full min-h-16 flex-col items-center gap-1 px-1 pt-3 pb-2.5 text-center outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset active:bg-muted motion-reduce:transition-none"
              >
                <span aria-hidden="true" className="grid size-6 place-items-center [&_svg]:size-5">
                  {action.icon ?? <Icon />}
                </span>
                <span className="text-xs leading-tight font-medium">{action.label}</span>
                {action.detail ? <span className="text-[0.6875rem] leading-tight whitespace-nowrap text-muted-foreground tabular-nums">{action.detail}</span> : null}
                {action.external ? <span className="sr-only"> ({words.newTab})</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
