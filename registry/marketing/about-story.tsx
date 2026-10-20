import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { cn } from "@/lib/utils";

export interface AboutImage {
  src: string;
  /** What the picture shows, for someone who cannot see it. */
  alt: string;
  /** A line under the picture: where it was taken, who is in it. */
  caption?: string;
}

export interface AboutFact {
  /** "Founded", "Team", "Places", "Customers". */
  label: string;
  /** "2014", "38 people", "1,200+". Set in tabular numbers. */
  value: string;
}

export interface AboutSignature {
  name: string;
  /** "Co-founder". */
  role?: string;
}

export interface AboutAction {
  label: string;
  href: string;
}

export interface AboutStoryProps extends Omit<ComponentProps<"section">, "children"> {
  /** A small line above the statement: "Our story". */
  eyebrow?: string;
  /** The opening sentence, set large. One idea, a sentence or two. */
  statement: string;
  /** The statement's element: "h2" (the default) inside a page, "h1" when this opens the page. */
  statementAs?: "h1" | "h2";
  /** The story in paragraphs, three reads best. On a phone the picture follows the first one. */
  paragraphs: readonly ReactNode[];
  /** A tall picture with its caption. Drawn at 4 to 5. */
  image: AboutImage;
  /** The facts that anchor it: founded, team, places, customers. Three to five read best. */
  facts?: readonly AboutFact[];
  /** Who is telling the story. */
  signature?: AboutSignature;
  /** A link on to the next page: "Meet the team". */
  action?: AboutAction;
  /** Renders the action link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Draws the picture: plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: AboutImage, className: string) => ReactNode;
}

/** One column per fact up to five, written out so Tailwind sees every class. */
const FACT_COLUMNS = ["", "", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-2 lg:grid-cols-4", "sm:grid-cols-3 lg:grid-cols-5"] as const;

function DefaultImage(image: AboutImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} decoding="async" className={className} />;
}

/**
 * The story of a company in long form, for an about page that should sound
 * like people wrote it: a large statement sentence, a two-column body of
 * story paragraphs beside a tall picture with its caption, and under it a
 * strip of the facts that anchor it in tabular numbers. Paragraphs keep a
 * comfortable measure, and on a phone the picture follows the first paragraph
 * instead of leading; on a tablet it keeps a width of 28rem instead of
 * filling the column. On wide, tall screens the picture stays in view while a
 * long story scrolls past it; set `--sticky-top` (for example
 * `className="[--sticky-top:4rem]"`) to the height of your sticky header.
 */
export function AboutStory({ eyebrow, statement, statementAs: Statement = "h2", paragraphs, image, facts = [], signature, action, linkAs: Link = "a", renderImage = DefaultImage, className, ...props }: AboutStoryProps) {
  const [first, ...rest] = paragraphs;
  return (
    <section data-slot="about-story" className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="max-w-4xl">
        {eyebrow ? <p className="mb-5 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Statement className="text-3xl leading-[1.1] font-medium tracking-[-.045em] text-balance sm:text-5xl lg:text-[3.5rem]">{statement}</Statement>
      </header>

      <div className="mt-12 grid gap-x-16 gap-y-8 sm:mt-16 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:grid-rows-[auto_1fr]">
        {first ? <p className="max-w-xl text-xl leading-[1.6] tracking-[-.01em] text-pretty text-foreground lg:col-start-1 lg:row-start-1">{first}</p> : null}
        <figure className="min-w-0 sm:max-w-md lg:max-w-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start lg:[@media(min-height:48rem)]:sticky lg:[@media(min-height:48rem)]:top-[var(--sticky-top,6rem)]">
          <AspectRatio ratio={4 / 5} className="overflow-hidden rounded-2xl bg-muted">
            {renderImage(image, "size-full object-cover")}
          </AspectRatio>
          {image.caption ? <figcaption className="mt-3 text-sm text-muted-foreground">{image.caption}</figcaption> : null}
        </figure>
        {rest.length || signature || action ? (
          <div className="max-w-xl lg:col-start-1 lg:row-start-2">
            <div className="grid gap-6 text-lg leading-[1.7] text-pretty text-muted-foreground">
              {rest.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {signature ? (
              <p className="mt-10 flex items-center gap-4">
                <span aria-hidden="true" className="h-px w-10 shrink-0 bg-foreground/40" />
                <span>
                  <span className="font-medium">{signature.name}</span>
                  {signature.role ? <span className="text-muted-foreground">, {signature.role}</span> : null}
                </span>
              </p>
            ) : null}
            {action ? (
              <Link
                href={action.href}
                className="group mt-8 inline-flex items-center gap-2 rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {action.label}
                <IconArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {facts.length ? (
        <dl className={cn("mt-16 grid grid-cols-2 gap-x-8 gap-y-10 sm:mt-24", FACT_COLUMNS[Math.min(facts.length, 5)] ?? "sm:grid-cols-3")}>
          {facts.map((fact) => (
            <div key={fact.label} className="border-t border-border pt-5">
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="mt-2 text-4xl font-medium tracking-[-.045em] tabular-nums sm:text-5xl">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
