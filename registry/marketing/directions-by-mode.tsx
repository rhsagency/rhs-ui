import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconAccessibility, IconArrowRight, IconCheck, IconFootprints, IconMap, IconPin, type IconProps } from "@rhs-ui/icons";
import { IconBikeAnimated } from "@rhs-ui/icons/animated/bike";
import { IconBusAnimated } from "@rhs-ui/icons/animated/bus";
import { IconCarAnimated } from "@rhs-ui/icons/animated/car";
import { IconPlaneAnimated } from "@rhs-ui/icons/animated/plane";
import { IconShipAnimated } from "@rhs-ui/icons/animated/ship";
import { IconTrainAnimated } from "@rhs-ui/icons/animated/train";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The ways of arriving that have an icon. Use `car` for a taxi or a rideshare. */
export type DirectionsKind = "train" | "bus" | "car" | "bike" | "walk" | "ferry" | "plane";

export interface DirectionsFact {
  /** What the number is about, with its starting point: "From Utrecht Centraal". */
  label: string;
  /** "18 min", "2.40 euros an hour". Set in tabular numbers. */
  value: string;
}

export interface DirectionsLink {
  /** "Live departures", "Parking map". */
  label: string;
  href: string;
}

export interface DirectionsMode {
  /** Which icon the row gets. The mode is always named in `title` as well. */
  kind: DirectionsKind;
  /** The way of arriving, in words: "By train". It is the row's heading. */
  title: string;
  /** The route, from the place people start: stops, line numbers, the last 200 metres. One paragraph, or an array for numbered steps. Wrap stop names and line numbers in `strong` to set them in heavier type. */
  body: ReactNode | readonly ReactNode[];
  /** A few numbers a reader plans with: the journey time from a named origin, what parking costs. */
  facts?: readonly DirectionsFact[];
  /** A link on from the route: live departures, a parking map. */
  link?: DirectionsLink;
}

/** A point of the access panel: a sentence, or a short label with its sentence. */
export type DirectionsAccessPoint = string | { label: string; text: string };

export interface DirectionsAccess {
  /** The panel's heading: "Step-free access". */
  title: string;
  /** A line under the heading. */
  description?: string;
  /** Step-free entry, lifts, accessible parking, assistance dogs: one point each, written as facts. */
  points: readonly DirectionsAccessPoint[];
}

export interface DirectionsLabels {
  /** The small label above the address. */
  destination: string;
  /** The text of the map link. */
  map: string;
  /** Read out after a link that opens in a new tab. */
  newTab: string;
}

export interface DirectionsByModeProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** A small line above the title: "Visit us". */
  eyebrow?: string;
  /** The section's title. */
  title?: string;
  /** One or two sentences that say where the routes start: "Every route below starts at the station." */
  description?: string;
  /** The address, one line per entry. It is set as a real address element. */
  address: readonly string[];
  /** A link to the place on a map. It opens in a new tab. */
  mapHref?: string;
  /** The ways of arriving, in the order you want them: the most common first. */
  modes: readonly DirectionsMode[];
  /** A separate panel for step-free entry, lifts, accessible parking and assistance dogs. */
  access?: DirectionsAccess;
  /** The level of the title: 2 by default. Each mode and the access panel sit one level below it. */
  headingLevel?: 2 | 3;
  /** Renders the links on from a route. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DirectionsLabels>;
}

const LABELS: DirectionsLabels = { destination: "Where you are going", map: "Open in maps", newTab: "(opens in a new tab)" };

/** One icon per way of arriving. Those with a motion play it when the row is hovered or focused; walking has no animated glyph. */
const MODE_ICON: Record<DirectionsKind, (props: IconProps) => ReactNode> = {
  train: IconTrainAnimated,
  bus: IconBusAnimated,
  car: IconCarAnimated,
  bike: IconBikeAnimated,
  walk: IconFootprints,
  ferry: IconShipAnimated,
  plane: IconPlaneAnimated,
};

const LINK =
  "group/link inline-flex items-center gap-2 rounded-sm text-sm font-medium underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * How to arrive, by every way people arrive: one row for each of train, bus,
 * car, bike and on foot, with an icon, the mode named in words, a short route
 * written from the place people start (stop names, line numbers, the last 200
 * metres), and a line of facts such as the journey time from a named origin
 * and what parking costs. A separate panel covers step-free entry, lifts,
 * accessible parking and assistance dogs. It is written for people who have
 * never been, so it starts from the station, not from the map pin. It answers
 * how to arrive, where LocationSection answers where the place is. A route
 * given as an array becomes numbered steps; the icons of the modes that have
 * one move when you hover or focus the row, and stay still for anyone who asks
 * for reduced motion. From 1024px the access panel stays in view beside the
 * routes while they scroll past; set `--sticky-top` on the section to the
 * height of a sticky header you have (2rem by default).
 */
export function DirectionsByMode({
  eyebrow,
  title = "Getting here",
  description,
  address,
  mapHref,
  modes,
  access,
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  className,
  ...props
}: DirectionsByModeProps) {
  const labels = { ...LABELS, ...custom };
  const accessId = useId();
  const Title = `h${headingLevel}` as "h2" | "h3";
  const Sub = `h${headingLevel + 1}` as "h3" | "h4";
  return (
    <section data-slot="directions-by-mode" className={cn("w-full break-words", className)} {...props}>
      <header className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
          <Title className="text-3xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{title}</Title>
          {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 lg:min-w-[26rem]">
          <div className="flex min-w-0 items-start gap-3.5">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <IconPin className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.destination}</p>
              <address className="mt-1 text-sm leading-snug font-medium not-italic">
                {address.map((line, index) => (
                  <span key={`${index}-${line}`} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
          {mapHref ? (
            <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
              <a href={mapHref} target="_blank" rel="noopener noreferrer">
                <IconMap aria-hidden="true" />
                {labels.map}
                <span className="sr-only"> {labels.newTab}</span>
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      <div className={cn("mt-12 grid grid-cols-1 gap-x-14 gap-y-10 sm:mt-14", access && "lg:grid-cols-[minmax(0,1fr)_21rem]")}>
        <ul role="list" className="divide-y divide-border border-y border-border">
          {modes.map((mode) => {
            const Icon = MODE_ICON[mode.kind];
            const steps = Array.isArray(mode.body) ? (mode.body as readonly ReactNode[]) : null;
            return (
              <li key={`${mode.kind}-${mode.title}`} data-rhs-icon-trigger className="group/mode grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 py-7 sm:gap-x-5 sm:py-8">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-foreground transition-colors duration-150 group-hover/mode:border-foreground/30 group-hover/mode:bg-muted motion-reduce:transition-none"
                >
                  <Icon className="size-6" />
                </span>
                <Sub className="text-lg leading-snug font-medium tracking-[-0.02em] sm:text-xl">{mode.title}</Sub>
                {/* On a phone the route takes the whole width under the title; from 640px it lines up under the title. */}
                <div className="col-span-2 mt-4 min-w-0 self-start sm:col-span-1 sm:col-start-2 sm:mt-3">
                  {steps ? (
                    <ol role="list" className="grid gap-3">
                      {steps.map((step, index) => (
                        <li
                          key={index}
                          className={cn(
                            "relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 text-[0.9375rem] leading-relaxed text-muted-foreground",
                            index < steps.length - 1 && "after:absolute after:top-[1.625rem] after:-bottom-3 after:left-[9.5px] after:w-px after:bg-border",
                          )}
                        >
                          <span aria-hidden="true" className="mt-[0.15rem] grid size-5 place-items-center rounded-full border border-border bg-background text-[0.6875rem] font-medium text-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <span className="min-w-0 [&_strong]:font-medium [&_strong]:text-foreground [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="max-w-[38rem] text-[0.9375rem] leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40">{mode.body}</div>
                  )}
                  {mode.facts?.length ? (
                    <dl className="mt-5 flex flex-wrap gap-2">
                      {mode.facts.map((fact) => (
                        <div key={fact.label} className="inline-flex items-baseline gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[0.8125rem] leading-snug">
                          <dt className="text-muted-foreground">{fact.label}</dt>
                          <dd className="font-medium tabular-nums">{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {mode.link ? (
                    <Link href={mode.link.href} className={cn(LINK, "mt-4")}>
                      {mode.link.label}
                      <IconArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {access ? (
          // From 1024px the panel stays in view while the routes scroll past, so step-free information is never a long way off.
          <aside aria-labelledby={accessId} className="self-start rounded-xl border border-border bg-muted/40 p-5 sm:p-6 lg:sticky lg:top-[var(--sticky-top,2rem)]">
            <div className="flex items-center gap-3.5">
              <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-card">
                <IconAccessibility className="size-6" />
              </span>
              <Sub id={accessId} className="text-lg leading-snug font-medium tracking-[-0.02em] text-balance">
                {access.title}
              </Sub>
            </div>
            {access.description ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{access.description}</p> : null}
            <ul role="list" className={cn("grid gap-4", access.description ? "mt-5" : "mt-6")}>
              {access.points.map((point, index) => (
                <li key={index} className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 text-sm leading-relaxed">
                  <IconCheck aria-hidden="true" className="mt-[0.2rem] size-4 text-foreground" />
                  {typeof point === "string" ? (
                    <span className="min-w-0">{point}</span>
                  ) : (
                    <span className="min-w-0">
                      <span className="block font-medium">{point.label}</span>
                      <span className="mt-0.5 block text-muted-foreground">{point.text}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
