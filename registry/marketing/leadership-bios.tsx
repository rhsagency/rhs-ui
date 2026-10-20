import type { ComponentProps, ElementType } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface LeadershipLink {
  /** The link text: "LinkedIn", "Talks", "Email". */
  label: string;
  /** Where the link goes. */
  href: string;
  /** Opens in a new tab with rel="noopener noreferrer". Set it for links to other sites. */
  external?: boolean;
}

export interface LeadershipMember {
  /** The person's full name. It is the heading of the row. */
  name: string;
  /** "Chief executive". */
  role: string;
  /** A portrait URL. It is drawn at 4:5 and cropped from the centre; without one, or when it fails to load, a monogram fills the same space. Use an opaque image: the monogram sits behind it. */
  photo?: string;
  /** Sixty to ninety words: who they are and what they own. */
  bio: string;
  /** Earlier roles in one line: "Head of design at Halcyon. Product designer at Polder." */
  previously?: string;
  /** Where to find them: a few links, set in a row. */
  links?: readonly LeadershipLink[];
}

export interface LeadershipLabels {
  /** The accessible name of the section. */
  section: string;
  /** The word before the earlier roles. */
  previously: string;
  /** The accessible name of each person's links; the person's name follows it. */
  links: string;
  /** Read out after a link that opens in a new tab. */
  newTab: string;
}

export interface LeadershipBiosProps extends Omit<ComponentProps<"section">, "children"> {
  /** The people, in the order they appear. Two to six work best. */
  members: readonly LeadershipMember[];
  /** Puts the portrait on the right of every second row from 768px up. A phone always shows the portrait first. */
  alternate?: boolean;
  /** The level of each name: 3 by default, for a page whose section heading is an h2. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the labels, for a site that is not in English. */
  labels?: Partial<LeadershipLabels>;
}

const LABELS: LeadershipLabels = {
  section: "Leadership",
  previously: "Previously",
  links: "Links",
  newTab: "(opens in a new tab)",
};

const LINK =
  "inline-flex max-w-full items-center gap-1 rounded-sm text-sm font-medium underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** mailto: and tel: links are not routes: they stay plain anchors even when a router link is passed. */
const isPlain = (href: string) => /^(?:mailto|tel):/i.test(href);

/**
 * The people who lead the company, one per row: a large portrait on one side
 * and, on the other, the name, role, a bio of sixty to ninety words, the
 * earlier roles and links. Rows keep their height without a photo because a
 * monogram takes the portrait's place, and it stays behind a portrait that
 * fails to load. Every portrait carries its width and height so nothing
 * shifts while it loads. For teams of two to six, where a grid of squares
 * would shrink the people and drop the story.
 */
export function LeadershipBios({
  members,
  alternate = false,
  headingLevel = 3,
  linkAs: Link = "a",
  labels: custom,
  className,
  ...props
}: LeadershipBiosProps) {
  const labels = { ...LABELS, ...custom };
  const Name = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <section data-slot="leadership-bios" aria-label={labels.section} className={cn("w-full break-words", className)} {...props}>
      <ul role="list" className="divide-y divide-border border-y border-border">
        {members.map((member, index) => {
          const flipped = alternate && index % 2 === 1;
          const hasFooter = Boolean(member.previously) || Boolean(member.links?.length);
          return (
            <li key={`${member.name}-${member.role}`} data-slot="leadership-bios-member" className="grid grid-cols-1 gap-8 py-10 md:grid-cols-12 md:gap-x-10 md:py-16">
              <div className={cn("w-full max-w-[22rem] md:col-span-5 md:row-start-1 md:max-w-none md:self-start", flipped ? "md:col-start-8" : "md:col-start-1")}>
                <AspectRatio ratio={4 / 5} className="overflow-hidden rounded-xl border border-border bg-muted">
                  {/* The monogram is always drawn, behind the photo: a portrait that fails to load leaves the initials, and a loaded one covers them. */}
                  <div aria-hidden="true" className="absolute inset-0 grid place-items-center text-7xl font-medium tracking-[-0.04em] text-muted-foreground/75 select-none sm:text-8xl">
                    {initialsOf(member.name)}
                  </div>
                  {member.photo ? (
                    <img src={member.photo} alt="" width={640} height={800} loading={index === 0 ? "eager" : "lazy"} decoding="async" className="relative size-full object-cover" />
                  ) : null}
                </AspectRatio>
              </div>
              <div className={cn("flex min-w-0 flex-col [overflow-wrap:anywhere] md:col-span-6 md:row-start-1", flipped ? "md:col-start-1" : "md:col-start-7")}>
                <Name className="text-3xl leading-[1.05] font-medium tracking-[-0.035em] text-balance sm:text-4xl">{member.name}</Name>
                <p className="mt-2 text-base text-muted-foreground">{member.role}</p>
                <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-pretty">{member.bio}</p>
                {hasFooter ? (
                  <div className="mt-8">
                    <div className="grid gap-5 border-t border-border pt-6">
                      {member.previously ? (
                        <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-4">
                          <dt className="text-muted-foreground">{labels.previously}</dt>
                          <dd>{member.previously}</dd>
                        </dl>
                      ) : null}
                      {member.links?.length ? (
                        <ul role="list" aria-label={`${labels.links}, ${member.name}`} className="flex flex-wrap gap-x-5 gap-y-2">
                          {member.links.map((link) => (
                            <li key={`${link.label}-${link.href}`} className="max-w-full min-w-0">
                              {link.external ? (
                                <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                                  {link.label}
                                  <IconArrowUpRight className="size-3.5" />
                                  <span className="sr-only"> {labels.newTab}</span>
                                </a>
                              ) : isPlain(link.href) ? (
                                <a href={link.href} className={LINK}>
                                  {link.label}
                                </a>
                              ) : (
                                <Link href={link.href} className={LINK}>
                                  {link.label}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
