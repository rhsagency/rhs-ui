"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { IconBan, IconFirstAid } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

/** Whether a player can be picked: fit, injured or suspended. */
export type PlayerStatus = "fit" | "injured" | "suspended";

/** One figure of the season: "Goals" and "11". */
export interface PlayerStat {
  /** What it counts: "Goals". Keep it to one short word. */
  label: string;
  /** The figure. */
  value: string | number;
}

/** The player's photo. */
export interface PlayerImage {
  /** The photo's address. */
  src: string;
  /** What it shows: "Mila Kowalski in the home kit". Leave it out for a photo that only decorates, since the name is written beside it. */
  alt?: string;
}

/** The words the card uses, for translation. `{number}`, `{age}`, `{name}` and `{status}` are filled in. */
export interface PlayerCardLabels {
  /** What a screen reader hears for the shirt number. Default "Number {number}". */
  number?: string;
  /** The word on a captain's badge. Default "Captain". */
  captain?: string;
  /** The word for an injured player. Default "Injured". */
  injured?: string;
  /** The word for a suspended player. Default "Suspended". */
  suspended?: string;
  /** How the age is written. Default "{age} years". */
  age?: string;
  /** The name of the list of figures. Default "Season stats". */
  stats?: string;
}

export interface PlayerCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The player's name: "Mila Kowalski". It is the one link of the card. */
  name: string;
  /** The shirt number. It is set large beside the name and read as "Number 9". */
  number?: number | string;
  /** The position as a word: "Forward", "Goalkeeper". Always a word, so it reads aloud. */
  position: string;
  /** The short code for the position, if your site uses one: "FW". Drawn as a small tag; the word is what is read. */
  positionCode?: string;
  /** The photo. The box keeps one portrait shape for every card; without a photo, or when it fails to load, a tonal tile with the initials takes its place. */
  image?: string | PlayerImage;
  /** Where they are from: "Poland". */
  nationality?: string;
  /** Their age in years. */
  age?: number;
  /** A few figures from the season, as label and value pairs: three or four fit the card. They form a description list in tabular numerals, in columns in a wide card and as rows of label and figure in a narrow one; a label that is too long is cut with an ellipsis. */
  stats?: readonly PlayerStat[];
  /** Marks the captain with a badge on the photo. */
  captain?: boolean;
  /** Whether the player can be picked. An injured or suspended player is marked in words in a bar across the photo, and the photo loses some of its colour. In a card narrower than 8.5rem the bar keeps to the word. Default "fit". */
  status?: PlayerStatus;
  /** For an injured or suspended player, when they are expected back, written as you want it read: "Back around 24 Nov". */
  returns?: string;
  /** The player's page. The name becomes a link and the whole card opens it, the photo included. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the name becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the card uses, for translation. */
  labels?: PlayerCardLabels;
}

const DEFAULT_LABELS = {
  number: "Number {number}",
  captain: "Captain",
  injured: "Injured",
  suspended: "Suspended",
  age: "{age} years",
  stats: "Season stats",
};

/**
 * The figures sit in one row of columns once the card is wide enough for their words to fit a column with room to spare, and as rows of label and figure
 * below that. What the words need grows with how many figures there are, so up to three switch at 12.5rem and four at 16rem. The words go in capitals
 * with tracking only from 17rem (22rem for four), where a word like "Shutouts" still clears the divider. Everything is written out in full because
 * Tailwind reads whole class names.
 */
const COLUMNS: Record<number, string> = { 1: "@min-[12.5rem]:grid-cols-1", 2: "@min-[12.5rem]:grid-cols-2", 3: "@min-[12.5rem]:grid-cols-3", 4: "@min-[16rem]:grid-cols-4" };

const FIGURES_FEW =
  "@min-[12.5rem]:divide-y-0 @min-[12.5rem]:divide-x @min-[12.5rem]:pt-4 @min-[12.5rem]:text-center @min-[12.5rem]:[&>div]:flex-col-reverse @min-[12.5rem]:[&>div]:items-center @min-[12.5rem]:[&>div]:justify-start @min-[12.5rem]:[&>div]:gap-0.5 @min-[12.5rem]:[&>div]:px-0.5 @min-[12.5rem]:[&>div]:py-0 " +
  "@min-[12.5rem]:[&_dd]:text-lg @min-[12.5rem]:[&_dd]:tracking-[-0.02em] @min-[12.5rem]:[&_dt]:text-[0.6875rem] @min-[12.5rem]:[&_dt]:leading-4 @min-[12.5rem]:[&_dt]:font-medium @min-[17rem]:[&_dt]:tracking-[0.06em] @min-[17rem]:[&_dt]:uppercase";

const FIGURES_FOUR =
  "@min-[16rem]:divide-y-0 @min-[16rem]:divide-x @min-[16rem]:pt-4 @min-[16rem]:text-center @min-[16rem]:[&>div]:flex-col-reverse @min-[16rem]:[&>div]:items-center @min-[16rem]:[&>div]:justify-start @min-[16rem]:[&>div]:gap-0.5 @min-[16rem]:[&>div]:px-0.5 @min-[16rem]:[&>div]:py-0 " +
  "@min-[16rem]:[&_dd]:text-lg @min-[16rem]:[&_dd]:tracking-[-0.02em] @min-[16rem]:[&_dt]:text-[0.6875rem] @min-[16rem]:[&_dt]:leading-4 @min-[16rem]:[&_dt]:font-medium @min-[22rem]:[&_dt]:tracking-[0.06em] @min-[22rem]:[&_dt]:uppercase";

/** What stretches the name's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/** The photo, or the tile that stands in for it: a plain picture so the first paint shows it, and the initials when it is missing or does not load. */
function Portrait({ photo, name, quiet, zoom }: { photo: PlayerImage | undefined; name: string; quiet: boolean; zoom: boolean }) {
  const [failed, setFailed] = useState(false);
  const picture = useRef<HTMLImageElement>(null);
  // A picture that failed before the page was live raised its error with nobody listening.
  useEffect(() => {
    const element = picture.current;
    if (element && element.complete && element.naturalWidth === 0) setFailed(true);
  }, []);
  if (!photo || failed) {
    return (
      <div className="grid size-full place-items-center bg-muted">
        <span aria-hidden="true" className="grid aspect-square w-3/5 place-items-center rounded-full bg-background/70 text-4xl font-semibold tracking-[-0.04em] text-muted-foreground">
          {initialsOf(name)}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: a plain picture, which any optimiser can replace
    <img
      ref={picture}
      src={photo.src}
      alt={photo.alt ?? ""}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("size-full object-cover object-top transition-[transform,filter] duration-500 ease-out motion-reduce:transition-none", quiet && "grayscale-[55%]", zoom && "motion-safe:group-hover/player-card:scale-[1.03]")}
    />
  );
}

/**
 * A squad member as a card for a club site: a portrait, the shirt number set
 * large beside the name, the position as a word, where they are from, and a few
 * season figures as a description list in tabular numerals. Every card has the
 * same portrait shape and its figures sit at the foot, so a grid of players
 * lines up whatever each one has; a missing photo becomes a tonal tile with the
 * initials. Whoever cannot play is marked in words in a bar across the photo,
 * "Injured" or "Suspended" with when they are expected back, and the photo loses
 * some of its colour. The number is read as "Number 9", and with `href` the name
 * is the one link of the card. The card answers to its own width: in a narrow
 * column the number sits above the name instead of beside it.
 */
export function PlayerCard({
  name,
  number,
  position,
  positionCode,
  image,
  nationality,
  age,
  stats,
  captain = false,
  status = "fit",
  returns,
  href,
  onOpen,
  headingLevel = 3,
  labels,
  className,
  ...props
}: PlayerCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const nameId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const photo = typeof image === "string" ? { src: image } : image;
  const unavailable = status !== "fit";
  const label = <span className="[overflow-wrap:anywhere]">{name}</span>;
  const meta = [nationality, age !== undefined ? fill(text.age, { age }) : null].filter(Boolean);
  const shown = stats?.slice(0, 4) ?? [];

  return (
    <article
      data-slot="player-card"
      data-status={status}
      aria-labelledby={nameId}
      className={cn(
        "group/player-card @container relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=player-card-open]:focus-visible]:border-ring has-[[data-slot=player-card-open]:focus-visible]:ring-[3px] has-[[data-slot=player-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="relative border-b border-border">
        <AspectRatio ratio={4 / 5} className="overflow-hidden bg-muted">
          <Portrait photo={photo} name={name} quiet={unavailable} zoom={Boolean(href || onOpen)} />
        </AspectRatio>
        {captain ? (
          <Badge className="absolute top-3 left-3 h-6 px-2.5 text-[0.6875rem] font-semibold tracking-[0.04em] uppercase shadow-xs">{text.captain}</Badge>
        ) : null}
        {unavailable ? (
          <p className="absolute inset-x-0 bottom-0 flex items-start gap-2 border-t border-border bg-background px-3 py-2.5 text-[0.8125rem] leading-5 @max-[10rem]:px-2.5 @max-[10rem]:py-1.5 @max-[10rem]:text-xs @max-[10rem]:leading-4">
            {status === "injured" ? <IconFirstAid className="mt-0.5 hidden size-4 shrink-0 @min-[12rem]:block" /> : <IconBan className="mt-0.5 hidden size-4 shrink-0 @min-[12rem]:block" />}
            <span className="min-w-0">
              <span className="block font-semibold">{status === "injured" ? text.injured : text.suspended}</span>
              {returns ? (
                // In a very narrow card the bar would cover most of the portrait, so it keeps to the word and the return is only read aloud.
                <span className="block text-muted-foreground @max-[10rem]:line-clamp-2 @max-[8.5rem]:sr-only">
                  <span className="sr-only">, </span>
                  {returns}
                </span>
              ) : null}
            </span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-2 @min-[12rem]:flex-row @min-[12rem]:items-start @min-[12rem]:gap-3">
          {number !== undefined ? (
            <p className="shrink-0 text-4xl leading-[0.95] font-semibold tracking-[-0.06em] tabular-nums @min-[12rem]:w-11">
              <span aria-hidden="true">{number}</span>
              <span className="sr-only">{fill(text.number, { number })}</span>
            </p>
          ) : null}
          <div className="min-w-0 flex-1">
            <Heading id={nameId} className="text-base leading-tight font-semibold tracking-[-0.02em] text-balance">
              {href ? (
                <a data-slot="player-card-open" href={href} onClick={onOpen} className={OPEN}>
                  {label}
                </a>
              ) : onOpen ? (
                <button data-slot="player-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                  {label}
                </button>
              ) : (
                label
              )}
            </Heading>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-muted-foreground">
              {position}
              {positionCode ? (
                <span aria-hidden="true" className="rounded-[5px] border border-border px-1 font-mono text-[0.6875rem] leading-4 tracking-[0.04em] uppercase">
                  {positionCode}
                </span>
              ) : null}
            </p>
            {meta.length ? (
              <p className="mt-0.5 text-[0.8125rem] leading-5 text-muted-foreground">
                {meta.map((part, index) => (
                  <Fragment key={part}>
                    {index > 0 ? (
                      <>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="sr-only">, </span>
                      </>
                    ) : null}
                    {part}
                  </Fragment>
                ))}
              </p>
            ) : null}
          </div>
        </div>

        {shown.length ? (
          <div className="mt-auto">
            <p className="sr-only">{text.stats}</p>
            <DescriptionList
              layout="stacked"
              items={shown.map((stat) => ({ term: stat.label, value: stat.value }))}
              className={cn(
                "grid-cols-1 gap-0 divide-y divide-border border-t border-border pt-3 text-left",
                COLUMNS[shown.length],
                shown.length > 3 ? FIGURES_FOUR : FIGURES_FEW,
                "[&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-2 [&>div]:py-1.5",
                "[&_dd]:text-base [&_dd]:leading-6 [&_dd]:font-semibold [&_dd]:tabular-nums",
                // A word is cut short with an ellipsis before it runs into the next figure.
                "[&_dt]:max-w-full [&_dt]:min-w-0 [&_dt]:truncate [&_dt]:text-[0.8125rem] [&_dt]:leading-5",
              )}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
