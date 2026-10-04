import type { ReactNode } from "react";

import { IconBriefcase, IconClock, IconEuro, IconPin } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface JobDetailProps {
  /** The title's element: "h1" (the default) on the job page itself, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  title: string;
  team: string;
  location: string;
  /** "Full-time, 32 to 40 hours". */
  hours: string;
  /** "€4,200 to €5,400 a month": honest salary ranges get more good applicants. */
  salary?: string;
  intro: string;
  sections: readonly { title: string; points: readonly string[] }[];
  /** The apply button or form link. */
  apply: ReactNode;
  /** "Questions? Ask Sara, our recruiter, at sara@example.com." */
  contact?: ReactNode;
  className?: string;
}

/**
 * A job posting that respects the reader: the facts first with icons (team,
 * place, hours, salary), a short intro, what you will do and what you bring
 * as scannable lists, and apply both on top and at the bottom. Pair it with
 * JobPosting structured data on the page.
 */
export function JobDetail({ titleAs: Title = "h1", title, team, location, hours, salary, intro, sections, apply, contact, className }: JobDetailProps) {
  const facts = [
    { icon: <IconBriefcase />, text: team },
    { icon: <IconPin />, text: location },
    { icon: <IconClock />, text: hours },
    ...(salary ? [{ icon: <IconEuro />, text: salary }] : []),
  ];
  return (
    <article data-slot="job-detail" className={cn("mx-auto max-w-3xl py-16", className)}>
      <header className="border-b border-border pb-8">
        <Title className="text-4xl font-medium tracking-[-.05em] text-balance sm:text-5xl">{title}</Title>
        <ul aria-label="About the role" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {facts.map((fact) => <li key={fact.text} className="flex items-center gap-2 [&_svg]:size-4">{fact.icon}{fact.text}</li>)}
        </ul>
        <div className="mt-8">{apply}</div>
      </header>
      <p className="mt-8 text-lg leading-relaxed text-pretty">{intro}</p>
      {sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xl font-medium tracking-tight">{section.title}</h2>
          <ul className="mt-4 grid gap-2.5">
            {section.points.map((point) => <li key={point} className="flex gap-3 text-base leading-relaxed"><span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground" />{point}</li>)}
          </ul>
        </section>
      ))}
      <footer className="mt-12 grid gap-4 rounded-3xl bg-muted/60 p-6 sm:p-8">
        <p className="text-lg font-medium">Sound like you?</p>
        <div>{apply}</div>
        {contact ? <p className="text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4">{contact}</p> : null}
      </footer>
    </article>
  );
}
