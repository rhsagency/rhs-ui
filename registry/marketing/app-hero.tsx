import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AppHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  eyebrow?: string;
  title: string;
  description?: string;
  /** Store badges or buttons. */
  actions?: ReactNode;
  /** A rating or a download count under the actions. */
  proof?: ReactNode;
  /** The phone screen: an image or a live view, shown at a 9:19.5 ratio. */
  screen: ReactNode;
  className?: string;
}

/**
 * The opening for a mobile app: copy and store links on one side, the app in
 * a device frame on the other. The frame is drawn in CSS, so it follows the
 * theme and never needs a picture of a phone.
 */
export function AppHero({ eyebrow, title, description, actions, proof, screen, titleAs: Title = "h2", className }: AppHeroProps) {
  return (
    <section data-slot="app-hero" className={cn("grid items-center gap-14 py-16 md:grid-cols-[1.2fr_1fr] lg:py-24", className)}>
      <div>
        {eyebrow ? <p className="mb-6 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <Title className="max-w-xl text-5xl font-medium leading-[1.05] tracking-[-.055em] text-balance sm:text-6xl">{title}</Title>
        {description ? <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        {proof ? <div className="mt-6 text-sm text-muted-foreground">{proof}</div> : null}
      </div>
      <div className="mx-auto w-full max-w-[17rem]">
        <div className="relative aspect-[9/19.5] rounded-[2.6rem] border border-border bg-foreground p-2.5 shadow-xl">
          <div aria-hidden="true" className="absolute top-4 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-foreground" />
          <div className="size-full overflow-hidden rounded-[2.1rem] bg-background">{screen}</div>
        </div>
      </div>
    </section>
  );
}
