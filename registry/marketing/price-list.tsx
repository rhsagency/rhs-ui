import { cn } from "@/lib/utils";

export interface PriceListItem {
  name: string;
  /** "45 min", "per m²". */
  detail?: string;
  /** Formatted: "€35", "from €80". */
  price: string;
  note?: string;
}

export interface PriceListGroup {
  title: string;
  items: readonly PriceListItem[];
}

export interface PriceListProps {
  title: string;
  description?: string;
  groups: readonly PriceListGroup[];
  /** Small print: "Prices include VAT." */
  footnote?: string;
  className?: string;
}

/**
 * The price list of a salon, a practice or a craftsman: groups of services
 * with a dotted leader to the price, the duration or unit beside the name,
 * and the small print underneath. Two columns of groups on wide screens,
 * one on a phone; each group a definition list.
 */
export function PriceList({ title, description, groups, footnote, className }: PriceListProps) {
  return (
    <section data-slot="price-list" className={cn("py-16 sm:py-20", className)}>
      <div className="max-w-xl">
        <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-10 grid gap-x-16 gap-y-10 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="border-b border-foreground pb-2 text-xs font-medium tracking-[.14em] uppercase">{group.title}</h3>
            <dl className="mt-2 grid">
              {group.items.map((item) => (
                <div key={item.name} className="py-2.5">
                  <div className="flex items-baseline gap-2">
                    <dt className="font-medium">{item.name}{item.detail ? <span className="ml-2 text-sm font-normal text-muted-foreground">{item.detail}</span> : null}</dt>
                    <span aria-hidden="true" className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-muted-foreground/50" />
                    <dd className="font-medium tabular-nums">{item.price}</dd>
                  </div>
                  {item.note ? <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p> : null}
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {footnote ? <p className="mt-8 text-xs text-muted-foreground">{footnote}</p> : null}
    </section>
  );
}
