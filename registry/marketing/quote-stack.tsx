import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface StackQuote {
  /** Identifies the quote in the stack. */
  id: string;
  /** One sentence, under fifteen words. The stack adds the quotation marks. */
  quote: string;
  /** Who said it. */
  name: string;
  /** Their job and company, written as it should be read: "Head of operations, Northwind". */
  role: string;
}

export interface QuoteStackProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. It is set small and quiet, so the quotes are the display type. */
  title: string;
  /** Four to six one-sentence quotes, in the order they are read. */
  quotes: readonly StackQuote[];
  /** Put every quote in the tab order, so keyboard focus dims the others the way a pointer does. Default true; set false for a stack that should add no tab stops. */
  focusable?: boolean;
}

/**
 * While the pointer is over one quote, every other quote falls back to 40 percent. It is a selector on the
 * list (`:has`), so there is no script and nothing moves. The media query keeps it to devices that can point:
 * on a touch screen a tap leaves a sticky hover behind, so there everything stays at full strength. The quote
 * you are on is forced to full strength, so a pointer and the keyboard can never dim each other's quote.
 * Every row is one hover target that includes the air above and below it, and on a wide screen the empty
 * third beside it, so the pointer hands over from one quote to the next with no gap between them where the
 * whole stack would flash back to full strength.
 */
const DIM_ON_POINTER = "[@media(hover:hover)]:group-has-[li:hover]/stack:opacity-40 hover:opacity-100!";
const DIM_ON_FOCUS = "group-has-[figure:focus-visible]/stack:opacity-40 focus-within:opacity-100!";

/**
 * Short lines of praise as typography: every quote set large, its attribution small beneath, stacked down the
 * page. On a wide screen they alternate between the left and the right two thirds of the width, so the section
 * reads as a wall of type and not a list of boxes; on a phone they sit in one left-aligned column. Point at one,
 * or tab to it, and the others fall back to 40 percent, in CSS only: no script and no motion, and on a touch
 * screen, which cannot point, everything stays at full strength. It is a real list of figures that reads in any
 * order. Use it for short, confident praise worth reading aloud; a testimonial list is for long quotes with a
 * result. No state of its own, so it renders on the server.
 */
export function QuoteStack({ title, quotes, focusable = true, className, ...props }: QuoteStackProps) {
  const heading = useId();

  return (
    <section data-slot="quote-stack" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <h2 id={heading} className="text-center text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </h2>
      {/* The space between quotes is padding of the rows, not a gap of the list, so there is no strip between two rows that belongs to none of them. The list is pulled up and down by the padding of its first and last row, which keeps the distances to the heading and to the section's edge what they were. */}
      <ul role="list" className="group/stack mt-4 -mb-8 grid sm:mt-6 sm:-mb-10">
        {quotes.map((item) => (
          // On a wide screen a row is the whole width and its padding keeps the quote to the left or the right two thirds, so the empty third beside a quote still belongs to it. The quote is also kept 4px in from the edge it sits against (the third is 4px short of a third), which is the room the focus ring below needs.
          <li key={item.id} className={cn("py-8 sm:py-10 lg:odd:pr-[calc(33.3333%-0.25rem)] lg:odd:pl-1 lg:even:pr-1 lg:even:pl-[calc(33.3333%-0.25rem)]", DIM_ON_POINTER, DIM_ON_FOCUS)}>
            {/* The focus ring is drawn by a pseudo-element, so it takes no room and moves nothing. It stands off the quote by 16px, 20px from sm up and 24px on a wide screen, where it clears the opening mark that hangs in the margin; with its own 3px it still ends inside the 24px gutter of a page (on a wide screen thanks to the 4px the row keeps the quote in from its edge). */}
            <figure
              tabIndex={focusable ? 0 : undefined}
              className="relative outline-none before:pointer-events-none before:absolute before:-inset-y-5 before:-inset-x-4 before:rounded-3xl before:opacity-0 before:ring-[3px] before:ring-ring/40 focus-visible:before:opacity-100 sm:before:-inset-x-5 lg:before:-inset-x-6"
            >
              <blockquote>
                {/* The opening mark hangs in the margin, so the first letter lines up with the lines below it. */}
                <p className="indent-[-0.4em] text-3xl leading-[1.12] font-medium tracking-[-0.04em] text-balance sm:text-4xl lg:text-5xl">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span aria-hidden="true" className="h-px w-6 bg-foreground/35" />
                <cite className="font-medium not-italic">{item.name}</cite>
                <span className="sr-only">, </span>
                <span className="text-muted-foreground">{item.role}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
