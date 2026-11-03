import type { ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { ProductWindow, summaryOf, type DashboardWindow } from "@rhs-ui/marketing/dashboard-hero/window";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { DashboardKpi, DashboardNavItem, DashboardRow, DashboardTone, DashboardWindow } from "@rhs-ui/marketing/dashboard-hero/window";

export interface DashboardHeroAction {
  /** The button's text. */
  label: string;
  /** Where it leads. */
  href: string;
}

export interface DashboardHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** A short label above the title: "Billing for teams". */
  eyebrow?: string;
  /** The promise, in a line or two. */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The action you want pressed. */
  primary: DashboardHeroAction;
  /** A quieter second action. */
  secondary?: DashboardHeroAction;
  /** The product, drawn: a sidebar, three figures and a table. See DashboardWindow. */
  window: DashboardWindow;
}

/**
 * A SaaS opening with the product drawn in HTML: the pitch and two actions on
 * the left and, on the right, a window with a hairline border, three quiet
 * dots and a title, holding a dashboard made from your data: a slim sidebar, a
 * row of figures with how they moved, and a table whose every row ends in a
 * status word. The window runs off the right and bottom edges of its stage, so
 * it reads as a product bigger than the picture, and because it is real
 * markup it follows light and dark and never needs a screenshot. To a screen
 * reader the drawing is one sentence, made from its own figures; it is hidden
 * and inert, so nothing in it takes focus. Under 768px it sits below the copy,
 * still cropped. Depth comes from the hairline and one soft shadow, never from
 * a gradient or a glow.
 */
export function DashboardHero({ titleAs: Title = "h2", eyebrow, title, description, primary, secondary, window: product, className, ...props }: DashboardHeroProps) {
  return (
    <section data-slot="dashboard-hero" className={cn("grid grid-cols-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-20", className)} {...props}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-5 text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.375rem]">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <a href={primary.href}>
              {primary.label}
              <IconArrowRight />
            </a>
          </Button>
          {secondary ? (
            <Button asChild size="lg" variant="outline">
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : null}
        </div>
      </div>

      {/* The stage is the crop: the window is wider and taller than it, so its right and bottom edges are never seen. It is also a container, so the table can ask how much room the picture has (the amount column needs 36rem). */}
      <div data-slot="dashboard-hero-stage" className="@container relative isolate h-[31rem] min-w-0 overflow-hidden rounded-3xl bg-muted lg:h-[35rem]">
        <p className="sr-only">{summaryOf(product)}</p>
        {/* The window starts a little way in (left-*) and ends 43px past the stage's right edge at every width: its width is the stage plus 43px minus that offset. So the cut always falls in the same place, past most of the third figure's tile and through the amount column, and what is cut is cut in the open, never down to a sliver of border. */}
        <div
          aria-hidden="true"
          inert
          className="absolute top-6 left-5 h-[40rem] w-[calc(100%+1.4375rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm select-none sm:top-9 sm:left-8 sm:w-[calc(100%+0.6875rem)] lg:top-12 lg:left-10 lg:w-[calc(100%+0.1875rem)]"
        >
          <ProductWindow view={product} />
        </div>
      </div>
    </section>
  );
}
