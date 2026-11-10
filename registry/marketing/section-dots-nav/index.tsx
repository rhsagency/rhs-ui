import type { ComponentProps, ElementType } from "react";

import { DotsRail } from "@rhs-ui/marketing/section-dots-nav/dots-rail";
import { cn } from "@/lib/utils";

export interface DotsSection {
  /** The id of the section on the page, without the #. */
  id: string;
  /** The section's name. It is shown beside the dot on hover and focus, and it is always the dot's name for screen readers. */
  label: string;
}

export interface SectionDotsNavProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The sections of the page, in order: one dot each, linking to the element with that id. */
  sections: readonly DotsSection[];
  /** Which edge of the window the rail sits at. Default "right". */
  side?: "left" | "right";
  /** The pixels a fixed header covers at the top. A section counts as current once its top passes this line, and a click scrolls it to rest just below. Default 0. */
  offset?: number;
  /** The name of the navigation, for screen readers. Default "Sections". */
  label?: string;
  /** A CSS selector for the element that scrolls, when the page scrolls inside one instead of in the window: "#story". */
  scrollContainer?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
}

const SIDE = {
  right: { rail: "right-1.5", tag: "right-full mr-2" },
  left: { rail: "left-1.5", tag: "left-full ml-2" },
} as const;

/**
 * A slim rail of dots down the side of a long page, one for each section,
 * for one-page sites and long stories where the sections are the structure.
 * Each dot is a real link with its section's name shown on hover and focus and
 * always available to screen readers; the dot of the section you are in is
 * filled and longer, and marked aria-current="location". The section is found
 * with an IntersectionObserver, and a click scrolls to it smoothly, or at once
 * under reduced motion. The rail sits in the outer gutter of the window, so it
 * never covers content, and it is hidden below lg, where AnchorNav or a menu
 * does the job. The dots are server-rendered links, so a Server Component can
 * pass its router's Link as linkAs.
 */
export function SectionDotsNav({ sections, side = "right", offset = 0, label = "Sections", scrollContainer, linkAs: Link = "a", className, ...props }: SectionDotsNavProps) {
  const edge = SIDE[side];

  return (
    <DotsRail ids={sections.map((section) => section.id)} offset={offset} scrollContainer={scrollContainer} aria-label={label} className={cn(edge.rail, className)} {...props}>
      {sections.map((section, index) => (
        <li key={section.id}>
          <Link
            href={`#${section.id}`}
            data-dot={section.id}
            aria-current={index === 0 ? "location" : undefined}
            className="group/dot relative flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <span
              aria-hidden="true"
              className="block size-2 rounded-full bg-muted-foreground/70 transition-[height,background-color] duration-200 group-hover/dot:bg-foreground group-aria-[current=location]/dot:h-5 group-aria-[current=location]/dot:bg-foreground motion-reduce:transition-none"
            />
            <span
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium whitespace-nowrap text-popover-foreground opacity-0 shadow-xs transition-opacity duration-150 group-hover/dot:opacity-100 group-focus-visible/dot:opacity-100 motion-reduce:transition-none",
                edge.tag,
              )}
            >
              {section.label}
            </span>
          </Link>
        </li>
      ))}
    </DotsRail>
  );
}
