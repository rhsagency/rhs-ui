import { cn } from "@/lib/utils";

export interface TreemapItem {
  id: string;
  label: string;
  value: number;
}

export interface TreemapChartProps {
  items: readonly TreemapItem[];
  label: string;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Height in pixels; the width follows the container. */
  height?: number;
  className?: string;
}

interface Rect { x: number; y: number; w: number; h: number }

/** Squarified layout (Bruls et al.): rows that keep each tile as close to square as possible. */
function squarify(values: number[], box: Rect): Rect[] {
  const total = values.reduce((sum, v) => sum + v, 0) || 1;
  const scale = (box.w * box.h) / total;
  const areas = values.map((v) => v * scale);
  const out: Rect[] = [];
  let rest = { ...box };
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(rest.w, rest.h);
    let row: number[] = [];
    let worst = Number.POSITIVE_INFINITY;
    while (i + row.length < areas.length) {
      const next = [...row, areas[i + row.length]!];
      const sum = next.reduce((a, b) => a + b, 0);
      const ratio = Math.max(...next.map((a) => Math.max((side * side * a) / (sum * sum), (sum * sum) / (side * side * a))));
      if (ratio > worst) break;
      worst = ratio;
      row = next;
    }
    const sum = row.reduce((a, b) => a + b, 0);
    const thick = sum / side;
    let offset = 0;
    for (const area of row) {
      const len = area / thick;
      out.push(rest.w >= rest.h ? { x: rest.x, y: rest.y + offset, w: thick, h: len } : { x: rest.x + offset, y: rest.y, w: len, h: thick });
      offset += len;
    }
    rest = rest.w >= rest.h ? { x: rest.x + thick, y: rest.y, w: rest.w - thick, h: rest.h } : { x: rest.x, y: rest.y + thick, w: rest.w, h: rest.h - thick };
    i += row.length;
  }
  return out;
}

/**
 * Parts of a whole as tiles sized by value: spend by team, storage by
 * folder, revenue by product. Squarified so tiles stay readable, shaded from
 * the largest down, labels only where they fit. Screen readers get the list
 * with each share.
 */
export function TreemapChart({ items, label, format, locale = "en-GB", height = 300, className }: TreemapChartProps) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0) || 1;
  const width = 640;
  const rects = squarify(sorted.map((item) => item.value), { x: 0, y: 0, w: width, h: height });
  const number = new Intl.NumberFormat(locale, format);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  return (
    <figure data-slot="treemap-chart" className={cn("relative", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible text-foreground" aria-hidden="true">
        {sorted.map((item, index) => {
          const rect = rects[index]!;
          const shade = 0.9 - (index / Math.max(1, sorted.length - 1)) * 0.75;
          const big = rect.w > 70 && rect.h > 38;
          return (
            <g key={item.id}>
              <rect x={rect.x + 1} y={rect.y + 1} width={Math.max(0, rect.w - 2)} height={Math.max(0, rect.h - 2)} rx={6} fill="currentColor" fillOpacity={shade} />
              {big ? (
                <>
                  <text x={rect.x + 10} y={rect.y + 20} className={cn("text-[12px] font-medium", shade > 0.45 ? "fill-background" : "fill-foreground")}>{item.label}</text>
                  <text x={rect.x + 10} y={rect.y + 36} className={cn("text-[11px]", shade > 0.45 ? "fill-background/80" : "fill-muted-foreground")} suppressHydrationWarning>{number.format(item.value)}</text>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        {label}
        <ul>{sorted.map((item) => <li key={item.id}>{`${item.label}: ${number.format(item.value)}, ${percent.format(item.value / total)}`}</li>)}</ul>
      </figcaption>
    </figure>
  );
}
