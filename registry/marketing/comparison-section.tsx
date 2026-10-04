import { IconCheck, IconClose } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ComparisonRow {
  topic: string;
  /** How it goes the old way. */
  before: string;
  /** How it goes with you. */
  after: string;
}

export interface ComparisonSectionProps {
  eyebrow?: string;
  title: string;
  beforeLabel?: string;
  afterLabel: string;
  rows: readonly ComparisonRow[];
  className?: string;
}

/**
 * Before and after, row by row: the way people work now against the way they
 * will with you. Each row names its topic so it reads as a table on a phone
 * too, and both columns carry a mark and words, not colour alone.
 */
export function ComparisonSection({ eyebrow, title, beforeLabel = "The usual way", afterLabel, rows, className }: ComparisonSectionProps) {
  return (
    <section data-slot="comparison-section" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      </header>
      <div className="mt-12 overflow-hidden rounded-2xl border border-border">
        <div className="hidden grid-cols-[1fr_1.5fr_1.5fr] border-b border-border bg-muted text-sm font-medium md:grid">
          <span className="p-5">&nbsp;</span>
          <span className="p-5 text-muted-foreground">{beforeLabel}</span>
          <span className="p-5">{afterLabel}</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.topic} className="grid gap-3 p-5 md:grid-cols-[1fr_1.5fr_1.5fr] md:gap-0 md:p-0">
              <span className="text-sm font-medium md:p-5">{row.topic}</span>
              <span className="flex gap-2.5 text-sm text-muted-foreground md:p-5">
                <span className="mt-0.5 shrink-0 [&_svg]:size-4"><IconClose /></span>
                <span><span className="sr-only">{beforeLabel}: </span>{row.before}</span>
              </span>
              <span className="flex gap-2.5 text-sm md:p-5">
                <span className="mt-0.5 shrink-0 [&_svg]:size-4"><IconCheck /></span>
                <span><span className="sr-only">{afterLabel}: </span>{row.after}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
