/**
 * The look of one link of the subnav, shared by the server half (the links of a product's pages, rendered with your router's Link) and
 * the client half (the links that jump within the page). It is tall as its row, and the current page or section carries a line on the
 * bar's own hairline that grows from the middle. Every class is written out, because Tailwind only generates what it can read.
 */
export const subnavLink =
  "relative flex h-11 items-center rounded-lg px-3 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset md:h-[55px] " +
  "after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-200 " +
  "aria-[current=location]:font-medium aria-[current=location]:text-foreground aria-[current=location]:after:scale-x-100 aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100 " +
  "motion-reduce:transition-none motion-reduce:after:transition-none";
