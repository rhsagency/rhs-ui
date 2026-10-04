import { cn } from "@/lib/utils";

export interface PillNavLink {
  href: string;
  label: string;
  /** A count after the label: open issues, unread items. */
  count?: number;
}

export interface PillNavProps {
  links: readonly PillNavLink[];
  /** The href of the page you are on; it gets aria-current. */
  current: string;
  /** Names the navigation: "Account sections". */
  label: string;
  className?: string;
}

/**
 * Sub-pages as a row of pills, for the top of a section with a few pages
 * (Overview, Members, Billing). Real links with aria-current on the page
 * you are on; the row scrolls sideways on a phone instead of wrapping.
 */
export function PillNav({ links, current, label, className }: PillNavProps) {
  return (
    <nav data-slot="pill-nav" aria-label={label} className={cn("relative -mx-1 overflow-x-auto px-1 py-1 [scrollbar-width:none]", className)}>
      <ul className="flex w-max gap-1 rounded-full bg-muted p-1">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <a
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-xs"
            >
              {link.label}
              {link.count !== undefined ? <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] tabular-nums">{link.count}</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
