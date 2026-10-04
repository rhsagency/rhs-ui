import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Speaker {
  id: string;
  name: string;
  role: string;
  /** The talk title. */
  talk?: string;
  /** A portrait, always visible. */
  photo: ReactNode;
  href?: string;
}

export interface SpeakerGridProps {
  title: string;
  description?: string;
  speakers: readonly Speaker[];
  className?: string;
}

/**
 * The speakers of an event: portraits in a grid with name, role and the
 * talk they give, each linking to their session. Portraits are square and
 * cropped from the top so faces line up across the row.
 */
export function SpeakerGrid({ title, description, speakers, className }: SpeakerGridProps) {
  return (
    <section data-slot="speaker-grid" className={cn("py-16 sm:py-20", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-xl text-base text-muted-foreground">{description}</p> : null}
      <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {speakers.map((speaker) => {
          const body = (
            <>
              <span className="block aspect-square overflow-clip rounded-2xl bg-muted [&_img]:size-full [&_img]:object-cover [&_img]:object-top">{speaker.photo}</span>
              <span className="mt-3 block font-medium">{speaker.name}</span>
              <span className="block text-sm text-muted-foreground">{speaker.role}</span>
              {speaker.talk ? <span className="mt-2 block text-sm leading-snug">“{speaker.talk}”</span> : null}
            </>
          );
          return <li key={speaker.id}>{speaker.href ? <a href={speaker.href} className="group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">{body}</a> : body}</li>;
        })}
      </ul>
    </section>
  );
}
