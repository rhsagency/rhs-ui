import { cn } from "@/lib/utils";

export interface CategoryBand {
  /** Upper bound of the band. */
  to: number;
  label: string;
}

export interface CategoryBarProps {
  label: string;
  value: number;
  /** Bands from low to high: [{ to: 50, label: "Poor" }, { to: 80, label: "Fair" }, { to: 100, label: "Good" }]. */
  bands: readonly CategoryBand[];
  /** Where the bar starts. */
  min?: number;
  /** How the value reads. */
  suffix?: string;
  className?: string;
}

/**
 * A score on a scale of named bands: a health score, a credit rating, a
 * performance grade. The bands step in shade, a marker sits at the value,
 * and the band it falls in is said in words under it ("72, Fair"), so
 * nobody has to read the colour.
 */
export function CategoryBar({ label, value, bands, min = 0, suffix = "", className }: CategoryBarProps) {
  const max = bands.at(-1)?.to ?? 100;
  const span = max - min || 1;
  const band = bands.find((b) => value <= b.to) ?? bands.at(-1);
  const at = Math.min(100, Math.max(0, ((value - min) / span) * 100));
  let from = min;
  return (
    <figure data-slot="category-bar" className={cn("grid gap-2", className)}>
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span><span className="font-medium tabular-nums">{value}{suffix}</span> <span className="text-muted-foreground">{band?.label}</span></span>
      </figcaption>
      <div aria-hidden="true" className="relative pt-3">
        <span className="absolute top-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-foreground" style={{ left: `${at}%` }} />
        <div className="flex h-2.5 gap-0.5 overflow-clip rounded-full">
          {bands.map((b, index) => {
            const width = ((b.to - from) / span) * 100;
            from = b.to;
            return <span key={b.label} className="h-full bg-foreground" style={{ width: `${width}%`, opacity: 0.18 + (index / Math.max(1, bands.length - 1)) * 0.62 }} />;
          })}
        </div>
        <div className="mt-1.5 flex text-[10px] text-muted-foreground">
          {(() => { let start = min; return bands.map((b) => { const width = ((b.to - start) / span) * 100; start = b.to; return <span key={b.label} style={{ width: `${width}%` }} className="truncate">{b.label}</span>; }); })()}
        </div>
      </div>
    </figure>
  );
}
