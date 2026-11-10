import { useId, type ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import type { Logo } from "@rhs-ui/marketing/logo-cloud";
import { cn } from "@/lib/utils";

export interface LogoStripMore {
  /** The link's text: "and 2,300 more". */
  label: string;
  /** Where it goes: the page of your customers, or an index of case studies. */
  href: string;
}

export interface LogoStripProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The lead-in, set on the left: "Trusted by 2,400 teams". It is also the name of the list for screen readers. */
  title: string;
  /** Five to seven customer marks. A mark is an SVG or an image in `mark`; its `name` is what a screen reader says. Give `href` to link it. */
  logos: readonly Logo[];
  /** A quiet link under the lead-in, to the rest of your customers. */
  more?: LogoStripMore;
}

/** Every mark is drawn at one height, whatever shape it comes in: 20px in a narrow strip, 24px where the lead-in sits beside the row. A mark is never made smaller to fit: the row wraps instead. */
const MARK = "inline-flex items-center [&_img]:h-5 [&_img]:w-auto [&_img]:max-w-full [&_svg]:h-5 [&_svg]:w-auto [&_svg]:max-w-full @2xl:[&_img]:h-6 @2xl:[&_svg]:h-6";

/** A picture mark cannot take the text colour, so it is greyed and dimmed, and comes to full strength with the link around it. */
const PICTURE = "[&_img]:opacity-70 [&_img]:grayscale [&_img]:transition-[opacity,filter] [&_img]:duration-150 motion-reduce:[&_img]:transition-none";

/**
 * The proof you put right under a hero: one quiet row, a lead-in on the left
 * and five to seven customer marks sharing the rest, all drawn at one height in
 * the muted text colour, with no grid and no borders, so it supports the hero
 * and never competes with it. A linked mark comes to full strength on hover and
 * gets a visible focus ring; every mark carries its company name for screen
 * readers. The strip answers to its own width, not the window's: from 56rem, where
 * six marks fit, the lead-in sits on the left and the marks spread across one row,
 * wrapping onto a second only when they do not fit; with less, the marks sit three
 * to a row (two in a strip under 18rem), beside the lead-in down to 42rem and under
 * it below that, so six marks make two even rows and never a ragged four and two.
 * A mark never shrinks to a size that can no longer be read. No state of its own,
 * so it renders on the server.
 */
export function LogoStrip({ title, logos, more, className, ...props }: LogoStripProps) {
  const heading = useId();

  return (
    <section data-slot="logo-strip" aria-labelledby={heading} className={cn("@container py-10 sm:py-12", className)} {...props}>
      <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-center @2xl:gap-10">
        <div className="grid shrink-0 gap-1.5 @2xl:w-44">
          <h2 id={heading} className="text-sm font-normal text-pretty text-muted-foreground">
            {title}
          </h2>
          {more ? (
            <a
              href={more.href}
              className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-foreground underline-offset-4 transition-colors duration-150 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              {more.label}
              <IconArrowRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </div>
        <ul className="grid grid-cols-[repeat(3,minmax(0,max-content))] items-center justify-between gap-x-6 gap-y-6 text-muted-foreground @max-[18rem]:grid-cols-[repeat(2,minmax(0,max-content))] @2xl:min-w-0 @2xl:flex-1 @4xl:flex @4xl:flex-wrap @4xl:gap-x-8">
          {logos.map((logo) => {
            const body = logo.mark ? (
              <span aria-hidden="true" className={cn(MARK, PICTURE)}>
                {logo.mark}
              </span>
            ) : (
              <span className="text-base font-semibold tracking-[-0.02em] @2xl:text-lg">{logo.name}</span>
            );
            return (
              <li key={logo.name} className="flex max-w-full min-w-0 items-center @4xl:shrink-0">
                {logo.href ? (
                  <a
                    href={logo.href}
                    aria-label={logo.name}
                    className="inline-flex max-w-full rounded-sm outline-none transition-colors duration-150 hover:text-foreground hover:[&_img]:opacity-100 focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:[&_img]:opacity-100 motion-reduce:transition-none"
                  >
                    {body}
                  </a>
                ) : (
                  <>
                    {body}
                    {logo.mark ? <span className="sr-only">{logo.name}</span> : null}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
