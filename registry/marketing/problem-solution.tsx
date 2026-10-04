import { IconCheck, IconClose } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ProblemSolutionProps {
  title: string;
  description?: string;
  /** "Without us" side. */
  beforeLabel?: string;
  afterLabel?: string;
  /** Pairs: the pain and how it changes. */
  rows: readonly { before: string; after: string }[];
  className?: string;
}

/**
 * Before and after, row by row: the way it is now on the left with a cross,
 * the way it works with you on the right with a check, each pair on one
 * line so the change reads straight across. Two lists with headings, so it
 * is clear without the icons too.
 */
export function ProblemSolution({ title, description, beforeLabel = "Today", afterLabel = "With us", rows, className }: ProblemSolutionProps) {
  return (
    <section data-slot="problem-solution" className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-12 grid overflow-clip rounded-3xl border border-border md:grid-cols-2">
        <div className="bg-muted/50 p-6 sm:p-8">
          <h3 className="text-sm font-medium tracking-[.1em] text-muted-foreground uppercase">{beforeLabel}</h3>
          <ul className="mt-5 grid gap-4">
            {rows.map((row) => <li key={row.before} className="flex gap-3 text-sm leading-relaxed text-muted-foreground"><IconClose aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{row.before}</li>)}
          </ul>
        </div>
        <div className="p-6 sm:p-8">
          <h3 className="text-sm font-medium tracking-[.1em] uppercase">{afterLabel}</h3>
          <ul className="mt-5 grid gap-4">
            {rows.map((row) => <li key={row.after} className="flex gap-3 text-sm leading-relaxed"><IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{row.after}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
