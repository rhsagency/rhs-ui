import type { ReactNode } from "react";

import { IconPlay, IconSmartphone } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AppStoreLink {
  store: "app-store" | "google-play";
  href: string;
}

export interface AppDownloadHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  title: string;
  description?: string;
  stores: readonly AppStoreLink[];
  /** "4.9 on the App Store, 12k ratings". */
  rating?: ReactNode;
  /** The app on a phone; sits in a phone-shaped frame. */
  screen: ReactNode;
  className?: string;
}

const STORE = {
  "app-store": { icon: <IconSmartphone />, small: "Download on the", name: "App Store" },
  "google-play": { icon: <IconPlay />, small: "Get it on", name: "Google Play" },
} as const;

/**
 * The opening for a mobile app: the promise, the two store buttons drawn in
 * the house style (no copied badges), a rating line, and the app in a phone
 * frame that leans into the section.
 */
export function AppDownloadHero({ titleAs: Title = "h2", title, description, stores, rating, screen, className }: AppDownloadHeroProps) {
  return (
    <section data-slot="app-download-hero" className={cn("grid items-center gap-12 overflow-x-clip py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:gap-20", className)}>
      <div>
        <Title className="text-4xl font-medium leading-[1.05] tracking-[-.05em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {stores.map((link) => {
            const store = STORE[link.store];
            return (
              <a key={link.store} href={link.href} className="inline-flex h-13 items-center gap-3 rounded-xl bg-foreground px-4 text-background outline-none hover:bg-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-6">
                {store.icon}
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-75">{store.small}</span>
                  <span className="block text-base font-medium">{store.name}</span>
                </span>
              </a>
            );
          })}
        </div>
        {rating ? <div className="mt-5 text-sm text-muted-foreground">{rating}</div> : null}
      </div>
      <div className="mx-auto w-64 rotate-3 rounded-[2.5rem] border-[10px] border-foreground bg-background shadow-2xl sm:w-72">
        <div className="aspect-[9/19] overflow-hidden rounded-[1.8rem] bg-muted">{screen}</div>
      </div>
    </section>
  );
}
