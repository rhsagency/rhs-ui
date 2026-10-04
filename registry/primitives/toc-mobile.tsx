import { IconChevronDown, IconList } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TocMobileItem {
  /** The id of the heading on the page. */
  id: string;
  title: string;
  /** 2 for a section, 3 for a subsection. */
  level: 2 | 3;
}

export interface TocMobileProps {
  items: readonly TocMobileItem[];
  title?: string;
  className?: string;
}

/**
 * "On this page" for small screens: a closed bar above the article that
 * opens into the list of headings. A native details element, so it works
 * without script, with the keyboard and in reader modes; pair it with
 * TableOfContents in a sticky aside on wide screens.
 */
export function TocMobile({ items, title = "On this page", className }: TocMobileProps) {
  return (
    <details data-slot="toc-mobile" className={cn("group rounded-2xl border border-border bg-card text-sm", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-2xl px-4 py-3 font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
        <IconList aria-hidden="true" className="size-4 text-muted-foreground" />
        <span className="flex-1">{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{items.filter((item) => item.level === 2).length} sections</span>
        <IconChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <nav aria-label={title} className="border-t border-border px-4 py-3">
        <ol className="grid gap-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={cn("block rounded-md py-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40", item.level === 3 ? "pl-4" : "font-medium text-foreground")}>{item.title}</a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
