import { cn } from "@/lib/utils";

export interface Milestone {
  /** "2019", "Q3 2026", "Now". */
  when: string;
  title: string;
  description: string;
  /** Milestones still ahead are drawn as open dots. */
  upcoming?: boolean;
}

export interface TimelineSectionProps {
  eyebrow?: string;
  title: string;
  milestones: readonly Milestone[];
  className?: string;
}

/**
 * A story in dates, for an about page or a public roadmap. Done milestones
 * sit on a solid line with filled dots; upcoming ones on a dashed line with
 * open dots, and say so in text as well.
 */
export function TimelineSection({ eyebrow, title, milestones, className }: TimelineSectionProps) {
  return (
    <section data-slot="timeline-section" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      </header>
      <ol className="mx-auto mt-14 max-w-2xl">
        {milestones.map((milestone, index) => {
          const last = index === milestones.length - 1;
          return (
            <li key={`${milestone.when}-${milestone.title}`} className="relative grid grid-cols-[5.5rem_1.5rem_1fr] gap-x-4 pb-10 last:pb-0">
              <span className="pt-0.5 text-right font-mono text-xs text-muted-foreground">{milestone.when}</span>
              <span className="relative flex justify-center">
                <span className={cn("relative z-10 mt-1 size-3 rounded-full border-2 border-foreground", milestone.upcoming ? "bg-background" : "bg-foreground")} />
                {last ? null : <span aria-hidden="true" className={cn("absolute top-4 -bottom-10 left-1/2 w-px -translate-x-1/2", milestone.upcoming ? "border-l border-dashed border-border" : "bg-border")} />}
              </span>
              <div>
                <h3 className="text-base font-medium">
                  {milestone.title}
                  {milestone.upcoming ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">Planned</span> : null}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{milestone.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
