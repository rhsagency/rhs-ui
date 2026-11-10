import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight, IconInfo } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface Expert {
  /** Identifies the expert in the list. */
  id: string;
  /** Their name with the title they use: "Dr. Mira Okonkwo". */
  name: string;
  /** Their qualification, as the chip under the name: "Dermatologist, MD" or "Head chef". It is real text, never part of the picture. */
  credential: string;
  /** Where they practise or work: "Kestrel Dermatology, Utrecht". */
  affiliation?: string;
  /** What they said, without quotation marks: the card adds them. Keep it to a sentence or two. */
  quote: string;
  /** A portrait. Initials stand in until it loads, and when there is none. */
  photo?: string;
  /** Where to read more about them, or the source of the quote. When set, the name is a link. */
  href?: string;
  /** Set it when this expert is paid, or has a stake in the product. The card then carries a "Sponsored" badge and its link is marked rel="sponsored". */
  sponsored?: boolean;
}

export interface ExpertEndorsementsLabels {
  /** Said before the credential chip to a screen reader, so the chip is not a loose phrase. Default "Credential". */
  credential: string;
  /** The badge on a paid expert's card. Default "Sponsored". */
  sponsored: string;
}

export interface ExpertEndorsementsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Two to six experts. Three sit in a row on a desktop; an odd last one spans the width below that. */
  experts: readonly Expert[];
  /**
   * What the reader needs to know about these quotes, printed under the grid: "Experts were not paid for these
   * quotes", or which of them were. Endorsements are regulated in many markets, so it is required; pass `null`
   * only when you have checked that nothing needs saying.
   */
  disclosure: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ExpertEndorsementsLabels>;
}

const LABELS: ExpertEndorsementsLabels = { credential: "Credential", sponsored: "Sponsored" };

/** Column classes written out per count, so Tailwind sees every one: four cards sit two by two, never three and a lonely one. */
function columnsFor(count: number): string {
  if (count <= 1) return "mx-auto max-w-xl";
  if (count === 2 || count === 4) return "md:grid-cols-2";
  return "md:grid-cols-2 lg:grid-cols-3";
}

/** "Dr. Mira Okonkwo" becomes "Mira Okonkwo": a title is not a name, so it must not turn into an initial ("DO") when there is no portrait. */
function withoutTitle(name: string): string {
  return name.replace(/^(?:(?:dr|prof|mr|mrs|ms|mx|chef|coach)\.?\s+)+/i, "");
}

/**
 * Quotes from credentialed people, for products where who says it matters: a doctor on a cream, a chef on a
 * knife, a coach on a programme. Each card leads with the person: a portrait, the name, the qualification as a
 * chip in real text and where they work, then the quote. The disclosure is part of the section, not an
 * afterthought: it is a required prop printed under the grid, and an expert who is paid carries a solid
 * "Sponsored" badge on the card itself and a rel="sponsored" link. Portraits show at once, with no hover and no
 * reveal. No state of its own, so it renders on the server.
 */
export function ExpertEndorsements({ title, description, experts, disclosure, labels, className, ...props }: ExpertEndorsementsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="expert-endorsements" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className={cn("mt-12 grid gap-x-4 gap-y-6 sm:mt-16", columnsFor(experts.length))}>
        {experts.map((expert) => (
          <li key={expert.id} className="relative md:max-lg:last:odd:col-span-2">
            {/* On the card's top edge, so every header keeps the same height whether or not an expert is paid. It comes first, so it is read first. */}
            {expert.sponsored ? (
              <Badge className="absolute top-0 left-6 z-10 h-6 -translate-y-1/2 px-2.5 text-[0.8125rem] ring-[3px] ring-background [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
                {words.sponsored}
              </Badge>
            ) : null}
            <figure className="flex h-full flex-col gap-6 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-7">
              <figcaption className="flex items-center gap-4">
                {/* Only for the eye: the name is written next to it, so the initials are not read. */}
                <Avatar aria-hidden="true" size="lg" className="ring-1 ring-border data-[size=lg]:size-16">
                  {expert.photo ? <AvatarImage src={expert.photo} alt="" /> : null}
                  <AvatarFallback>{initialsOf(withoutTitle(expert.name))}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 justify-items-start gap-1.5">
                  <cite className="text-base leading-tight font-medium tracking-[-0.01em] not-italic">
                    {expert.href ? (
                      <a
                        href={expert.href}
                        rel={expert.sponsored ? "sponsored" : undefined}
                        className="group/name inline-flex items-center gap-1 rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                      >
                        {expert.name}
                        <IconArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-150 motion-safe:group-hover/name:translate-x-0.5 motion-safe:group-hover/name:-translate-y-0.5 motion-reduce:transition-none" />
                      </a>
                    ) : (
                      expert.name
                    )}
                  </cite>
                  <Badge variant="secondary" className="h-auto min-h-6 px-2.5 py-0.5 text-[0.8125rem] whitespace-normal">
                    <span className="sr-only">{words.credential}: </span>
                    {expert.credential}
                  </Badge>
                  {expert.affiliation ? <span className="text-[0.8125rem] leading-snug text-muted-foreground">{expert.affiliation}</span> : null}
                </div>
              </figcaption>
              <blockquote>
                <p className="text-[1.0625rem] leading-relaxed tracking-[-0.01em] text-pretty">&ldquo;{expert.quote}&rdquo;</p>
              </blockquote>
            </figure>
          </li>
        ))}
      </ul>
      {disclosure ? (
        <div role="note" className="mx-auto mt-8 flex w-fit max-w-2xl items-start gap-2.5 text-left text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>{disclosure}</div>
        </div>
      ) : null}
    </section>
  );
}
