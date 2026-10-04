import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FooterMinimalProps {
  /** Your logo or wordmark. */
  brand: ReactNode;
  links: readonly { label: string; href: string }[];
  /** Social links: an icon and an accessible name each. */
  social?: readonly { label: string; href: string; icon: ReactNode }[];
  /** "© 2026 Company B.V." */
  legal: string;
  className?: string;
}

/**
 * The one-row footer for a small site: brand, a handful of links, social
 * icons and the legal line. Wraps to two rows on a phone.
 */
export function FooterMinimal({ brand, links, social = [], legal, className }: FooterMinimalProps) {
  return (
    <footer data-slot="footer-minimal" className={cn("border-t border-border py-10", className)}>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">{brand}</div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a href={link.href} className="hover:text-foreground">{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        {social.length ? (
          <ul className="flex gap-2">
            {social.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <a href={item.href} aria-label={item.label} className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4">{item.icon}</a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">{legal}</p>
    </footer>
  );
}
