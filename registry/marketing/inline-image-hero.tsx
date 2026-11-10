import { Fragment, useId, type ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface InlineImage {
  /** The address of the picture. A data: URI works too. */
  image: string;
  /** What it shows. Leave it out for a picture that only decorates, which is the usual case: it is then hidden from assistive technology and the heading reads as the plain sentence. An alt is read inside the sentence, at the place of the picture. */
  alt?: string;
  /** How many times wider than high the pill is. By default the pills vary a little in turn: 2, 1.5, 2.4. */
  ratio?: number;
}

/** A piece of the sentence: some words, or a picture that sits between the words. */
export type InlineImagePart = string | InlineImage;

export interface InlineImageHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The sentence as data: words and pictures in the order they are read, `["We design", { image }, "brands for", { image }, "people who care"]`. Words are joined with a space; a picture is set between them as a pill. */
  parts: readonly InlineImagePart[];
  /** A small line above the sentence: what the studio is and where. */
  kicker?: string;
  /** The one action, as a button under the sentence. */
  cta?: { label: string; href: string };
  /** Small facts along the foot of the hero: services, a city, when there is room for a new project. */
  meta?: readonly string[];
}

/** The pills vary in turn, so the line does not read as a row of the same stamp. */
const RATIOS = [2, 1.5, 2.4];

/**
 * An agency's statement set at display size with small rounded pictures sitting
 * between the words, so the sentence and the work read together: the pattern
 * of studio sites, built so it cannot break the heading. The sentence is data,
 * words and pictures in order, and is one heading; the pictures are pills that
 * are part of the line, wrap with it and are as high as the line itself, the
 * most a line can hold without being pushed apart. They are sized in em, so
 * they shrink with the type on a phone and the rhythm of the line holds. A
 * picture is decorative unless you give it an alt, and
 * the heading reads to a screen reader as the plain sentence. A kicker sits
 * over it, and under it a rule with a few small facts and the one action.
 */
export function InlineImageHero({ titleAs: Title = "h2", parts, kicker, cta, meta = [], className, ...props }: InlineImageHeroProps) {
  const id = useId();
  let pictures = 0;

  return (
    <section data-slot="inline-image-hero" aria-labelledby={`${id}-title`} className={cn("@container w-full py-14 sm:py-20", className)} {...props}>
      {kicker ? <p className="text-sm font-medium text-muted-foreground sm:text-base">{kicker}</p> : null}
      <Title
        id={`${id}-title`}
        className={cn("text-[clamp(2.5rem,calc(1.2rem_+_8.4cqi),7.5rem)] leading-[1.1] font-medium tracking-[-0.04em] text-balance [overflow-wrap:anywhere]", kicker && "mt-5 sm:mt-7")}
      >
        {parts.map((part, index) => {
          if (typeof part === "string") {
            return (
              <Fragment key={index}>
                {index > 0 ? " " : null}
                {part}
              </Fragment>
            );
          }
          const ratio = part.ratio ?? RATIOS[pictures++ % RATIOS.length] ?? 2;
          return (
            <Fragment key={index}>
              {index > 0 ? " " : null}
              <span
                data-slot="inline-image-hero-pill"
                className="inline-block h-[1em] max-w-full overflow-hidden rounded-full bg-muted align-[-0.16em] [&>img]:size-full [&>img]:object-cover"
                style={{ width: `${ratio.toFixed(2)}em` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI */}
                <img src={part.image} alt={part.alt ?? ""} loading="eager" decoding="async" draggable={false} />
              </span>
            </Fragment>
          );
        })}
      </Title>

      {cta || meta.length ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-6 border-t border-border pt-6 sm:mt-14">
          {meta.length ? (
            <ul className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-muted-foreground">
              {meta.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          ) : null}
          {cta ? (
            <Button asChild size="lg" className="max-sm:w-full">
              <a href={cta.href}>
                {cta.label}
                <IconArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
