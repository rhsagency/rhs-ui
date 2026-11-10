import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconArrowUpRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { FeatureBadge } from "@rhs-ui/primitives/feature-badge";
import { cn } from "@/lib/utils";

export interface CreatorStat {
  /** What is counted: "Followers", "Subscribers", "Episodes". */
  label: string;
  /** The number itself. It is shown in compact notation, 48,200 as 48.2K, and read in full. */
  value: number;
}

export interface CreatorLink {
  /** The words on the button. */
  label: string;
  /** Where the button goes. */
  href: string;
  /** An icon for the link, drawn small in a tile at the left. */
  icon?: ReactNode;
  /** A "New", "Beta" or "Soon" tag next to the label. */
  badge?: "new" | "beta" | "soon";
  /** The one link to set in solid colour: the thing you most want pressed. */
  featured?: boolean;
  /** Opens in a new tab with rel="noopener noreferrer", and says so to screen readers. Defaults to true for an absolute http(s) address. */
  external?: boolean;
}

export interface CreatorSocial {
  /** The network, in words: "Instagram". These are named, not drawn, so there is no borrowed logo to get wrong. */
  label: string;
  /** The profile's address. */
  href: string;
}

export interface CreatorHeroLabels {
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
  /** The name of the list of profiles. */
  profiles: string;
}

export interface CreatorHeroProps extends Omit<ComponentProps<"section">, "children"> {
  /** The name's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  nameAs?: "h1" | "h2";
  /** Your name. */
  name: string;
  /** "@marlowe.makes" */
  handle: string;
  /** One line about you. */
  bio: string;
  /** A square picture, as a URL or a data URI. Leave it out and your initials are drawn. */
  avatar?: string;
  /** Three fit best: the numbers that make a stranger stay. */
  stats?: readonly CreatorStat[];
  /** The stack of buttons: what you want people to do next, in order. */
  links: readonly CreatorLink[];
  /** A row of profiles under the stack, named in text. */
  socials?: readonly CreatorSocial[];
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CreatorHeroLabels>;
}

const LABELS: CreatorHeroLabels = { newTab: "opens in a new tab", profiles: "Profiles" };

const isExternal = (link: CreatorLink) => link.external ?? /^https?:\/\//i.test(link.href);

/**
 * A link-in-bio opening for a creator, designed at 320px and left that way:
 * one narrow column with a large avatar, the name and handle, a line of bio,
 * three audience numbers in compact notation (48.2K, and the full figure for
 * screen readers) and a stack of full-width link buttons, each with an icon,
 * a label and an optional New tag, then profiles named in text. The stack is
 * a real list, the first link can be set in solid colour as the one to press,
 * and a link that leaves the page opens in a new tab with a rel and says so.
 * For creators, speakers, musicians and small brands.
 */
export function CreatorHero({ nameAs: Name = "h2", name, handle, bio, avatar, stats = [], links, socials = [], locale = "en-US", labels: custom, className, ...props }: CreatorHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const full = new Intl.NumberFormat(locale);

  return (
    <section data-slot="creator-hero" aria-labelledby={`${id}-name`} className={cn("mx-auto w-full max-w-md px-4 py-12 text-center sm:py-16", className)} {...props}>
      <Avatar className="mx-auto shadow-xs ring-1 ring-border ring-offset-4 ring-offset-background data-[size=default]:size-24">
        {avatar ? <AvatarImage src={avatar} alt="" /> : null}
        <AvatarFallback className="text-2xl tracking-tight">{initialsOf(name)}</AvatarFallback>
      </Avatar>

      <Name id={`${id}-name`} className="mt-6 text-3xl leading-tight font-medium tracking-[-0.035em] text-balance">
        {name}
      </Name>
      <p className="mt-1 text-sm text-muted-foreground">{handle}</p>
      <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-pretty">{bio}</p>

      {stats.length ? (
        <dl className="mt-7 grid grid-flow-col auto-cols-fr divide-x divide-border rounded-xl border border-border bg-card py-3.5 text-card-foreground shadow-xs">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col-reverse gap-0.5 px-2">
              <dt className="text-xs text-balance text-muted-foreground">{stat.label}</dt>
              <dd className="text-xl font-medium tracking-[-0.03em] tabular-nums">
                <span aria-hidden="true">{compact.format(stat.value)}</span>
                <span className="sr-only">{full.format(stat.value)}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <ul className="mt-7 grid gap-3 text-left">
        {links.map((link) => {
          const external = isExternal(link);
          return (
            <li key={`${link.label}-${link.href}`}>
              <a
                href={link.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className={cn(
                  "group/link flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium shadow-xs transition-[background-color,border-color,transform] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 active:translate-y-px motion-reduce:transition-none",
                  link.featured
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-card text-card-foreground hover:border-foreground/25 hover:bg-muted/60",
                )}
              >
                {link.icon ? (
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[1.125rem]", link.featured ? "bg-primary-foreground/12" : "bg-muted")}>{link.icon}</span>
                ) : null}
                <span className="flex min-w-0 flex-1 items-center leading-snug">
                  {link.badge ? (
                    <FeatureBadge kind={link.badge} className="min-w-0">
                      <span className="min-w-0 text-pretty">{link.label}</span>
                    </FeatureBadge>
                  ) : (
                    <span className="min-w-0 text-pretty">{link.label}</span>
                  )}
                </span>
                {external ? <IconArrowUpRight aria-hidden="true" className="size-4 shrink-0 opacity-60 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-reduce:transition-none" /> : <IconArrowRight aria-hidden="true" className="size-4 shrink-0 opacity-60 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />}
                {external ? <span className="sr-only"> ({words.newTab})</span> : null}
              </a>
            </li>
          );
        })}
      </ul>

      {socials.length ? (
        <ul aria-label={words.profiles} className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          {socials.map((social) => (
            <li key={`${social.label}-${social.href}`}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm text-muted-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:text-foreground hover:decoration-foreground/40 focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                {social.label}
                <span className="sr-only"> ({words.newTab})</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
