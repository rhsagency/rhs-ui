import type { ComponentProps, ElementType } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { AutoGrid } from "@rhs-ui/primitives/auto-grid";
import { cn } from "@/lib/utils";

export interface TeamPerson {
  name: string;
  /** "Staff engineer". */
  role: string;
  /** "Utrecht", "Remote". Shown when `showLocation` is on. */
  location?: string;
  /** The year they joined, shown as "since 2019". */
  since?: number;
  /** A square portrait. The initials show as a monogram until it loads, or without one. */
  photo?: string;
  /** Their page or profile. The name links only when you pass one. */
  href?: string;
}

export interface TeamDepartment {
  /** Stable and URL-safe: the department can be linked as #id. */
  id: string;
  name: string;
  people: readonly TeamPerson[];
}

export interface TeamByDepartmentLabels {
  /** The jump row's landmark name. */
  jump: string;
  /** Read after each head count: "people". */
  people: string;
  /** How a start year reads: "since 2019". */
  since: (year: number) => string;
}

export interface TeamByDepartmentProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** A small line above the title: "The team". */
  eyebrow?: string;
  title?: string;
  /** The title's element: "h2" (the default) inside a page, "h1" when the roster is the page. Departments go one level below it. */
  titleAs?: "h1" | "h2";
  description?: string;
  departments: readonly TeamDepartment[];
  /** Show each person's place after their role. */
  showLocation?: boolean;
  /** Renders the names that have an href. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Replaces any of the fixed words, for another language. */
  labels?: Partial<TeamByDepartmentLabels>;
}

const LABELS: TeamByDepartmentLabels = { jump: "Departments", people: "people", since: (year) => `since ${year}` };

/**
 * The whole team as a roster, built to hold forty people on one page without
 * shrinking them into thumbnails: departments as sections with the head count
 * in the heading and a jump row on top, and inside each one, compact two-line
 * rows with a 40px portrait or monogram, the name, the role, and the place
 * and start year in the muted colour. Three columns on wide screens and one
 * on a phone; a name links only when you pass an href. For companies past
 * fifteen people, schools and clubs, where TeamGrid's big portraits stop
 * fitting.
 */
export function TeamByDepartment({ eyebrow, title, titleAs: Title = "h2", description, departments, showLocation = true, linkAs: Link = "a", labels, className, ...props }: TeamByDepartmentProps) {
  const text = { ...LABELS, ...labels };
  const Department = title ? (Title === "h1" ? "h2" : "h3") : "h2";
  return (
    <section data-slot="team-by-department" className={cn("py-16 sm:py-24", className)} {...props}>
      {title || description || eyebrow ? (
        <header className="max-w-2xl">
          {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
          {title ? <Title className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</Title> : null}
          {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </header>
      ) : null}
      <nav aria-label={text.jump} className={cn(title || description || eyebrow ? "mt-8" : undefined)}>
        <ul role="list" className="flex flex-wrap gap-2">
          {departments.map((department) => (
            <li key={department.id}>
              <a
                href={`#${department.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-4 text-sm outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                {department.name}
                <span aria-hidden="true" className="text-muted-foreground tabular-nums">
                  {department.people.length}
                </span>
                <span className="sr-only">
                  ({department.people.length} {text.people})
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-12 grid gap-14">
        {departments.map((department) => (
          <section key={department.id} id={department.id} aria-labelledby={`${department.id}-title`} className="scroll-mt-[calc(var(--sticky-top,5rem)_+_1.5rem)]">
            <Department id={`${department.id}-title`} className="flex items-baseline gap-3 border-b border-foreground pb-4 text-xl font-semibold tracking-[-.025em]">
              {department.name}
              <span className="text-base font-normal text-muted-foreground tabular-nums" aria-hidden="true">
                {department.people.length}
              </span>
              <span className="sr-only">
                ({department.people.length} {text.people})
              </span>
            </Department>
            <AutoGrid min={20} gap="lg" className="gap-y-0">
              {department.people.map((person) => {
                const details = [person.role, showLocation ? person.location : undefined, person.since ? text.since(person.since) : undefined].filter(Boolean);
                return (
                  <div key={`${person.name}-${person.role}`} className="group relative flex items-center gap-3.5 border-b border-border py-3.5">
                    <Avatar size="lg" className="data-[size=lg]:size-10">
                      {person.photo ? <AvatarImage src={person.photo} alt="" /> : null}
                      <AvatarFallback className="group-data-[size=lg]/avatar:text-sm">{initialsOf(person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] leading-snug font-medium">
                        {person.href ? (
                          <Link
                            href={person.href}
                            className="rounded-sm outline-none after:absolute after:-inset-x-2 after:inset-y-0 hover:underline hover:underline-offset-4 focus-visible:after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
                          >
                            {person.name}
                          </Link>
                        ) : (
                          person.name
                        )}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{details.join("\u2002·\u2002")}</p>
                    </div>
                    {person.href ? <IconArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-muted-foreground/60 transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:transition-none" /> : null}
                  </div>
                );
              })}
            </AutoGrid>
          </section>
        ))}
      </div>
    </section>
  );
}
