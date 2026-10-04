import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FooterBigBrandProps {
  /** The brand name, set as large as the viewport allows. */
  name: string;
  links: readonly { label: string; href: string }[];
  /** Socials or a contact line. */
  aside?: ReactNode;
  legal: ReactNode;
  className?: string;
}

/**
 * A footer that ends the page with the name in huge type across the full
 * width, the links in one row above it. For studios and brands where the
 * name is the logo. The giant word is decoration; the page already says it.
 */
export function FooterBigBrand({ name, links, aside, legal, className }: FooterBigBrandProps) {
  return (
    <footer data-slot="footer-big-brand" className={cn("overflow-hidden border-t border-border pt-12", className)}>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {links.map((link) => (
              <li key={`${link.href}-${link.label}`}><a href={link.href} className="hover:underline hover:underline-offset-4">{link.label}</a></li>
            ))}
          </ul>
        </nav>
        {aside ? <div className="text-sm text-muted-foreground">{aside}</div> : null}
      </div>
      <p aria-hidden="true" className="mt-16 text-[22vw] leading-[.8] font-medium tracking-[-.08em] whitespace-nowrap select-none sm:text-[18vw] lg:text-[15rem]">{name}</p>
      <div className="flex flex-col gap-2 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">{legal}</div>
    </footer>
  );
}
