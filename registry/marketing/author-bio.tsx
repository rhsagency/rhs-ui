import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AuthorBioProps {
  name: string;
  role: string;
  bio: string;
  /** A portrait; initials are drawn when there is none. */
  image?: string;
  /** Links to their profile, other posts or socials. */
  links?: readonly { label: string; href: string }[];
  /** An extra action, like "Follow". */
  action?: ReactNode;
  className?: string;
}

/**
 * The box at the end of an article: who wrote it, what they do, a short bio
 * and where to read more. Marked up as an aside with rel="author" on the
 * profile link, so readers and search engines know who is behind the words.
 */
export function AuthorBio({ name, role, bio, image, links = [], action, className }: AuthorBioProps) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <aside data-slot="author-bio" aria-label="About the author" className={cn("flex flex-col gap-5 rounded-3xl border border-border p-6 sm:flex-row sm:p-8", className)}>
      <span className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-medium">
        {image ? <img src={image} alt="" className="size-full object-cover" /> : initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Written by</p>
            <p className="text-lg font-medium">{links[0] ? <a href={links[0].href} rel="author" className="hover:underline hover:underline-offset-4">{name}</a> : name}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
          {action}
        </div>
        <p className="mt-4 text-sm leading-relaxed">{bio}</p>
        {links.length > 1 ? (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {links.slice(1).map((link) => (
              <li key={`${link.href}-${link.label}`}><a href={link.href} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">{link.label}</a></li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
