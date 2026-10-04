"use client";
import { useState } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { PlusGrid } from "@rhs-ui/backgrounds/plus-grid";
import { IconArrowUpRight, IconBriefcase, IconGlobe, IconGraduationCap, IconHeart, IconHome, IconPin, IconSearch, IconSun, IconUsers } from "@rhs-ui/icons";
import { FeatureGrid, type Feature } from "@rhs-ui/marketing/feature-grid";
import { Reveal } from "@rhs-ui/motion/reveal";
import { TextReveal } from "@rhs-ui/motion/text-reveal";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Stepper } from "@rhs-ui/primitives/stepper";

export interface Role { id: string; title: string; team: string; place: string; kind: string; href: string }

export interface CareersProps {
  company?: string;
  roles?: readonly Role[];
  benefits?: readonly Feature[];
}

const ROLES: Role[] = [
  { id: "1", title: "Senior product designer", team: "Design", place: "Amsterdam or remote EU", kind: "Full-time", href: "#" },
  { id: "2", title: "Staff engineer, platform", team: "Engineering", place: "Remote EU", kind: "Full-time", href: "#" },
  { id: "3", title: "Frontend engineer", team: "Engineering", place: "Amsterdam", kind: "Full-time", href: "#" },
  { id: "4", title: "Product marketing manager", team: "Marketing", place: "Amsterdam", kind: "Full-time", href: "#" },
  { id: "5", title: "Customer success lead", team: "Customers", place: "Berlin or remote EU", kind: "Full-time", href: "#" },
  { id: "6", title: "Design engineer, internship", team: "Design", place: "Amsterdam", kind: "6 months", href: "#" },
];

const BENEFITS: Feature[] = [
  { id: "remote", icon: <IconHome size={20} />, title: "Work where you work best", description: "Remote in the EU or at our canal office. We meet in person every quarter." },
  { id: "leave", icon: <IconSun size={20} />, title: "Thirty days off", description: "Plus the week between Christmas and New Year, when the whole company is closed." },
  { id: "learn", icon: <IconGraduationCap size={20} />, title: "€2,000 to learn", description: "Every year, for courses, books and conferences you choose." },
  { id: "health", icon: <IconHeart size={20} />, title: "Health, covered", description: "Full health insurance and a monthly budget for sport or therapy." },
  { id: "equity", icon: <IconBriefcase size={20} />, title: "Real equity", description: "Options for everyone, with a ten-year window to exercise." },
  { id: "lunch", icon: <IconUsers size={20} />, title: "Lunch together", description: "Cooked in our kitchen every office day, and paid for on remote days." },
];

/**
 * A careers page: why work here, the open roles with a team filter and a
 * search that answers as you type, benefits, how hiring works, and an open
 * application for everyone else.
 */
export function Careers({ company = "Outline", roles = ROLES, benefits = BENEFITS }: CareersProps): React.JSX.Element {
  const [team, setTeam] = useState("All");
  const [query, setQuery] = useState("");
  const teams = ["All", ...new Set(roles.map((role) => role.team))];
  const shown = roles.filter((role) => (team === "All" || role.team === team) && `${role.title} ${role.place}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div data-slot="careers" className="bg-background text-foreground">
      <PlusGrid className="border-b border-border [&>canvas]:opacity-25" speed={0.3}>
        <nav aria-label="Company" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm sm:px-10">
          <a href="#careers-top" className="font-semibold tracking-tight">{company}</a>
          <a href="#careers-roles" className="rounded-full bg-foreground px-4 py-2 text-background">Open roles · {roles.length}</a>
        </nav>
        <header id="careers-top" className="mx-auto max-w-6xl px-6 pt-16 pb-24 sm:px-10">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Careers at {company}</p>
          <h1 className="mt-6 max-w-4xl text-6xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-7xl">Do the best work of your career, calmly.</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">We are 48 people building tools for teams who hate busywork. We hire slowly, pay well and keep meetings rare.</p>
        </header>
      </PlusGrid>

      <section className="mx-auto max-w-4xl px-6 py-24 sm:px-10">
        <TextReveal as="p" className="text-center text-3xl font-semibold leading-snug tracking-tight sm:text-4xl" text="We write things down, decide in the open, and trust people to manage their own time. Most of our best ideas came from someone who joined last year." />
      </section>

      <section id="careers-roles" className="scroll-mt-6 border-y border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-4xl font-semibold tracking-[-0.03em]">Open roles</h2>
            <SearchInput value={query} onValueChange={setQuery} placeholder="Search roles" aria-label="Search roles" className="w-full sm:w-64" />
          </Reveal>
          <SegmentedControl label="Team" value={team} onValueChange={setTeam} options={teams.map((value) => ({ value, label: value }))} className="mt-8" />
          <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">{shown.length} {shown.length === 1 ? "role" : "roles"}</p>
          {shown.length ? (
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-background">
              {shown.map((role) => (
                <li key={role.id}>
                  <a href={role.href} className="group flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium group-hover:underline">{role.title}</span>
                      <span className="text-sm text-muted-foreground">{role.team} · {role.kind}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><IconPin size={14} /> {role.place}</span>
                    <IconArrowUpRight size={18} className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4 rounded-2xl border border-border bg-background" icon={<IconSearch size={20} />} title="No roles match" description="Try another team or word, or send an open application below." />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <Reveal>
          <FeatureGrid eyebrow="Benefits" title="What you get, besides the work." features={benefits} columns={3} />
        </Reveal>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <Reveal>
          <h2 className="text-4xl font-semibold tracking-[-0.03em]">How hiring works</h2>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">Four steps, about three weeks, and an answer from us within five days after each one.</p>
        </Reveal>
        <Stepper className="mt-10" current={0} steps={[{ title: "Intro call", description: "30 minutes, with the hiring manager" }, { title: "Work sample", description: "A paid, realistic task" }, { title: "Team day", description: "Meet the people you would work with" }, { title: "Offer", description: "Salary bands are public" }]} />
      </section>

      <section className="border-t border-border bg-foreground text-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-8 px-6 py-16 sm:px-10">
          <div>
            <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight"><IconGlobe size={26} /> Not seeing your role?</h2>
            <p className="mt-2 text-sm opacity-70">Tell us what you would build here. We read every open application.</p>
          </div>
          <a href="mailto:jobs@example.com" className="rounded-full bg-background px-6 py-3 text-sm text-foreground">Send an open application</a>
        </div>
      </section>
    </div>
  );
}
