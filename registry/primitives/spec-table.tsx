import { cn } from "@/lib/utils";

export interface SpecGroup {
  title: string;
  rows: readonly { label: string; value: string }[];
}

export interface SpecTableProps {
  groups: readonly SpecGroup[];
  className?: string;
}

/**
 * Specifications grouped under headings: dimensions, materials, power,
 * what is in the box. A definition list per group, two columns on wide
 * screens, so long spec sheets stay easy to scan.
 */
export function SpecTable({ groups, className }: SpecTableProps) {
  return (
    <div data-slot="spec-table" className={cn("grid gap-8 md:grid-cols-2", className)}>
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{group.title}</h3>
          <dl className="divide-y divide-border border-y border-border">
            {group.rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
