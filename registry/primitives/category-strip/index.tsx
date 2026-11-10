import type { ComponentProps, ElementType, MouseEvent, ReactNode } from "react";

import { CategoryStripScroller } from "@rhs-ui/primitives/category-strip/scroller";
import { cn } from "@/lib/utils";

export interface Category {
  /** What `current` and `onSelect` speak. Unique among the categories. */
  id: string;
  /** The name under the icon. It is never cut: it sets the width of its item. */
  label: string;
  /** An icon element above the label: `<IconCabin />`. It is decoration and is sized by the strip. */
  icon?: ReactNode;
  /** Where the category goes. With one, the item is a link; without, a button. */
  href?: string;
  /** How many things are in it. Written after the label, in tabular figures, and read out after the name. */
  count?: number;
}

export interface CategoryStripProps extends Omit<ComponentProps<"div">, "children" | "onSelect" | "ref"> {
  /** The categories, in order. */
  categories: readonly Category[];
  /** The `id` of the current category: underlined, and marked aria-current="page" on a link or aria-pressed on a button. */
  current?: string;
  /** Called with the `id` of the category chosen. On a link, a plain click calls it and the browser's own navigation is skipped, so route yourself; a function, so use it from a Client Component. */
  onSelect?: (id: string) => void;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** `sm`, `md` or `lg`: the icon is 20, 24 or 28px. Default "md". */
  size?: "sm" | "md" | "lg";
  /** The name of the strip for assistive technology. Default "Categories". */
  label?: string;
  /** The locale the counts are written in. Default "en-US". */
  locale?: string;
}

type Size = NonNullable<CategoryStripProps["size"]>;

/** Written out whole so Tailwind can see them. */
const SIZE: Record<Size, string> = {
  sm: "min-w-14 gap-1 px-2.5 pt-1.5 pb-2.5 text-xs [&_svg]:size-5",
  md: "min-w-[4.5rem] gap-1.5 px-3.5 pt-2 pb-3 text-[0.8125rem] [&_svg]:size-6",
  lg: "min-w-24 gap-2 px-4 pt-2.5 pb-3.5 text-sm [&_svg]:size-7",
};

/** Medium weight whether current or not, so choosing one never changes a width. The underline is a pseudo-element, so it adds none. */
const ITEM =
  "group/category relative flex shrink-0 flex-col items-center rounded-lg font-medium whitespace-nowrap text-muted-foreground outline-none select-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none aria-[current=page]:text-foreground aria-pressed:text-foreground [&_svg]:shrink-0 " +
  "after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-20 aria-[current=page]:after:opacity-100 aria-pressed:after:opacity-100 motion-reduce:after:transition-none";

/**
 * The category bar of a marketplace or a stays site: an icon above a short name, in a row that scrolls sideways
 * behind fade edges, with arrows that appear only when something is hidden. The current category is underlined and
 * marked for everyone (aria-current on links, aria-pressed on buttons) and scrolls itself into view. A mouse can
 * drag the row and it glides on; touch keeps its own momentum; the arrow keys, Home and End move between items
 * with one tab stop for the strip. Names never truncate, they set the width of their item. There are no panels:
 * choosing a category only changes what the page below shows. With `linkAs` the items are drawn on the server.
 */
export function CategoryStrip({ categories, current, onSelect, linkAs: Link = "a", size = "md", label = "Categories", locale = "en-US", className, ...props }: CategoryStripProps) {
  if (!categories.length) return null;
  const links = categories.some((category) => category.href);
  const numbers = new Intl.NumberFormat(locale);
  const known = categories.some((category) => category.id === current);

  const items = categories.map((category, index) => {
    const selected = category.id === current;
    // One tab stop for the whole strip: the current item, or the first when none is current.
    const stop = known ? selected : index === 0;
    const inside = (
      <>
        {category.icon ? (
          <span aria-hidden="true" className="grid place-items-center">
            {category.icon}
          </span>
        ) : null}
        <span className="flex items-baseline gap-1">
          {category.label}
          {category.count !== undefined ? (
            <>
              <span className="sr-only">, </span>
              <span className="text-[0.6875rem] font-normal text-muted-foreground tabular-nums">{numbers.format(category.count)}</span>
            </>
          ) : null}
        </span>
      </>
    );
    const classes = cn(ITEM, SIZE[size]);
    return (
      <li key={category.id} className="flex">
        {category.href ? (
          <Link
            href={category.href}
            data-category={category.id}
            aria-current={selected ? "page" : undefined}
            tabIndex={stop ? 0 : -1}
            onClick={
              onSelect
                ? (event: MouseEvent<HTMLElement>) => {
                    // A modified click opens the address the way the browser does; only a plain one is yours.
                    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    onSelect(category.id);
                  }
                : undefined
            }
            className={classes}
          >
            {inside}
          </Link>
        ) : (
          <button type="button" data-category={category.id} aria-pressed={selected} tabIndex={stop ? 0 : -1} onClick={onSelect ? () => onSelect(category.id) : undefined} className={classes}>
            {inside}
          </button>
        )}
      </li>
    );
  });

  const list = (
    <CategoryStripScroller currentKey={current}>
      {/* The hairline runs the whole length of what scrolls, so it fades out with the row. */}
      <ul className="flex w-max min-w-full gap-1 border-b border-border px-1">{items}</ul>
    </CategoryStripScroller>
  );

  return links ? (
    <nav data-slot="category-strip" data-size={size} aria-label={label} className={cn("min-w-0", className)} {...props}>
      {list}
    </nav>
  ) : (
    <div data-slot="category-strip" data-size={size} role="group" aria-label={label} className={cn("min-w-0", className)} {...props}>
      {list}
    </div>
  );
}
