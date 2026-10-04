import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CtaImageBandProps {
  title: string;
  description?: string;
  actions: ReactNode;
  /** The photo behind the text: always visible, never animated in. */
  image: ReactNode;
  className?: string;
}

/**
 * A closing call to action over a full-bleed photo: a dark scrim from the
 * left keeps the text readable on any picture, in both themes, because the
 * text is always light on the scrim, not on the theme.
 */
export function CtaImageBand({ title, description, actions, image, className }: CtaImageBandProps) {
  return (
    <section data-slot="cta-image-band" className={cn("relative isolate my-16 overflow-clip rounded-3xl", className)}>
      <div className="absolute inset-0 -z-10 bg-neutral-800 [&_img]:size-full [&_img]:object-cover">{image}</div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/10" />
      <div className="max-w-xl px-6 py-16 text-white sm:px-12 sm:py-24">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-5xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-white/80">{description}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </div>
    </section>
  );
}
