"use client";

import { useState } from "react";

import { IconPhone } from "@rhs-ui/icons";
import { NavbarOnepage } from "@rhs-ui/marketing/navbar-onepage";
import { Button } from "@rhs-ui/primitives/button";

const SECTIONS = [
  { id: "services", label: "Services" },
  { id: "projects", label: "Projects" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

const SERVICES = [
  ["Re-roofing", "Tiles, slate or zinc, stripped and relaid in a week. Every roof comes with a ten-year guarantee in writing."],
  ["Flat roofs", "EPDM and bitumen, with proper falls and drains. We fix the cause of the puddle, not the puddle."],
  ["Leaks and inspection", "A free inspection within 48 hours, a photo report, and a fixed price before anyone climbs a ladder."],
];

const PROJECTS = [
  ["Canal house, Oudegracht", "Zinc roof and dormers", "2026"],
  ["Farmhouse, Vleuten", "Reed thatch to slate", "2025"],
  ["School gym, Zeist", "1,200 m² flat roof", "2025"],
];

const REVIEWS = [
  ["They found the leak in twenty minutes. Three roofers before them never did.", "Marieke V., Utrecht"],
  ["On time, tidy, and the price on the quote was the price on the invoice.", "Hassan E., Houten"],
  ["Our roof survived the October storm without a single tile moved.", "The Bakker family, Zeist"],
];

const section = "scroll-mt-20 px-4 py-20 sm:px-6";
const heading = "text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl";

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("");

  return (
    <div>
      {/* The bar is the width of the page, so its hairline runs edge to edge; its own content is as wide as the sections below. */}
      <NavbarOnepage
        brand={<span className="text-base font-semibold tracking-tight">Brightwell</span>}
        brandLabel="Brightwell Roofing, back to the top"
        sections={SECTIONS}
        onNavigate={setLast}
        action={
          <Button size="sm" asChild>
            <a href="#contact">Request a quote</a>
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl">
        <div className="px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Roofers in Utrecht since 1994</p>
          <h2 className="mx-auto mt-5 max-w-2xl text-5xl leading-[1.02] font-medium tracking-[-0.05em] text-balance sm:text-6xl">A roof that outlasts the mortgage.</h2>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">Scroll, or use the bar: each link takes you to its section, the one you are in is marked, and focus lands on the heading.</p>
          <p className="mt-4 min-h-5 text-xs text-muted-foreground" role="status">
            {last ? `onNavigate: ${last}` : ""}
          </p>
        </div>

        <figure className="mx-auto grid max-w-3xl gap-3 px-4 sm:px-6">
          <figcaption className="text-xs text-muted-foreground">The same bar with currentId set, for a page that keeps its own track of the section: it marks Projects whatever the scroll.</figcaption>
          <section aria-label="Bar with a section marked" className="overflow-hidden rounded-xl border border-border bg-background">
            <NavbarOnepage
              sticky={false}
              navLabel="Sections, marked"
              currentId="projects"
              brand={<span className="text-base font-semibold tracking-tight">Brightwell</span>}
              sections={SECTIONS}
              action={
                <Button size="sm" asChild>
                  <a href="#contact">Request a quote</a>
                </Button>
              }
            />
            <p className="px-6 py-6 text-sm text-muted-foreground">The section in view carries aria-current=&quot;location&quot; and a line on the bar&apos;s own hairline.</p>
          </section>
        </figure>

        <section id="services" className={section}>
          <h2 className={heading}>What we do</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {SERVICES.map(([name, text]) => (
              <li key={name} className="rounded-xl border border-border bg-card p-6 text-card-foreground">
                <h3 className="text-lg font-medium tracking-[-0.02em]">{name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="projects" className={section}>
          <h2 className={heading}>Recent work</h2>
          <ul className="mt-10 divide-y divide-border border-y border-border">
            {PROJECTS.map(([place, work, year]) => (
              <li key={place} className="grid gap-1 py-5 sm:grid-cols-[1fr_1fr_auto] sm:gap-6">
                <p className="font-medium">{place}</p>
                <p className="text-muted-foreground">{work}</p>
                <p className="text-sm text-muted-foreground tabular-nums">{year}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="reviews" className={section}>
          <h2 className={heading}>What the neighbours say</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {REVIEWS.map(([quote, who]) => (
              <li key={who} className="grid content-between gap-6 rounded-xl border border-border p-6">
                <p className="text-base leading-relaxed text-pretty">&ldquo;{quote}&rdquo;</p>
                <p className="text-sm text-muted-foreground">{who}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className={`${section} min-h-[28rem]`}>
          <h2 className={heading}>Request a quote</h2>
          <p className="mt-4 max-w-md text-muted-foreground">Tell us the address and what you see. We reply within one working day, and the inspection is free.</p>
          <p className="mt-8 flex items-center gap-3 text-2xl font-medium tracking-[-0.03em] tabular-nums">
            <IconPhone aria-hidden="true" className="size-6 text-muted-foreground" />
            030 555 01 94
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Monday to Friday, 7:30 to 17:00</p>
        </section>
      </div>
    </div>
  );
}
