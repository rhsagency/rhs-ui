"use client";

import { useMemo, useState } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface Opening {
  id: string;
  title: string;
  team: string;
  location: string;
  /** "Full-time", "Contract". */
  type: string;
  href: string;
}

export interface CareersListProps {
  title?: string;
  description?: string;
  openings: readonly Opening[];
  className?: string;
}

/**
 * Open roles grouped by team, with a filter row of teams. Each role is one
 * link with title, location and type; the filter is a set of toggle buttons
 * that say how many roles each team has.
 */
export function CareersList({ title = "Open roles", description, openings, className }: CareersListProps) {
  const teams = useMemo(() => [...new Set(openings.map((opening) => opening.team))], [openings]);
  const [team, setTeam] = useState<string | null>(null);
  const shown = team ? openings.filter((opening) => opening.team === team) : openings;
  const grouped = teams.filter((name) => !team || name === team).map((name) => ({ name, roles: shown.filter((opening) => opening.team === name) }));
  const chip = "rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
  return (
    <section data-slot="careers-list" className={cn("py-16 sm:py-24", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      <div role="group" aria-label="Filter by team" className="mt-8 flex flex-wrap gap-2">
        <button type="button" aria-pressed={team === null} onClick={() => setTeam(null)} className={cn(chip, team === null ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted")}>
          All <span className="tabular-nums opacity-60">{openings.length}</span>
        </button>
        {teams.map((name) => (
          <button key={name} type="button" aria-pressed={team === name} onClick={() => setTeam(name)} className={cn(chip, team === name ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted")}>
            {name} <span className="tabular-nums opacity-60">{openings.filter((opening) => opening.team === name).length}</span>
          </button>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-10">
        {grouped.map((group) => (
          <div key={group.name}>
            <h3 className="text-xs font-medium uppercase tracking-[.16em] text-muted-foreground">{group.name}</h3>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {group.roles.map((role) => (
                <li key={role.id}>
                  <a href={role.href} className="group flex flex-wrap items-center gap-x-6 gap-y-1 py-5 outline-none focus-visible:bg-muted">
                    <span className="w-full text-base font-medium group-hover:underline group-hover:underline-offset-4 sm:w-auto sm:flex-1">{role.title}</span>
                    <span className="text-sm text-muted-foreground">{role.location}</span>
                    <span className="text-sm text-muted-foreground">{role.type}</span>
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 [&_svg]:size-4"><IconArrowUpRight /></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
