import type { ReactNode } from "react";

import { Marquee } from "@rhs-ui/primitives/marquee";
import { cn } from "@/lib/utils";

export interface MarqueeLogo {
  name: string;
  mark?: ReactNode;
}

export interface LogoMarqueeProps {
  title?: string;
  logos: readonly MarqueeLogo[];
  /** Seconds for one pass. */
  duration?: number;
  className?: string;
}

/**
 * A drifting row of customer marks under a quiet line. Built on Marquee, so
 * it pauses on hover and focus and stands still under reduced motion.
 */
export function LogoMarquee({ title = "Trusted by teams at", logos, duration = 36, className }: LogoMarqueeProps) {
  return (
    <section data-slot="logo-marquee" className={cn("py-12 sm:py-16", className)}>
      <h2 className="mb-8 text-center text-sm text-muted-foreground">{title}</h2>
      <Marquee label={title} duration={duration}>
        {logos.map((logo) => (
          <span key={logo.name} className="flex h-10 items-center text-foreground/55 [&_svg]:h-7 [&_svg]:w-auto">
            {logo.mark ? (
              <>
                <span aria-hidden="true">{logo.mark}</span>
                <span className="sr-only">{logo.name}</span>
              </>
            ) : (
              <span className="text-lg font-semibold tracking-tight whitespace-nowrap">{logo.name}</span>
            )}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
