import { cn } from "@/lib/utils";

export interface HorizontalMilestone {
  id: string;
  /** "Q1 2026", "12 May". */
  when: string;
  title: string;
  description?: string;
  status: "done" | "current" | "next";
}

export interface TimelineHorizontalProps {
  milestones: readonly HorizontalMilestone[];
  label: string;
  className?: string;
}

/**
 * A roadmap or project plan along one line: done milestones solid, the
 * current one ringed and marked as the current step, the rest hollow, with
 * the line drawn solid up to where you are. Scrolls sideways with snap on a
 * phone instead of squeezing the labels.
 */
export function TimelineHorizontal({ milestones, label, className }: TimelineHorizontalProps) {
  const current = milestones.findIndex((m) => m.status === "current");
  const reached = current === -1 ? milestones.filter((m) => m.status === "done").length : current;
  return (
    <div data-slot="timeline-horizontal" className={cn("relative overflow-x-auto pb-2", className)}>
      <ol aria-label={label} className="relative flex min-w-max snap-x gap-0">
        {milestones.map((milestone, index) => (
          <li key={milestone.id} aria-current={milestone.status === "current" ? "step" : undefined} className="relative w-52 shrink-0 snap-start pr-6">
            <div className="flex items-center">
              <span className={cn("relative z-10 inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2", milestone.status === "done" ? "border-foreground bg-foreground" : milestone.status === "current" ? "border-foreground bg-background ring-4 ring-foreground/15" : "border-border bg-background")} />
              {index < milestones.length - 1 ? <span aria-hidden="true" className={cn("h-0.5 flex-1", index < reached ? "bg-foreground" : "bg-border")} /> : null}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{milestone.when}</p>
            <p className={cn("mt-0.5 text-sm font-medium", milestone.status === "next" && "text-muted-foreground")}>{milestone.title}</p>
            {milestone.description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{milestone.description}</p> : null}
            <span className="sr-only">{milestone.status === "done" ? "Done" : milestone.status === "current" ? "In progress" : "Planned"}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
