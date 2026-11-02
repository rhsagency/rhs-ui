import { Fragment, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface SideBenefit {
  /** A glyph from @rhs-ui/icons, drawn at 18px in a small tile. It is decoration: the title says it all. A check stands in when there is none. */
  icon?: ReactNode;
  /** The benefit in a few words: "Guests are verified before they book". */
  title: string;
  /** One or two lines that back it up. */
  description: string;
}

export interface SideAction {
  /** The button's text: "List your place". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface PlatformSide {
  /** Who this side is for, as a short tag: "For hosts". */
  label: string;
  /** What this side gets, as a sentence: "Fill your calendar without chasing anyone". */
  heading: string;
  /** What they get. Four read best. The two sides line up row by row, so a side with fewer benefits simply ends sooner. */
  benefits: readonly SideBenefit[];
  /** The one action of this side. Give both sides one, or neither, so neither reads as an afterthought. */
  cta?: SideAction;
}

export interface TwoSidedFeaturesLabels {
  /** The word on the divider between the two sides: "and". */
  and: string;
}

export interface TwoSidedFeaturesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "How Kestrel works". */
  eyebrow?: string;
  /** The heading. Name the one idea the platform is built on: "A stay that works for both sides". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Whether the heading is set from the middle, which suits two mirrored sides, or from the start. "center" by default. */
  align?: "center" | "start";
  /** The two audiences, left and right. They get the same structure and the same weight. */
  sides: readonly [PlatformSide, PlatformSide];
  /** The level of the heading: 2 by default. The heading of each side sits one level below, and is always set smaller than the title, so the title stays the focal point at level 3 too. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TwoSidedFeaturesLabels>;
}

const LABELS: TwoSidedFeaturesLabels = { and: "and" };

/**
 * A platform explained to both of the people it serves: what buyers get and what sellers get, mirrored around a
 * centre rule. Each side has an audience tag, a heading, a ruled list of benefits with a small icon and its own
 * action, and the benefits sit on the same rows across the rule, so each pair reads straight across whatever the
 * length of the words. Both sides carry the same structure, size and button, so neither reads as an afterthought.
 * It is made for marketplaces, booking platforms, hiring sites and any other two-sided network. On a narrow block
 * the sides stack with a labelled divider ("and") between them. The block has no state of its own and renders on
 * the server; the sides come in two columns by the width of the block, not of the screen.
 */
export function TwoSidedFeatures({ eyebrow, title, description, align = "center", sides, headingLevel = 2, labels: custom, className, ...props }: TwoSidedFeaturesProps) {
  const labels = { ...LABELS, ...custom };
  const SideHeading = `h${headingLevel + 1}` as "h3" | "h4";
  // The rows every side shares: its tag, its heading, one per benefit (as many as the longest side has) and the action.
  const benefitRows = Math.max(1, ...sides.map((side) => side.benefits.length));
  const rows = 2 + benefitRows + (sides.some((side) => side.cta) ? 1 : 0);

  return (
    <section data-slot="two-sided-features" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} align={align === "center" ? "center" : "left"} as={headingLevel === 3 ? "h3" : "h2"} />

      <div
        style={{ "--rows": rows, "--benefits": benefitRows } as CSSProperties}
        className="mt-12 grid gap-y-10 @3xl:mt-14 @3xl:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] @3xl:gap-y-0"
      >
        {sides.map((side, index) => (
          <Fragment key={`${index}-${side.label}`}>
            {/* The divider sits between the sides: a labelled rule on a phone, and a vertical rule with the same word on it beside them. */}
            {index === 1 ? (
              <>
                <LabeledDivider className="@3xl:hidden">{labels.and}</LabeledDivider>
                {/* The rule shares the rows of the sides, so its word can sit exactly on the hairline between the two middle benefits. */}
                <div
                  aria-hidden="true"
                  className="relative hidden before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border @3xl:col-start-2 @3xl:row-span-(--rows) @3xl:row-start-1 @3xl:grid @3xl:grid-rows-subgrid"
                >
                  <span style={{ gridRow: 2 + Math.ceil(benefitRows / 2) }} className="relative z-10 translate-y-1/2 self-end justify-self-center rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {labels.and}
                  </span>
                </div>
              </>
            ) : null}
            <div className={cn("flex min-w-0 flex-col @3xl:row-span-(--rows) @3xl:row-start-1 @3xl:grid @3xl:grid-rows-subgrid", index === 0 ? "@3xl:col-start-1" : "@3xl:col-start-3")}>
              <p className="flex h-6 w-fit items-center gap-2 rounded-full border border-border px-2.5 text-xs font-medium">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                {side.label}
              </p>
              {/* Always below the size SectionHeading gives the title at this level (20 and 24px at level 3, 30 and 36px at level 2). */}
              <SideHeading className={cn("mt-4 pb-8 leading-[1.2] font-medium tracking-[-0.03em] text-balance", headingLevel === 3 ? "text-lg" : "text-2xl @3xl:text-[1.75rem]")}>{side.heading}</SideHeading>
              <ul role="list" className="border-b border-border @3xl:row-span-(--benefits) @3xl:grid @3xl:grid-rows-subgrid">
                {side.benefits.map((benefit, benefitIndex) => (
                  <li key={`${benefitIndex}-${benefit.title}`} className="flex gap-4 border-t border-border py-5">
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground [&_svg]:size-[1.125rem]">
                      {benefit.icon ?? <IconCheck />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] leading-snug font-medium tracking-[-0.01em]">{benefit.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{benefit.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {side.cta ? (
                <div className="pt-8">
                  <Button asChild size="lg" className="w-full @xl:w-auto">
                    <a href={side.cta.href}>
                      {side.cta.label}
                      <IconArrowRight aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
