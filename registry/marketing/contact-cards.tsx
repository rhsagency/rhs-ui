import type { ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ContactRoute {
  icon: ReactNode;
  /** Who this route is for: "Sales", "Support", "Press". */
  title: string;
  description: string;
  /** "Reply within a day", "Mon to Fri, 9:00 to 17:00". */
  promise?: string;
  /** The link text and target: an email, a phone number, a form. */
  label: string;
  href: string;
}

export interface ContactCardsProps {
  title: string;
  description?: string;
  routes: readonly ContactRoute[];
  className?: string;
}

/**
 * "Who should I talk to?": one card per route (sales, support, press) with
 * what it is for, how fast you answer, and the one link that gets there.
 * Sends people to the right inbox before they write.
 */
export function ContactCards({ title, description, routes, className }: ContactCardsProps) {
  return (
    <section data-slot="contact-cards" className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {routes.map((route) => (
          <li key={route.title} className="flex flex-col rounded-3xl border border-border p-7">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-muted [&_svg]:size-5">{route.icon}</span>
            <h3 className="mt-6 text-lg font-medium">{route.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{route.description}</p>
            {route.promise ? <p className="mt-4 text-xs text-muted-foreground">{route.promise}</p> : null}
            <a href={route.href} className="group mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline">
              {route.label}
              <IconArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
