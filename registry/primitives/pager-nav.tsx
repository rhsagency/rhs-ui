import { IconArrowLeft, IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PagerLink {
  href: string;
  title: string;
}

export interface PagerNavProps {
  previous?: PagerLink;
  next?: PagerLink;
  /** "Guide", "Lesson", "Chapter": the word above each title. */
  noun?: string;
  className?: string;
}

/**
 * Previous and next at the end of a doc page, a lesson or a blog series: two
 * cards with the direction, the title and an arrow that nudges on hover. The
 * links carry rel="prev" and rel="next", and a missing side leaves its half
 * empty so the other stays where people expect it.
 */
export function PagerNav({ previous, next, noun = "Page", className }: PagerNavProps) {
  const card = "group flex flex-col gap-1 rounded-2xl border border-border p-4 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40";
  return (
    <nav data-slot="pager-nav" aria-label={`${noun} navigation`} className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {previous ? (
        <a href={previous.href} rel="prev" className={card}>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><IconArrowLeft aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" />Previous {noun.toLowerCase()}</span>
          <span className="font-medium text-balance">{previous.title}</span>
        </a>
      ) : <span className="hidden sm:block" />}
      {next ? (
        <a href={next.href} rel="next" className={cn(card, "sm:items-end sm:text-right")}>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">Next {noun.toLowerCase()}<IconArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" /></span>
          <span className="font-medium text-balance">{next.title}</span>
        </a>
      ) : null}
    </nav>
  );
}
