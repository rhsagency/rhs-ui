import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowRight, IconCheck, IconClipboardCheck } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Callout } from "@rhs-ui/primitives/callout";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface GuideFact {
  /** "Time needed", "Difficulty", "Last tested". */
  label: string;
  /** "45 minutes", "Easy", "14 October 2026". */
  value: string;
  /** A small icon in front of the fact: an IconClock, an IconGauge. */
  icon?: ReactNode;
}

export interface GuideRequirementGroup {
  /** "Tools", "Parts", "Have ready". Leave it out for a single list. */
  title?: string;
  items: readonly string[];
}

export interface GuideImage {
  src: string;
  /** What the picture shows, for someone who cannot see it. */
  alt: string;
  /** A line under the picture. */
  caption?: string;
  /** Width over height. Defaults to 16 / 10. */
  ratio?: number;
}

export interface GuideStep {
  /** A short imperative: "Remove the back cover". */
  title: string;
  body: ReactNode;
  image?: GuideImage;
  /** A tip set in a Callout under the picture. */
  tip?: ReactNode;
  /** A warning for the step that can go wrong, set in a Callout above the tip. */
  warning?: ReactNode;
}

export interface GuideDone {
  /** What the reader now has: "Your doorbell is on the wall and online". */
  title: string;
  body?: ReactNode;
  /** The results, as short lines with a check each. */
  items?: readonly string[];
}

export interface GuideNext {
  title: string;
  href: string;
  description?: string;
}

export interface HowToLabels {
  /** The heading of the requirements panel. */
  requirements: string;
  /** A line beside it: tell readers the boxes can be ticked. */
  hint: string;
  /** The word in each step number's link name: "Step 4". */
  step: string;
  tip: string;
  warning: string;
  /** The eyebrow above the next guide. */
  next: string;
}

export interface HowToGuideProps extends Omit<ComponentProps<"article">, "title" | "children"> {
  /** A small line above the title: "Setup guide". */
  eyebrow?: string;
  title: string;
  /** The title's element: "h1" (the default) because this is the page, "h2" inside a preview. Sections go one level below it. */
  titleAs?: "h1" | "h2";
  /** One or two sentences on what the guide achieves. */
  description?: string;
  /** Three facts that let a reader decide: time needed, difficulty, last tested. */
  facts?: readonly GuideFact[];
  /** What to have to hand, as a checklist. Plain strings make one list; groups make columns (Tools, Parts). */
  requirements?: readonly (string | GuideRequirementGroup)[];
  steps: readonly GuideStep[];
  /** The closing block: what the reader now has. */
  done?: GuideDone;
  /** A link to the guide that comes next. */
  next?: GuideNext;
  /** Prefix of the step anchors: "step" gives #step-1, #step-2 and so on. */
  idPrefix?: string;
  /** Renders the next-guide link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Draws a step's picture: plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: GuideImage, className: string) => ReactNode;
  /** Replaces any of the fixed words, for another language. */
  labels?: Partial<HowToLabels>;
}

const LABELS: HowToLabels = {
  requirements: "Before you start",
  hint: "Tick each one off as you gather it.",
  step: "Step",
  tip: "Tip",
  warning: "Warning",
  next: "Next guide",
};

function DefaultImage(image: GuideImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className={className} />;
}

/** Plain strings become one list in front of the titled groups. */
function groupsOf(requirements: readonly (string | GuideRequirementGroup)[]): GuideRequirementGroup[] {
  const loose = requirements.filter((entry): entry is string => typeof entry === "string");
  const groups = requirements.filter((entry): entry is GuideRequirementGroup => typeof entry !== "string");
  return loose.length ? [{ items: loose }, ...groups] : groups;
}

const SECTION = { h1: "h2", h2: "h3" } as const;

/**
 * A step-by-step guide built for long, picture-led instructions: the title
 * with three facts up front, a Before you start checklist the reader can tick
 * off, then numbered steps, each with a large numeral, a short imperative
 * title, text, an optional picture with a caption and optional tip or
 * warning in a Callout. A closing block says what the reader now has and
 * links to the next guide. The steps are an ordered list with anchors, so a
 * reader can link straight to step 4 (#step-4). For help articles, setup
 * guides and repair manuals; unlike ProcessSection it is meant for pages that
 * run long.
 */
export function HowToGuide({
  eyebrow,
  title,
  titleAs: Title = "h1",
  description,
  facts = [],
  requirements = [],
  steps,
  done,
  next,
  idPrefix = "step",
  linkAs: Link = "a",
  renderImage = DefaultImage,
  labels,
  className,
  ...props
}: HowToGuideProps) {
  const uid = useId();
  const text = { ...LABELS, ...labels };
  const Section = SECTION[Title];
  const groups = groupsOf(requirements);
  return (
    <article data-slot="how-to-guide" className={cn("py-12 sm:py-16", className)} {...props}>
      <header>
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="text-4xl leading-[1.08] font-semibold tracking-[-.045em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        {facts.length ? (
          <dl className="mt-8 grid divide-y divide-border rounded-2xl border border-border bg-card sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-y-0">
            {facts.map((fact) => (
              <div key={fact.label} className={cn("relative min-w-0 px-5 py-4", fact.icon && "pl-[4.25rem]")}>
                <dt className="text-xs text-muted-foreground">
                  {fact.icon ? (
                    <span aria-hidden="true" className="absolute top-1/2 left-5 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-[18px]">
                      {fact.icon}
                    </span>
                  ) : null}
                  {fact.label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {groups.length ? (
        <section aria-labelledby={`${uid}-before`} className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
            <Section id={`${uid}-before`} className="flex items-center gap-2.5 text-lg font-semibold tracking-[-.02em]">
              <IconClipboardCheck size={20} className="text-muted-foreground" />
              {text.requirements}
            </Section>
            <p className="text-sm text-muted-foreground">{text.hint}</p>
          </div>
          <div className={cn("mt-6 grid gap-x-10 gap-y-8", groups.length > 1 && "sm:grid-cols-2")}>
            {groups.map((group, groupIndex) => (
              <div key={`${group.title ?? "list"}-${groupIndex}`}>
                {group.title ? <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{group.title}</p> : null}
                <ul role="list" className={cn("grid gap-3", group.title && "mt-3")}>
                  {group.items.map((item, itemIndex) => {
                    const id = `${uid}-need-${groupIndex}-${itemIndex}`;
                    return (
                      <li key={id} className="flex items-start gap-3">
                        <Checkbox id={id} className="mt-px" />
                        <Label htmlFor={id} className="items-start text-sm leading-snug font-normal text-foreground/90 peer-data-[state=checked]:text-muted-foreground peer-data-[state=checked]:line-through">
                          {item}
                        </Label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ol role="list" className="mt-14 divide-y divide-border border-y border-border">
        {steps.map((step, index) => {
          const number = index + 1;
          const id = `${idPrefix}-${number}`;
          return (
            <li key={`${step.title}-${number}`} id={id} className="grid scroll-mt-24 gap-x-8 gap-y-3 py-10 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:py-12">
              <a
                href={`#${id}`}
                aria-label={`${text.step} ${number}`}
                className="h-fit w-fit rounded-md text-4xl leading-none font-medium tracking-[-.06em] text-muted-foreground/70 tabular-nums outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:text-5xl"
              >
                {number}
              </a>
              <div className="min-w-0">
                <Section className="text-2xl leading-snug font-semibold tracking-[-.03em] text-balance">{step.title}</Section>
                <div className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{step.body}</div>
                {step.image ? (
                  <figure className="mt-6">
                    <AspectRatio ratio={step.image.ratio ?? 16 / 10} className="overflow-hidden rounded-2xl border border-border bg-muted">
                      {renderImage(step.image, "size-full object-cover")}
                    </AspectRatio>
                    {step.image.caption ? <figcaption className="mt-3 text-sm text-muted-foreground">{step.image.caption}</figcaption> : null}
                  </figure>
                ) : null}
                {step.warning ? (
                  <Callout tone="warning" title={text.warning} className="mt-6">
                    {step.warning}
                  </Callout>
                ) : null}
                {step.tip ? (
                  <Callout tone="tip" title={text.tip} className="mt-6">
                    {step.tip}
                  </Callout>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {done || next ? (
        <section aria-labelledby={done ? `${uid}-done` : undefined} aria-label={done ? undefined : text.next} className="mt-14 rounded-3xl bg-muted/60 p-6 sm:p-10">
          {done ? (
            <div>
              <div className="flex items-center gap-3.5">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck size={18} strokeWidth={2.25} />
                </span>
                <Section id={`${uid}-done`} className="text-2xl leading-snug font-semibold tracking-[-.03em] text-balance">
                  {done.title}
                </Section>
              </div>
              {done.body ? <div className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{done.body}</div> : null}
              {done.items?.length ? (
                <ul role="list" className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  {done.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <IconCheck size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {next ? (
            <Link
              href={next.href}
              className={cn(
                "group flex items-center justify-between gap-6 rounded-2xl border border-border bg-card p-5 outline-none transition-colors duration-150 hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/40",
                done && "mt-8",
              )}
            >
              <span className="min-w-0">
                <span className="block text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{text.next}</span>
                <span className="mt-1.5 block text-base font-semibold tracking-[-.02em] text-balance">{next.title}</span>
                {next.description ? <span className="mt-1 block text-sm text-muted-foreground">{next.description}</span> : null}
              </span>
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-border transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none">
                <IconArrowRight size={16} />
              </span>
            </Link>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
