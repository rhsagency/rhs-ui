import { useId, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export interface MembershipTier {
  /** A stable key for the tier, matched by `current`: "silver". */
  id: string;
  /** What the tier is called: "Silver". */
  name: string;
  /** What it takes to earn it, as you want it read: "from €250 a year", "after 2 years", "Free to join". */
  threshold: string;
  /** What the member gets, a line each. A tier that includes the one below can start with "Everything in Bronze". */
  perks: readonly string[];
}

export interface MembershipProgress {
  /** Where the member is now, in the unit the tiers are earned in: 420. */
  value: number;
  /** Where the next tier starts, in the same unit: 600. */
  nextAt: number;
  /** An ISO 4217 currency when the tiers are earned by spend: "EUR". The numbers are written as money. */
  currency?: string;
  /** What the numbers count when it is not money: "points", "nights", "months". It comes once, after the numbers. */
  unit?: string;
}

export interface MembershipTiersLabels {
  /** Marks the member's own tier. */
  yourTier: string;
  /** Said on a tier the member has already earned. */
  reached: string;
  /** Read out on a tier the member has not earned yet. */
  ahead: string;
  /** Under the member's tier, the numbers. {value} and {nextAt} stand for them. */
  figures: string;
  /** Under the member's tier, how far the next tier is. {amount} stands for the distance and {tier} for the name of the next tier. */
  toGo: string;
  /** Said instead of the distance once the member has enough for the next tier. {tier} stands for its name. */
  qualified: string;
  /** Said under the highest tier when it is the member's own. */
  top: string;
  /** The name of the progress bar for assistive technology. {tier} stands for the next tier. */
  progressName: string;
}

const LABELS: MembershipTiersLabels = {
  yourTier: "Your tier",
  reached: "Reached",
  ahead: "Not reached yet",
  figures: "{value} of {nextAt}",
  toGo: "{amount} to go until {tier}",
  qualified: "You have enough for {tier}.",
  top: "You are on our highest tier.",
  progressName: "Progress to {tier}",
};

export interface MembershipTiersProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Earn your way up". */
  title: string;
  /** One or two sentences under the heading: what counts towards a tier and when it is reviewed. */
  description?: string;
  /** Three or four tiers, lowest first. They are earned in order, so the order is the ladder. */
  tiers: readonly MembershipTier[];
  /** The `id` of the member's own tier. Leave it out for a visitor who is not a member: no tier is marked. */
  current?: string;
  /** How far the member is towards the next tier. It needs `current`; the marker sits between the two tiers, and the words say how far is left. */
  progress?: MembershipProgress;
  /** The action under the ladder: a Button or a link styled as one, such as "Join the club". */
  cta?: ReactNode;
  /** Fine print under the action: "Tiers are reviewed every January, on the last twelve months." */
  note?: string;
  /** The level of the heading: 2 by default. Each tier's name sits one level below it. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<MembershipTiersLabels>;
  /** Locale for the numbers. "en-US" by default. */
  locale?: string;
}

/**
 * The classes that turn the ladder from a column into a row, written out so Tailwind sees every one. Up to three tiers
 * go side by side from 768px of width, four need 896px to keep their perks readable. Below that the ladder runs down
 * the page, the rail on the left and each tier beside it.
 */
const ROW = {
  few: {
    item: "@3xl:flex @3xl:flex-col",
    rail: "@3xl:mb-4 @3xl:h-5",
    node: "@3xl:top-0 @3xl:left-0 @3xl:translate-x-0",
    track: "@3xl:top-[9px] @3xl:right-[-1.25rem] @3xl:bottom-auto @3xl:left-5 @3xl:h-0.5 @3xl:w-auto @3xl:translate-x-0",
    fill: "@3xl:h-full @3xl:w-(--at)",
    marker: "@3xl:top-1/2 @3xl:left-(--at)",
    card: "@3xl:flex-1",
  },
  many: {
    item: "@4xl:flex @4xl:flex-col",
    rail: "@4xl:mb-4 @4xl:h-5",
    node: "@4xl:top-0 @4xl:left-0 @4xl:translate-x-0",
    track: "@4xl:top-[9px] @4xl:right-[-1.25rem] @4xl:bottom-auto @4xl:left-5 @4xl:h-0.5 @4xl:w-auto @4xl:translate-x-0",
    fill: "@4xl:h-full @4xl:w-(--at)",
    marker: "@4xl:top-1/2 @4xl:left-(--at)",
    card: "@4xl:flex-1",
  },
};

/**
 * Where the marker stands along the rail, and where the filled rail ends, from the share of the way the member has gone
 * (--f). The rail between two nodes is the line the marker rides on, but the nodes are 20px discs and the marker is a
 * diamond with a ring of its own, so at 0% and at 100% it would sit under a node as a half-hidden shape. It is kept 13px
 * clear of both ends instead, which is as close as its ring (the half diagonal of an 18px square, 12.7px) can come
 * without touching the node: a new member's marker stands just past their own tier, and a member with enough for the
 * next tier stands just short of it. The words and the bar carry the exact figure.
 */
const MARKER_AT = "calc(13px + var(--f) * (100% - 26px))";
/** Where the filled rail ends on a stretch with no marker: all of it below the member's tier, none of it above. */
const FILLED_AT = "calc(var(--f) * 100%)";

/** One column per tier, written out so Tailwind sees every class. Below the width where the tiers sit side by side the ladder is a centred column, so on a tablet a card never stretches the width of the page. */
const COLUMNS = [
  "mx-auto max-w-xl",
  "mx-auto max-w-xl",
  "mx-auto max-w-xl @3xl:max-w-none @3xl:grid-cols-2 @3xl:gap-x-5 @3xl:gap-y-0",
  "mx-auto max-w-xl @3xl:max-w-none @3xl:grid-cols-3 @3xl:gap-x-5 @3xl:gap-y-0",
  "mx-auto max-w-xl @4xl:max-w-none @4xl:grid-cols-4 @4xl:gap-x-5 @4xl:gap-y-0",
];

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/**
 * A loyalty or membership ladder: tiers that are earned, not bought, with
 * what each takes and what each gives. The tiers are an ordered list joined
 * by a rail, as columns on a wide section and one under the other on a phone.
 * Give it the member's tier and how far they are towards the next, and their
 * own tier is marked in words (Your tier, with aria-current), the tiers below
 * it say Reached, the rail is filled up to where the member stands with a
 * marker between the two tiers, and a progress bar says it in numbers and
 * words: "€180 to go until Gold". Without a member it is the ladder a visitor
 * sees, and nothing is marked. Different from a pricing table, where each
 * column is a purchase: here the thresholds are the point. For shops, clubs,
 * airlines, hotels and anyone who rewards people for staying.
 */
export function MembershipTiers({ title, description, tiers, current, progress, cta, note, headingLevel = 2, labels: custom, locale = "en-US", className, ...props }: MembershipTiersProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Name = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const row = tiers.length > 3 ? ROW.many : ROW.few;
  const at = current === undefined ? -1 : tiers.findIndex((tier) => tier.id === current);
  const next = at >= 0 ? tiers[at + 1] : undefined;

  // How far the member is towards the next tier, from 0 to 1: the share of the next threshold they have reached. The bar and the marker on the rail show the same share.
  const fraction = progress && next ? (progress.nextAt > 0 ? Math.min(1, Math.max(0, progress.value / progress.nextAt)) : 1) : 0;

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const money = progress?.currency ? new Intl.NumberFormat(locale, { style: "currency", currency: progress.currency, maximumFractionDigits: 0 }) : null;
  const amount = (value: number) => (money ? money.format(value) : number.format(value));
  const withUnit = (value: string) => (!money && progress?.unit ? `${value} ${progress.unit}` : value);

  return (
    <section data-slot="membership-tiers" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      <ol role="list" className={cn("mt-10 grid gap-y-8 @3xl:mt-14", COLUMNS[Math.min(tiers.length, 4)])}>
        {tiers.map((tier, index) => {
          const isCurrent = index === at;
          const reached = at >= 0 && index < at;
          const hasProgress = isCurrent && progress !== undefined && next !== undefined;
          const isTop = isCurrent && next === undefined;
          const figures = hasProgress ? withUnit(text(labels.figures, { value: amount(progress.value), nextAt: amount(progress.nextAt) })) : "";
          const last = index === tiers.length - 1;
          // The share of the rail after this tier that is filled: all of it below the member's tier, part of it from the member's tier on.
          const filled = reached ? 1 : isCurrent ? fraction : 0;
          const nameId = `${id}-${tier.id}`;
          return (
            <li key={tier.id} aria-current={isCurrent ? "true" : undefined} data-state={isCurrent ? "current" : reached ? "reached" : "ahead"} className={cn("grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4", row.item)}>
              {/* The rail: this tier's marker, and the line to the next one. It is decoration; the words say where the member stands. */}
              <div aria-hidden="true" className={cn("relative", row.rail)}>
                <span
                  className={cn(
                    "absolute top-7 left-1/2 z-10 grid size-5 -translate-x-1/2 place-items-center rounded-full border-2",
                    row.node,
                    reached ? "border-foreground bg-foreground text-background" : isCurrent ? "border-foreground bg-background" : "border-foreground/25 bg-background",
                  )}
                >
                  {reached ? <IconCheck size={12} strokeWidth={2.5} /> : isCurrent ? <span className="size-2 rounded-full bg-foreground" /> : null}
                </span>
                {last ? null : (
                  <span style={{ "--f": filled, "--at": hasProgress ? MARKER_AT : FILLED_AT } as CSSProperties} className={cn("absolute top-12 -bottom-15 left-1/2 w-0.5 -translate-x-1/2 bg-foreground/15", row.track)}>
                    <span className={cn("absolute top-0 left-0 h-(--at) w-full bg-foreground", row.fill)} />
                    {hasProgress ? (
                      <span className={cn("absolute top-(--at) left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-foreground ring-[3px] ring-background", row.marker)} />
                    ) : null}
                  </span>
                )}
              </div>

              <div className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-6", row.card, isCurrent ? "border-foreground shadow-xs" : "border-border")}>
                <div className="flex min-h-7 items-center justify-between gap-3">
                  <Name id={nameId} className="text-xl leading-7 font-medium tracking-[-0.02em]">
                    {tier.name}
                  </Name>
                  {isCurrent ? (
                    <Badge>{labels.yourTier}</Badge>
                  ) : reached ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <IconCheck aria-hidden="true" size={14} />
                      {labels.reached}
                    </span>
                  ) : at >= 0 ? (
                    <span className="sr-only">{labels.ahead}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">{tier.threshold}</p>

                <ul role="list" aria-labelledby={nameId} className={cn("mt-5 grid gap-3 border-t border-border pt-5", (hasProgress || isTop) && "mb-6")}>
                  {tier.perks.map((perk, perkIndex) => (
                    <li key={`${perkIndex}-${perk}`} className="flex items-start gap-2.5 text-sm leading-snug">
                      <IconCheck aria-hidden="true" className="mt-px size-4 shrink-0" />
                      <span className="min-w-0 text-pretty">{perk}</span>
                    </li>
                  ))}
                </ul>

                {hasProgress ? (
                  <div className="mt-auto border-t border-border pt-5">
                    <p className="text-sm font-medium tabular-nums">{figures}</p>
                    {/* The words are the value text, not a function: this module renders on the server, and a function cannot be passed to the client Progress. */}
                    <Progress value={fraction * 100} aria-label={text(labels.progressName, { tier: next.name })} aria-valuetext={figures} className="mt-3 h-1.5" />
                    <p className="mt-3 text-sm text-muted-foreground tabular-nums">
                      {progress.value >= progress.nextAt
                        ? text(labels.qualified, { tier: next.name })
                        : text(labels.toGo, { amount: withUnit(amount(Math.max(0, progress.nextAt - progress.value))), tier: next.name })}
                    </p>
                  </div>
                ) : isTop ? (
                  <p className="mt-auto border-t border-border pt-5 text-sm text-muted-foreground">{labels.top}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {cta || note ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center @3xl:mt-12">
          {cta}
          {note ? <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">{note}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
