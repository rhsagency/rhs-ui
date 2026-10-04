import type { ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ServiceItem {
  href: string;
  title: string;
  description: string;
  /** "From €450", "Quote on request". */
  price?: string;
  icon?: ReactNode;
}

export interface ServiceListProps {
  title: string;
  description?: string;
  services: readonly ServiceItem[];
  className?: string;
}

/**
 * What a business does, as a numbered list of services: number, title, a
 * line of what is included, the starting price, and an arrow to the service
 * page. Reads like a menu of work for craftsmen, agencies and consultants;
 * each row is a single link.
 */
export function ServiceList({ title, description, services, className }: ServiceListProps) {
  return (
    <section data-slot="service-list" className={cn("py-16 sm:py-20", className)}>
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
          {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
        </div>
        <ol className="divide-y divide-border border-y border-border">
          {services.map((service, index) => (
            <li key={`${service.href}-${service.title}`}>
              <a href={service.href} className="group grid grid-cols-[2.5rem_1fr_auto] items-start gap-4 py-5 outline-none focus-visible:bg-muted/60">
                <span className="pt-0.5 font-mono text-sm text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="flex items-center gap-2 text-lg font-medium tracking-tight [&_svg]:size-5">{service.icon}{service.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{service.description}</span>
                  {service.price ? <span className="mt-2 block text-sm font-medium">{service.price}</span> : null}
                </span>
                <IconArrowRight aria-hidden="true" className="mt-1.5 size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground motion-reduce:transition-none" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
