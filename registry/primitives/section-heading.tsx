import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** A link or button on the right: "View all". */
  action?: ReactNode;
  align?: "left" | "center";
  /** Heading level: h2 for page sections, h3 inside a section. */
  as?: "h2" | "h3";
  className?: string;
}

/**
 * The heading every section needs, in one place: eyebrow, title, a line of
 * description and an optional action, left or centred. Keeps the rhythm of
 * a page consistent instead of hand-tuned per section.
 */
export function SectionHeading({ eyebrow, title, description, action, align = "left", as: Tag = "h2", className }: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <header data-slot="section-heading" className={cn("flex flex-wrap items-end gap-4", centered ? "flex-col items-center text-center" : "justify-between", className)}>
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow ? <p className="mb-3 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <Tag className={cn("font-medium tracking-[-.035em] text-balance", Tag === "h2" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl")}>{title}</Tag>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 text-sm">{action}</div> : null}
    </header>
  );
}
