import type { ComponentProps } from "react";

import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TwoPathHeroPath {
  /** The small label above the heading: "For teams". */
  label: string;
  /** What this visitor gets, in one line. */
  heading: string;
  /** Three outcomes, one short line each. */
  points: readonly string[];
  /** Where the whole half leads. */
  href: string;
  /** The link text beside the arrow: "Start hiring". */
  cta: string;
}

export interface TwoPathHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. The two path headings sit one level below it. */
  titleAs?: "h1" | "h2";
  /** The brand statement above both halves. */
  title: string;
  /** One line under the title. */
  description?: string;
  /** The two paths: side by side from 768px, stacked on a phone. */
  paths: readonly [TwoPathHeroPath, TwoPathHeroPath];
  /** The word on the seam between the halves. */
  divider?: string;
}

/* The half under the pointer, or holding keyboard focus, takes the inverted surface; these are the parts that follow it. */
const QUIET = "text-muted-foreground group-hover/path:text-background/70 group-has-[a:focus-visible]/path:text-background/70";
const ARROW =
  "border-current/30 transition-[translate,background-color,color,border-color] duration-300 motion-reduce:transition-none motion-safe:group-hover/path:translate-x-1 motion-safe:group-has-[a:focus-visible]/path:translate-x-1 group-hover/path:border-transparent group-hover/path:bg-background group-hover/path:text-foreground group-has-[a:focus-visible]/path:border-transparent group-has-[a:focus-visible]/path:bg-background group-has-[a:focus-visible]/path:text-foreground";

/**
 * A hero that routes the visitor: two equal halves, each one whole link with
 * its own promise, under one brand statement. The half under the pointer or
 * keyboard focus fills with the inverted surface while the other stays quiet,
 * so the choice is felt before the click. For marketplaces (hire or work),
 * schools (students or teachers), clinics (patients or providers) and any
 * product where sending people the right way is the job.
 */
export function TwoPathHero({ titleAs: Title = "h2", title, description, paths, divider = "or", className, ...props }: TwoPathHeroProps) {
  const Heading = Title === "h1" ? "h2" : "h3";
  return (
    <section data-slot="two-path-hero" className={cn("py-16 sm:py-20", className)} {...props}>
      <div className="mx-auto max-w-4xl text-center">
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
        {description ? <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
      </div>
      <div className="relative mt-12 grid overflow-hidden rounded-2xl border border-border md:mt-16 md:grid-cols-2">
        {paths.map((path, index) => (
          <article
            key={path.label}
            data-slot="two-path-hero-path"
            className={cn(
              "group/path relative flex flex-col justify-between gap-14 bg-background p-6 text-foreground transition-colors duration-300 motion-reduce:transition-none sm:p-10 md:min-h-[27rem]",
              "hover:bg-foreground hover:text-background has-[a:focus-visible]:bg-foreground has-[a:focus-visible]:text-background",
              index === 1 && "border-t border-border md:border-t-0 md:border-l",
            )}
          >
            <div>
              <p className={cn("text-xs font-medium tracking-[.14em] uppercase", QUIET)}>{path.label}</p>
              <Heading className="mt-4 max-w-md text-3xl leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-4xl">{path.heading}</Heading>
              <ul className="mt-8 grid gap-3">
                {path.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-base leading-snug">
                    <IconCheck className="mt-0.5 size-4 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href={path.href}
              className="flex items-center justify-between gap-4 text-lg font-medium tracking-[-0.01em] outline-none after:absolute after:inset-0 focus-visible:underline focus-visible:underline-offset-4"
            >
              <span>
                {path.cta}
                <span className="sr-only">, {path.label}</span>
              </span>
              <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-full border", ARROW)}>
                <IconArrowRight className="size-5" />
              </span>
            </a>
          </article>
        ))}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-xs font-medium text-muted-foreground md:grid"
        >
          {divider}
        </span>
      </div>
    </section>
  );
}
