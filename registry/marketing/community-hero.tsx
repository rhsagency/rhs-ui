import { useId, type ComponentProps } from "react";

import { IconArrowRight, IconHash } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CommunityMember {
  /** Their name. It makes the initials until a picture is there, and the summary for assistive technology reads the first few. */
  name: string;
  /** A small square picture, as a URL or a data URI. Leave it out and the member is shown as initials. */
  image?: string;
}

export interface CommunityChannel {
  /** The channel's name, without the #. */
  name: string;
  /** How many people are in it right now. */
  online: number;
}

export interface CommunityHeroLabels {
  /** The member count. {count} stands for the number. */
  members: string;
  /** The heading over the list of channels. */
  active: string;
  /** What is said of a channel's number. {count} stands for the number. */
  online: string;
  /** The one sentence a screen reader gets for the mosaic. {names} stands for the first few members, {count} for how many more there are. */
  summary: string;
}

export interface CommunityHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The promise: what it is like to be here. */
  title: string;
  /** One or two sentences of support under it. */
  description?: string;
  /** Twelve to eighteen of them look best. The first half sit on the left of the text and the rest on the right; a phone shows eight. */
  members: readonly CommunityMember[];
  /** Everyone in the community, the figure on the line under the button. */
  total: number;
  /** A few channels that are busy now, with how many are in them. */
  channels?: readonly CommunityChannel[];
  /** Where the join button goes. */
  joinHref: string;
  /** The words on the join button. */
  joinLabel?: string;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CommunityHeroLabels>;
}

const LABELS: CommunityHeroLabels = {
  members: "{count} members",
  active: "Active right now",
  online: "{count} online",
  summary: "Members include {names} and {count} more.",
};

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** One side of the mosaic: a staggered grid beside the text, or a row of faces above or below it. Decorative. */
function Mosaic({ members }: { members: readonly CommunityMember[] }) {
  if (!members.length) return null;
  return (
    <ul aria-hidden="true" className="flex flex-wrap justify-center gap-3 pb-3 @[68rem]:grid @[68rem]:grid-cols-3 @[68rem]:gap-4 @[68rem]:pb-10">
      {members.map((member, index) => (
        <li
          key={`${member.name}-${index}`}
          className="@max-[38rem]:nth-[n+5]:hidden nth-even:translate-y-3 @[68rem]:nth-even:translate-y-0 @[68rem]:nth-[3n+2]:translate-y-10"
        >
          <Avatar className="shadow-xs ring-1 ring-border data-[size=default]:size-(--tile)">
            <AvatarFallback className="text-sm @[68rem]:text-base">{initialsOf(member.name)}</AvatarFallback>
            {member.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI
              <img src={member.image} alt="" width={64} height={64} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
            ) : null}
          </Avatar>
        </li>
      ))}
    </ul>
  );
}

/**
 * A community opening built from its members. The promise and one join button
 * stand in the middle of a staggered mosaic of faces, pictures or initials on
 * a calm grid; under the button come the total ("12,480 members") and the
 * channels that are busy now with how many people are in each. The mosaic is
 * decoration and gets one sentence for screen readers instead of eighteen
 * faces; its pictures load lazily, so a phone, which shows eight, never
 * fetches the rest. Where the container is wide the faces flank the text,
 * and where it is narrow they become a row above and a row below it. For
 * clubs, chat communities, alumni networks and open-source groups, where the
 * people are the product.
 */
export function CommunityHero({
  titleAs: Title = "h2",
  title,
  description,
  members,
  total,
  channels = [],
  joinHref,
  joinLabel = "Join the community",
  locale = "en-US",
  labels: custom,
  className,
  ...props
}: CommunityHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const Sub = Title === "h1" ? "h2" : "h3";
  const count = new Intl.NumberFormat(locale);
  const half = Math.ceil(members.length / 2);
  const named = members.slice(0, 3).map((member) => member.name);
  const summary = named.length
    ? fill(words.summary, { names: new Intl.ListFormat(locale, { style: "short", type: "unit" }).format(named), count: count.format(Math.max(0, total - named.length)) })
    : null;

  return (
    <section data-slot="community-hero" aria-labelledby={`${id}-title`} className={cn("@container", className)} {...props}>
      <div className="grid gap-8 py-14 [--tile:3.25rem] @md:[--tile:3.5rem] @[68rem]:grid-cols-[minmax(0,1fr)_minmax(0,32rem)_minmax(0,1fr)] @[68rem]:items-center @[68rem]:gap-10 @[68rem]:py-24 @[68rem]:[--tile:4.5rem]">
        <div className="@[68rem]:justify-self-end">
          <Mosaic members={members.slice(0, half)} />
        </div>

        <div className="mx-auto w-full max-w-xl text-center">
          <Title id={`${id}-title`} className="text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance sm:text-5xl @[68rem]:text-6xl">
            {title}
          </Title>
          {description ? <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
          {summary ? <p className="sr-only">{summary}</p> : null}

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <a href={joinHref}>
                {joinLabel}
                <IconArrowRight />
              </a>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground tabular-nums">{fill(words.members, { count: count.format(total) })}</p>

          {channels.length ? (
            <div className="mt-8 border-t border-border pt-6">
              <Sub className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{words.active}</Sub>
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {channels.map((channel) => (
                  <li key={channel.name} className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-card-foreground">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <IconHash aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      {channel.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                      {fill(words.online, { count: count.format(channel.online) })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="@[68rem]:justify-self-start">
          <Mosaic members={members.slice(half)} />
        </div>
      </div>
    </section>
  );
}
