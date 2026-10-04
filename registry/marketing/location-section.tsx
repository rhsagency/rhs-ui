import type { ReactNode } from "react";

import { IconMail, IconNavigation, IconPhone, IconPin } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface LocationSectionProps {
  title: string;
  name: string;
  address: readonly string[];
  phone?: string;
  email?: string;
  directionsHref: string;
  /** Opening hours, parking, public transport: a component or a few lines. */
  aside?: ReactNode;
  /** A static map or your map component; a calm placeholder otherwise, so nothing third-party loads by default. */
  map?: ReactNode;
  className?: string;
}

/**
 * "Where to find us" for a local business: address as a real address
 * element, phone and email as tap-to-call and mail links, directions, and a
 * slot for opening hours or parking, beside a map. The same name, address
 * and phone you use everywhere else (NAP), in one place.
 */
export function LocationSection({ title, name, address, phone, email, directionsHref, aside, map, className }: LocationSectionProps) {
  const row = "flex items-start gap-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
  return (
    <section data-slot="location-section" className={cn("grid gap-8 py-16 sm:py-20 lg:grid-cols-[1fr_1.3fr]", className)}>
      <div>
        <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
        <div className="mt-8 grid gap-4">
          <p className="font-medium">{name}</p>
          <div className={row}><IconPin aria-hidden="true" /><address className="leading-relaxed not-italic">{address.map((line) => <span key={line} className="block">{line}</span>)}</address></div>
          {phone ? <div className={row}><IconPhone aria-hidden="true" /><a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">{phone}</a></div> : null}
          {email ? <div className={row}><IconMail aria-hidden="true" /><a href={`mailto:${email}`} className="underline-offset-4 hover:underline">{email}</a></div> : null}
          <a href={directionsHref} className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background outline-none hover:bg-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4"><IconNavigation aria-hidden="true" />Directions</a>
        </div>
        {aside ? <div className="mt-8">{aside}</div> : null}
      </div>
      <div className="relative min-h-80 overflow-clip rounded-3xl border border-border bg-muted">
        {map ?? (
          <svg aria-hidden="true" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full text-foreground">
            {Array.from({ length: 16 }, (_, i) => <line key={`v${i}`} x1={i * 28} x2={i * 28 - 30} y1="0" y2="300" stroke="currentColor" strokeOpacity="0.06" strokeWidth={i % 5 === 0 ? 9 : 2} />)}
            {Array.from({ length: 11 }, (_, i) => <line key={`h${i}`} x1="0" x2="400" y1={i * 30} y2={i * 30 + 18} stroke="currentColor" strokeOpacity="0.06" strokeWidth={i % 4 === 0 ? 9 : 2} />)}
            <circle cx="200" cy="150" r="10" fill="currentColor" /><circle cx="200" cy="150" r="22" fill="none" stroke="currentColor" strokeOpacity="0.3" />
          </svg>
        )}
      </div>
    </section>
  );
}
