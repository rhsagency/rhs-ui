import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export interface ViewedProduct {
  id: string;
  title: string;
  price: Money;
  image: { src: string; alt: string };
  href: string;
}

export interface RecentlyViewedProps {
  title?: string;
  products: readonly ViewedProduct[];
  /** A "Clear" control, wired to wherever you keep the history. */
  clear?: React.ReactNode;
  locale?: string;
  className?: string;
}

/**
 * The strip at the bottom of a product page: what the shopper looked at
 * before, small, in a row that scrolls sideways with snap on a phone and
 * wraps into a grid on wide screens. Each tile is one link. The history
 * itself is yours to keep (local storage or the account), never inferred.
 */
export function RecentlyViewed({ title = "Recently viewed", products, clear, locale = "en-GB", className }: RecentlyViewedProps) {
  if (!products.length) return null;
  return (
    <section data-slot="recently-viewed" aria-label={title} className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-medium tracking-tight">{title}</h2>
        {clear ? <div className="text-sm text-muted-foreground">{clear}</div> : null}
      </div>
      <ul className="relative -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {products.map((product) => (
          <li key={product.id} className="w-36 shrink-0 snap-start sm:w-auto">
            <a href={product.href} className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <span className="block aspect-square overflow-clip rounded-xl bg-muted">
                <img src={product.image.src} alt={product.image.alt} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
              </span>
              <span className="mt-2 block truncate text-sm">{product.title}</span>
              <span className="block text-sm text-muted-foreground tabular-nums" suppressHydrationWarning>{formatMoney(product.price, locale)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
