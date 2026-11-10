"use client";

import { useState } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { PageHeaderSplit } from "@rhs-ui/marketing/page-header-split";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

const SECTIONS = ["Studio", "Team", "Method", "Press"] as const;
const FILTERS = ["All work", "Offices", "Hospitality", "Retail", "Homes"] as const;

export default function Demo(): React.JSX.Element {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All work");

  return (
    <div className="mx-auto grid max-w-6xl gap-20 px-6 pb-16">
      <figure className="grid gap-1">
        <figcaption className="pt-6 text-xs leading-relaxed text-muted-foreground">
          Four facts as a description list, one action, and a row of page links in the slot under the hairline. Below 1024px the columns stack, title first. The facts follow the width of their column: four in a row when it is wide enough, two by two when it is not.
        </figcaption>
        <PageHeaderSplit
          titleAs="h2"
          eyebrow="About the studio"
          title="We design the rooms where work happens."
          lede="Halcyon is an interior studio for offices, restaurants and shops. Twenty-four people plan, draw and fit out spaces across the Benelux, from the first sketch to the day the doors open."
          facts={[
            { label: "Founded", value: "2011" },
            { label: "Team", value: "24 people" },
            { label: "Based in", value: "Rotterdam" },
            { label: "Projects", value: "380+" },
          ]}
          action={
            <Button asChild size="lg">
              <a href="#team">
                Meet the team
                <IconArrowRight />
              </a>
            </Button>
          }
        >
          <nav aria-label="About the studio" className="border-b border-border">
            <ul className="-ml-3 flex gap-1">
              {SECTIONS.map((section) => (
                <li key={section}>
                  <a
                    href={`#${section.toLowerCase()}`}
                    aria-current={section === "Studio" ? "page" : undefined}
                    className="relative inline-flex h-12 items-center rounded-md px-3 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-3 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-foreground motion-reduce:transition-none"
                  >
                    {section}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </PageHeaderSplit>
      </figure>

      <figure className="grid gap-1">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          A category page with three facts and no action. The slot takes a filter row instead; the header only draws the hairline above it.
        </figcaption>
        <PageHeaderSplit
          titleAs="h2"
          eyebrow="Services"
          title="Fit-out, start to finish."
          lede="One team from the first measurement to the last coat of paint, with a fixed price agreed before we order a single board."
          facts={[
            { label: "From", value: "€4,800" },
            { label: "Lead time", value: "6 weeks" },
            { label: "Guarantee", value: "10 years" },
          ]}
        >
          <div role="group" aria-label="Filter the projects" className="flex flex-wrap gap-2 py-5">
            {FILTERS.map((name) => (
              <Button key={name} size="sm" variant={name === filter ? "default" : "outline"} aria-pressed={name === filter} onClick={() => setFilter(name)} className={cn("rounded-full", name !== filter && "text-muted-foreground")}>
                {name}
              </Button>
            ))}
          </div>
        </PageHeaderSplit>
      </figure>
    </div>
  );
}
