import { useId, type ComponentProps } from "react";

import { IconArrowRight, IconCalendar, IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface PackageAction {
  /** What the button says: "Book a sprint". */
  label: string;
  /** Where it goes. The action is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the action is pressed, for a booking that opens in a dialog. A function needs a client component around the section. */
  onClick?: () => void;
}

export interface ServicePackage {
  /** A stable key: "sprint". */
  id: string;
  /** What it is called: "Sprint". */
  name: string;
  /** What it is for, in a sentence: "A focused answer to one question." */
  summary: string;
  /** The price as real text: "€4,800". It is set in tabular figures. */
  price: string;
  /** Shows "from" before the price, for work whose scope moves a little. */
  from?: boolean;
  /** What the price covers, under it: "Fixed fee, excl. VAT". */
  priceNote?: string;
  /** How long it takes, as a fact: "2 weeks". */
  duration: string;
  /** What the client gets, a line each. Four to six scan best. */
  deliverables: readonly string[];
  /** What the client has to bring, as lowercase phrases: "access to your analytics", "one decision-maker". They are joined into one sentence. */
  requirements: readonly string[];
  /** How to buy it. */
  action: PackageAction;
  /** Marks the one most clients choose, usually the middle package. */
  featured?: boolean;
}

export interface ServicePackagesLabels {
  /** Before the price of a package marked `from`. */
  from: string;
  /** In front of the duration. */
  duration: string;
  /** Above the list of deliverables. */
  deliverables: string;
  /** Above what the client provides. */
  requirements: string;
  /** The badge on the featured package. */
  featured: string;
}

export interface ServicePackagesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Fixed scope, fixed price". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Two to four packages. Three read best. */
  packages: readonly ServicePackage[];
  /** The small print under the cards: VAT, payment terms and what happens when the scope changes. */
  note?: string;
  /** The language the "you provide" list is joined in. "en-US" by default. */
  locale?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ServicePackagesLabels>;
}

const LABELS: ServicePackagesLabels = {
  from: "from",
  duration: "Duration",
  deliverables: "What you get",
  requirements: "You provide",
  featured: "Most chosen",
};

/** Columns by how many cards there are, written out so Tailwind sees every class. A count that does not divide the row never leaves a lonely card: three go from one column straight to three, four from two to four. */
const COLUMNS = [
  "mx-auto max-w-md",
  "mx-auto max-w-md",
  "mx-auto max-w-3xl @2xl:grid-cols-2",
  "mx-auto max-w-xl @4xl:max-w-none @4xl:grid-cols-3",
  "mx-auto max-w-xl @2xl:max-w-none @2xl:grid-cols-2 @6xl:grid-cols-4",
];

function ActionButton({ action, featured }: { action: PackageAction; featured?: boolean }) {
  const content = (
    <>
      <span className="min-w-0">{action.label}</span>
      <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
    </>
  );
  // A long label wraps instead of spilling out of a narrow card.
  const style = "h-auto min-h-11 w-full whitespace-normal py-2.5 text-center leading-snug";
  if (action.href) {
    return (
      <Button asChild variant={featured ? "default" : "outline"} size="lg" className={style}>
        <a href={action.href} onClick={action.onClick}>
          {content}
        </a>
      </Button>
    );
  }
  return (
    <Button type="button" variant={featured ? "default" : "outline"} size="lg" className={style} onClick={action.onClick}>
      {content}
    </Button>
  );
}

/**
 * Fixed-scope packages for agencies, studios and consultants: what you get,
 * how long it takes, what you have to provide and the price, in cards that line
 * up row by row so the figures, the deliverables and the buttons compare at a
 * glance. The "you provide" panel is what makes it a service package and not a
 * software plan: access, content and a decision-maker are the three things that
 * delay scoped work, and naming them up front is the honest part of the offer.
 * Prices are real text in tabular figures, the duration is a visible fact, and
 * one package can be marked as the one most clients choose.
 */
export function ServicePackages({ title, description, packages, note, locale = "en-US", headingLevel = 2, labels: custom, className, ...props }: ServicePackagesProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Name = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  /** "access to your analytics and one decision-maker" becomes a sentence: "Access to your analytics and one decision-maker." */
  const sentence = (items: readonly string[]) => {
    const joined = list.format(items);
    return `${joined.charAt(0).toLocaleUpperCase(locale)}${joined.slice(1)}.`;
  };
  return (
    <section data-slot="service-packages" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      {/* Every card spans six rows of this grid and passes them on (subgrid), so each row is as tall as the tallest card needs. */}
      <ul role="list" className={cn("mt-10 grid gap-5 @3xl:mt-12", COLUMNS[Math.min(packages.length, 4)])}>
        {packages.map((pack) => (
          <li key={pack.id} className="row-span-6 grid min-w-0 grid-rows-subgrid gap-y-0">
            <article
              aria-labelledby={`${id}-${pack.id}`}
              className={cn("row-span-6 grid min-w-0 grid-rows-subgrid gap-y-0 rounded-2xl border bg-card p-6 @sm:p-7", pack.featured ? "border-foreground shadow-sm" : "border-border shadow-xs")}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <Name id={`${id}-${pack.id}`} className="text-lg leading-snug font-medium tracking-[-0.02em]">
                    {pack.name}
                  </Name>
                  {pack.featured ? <Badge>{labels.featured}</Badge> : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{pack.summary}</p>
              </div>

              <div className="mt-7">
                <p className="text-[2.5rem] leading-none font-medium tracking-[-0.05em] tabular-nums">
                  {pack.from ? <span className="mr-2 text-sm font-normal tracking-normal text-muted-foreground">{labels.from}</span> : null}
                  {pack.price}
                </p>
                {pack.priceNote ? <p className="mt-2 text-sm text-muted-foreground">{pack.priceNote}</p> : null}
              </div>

              {/* The duration has a row of its own: when one package's price note runs to two lines, the durations still sit on one line across the cards. */}
              <p className="mt-4 flex items-center gap-2 text-sm">
                <IconCalendar aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{labels.duration}</span>
                <span className="font-medium tabular-nums">{pack.duration}</span>
              </p>

              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.deliverables}</p>
                <ul role="list" className="mt-3.5 grid gap-3">
                  {pack.deliverables.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm leading-snug">
                      <IconCheck aria-hidden="true" className="mt-px size-4 shrink-0" />
                      <span className="min-w-0 text-pretty">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* A package that needs nothing from the client keeps its row, empty, so the rows of its neighbours still line up. */}
              <div className={cn("mt-6", pack.requirements.length > 0 && "rounded-xl bg-muted/60 p-4")}>
                {pack.requirements.length > 0 ? (
                  <>
                    <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.requirements}</p>
                    <p className="mt-2 text-sm leading-relaxed text-pretty">{sentence(pack.requirements)}</p>
                  </>
                ) : null}
              </div>

              {/* The row is as tall as the tallest button in the line, and every button fills it. */}
              <div className="mt-6 flex">
                <ActionButton action={pack.action} featured={pack.featured} />
              </div>
            </article>
          </li>
        ))}
      </ul>

      {note ? <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">{note}</p> : null}
    </section>
  );
}
