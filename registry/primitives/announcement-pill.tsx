import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AnnouncementPillProps {
  /** The short tag on the left: "New", "Beta", "v2.0". */
  tag: string;
  text: string;
  href: string;
  className?: string;
}

/**
 * The small rounded link above a hero title that points at the latest
 * news: a filled tag, one line of text and an arrow that nudges on hover.
 * The text truncates on a narrow screen instead of wrapping the pill.
 */
export function AnnouncementPill({ tag, text, href, className }: AnnouncementPillProps) {
  return (
    <a href={href} data-slot="announcement-pill" className={cn("group inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-sm outline-none hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}>
      <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">{tag}</span>
      <span className="truncate">{text}</span>
      <IconArrowRight aria-hidden="true" className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </a>
  );
}
