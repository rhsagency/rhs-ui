"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export interface MenuDish {
  name: string;
  description?: string;
  price: string;
  /** Short marks the kitchen uses: "V" vegetarian, "VG" vegan, "GF" gluten-free, "N" nuts. */
  tags?: readonly string[];
}

export interface MenuCourse {
  id: string;
  title: string;
  dishes: readonly MenuDish[];
}

export interface MenuSectionProps {
  title: string;
  courses: readonly MenuCourse[];
  /** What the tags mean, shown once: { V: "Vegetarian", ... }. */
  legend?: Readonly<Record<string, string>>;
  /** "Ask us about allergens." */
  footnote?: string;
  className?: string;
}

/**
 * A restaurant menu on the web, not a PDF: courses as tabs (arrow keys
 * move), dishes with a line of description and the price, dietary marks
 * that are spelled out for screen readers and explained in a legend, and
 * the allergen note at the end. Text, so it is searchable and translatable.
 */
export function MenuSection({ title, courses, legend = {}, footnote, className }: MenuSectionProps) {
  const [active, setActive] = useState(courses[0]?.id ?? "");
  const course = courses.find((c) => c.id === active);
  function keys(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = courses.findIndex((c) => c.id === active);
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = courses[(next + courses.length) % courses.length];
    if (!target) return;
    setActive(target.id);
    (event.currentTarget.querySelector(`[data-course="${target.id}"]`) as HTMLElement | null)?.focus();
  }
  return (
    <section data-slot="menu-section" className={cn("mx-auto max-w-3xl py-16 sm:py-20", className)}>
      <h2 className="text-center text-4xl font-medium tracking-tight">{title}</h2>
      <div role="tablist" aria-label="Courses" onKeyDown={keys} className="relative mt-8 flex justify-center-safe gap-1 overflow-x-auto">
        {courses.map((c) => (
          <button key={c.id} data-course={c.id} type="button" role="tab" id={`menu-tab-${c.id}`} aria-selected={c.id === active} aria-controls={`menu-panel-${c.id}`} tabIndex={c.id === active ? 0 : -1} onClick={() => setActive(c.id)} className="shrink-0 rounded-full px-4 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-selected:bg-foreground aria-selected:text-background">{c.title}</button>
        ))}
      </div>
      {course ? (
        <ul id={`menu-panel-${course.id}`} role="tabpanel" aria-labelledby={`menu-tab-${course.id}`} className="relative mt-8 divide-y divide-border">
          {course.dishes.map((dish) => (
            <li key={dish.name} className="flex justify-between gap-6 py-4">
              <div>
                <p className="font-medium">
                  {dish.name}
                  {dish.tags?.map((tag) => <span key={tag}><abbr title={legend[tag] ?? tag} aria-hidden="true" className="ml-2 rounded border border-border px-1 text-[10px] font-normal tracking-wide text-muted-foreground no-underline">{tag}</abbr><span className="sr-only">, {legend[tag] ?? tag}</span></span>)}
                </p>
                {dish.description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dish.description}</p> : null}
              </div>
              <p className="shrink-0 font-medium tabular-nums">{dish.price}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {Object.keys(legend).length || footnote ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {Object.entries(legend).map(([tag, meaning]) => `${tag}: ${meaning}`).join(" · ")}{footnote ? <><br />{footnote}</> : null}
        </p>
      ) : null}
    </section>
  );
}
