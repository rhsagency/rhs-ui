import type { ComponentProps, ElementType, ReactNode } from "react";

import { FloatingBar } from "@rhs-ui/marketing/navbar-floating/floating-bar";

export interface NavbarFloatingLink {
  /** The link text: "Journal". */
  label: string;
  /** Where it goes: the page's path. */
  href: string;
}

export interface NavbarFloatingProps extends Omit<ComponentProps<"header">, "children"> {
  /** Your mark, usually already a link home. */
  brand: ReactNode;
  /** The links, flat: a floating bar has no room for panels. Five or fewer read best. */
  items: readonly NavbarFloatingLink[];
  /** Sign in, a call to action: on the right of the pill, and at the foot of the panel on a phone. */
  actions?: ReactNode;
  /** The path of the current page; its link gets aria-current="page" and the highlight rests on it. */
  currentHref?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Keep the pill at the top of the window as the page scrolls. On by default; the page scrolls behind it. */
  sticky?: boolean;
  /** The name of the navigation landmark, for a site that is not in English or a page with two bars. */
  navLabel?: string;
  /** The name of the button that opens the panel on a phone. */
  menuLabel?: string;
}

const link =
  "relative z-10 flex h-9 items-center rounded-full px-3.5 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:font-medium aria-[current=page]:text-foreground motion-reduce:transition-none";
const menuLink =
  "flex min-h-11 items-center rounded-xl px-3 text-[0.9375rem] font-medium transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted motion-reduce:transition-none";

/**
 * A navbar that floats clear of the page edges: a solid, bordered pill with
 * space on every side, so the page scrolls behind it with room to breathe.
 * One highlight follows the pointer and the keyboard along the links and
 * settles on the current page when they leave, measured from the link boxes so
 * it fits any label; under reduced motion it jumps instead of sliding. On a
 * phone the pill shrinks to the mark and a menu button, and the links open as
 * a panel under it: a disclosure that Escape, a click outside or choosing a
 * link closes. The links are rendered here, on the server, so a Server
 * Component can pass its router's Link as linkAs.
 */
export function NavbarFloating({ brand, items, actions, currentHref, linkAs: Link = "a", sticky = true, navLabel = "Main", menuLabel = "Menu", ...props }: NavbarFloatingProps) {
  const current = (href: string) => (href === currentHref ? "page" : undefined);

  return (
    <FloatingBar
      brand={brand}
      actions={actions}
      sticky={sticky}
      navLabel={navLabel}
      menuLabel={menuLabel}
      links={items.map((item) => (
        <li key={`${item.label}-${item.href}`}>
          <Link href={item.href} aria-current={current(item.href)} className={link}>
            {item.label}
          </Link>
        </li>
      ))}
      menuLinks={items.map((item) => (
        <li key={`${item.label}-${item.href}`}>
          <Link href={item.href} aria-current={current(item.href)} className={menuLink}>
            {item.label}
          </Link>
        </li>
      ))}
      {...props}
    />
  );
}
