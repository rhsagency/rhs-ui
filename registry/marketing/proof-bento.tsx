import { useId, type ComponentProps, type CSSProperties } from "react";

import { IconArrowUpRight, IconStar } from "@rhs-ui/icons";
import type { Logo } from "@rhs-ui/marketing/logo-cloud";
import { CountUp } from "@rhs-ui/motion/count-up";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface ProofTileBase {
  /** Identifies the tile in the grid. */
  id: string;
  /** Columns the tile covers on a desktop, which has four. A phone and a tablet have two, so 2 is the full width there. Default 1. */
  span?: 1 | 2;
  /** Rows the tile covers on a desktop. On a phone and a tablet every tile takes the height its content needs. Default 1. */
  rowSpan?: 1 | 2;
}

export interface ProofQuoteTile extends ProofTileBase {
  /** Words from a customer, set large with the person under them. */
  kind: "quote";
  /** What they said, without quotation marks: the tile adds them. Give a narrow tile one short sentence. */
  quote: string;
  /** Who said it. */
  name: string;
  /** Their job and company, written as it should be read: "Head of support, Northwind". */
  role?: string;
  /** A portrait. Initials stand in when there is none and until it loads. */
  avatar?: string;
}

export interface ProofStatTile extends ProofTileBase {
  /** One figure with what it counts. */
  kind: "stat";
  /** The figure. A number counts up once as it scrolls into view; text such as "24/7" or "A+" is set as written. */
  value: number | string;
  /** Text before the figure, set at the same size: "$", "€". */
  prefix?: string;
  /** Text after the figure, set at the same size: "%", "k", "M". */
  suffix?: string;
  /** Digits after the decimal point of a number: `99.98` with `decimals={2}`. */
  decimals?: number;
  /** What the figure counts, in a few words: "Teams on Halcyon". */
  label: string;
  /** One line of context under the figure: "in 31 countries". */
  detail?: string;
}

export interface ProofRatingTile extends ProofTileBase {
  /** A score from a review site: the number, stars to the fraction, how many people gave it and where. */
  kind: "rating";
  /** The score, out of `max`: 4.8. A fraction fills part of the last star. */
  score: number;
  /** How many stars the scale has. Default 5. */
  max?: number;
  /** How many people gave it, written as you want it read: "2,140 reviews". */
  count: string;
  /** Where the rating lives, as plain text and never a borrowed logo: "G2", "App Store". */
  source: string;
  /** The page with the reviews. It makes the whole tile one link, named by the rating. */
  href?: string;
}

export interface ProofLogosTile extends ProofTileBase {
  /** The marks of the customers you work with, in a tile of their own. */
  kind: "logos";
  /** A quiet line above the marks, which also names the list: "Trusted by support teams at". */
  title?: string;
  /** The marks, in the shape LogoCloud takes: a name, a mark as an SVG or an image, and an optional link. Every mark keeps its own width: a narrow tile wraps them in a row, a wide one sets them in columns. */
  logos: readonly Logo[];
}

export interface ProofImageTile extends ProofTileBase {
  /** A customer photo that fills the tile, with a caption on it. */
  kind: "image";
  /** The photo. It fills the tile and is cropped to it, so give it room around the subject. */
  src: string;
  /** What the photo shows. Required: it is the only description for anyone who cannot see it. */
  alt: string;
  /** A line on the photo, on a solid chip so it reads on any picture: "Packing day at the Rotterdam warehouse". */
  caption: string;
  /** Who is in the photo or who took it, in smaller type under the caption. */
  credit?: string;
  /** Where the crop keeps the subject, as a CSS object-position: "50% 30%". Default the centre. */
  focalPoint?: string;
}

/** One tile of the grid. `kind` tells them apart. */
export type ProofTile = ProofQuoteTile | ProofStatTile | ProofRatingTile | ProofLogosTile | ProofImageTile;

export interface ProofBentoLabels {
  /** What a screen reader hears for a rating; `{score}`, `{max}`, `{source}` and `{count}` are filled in. Default "Rated {score} out of {max} on {source}, {count}". */
  rated: string;
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
}

export interface ProofBentoProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** A small line above the title: "Customers". */
  eyebrow?: string;
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** The tiles, in the order they are read. The grid fills them in that order and never reorders them, so pair the spans: a row of four is full when its tiles add up to four columns. */
  tiles: readonly ProofTile[];
  /** The locale of the digits and separators. Default "en-US", which is also what a tag the browser cannot read ("en_US" with an underscore) falls back to. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ProofBentoLabels>;
}

const LABELS: ProofBentoLabels = {
  rated: "Rated {score} out of {max} on {source}, {count}",
  newTab: "opens in a new tab",
};

const EXTERNAL = /^https?:\/\//i;

/** One radius, one hairline, one padding for every kind of tile: the variety is in what is inside. The tile is its own size container, so the figures can fit its width. */
const TILE = "@container relative flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6";

const LABEL = "text-sm leading-snug text-pretty text-muted-foreground";

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/** Written out whole, so Tailwind sees every class. A tile that would sit alone in its row on a phone takes the row; from a desktop up it is one column again. */
const COLUMN = { one: "col-span-1", lone: "col-span-2 lg:col-span-1", two: "col-span-2" } as const;
const ROW = { 1: "", 2: "lg:row-span-2" } as const;

/** The type of each size of quote. `lone` is a one-column quote that has a whole row to itself below a desktop: the wide size there, and the narrow size again from a desktop up, where it is one column. */
const QUOTE_TEXT = {
  lead: "text-2xl leading-[1.18] tracking-[-0.03em] text-balance sm:text-[2rem] lg:text-[2.25rem]",
  wide: "text-xl leading-[1.28] tracking-[-0.025em] text-balance sm:text-2xl",
  narrow: "text-[0.9375rem] leading-[1.45] tracking-[-0.01em] text-pretty sm:text-base",
  lone: "text-xl leading-[1.28] tracking-[-0.025em] text-balance sm:text-2xl lg:text-base lg:leading-[1.45] lg:tracking-[-0.01em] lg:text-pretty",
} as const;

const QUOTE_AVATAR = { lead: "lg", wide: "default", narrow: "sm", lone: "default" } as const;

/** A lone quote's face follows its type: the wide size below a desktop, the narrow one (and its smaller initials) again from it. */
const LONE_FACE = "lg:data-[size=default]:size-7";
const LONE_INITIALS = "lg:group-data-[size=default]/avatar:text-[0.6875rem]";

/** The largest a figure is set: one column holds a smaller number than two. */
const FIGURE_CAP = { 1: "3.5rem", 2: "5rem" } as const;

/** About how wide a digit is, in em, at weight 500 with tight tracking. A little over, so a figure never runs past its tile. */
const DIGIT_EM = 0.6;

/** A template with `{name}` holes, filled with text. */
const fillText = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => values[name] ?? hole);

/**
 * The locale every number of the section is set in, settled once: the one you passed, or "en-US" when the browser
 * cannot read it. A malformed tag ("en_US") makes `Intl.NumberFormat` throw, and a well-formed one it does not know
 * ("xx") silently uses the runtime's own locale, so the server and the browser could disagree. Resolved here, the
 * figure sizes, the rating and the count all get the same tag.
 */
function resolveLocale(locale: string): string {
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length ? locale : "en-US";
  } catch {
    return "en-US";
  }
}

/** The figure as it reads once the count has finished, so its width is known before it runs. */
function writtenFigure(tile: ProofStatTile, locale: string): string {
  const { value, prefix = "", suffix = "", decimals = 0 } = tile;
  if (typeof value === "string") return `${prefix}${value}${suffix}`;
  return `${prefix}${new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}${suffix}`;
}

/** The length of the longest figure among the stat tiles of each width: every figure of a width is set at one size, so a row of stats does not wobble. */
function longestFigures(tiles: readonly ProofTile[], locale: string): Record<1 | 2, number> {
  const longest: Record<1 | 2, number> = { 1: 3, 2: 3 };
  for (const tile of tiles) {
    if (tile.kind !== "stat") continue;
    const span = tile.span ?? 1;
    longest[span] = Math.max(longest[span], writtenFigure(tile, locale).length);
  }
  return longest;
}

/** The size of a figure: as large as its tile holds for the longest figure of its width, between a floor (small, but never wider than its tile) and the cap. */
function figureStyle(span: 1 | 2, characters: number): CSSProperties {
  return { fontSize: `clamp(1rem, calc(100cqw / ${(characters * DIGIT_EM).toFixed(2)}), ${FIGURE_CAP[span]})` };
}

/** The one-column tiles that would be left alone in a row of a two-column grid, which is what a phone and a tablet have: they take the whole row instead of leaving a hole beside them. */
function loneOnPhone(tiles: readonly ProofTile[]): Set<string> {
  const lone = new Set<string>();
  let waiting: string | null = null;
  for (const tile of tiles) {
    if ((tile.span ?? 1) === 2) {
      // A full-width tile starts a new row, so a single column tile before it had the row to itself.
      if (waiting) lone.add(waiting);
      waiting = null;
    } else if (waiting) waiting = null;
    else waiting = tile.id;
  }
  if (waiting) lone.add(waiting);
  return lone;
}

/**
 * How a tile of marks is laid out, by what the tile can hold (its own width, not the screen's), written out whole.
 * A narrow tile is a wrapping row: every mark at its own width, as many to a line as fit, because a cell of a fixed
 * grid there is narrower than a wordmark and would shrink it to fit. A wide tile has columns, and only once a cell is
 * as wide as an ordinary mark: three across, or four when the count divides by four, so the usual counts (four, six,
 * eight, nine, twelve) fill their rows evenly.
 */
function logoColumns(count: number): string {
  return count > 0 && count % 4 === 0 ? "@lg:grid @lg:grid-cols-4 @lg:gap-y-5" : "@sm:grid @sm:grid-cols-3 @sm:gap-y-5";
}

function placement(tile: ProofTile, lone: boolean): string {
  const column = (tile.span ?? 1) === 2 ? COLUMN.two : lone ? COLUMN.lone : COLUMN.one;
  return cn(column, ROW[tile.rowSpan ?? 1]);
}

function QuoteTile({ tile, lone }: { tile: ProofQuoteTile; lone: boolean }) {
  const tier = tile.span === 2 ? (tile.rowSpan === 2 ? "lead" : "wide") : lone ? "lone" : "narrow";
  return (
    <figure className={cn(TILE, "justify-between gap-6")}>
      <blockquote className={cn("font-medium", QUOTE_TEXT[tier])}>
        {/* The marks are generated, so they are the ones of the page's language (curly in English, low and high in German, guillemets in French) and the quote stays clean text. The opening mark hangs in the margin, so the first letter lines up with the lines below it. */}
        <p className="indent-[-0.4em] before:content-[open-quote] after:content-[close-quote]">{tile.quote}</p>
      </blockquote>
      {/* In a tile too narrow for the face beside the name (a one-column tile on a small phone), the face goes above it. */}
      <figcaption className="flex items-center gap-3 @max-[10rem]:flex-col @max-[10rem]:items-start @max-[10rem]:gap-2">
        <Avatar size={QUOTE_AVATAR[tier]} className={tier === "lone" ? LONE_FACE : undefined}>
          {tile.avatar ? <AvatarImage src={tile.avatar} alt="" /> : null}
          <AvatarFallback className={tier === "lone" ? LONE_INITIALS : undefined}>{initialsOf(tile.name)}</AvatarFallback>
        </Avatar>
        <span className="grid min-w-0 text-sm leading-snug">
          <span className="font-medium">{tile.name}</span>
          {tile.role ? <span className="text-pretty text-muted-foreground">{tile.role}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

function StatTile({ tile, characters, locale }: { tile: ProofStatTile; characters: number; locale: string }) {
  return (
    <dl className={cn(TILE, "justify-between gap-6")}>
      <dt className={LABEL}>{tile.label}</dt>
      <dd className="grid gap-2">
        {/* text-4xl is the size where a browser has no container query units; the inline size replaces it everywhere else. */}
        <span style={figureStyle(tile.span ?? 1, characters)} className="block text-4xl leading-none font-medium tracking-[-0.05em] whitespace-nowrap tabular-nums">
          {typeof tile.value === "number" ? (
            <CountUp value={tile.value} prefix={tile.prefix} suffix={tile.suffix} decimals={tile.decimals} locale={locale} />
          ) : (
            <>
              {tile.prefix}
              {tile.value}
              {tile.suffix}
            </>
          )}
        </span>
        {tile.detail ? <span className={LABEL}>{tile.detail}</span> : null}
      </dd>
    </dl>
  );
}

/** Stars for a score, each filled as far as the score reaches it: 4.8 leaves the last star one fifth empty. Decoration only: the sentence beside it is what is read. A long scale wraps in a narrow tile instead of running out of it. */
function Stars({ score, max }: { score: number; max: number }) {
  return (
    <span aria-hidden="true" className="inline-flex max-w-full flex-wrap gap-0.5">
      {Array.from({ length: max }, (_, index) => {
        const filled = Math.min(1, Math.max(0, score - index));
        return (
          <span key={index} className="relative inline-flex size-4 shrink-0">
            <IconStar className="size-4 fill-current text-foreground/15" />
            {filled > 0 ? (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${filled * 100}%` }}>
                <IconStar className="size-4 shrink-0 fill-current text-foreground" />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

function RatingTile({ tile, characters, locale, words }: { tile: ProofRatingTile; characters: number; locale: string; words: ProofBentoLabels }) {
  const max = tile.max ?? 5;
  const score = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(tile.score);
  const sentence = fillText(words.rated, { score, max: String(max), source: tile.source, count: tile.count });
  const external = tile.href ? EXTERNAL.test(tile.href) : false;
  return (
    <div className={cn(TILE, "justify-between gap-6", tile.href && "transition-colors duration-150 hover:border-foreground/30 motion-reduce:transition-none")}>
      <p aria-hidden="true" className={cn(LABEL, "flex items-start justify-between gap-2")}>
        {tile.source}
        {tile.href ? <IconArrowUpRight className="mt-0.5 size-4 shrink-0" /> : null}
      </p>
      <div aria-hidden="true" className="grid gap-2.5">
        <span style={figureStyle(tile.span ?? 1, characters)} className="block text-4xl leading-none font-medium tracking-[-0.05em] tabular-nums">
          {score}
        </span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
          <Stars score={tile.score} max={max} />
          {tile.count}
        </span>
      </div>
      {/* The link lies over the whole tile and takes no room of its own, so the layout is the same with and without it. */}
      {tile.href ? (
        <a href={tile.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cn(FOCUS, "absolute inset-0 rounded-2xl")}>
          <span className="sr-only">
            {sentence}
            {external ? ` (${words.newTab})` : null}
          </span>
        </a>
      ) : (
        <p className="sr-only">{sentence}</p>
      )}
    </div>
  );
}

function LogosTile({ tile }: { tile: ProofLogosTile }) {
  const title = useId();
  return (
    <div className={cn(TILE, "gap-6", tile.title ? "justify-between" : "justify-center")}>
      {tile.title ? (
        <p id={title} className={LABEL}>
          {tile.title}
        </p>
      ) : null}
      <ul role="list" aria-labelledby={tile.title ? title : undefined} className={cn("flex flex-wrap items-center gap-x-6 gap-y-4 text-foreground/60", logoColumns(tile.logos.length))}>
        {tile.logos.map((logo) => {
          const body = logo.mark ? (
            <span aria-hidden="true" className="flex min-w-0 [&_img]:h-6 [&_img]:w-auto [&_img]:object-contain [&_svg]:h-6 [&_svg]:w-auto">
              {logo.mark}
            </span>
          ) : (
            <span className="text-base font-semibold tracking-tight">{logo.name}</span>
          );
          return (
            <li key={logo.name} className="flex min-w-0 items-center">
              {logo.href ? (
                <a href={logo.href} aria-label={logo.name} className={cn(FOCUS, "flex items-center rounded-sm transition-colors duration-150 hover:text-foreground motion-reduce:transition-none")}>
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
  );
}

function ImageTile({ tile }: { tile: ProofImageTile }) {
  return (
    // A photo needs room to be a photo: on a phone and a tablet the tile is never shorter than this, where it has no second row to borrow height from.
    <figure className={cn(TILE, "isolate min-h-64 justify-end overflow-hidden bg-muted sm:min-h-72 lg:min-h-0")}>
      <img
        src={tile.src}
        alt={tile.alt}
        loading="lazy"
        decoding="async"
        style={tile.focalPoint ? { objectPosition: tile.focalPoint } : undefined}
        className="absolute inset-0 size-full object-cover"
      />
      {/* A solid chip, not a wash over the photo, so the words read on a pale picture and a dark one alike. It is positioned so it paints above the photo, and it gets smaller in a narrow tile so the picture keeps most of the room. */}
      <figcaption className="relative grid max-w-full gap-0.5 self-start rounded-lg border border-border bg-background px-3 py-2 text-sm leading-snug shadow-xs @max-[10rem]:px-2.5 @max-[10rem]:py-1.5 @max-[10rem]:text-xs">
        <span className="font-medium text-pretty">{tile.caption}</span>
        {/* In a very narrow tile the credit leaves the chip but stays in the page for a screen reader. */}
        {tile.credit ? <span className="text-xs text-pretty text-muted-foreground @max-[10rem]:sr-only">{tile.credit}</span> : null}
      </figcaption>
    </figure>
  );
}

/**
 * Every kind of proof on one page, composed instead of stacked: a big quote, a
 * figure that counts up, a rating, a row of customer marks and a photo, in
 * tiles of mixed size on a grid of four columns (two below a desktop). All five
 * kinds share one radius, one hairline and one padding, so the variety comes
 * from what is inside and the section reads as one object. A tile covers one or
 * two columns and, on a desktop, one or two rows. The grid fills the tiles in
 * the order you give them and never reorders them, so the DOM order is the
 * reading order, and every tile is complete on its own: the rating is read as
 * one sentence, the logos are a named list, the quote is a figure with its
 * caption, and the photo carries its alt text and a caption on a solid chip.
 * Figures are set as large as their tile allows, all at one size for a width,
 * so a long number such as "99.98%" fits and a row of stats stays level; a
 * number counts up once as it scrolls into view and stands still under reduced
 * motion, with its final value in the page from the first render. Customer
 * marks keep their own width: a narrow tile wraps them in a row and a wide one
 * sets them in columns, so a wordmark is never squeezed into a cell. On a phone
 * or a tablet a single tile that would be left alone in its row takes the whole
 * row, so the grid never has a hole there, and a quote that gets a row to itself
 * is set at the wider size. Use it where the page has room for
 * exactly one proof section; for a single kind of proof reach for the matching
 * section instead. No state of its own, so it renders on the server.
 */
export function ProofBento({ eyebrow, title, description, tiles, locale = "en-US", labels, className, ...props }: ProofBentoProps) {
  const heading = useId();
  const words = { ...LABELS, ...labels };
  const lone = loneOnPhone(tiles);
  const tag = resolveLocale(locale);
  const longest = longestFigures(tiles, tag);

  return (
    <section data-slot="proof-bento" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      {tiles.length ? (
        <ul role="list" className="mt-12 grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-3 sm:mt-14 sm:gap-4 lg:grid-cols-4">
          {tiles.map((tile) => {
            const span = tile.span ?? 1;
            return (
              <li key={tile.id} className={cn("min-w-0", placement(tile, lone.has(tile.id)))}>
                {tile.kind === "quote" ? <QuoteTile tile={tile} lone={lone.has(tile.id)} /> : null}
                {tile.kind === "stat" ? <StatTile tile={tile} characters={longest[span]} locale={tag} /> : null}
                {tile.kind === "rating" ? <RatingTile tile={tile} characters={longest[span]} locale={tag} words={words} /> : null}
                {tile.kind === "logos" ? <LogosTile tile={tile} /> : null}
                {tile.kind === "image" ? <ImageTile tile={tile} /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
