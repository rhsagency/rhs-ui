import type { ReactNode } from "react";

import { IconMail, IconPhone, IconPin } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ContactCardProps {
  name: string;
  role?: string;
  company?: string;
  image?: string;
  email?: string;
  phone?: string;
  location?: string;
  /** Extra actions: "Message", "Add to CRM". */
  actions?: ReactNode;
  className?: string;
}

/**
 * A person with the ways to reach them: photo or initials, role and company,
 * and email, phone and place as real links (mailto, tel) with icons. For a
 * CRM sidebar, a team page or a support handover.
 */
export function ContactCard({ name, role, company, image, email, phone, location, actions, className }: ContactCardProps) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const row = "flex items-center gap-2.5 text-sm [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
  return (
    <article data-slot="contact-card" className={cn("rounded-2xl border border-border p-5", className)}>
      <header className="flex items-center gap-3">
        <span className="inline-flex size-12 shrink-0 items-center justify-center overflow-clip rounded-full bg-muted text-sm font-medium">{image ? <img src={image} alt="" className="size-full object-cover" /> : initials}</span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{name}</span>
          {role || company ? <span className="block truncate text-sm text-muted-foreground">{[role, company].filter(Boolean).join(", ")}</span> : null}
        </span>
      </header>
      <ul className="mt-4 grid gap-2">
        {email ? <li className={row}><IconMail aria-hidden="true" /><a href={`mailto:${email}`} className="truncate underline-offset-4 hover:underline">{email}</a></li> : null}
        {phone ? <li className={row}><IconPhone aria-hidden="true" /><a href={`tel:${phone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">{phone}</a></li> : null}
        {location ? <li className={row}><IconPin aria-hidden="true" /><span>{location}</span></li> : null}
      </ul>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}
