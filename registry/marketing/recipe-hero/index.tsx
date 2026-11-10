"use client";

import { Fragment, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowDown, IconBookmark, IconClock, IconFlame, IconGauge, IconHourglass, IconPrinter, IconUtensils } from "@rhs-ui/icons";
import { countText, dayText, fill, LABELS, minutesIso, minutesText, plural, scoreText, type RecipeHeroLabels } from "@rhs-ui/marketing/recipe-hero/format";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

export type { RecipeHeroLabels } from "@rhs-ui/marketing/recipe-hero/format";

export interface RecipeImage {
  /** The address of the photo. A data: URI works too. */
  src: string;
  /** What the dish looks like: "A white bowl of roasted tomato soup with basil and a swirl of cream". The photo sells the recipe, so it needs a real alt. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the photo is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
}

export interface RecipeAuthor {
  name: string;
  /** The author's page. The name is a link when this is set. */
  href?: string;
}

export interface RecipeRating {
  /** The average, from 0 to 5. The stars round it to the half; the number beside them keeps the decimal. */
  value: number;
  /** How many ratings it is the average of. */
  count: number;
  /** Where the reviews are on the page: "#reviews". The count is a link when this is set. */
  href?: string;
}

export interface RecipeFacts {
  /** Preparation time in minutes. */
  prep?: number;
  /** Cooking time in minutes. */
  cook?: number;
  /** Total time in minutes. Left out, it is the prep and the cook added up. */
  total?: number;
  /** What it makes: 4, or a phrase such as "4 to 6" or "12 muffins". */
  servings?: number | string;
  /** How hard it is, in a word: "Easy", "Intermediate". */
  difficulty?: string;
}

export interface RecipeHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The name of the dish. It is the heading. */
  title: string;
  /** The photo of the finished dish. */
  image: RecipeImage;
  /** A sentence or two on the dish. Keep the story for under the recipe. */
  description?: string;
  /** Who wrote it: a name, or a name with a page. */
  author?: string | RecipeAuthor;
  /** The day it was published: an ISO day ("2026-10-12"), a timestamp or a Date. */
  publishedAt?: string | Date;
  /** The stars and how many ratings stand behind them. */
  rating?: RecipeRating;
  /** Prep, cook, total, servings and difficulty. Each one you leave out is left out of the row. */
  facts: RecipeFacts;
  /** What the dish is free of or suits, as chips: "Vegetarian", "Gluten-free". */
  diet?: readonly string[];
  /** Where Jump to recipe goes: the id of the recipe further down, "#recipe". */
  jumpHref: string;
  /** Whether the recipe is saved, as your app knows it. Leave it out and the button remembers by itself. */
  saved?: boolean;
  /** Whether it starts saved, when the button remembers by itself. */
  defaultSaved?: boolean;
  /** Called with the new state when Save is pressed. */
  onSave?: (saved: boolean) => void;
  /** Called when Print is pressed. Left out, the browser's print dialog opens. */
  onPrint?: () => void;
  /** The language of the numbers and the date. Default "en-US". */
  locale?: string;
  /** The time zone a full timestamp is read in. A plain ISO day is that calendar day everywhere. Default "UTC". */
  timeZone?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RecipeHeroLabels>;
}

/** A template with one `{author}` in it, with the name as a node: the byline can carry a link in the middle of it in any language. */
function withAuthor(template: string, author: ReactNode): ReactNode[] {
  return template.split(/(\{author\})/).map((part, index) => (part === "{author}" ? <Fragment key={index}>{author}</Fragment> : part));
}

const link = "rounded-sm underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The top of a recipe, for the visitor who wants the recipe first and the
 * story second. The photo is on one side; beside it the title, a short
 * description, the stars with their count, the author and the date, and the
 * facts that decide whether to cook it tonight: prep, cook, total, servings
 * and difficulty, each with an icon, as one region named Recipe facts. Times
 * are time elements with ISO durations, written "25 min" and spoken "25
 * minutes". Diet chips follow, and three actions: Jump to recipe, an anchor
 * that skips the story; Save, which reports pressed or not; and Print, which
 * opens the print dialog unless you say otherwise.
 */
export function RecipeHero({
  titleAs: Title = "h2",
  title,
  image,
  description,
  author,
  publishedAt,
  rating,
  facts,
  diet = [],
  jumpHref,
  saved,
  defaultSaved = false,
  onSave,
  onPrint,
  locale = "en-US",
  timeZone = "UTC",
  labels: custom,
  className,
  ...props
}: RecipeHeroProps) {
  const words = { ...LABELS, ...custom, ratings: { ...LABELS.ratings, ...custom?.ratings } };
  const id = useId();
  const [own, setOwn] = useState(defaultSaved);
  const isSaved = saved ?? own;
  const person: RecipeAuthor | undefined = typeof author === "string" ? { name: author } : author;
  const published = publishedAt === undefined ? null : dayText(publishedAt, locale, timeZone);
  const given = [facts.prep, facts.cook].filter((value): value is number => value !== undefined);
  const total = facts.total ?? (given.length ? given.reduce((sum, value) => sum + value, 0) : undefined);

  const time = (minutes: number): ReactNode => (
    <time dateTime={minutesIso(minutes)}>
      <span aria-hidden="true">{minutesText(minutes, locale, "short")}</span>
      <span className="sr-only">{minutesText(minutes, locale, "long")}</span>
    </time>
  );
  const rows: { key: string; label: string; icon: ReactNode; value: ReactNode }[] = [];
  if (facts.prep !== undefined) rows.push({ key: "prep", label: words.prep, icon: <IconClock />, value: time(facts.prep) });
  if (facts.cook !== undefined) rows.push({ key: "cook", label: words.cook, icon: <IconFlame />, value: time(facts.cook) });
  if (total !== undefined) rows.push({ key: "total", label: words.total, icon: <IconHourglass />, value: time(total) });
  if (facts.servings !== undefined && facts.servings !== "") rows.push({ key: "servings", label: words.servings, icon: <IconUtensils />, value: facts.servings });
  if (facts.difficulty) rows.push({ key: "difficulty", label: words.difficulty, icon: <IconGauge />, value: facts.difficulty });

  const toggle = () => {
    const next = !isSaved;
    if (saved === undefined) setOwn(next);
    onSave?.(next);
  };
  const ratingText = rating ? fill(plural(words.ratings, rating.count, locale), { count: countText(rating.count, locale) }) : "";
  const name = person ? (person.href ? <a href={person.href} className={cn(link, "font-medium text-foreground")}>{person.name}</a> : <span className="font-medium text-foreground">{person.name}</span>) : null;

  return (
    <section
      data-slot="recipe-hero"
      aria-labelledby={`${id}-title`}
      className={cn("grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-14", className)}
      {...props}
    >
      <div className="min-w-0">
        <Title id={`${id}-title`} className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl [overflow-wrap:anywhere]">
          {title}
        </Title>
        {description ? <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}

        {rating || name || published ? (
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {rating ? (
              <p className="flex items-center gap-2 tabular-nums">
                <span aria-hidden="true" className="inline-flex">
                  <Rating readOnly value={rating.value} size={16} />
                </span>
                <span aria-hidden="true" className="font-medium">
                  {scoreText(rating.value, locale)}
                </span>
                <span className="sr-only">{fill(words.rated, { value: scoreText(rating.value, locale), max: 5 })}.</span>
                {rating.href ? (
                  <a href={rating.href} className={cn(link, "text-muted-foreground")}>
                    {ratingText}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{ratingText}</span>
                )}
              </p>
            ) : null}
            {name || published ? (
              <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                {/* The dot trails the name, so when the line wraps it ends a line and never starts one. */}
                {name ? (
                  <span>
                    {withAuthor(words.by, name)}
                    {published ? (
                      <span aria-hidden="true" className="ml-2">
                        &middot;
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {published ? <time dateTime={published.iso}>{published.text}</time> : null}
              </p>
            ) : null}
          </div>
        ) : null}

        {rows.length ? (
          <section aria-label={`${words.facts}: ${title}`} data-slot="recipe-hero-facts" className="mt-7 border-y border-border py-5">
            <dl className="grid grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))] gap-x-4 gap-y-5">
              {rows.map((row) => (
                <div key={row.key} className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
                    {row.icon}
                    {row.label}
                  </dt>
                  <dd className="mt-1.5 text-[0.9375rem] leading-tight font-medium tracking-[-0.01em] tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {diet.length ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {diet.map((item) => (
              <li key={item} className="max-w-full min-w-0">
                <Badge variant="outline" className="h-7 max-w-full px-3 text-[0.8125rem] font-normal">
                  <span className="truncate">{item}</span>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap">
          <Button asChild size="lg" className="col-span-2 sm:col-span-1">
            <a href={jumpHref}>
              {words.jump}
              <IconArrowDown className="transition-transform duration-150 group-hover/button:translate-y-0.5 motion-reduce:transition-none" />
            </a>
          </Button>
          <Button type="button" variant="outline" size="lg" aria-pressed={isSaved} onClick={toggle} className="aria-pressed:border-foreground/50 aria-pressed:bg-muted">
            <IconBookmark fill={isSaved ? "currentColor" : "none"} />
            {words.save}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => (onPrint ? onPrint() : window.print())}>
            <IconPrinter />
            {words.print}
          </Button>
        </div>
      </div>

      <figure data-slot="recipe-hero-photo" className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted shadow-xs max-lg:order-first sm:aspect-[5/4] lg:aspect-[4/5]">
        {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the photo is any URL or data URI */}
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          srcSet={image.srcSet}
          sizes={image.sizes ?? "(min-width: 1024px) 34rem, 100vw"}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      </figure>
    </section>
  );
}
