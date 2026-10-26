import type { ComponentProps } from "react";

import { IconArrowRight, IconBookOpen, IconCheck, IconClock } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { buttonVariants } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { Progress } from "@rhs-ui/primitives/progress";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseCardCover {
  src: string;
  /** What the cover shows. Use "" when it only decorates: the title is right beside it. */
  alt: string;
}

export interface CourseCardInstructor {
  name: string;
  /** A portrait. Without one, or while it loads, the initials stand in. */
  image?: string;
}

export interface CourseCardLabels {
  beginner?: string;
  intermediate?: string;
  advanced?: string;
  /** One lesson. `{count}`. */
  lesson?: string;
  /** More than one lesson. `{count}`. */
  lessons?: string;
  /** What a screen reader hears for the stars. `{rating}`. */
  rated?: string;
  /** Added when there is a count. `{count}`. */
  ratedBy?: string;
  /** The price of a course that costs nothing. */
  free?: string;
  /** What a screen reader hears before the struck-through price. */
  was?: string;
  /** The discount in words. `{percent}`. */
  off?: string;
  /** Under the title of an enrolled course. `{percent}`. */
  complete?: string;
  /** In place of the percentage once the course is finished. */
  completed?: string;
  /** The action of a course that has been started. */
  continue?: string;
  /** The action of a course that is finished. */
  review?: string;
  /** Names the progress bar. */
  progress?: string;
  /** What a screen reader hears before the instructor's name. */
  instructor?: string;
}

const WORDS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  lesson: "{count} lesson",
  lessons: "{count} lessons",
  rated: "Rated {rating} out of 5",
  ratedBy: " by {count} learners",
  free: "Free",
  was: "Was",
  off: "{percent}% off",
  complete: "{percent}% complete",
  completed: "Completed",
  continue: "Continue",
  review: "Review",
  progress: "Course progress",
  instructor: "Taught by",
} satisfies Required<CourseCardLabels>;

export interface CourseCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The course's title. It is the link. */
  title: string;
  /** The picture on top. */
  cover: CourseCardCover;
  /** Who teaches it. */
  instructor?: CourseCardInstructor;
  /** How hard it is, as a word with a small bar glyph. */
  level?: CourseLevel;
  /** How long it takes in all, in minutes. Written as "6h 30m". */
  duration?: number;
  /** How many lessons it has. */
  lessons?: number;
  /** The average rating, 0 to 5. Shown as a number and stars. */
  rating?: number;
  /** How many ratings it rests on. */
  ratingCount?: number;
  /** The price in minor units: 4999 is 49.99. 0 says "Free". Not shown for an enrolled course. */
  price?: number;
  /** The price before the discount, in minor units. Struck through, with the discount in words. */
  compareAtPrice?: number;
  /** ISO 4217 code. */
  currency?: string;
  /** How far the learner has got, 0 to 100. Any number turns the card into an enrolled course: a progress bar and "Continue" in place of the price. */
  progress?: number;
  /** A word on the cover: "Bestseller", "New". */
  badge?: string;
  /** The course page, or for an enrolled course the lesson to continue with. The whole card is this one link. */
  href: string;
  /** Always pass your application locale, so the server and the browser write the same numbers. */
  locale?: string;
  /** The heading's element: "h3" by default, "h2" when the courses are the main content of the page. */
  headingAs?: "h2" | "h3" | "h4";
  /** The words, for another language. */
  labels?: CourseCardLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** A price in minor units. A whole amount drops its cents ("€79"), one with cents keeps them ("€49.99"). */
function money(minor: number, currency: string, locale: string): string {
  const digits = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const major = minor / 10 ** digits;
  const fraction = Number.isInteger(major) ? 0 : digits;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(major);
}

/** "6h 30m", "45m". */
function hoursText(minutes: number, locale: string): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const unit = (value: number, name: "hour" | "minute") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "narrow" }).format(value);
  return [hours ? unit(hours, "hour") : "", rest || !hours ? unit(rest, "minute") : ""].filter(Boolean).join(" ");
}

/** Three bars of growing height, filled up to the level: a glyph that is read as a word, never alone. */
function LevelBars({ level }: { level: CourseLevel }) {
  const filled = level === "beginner" ? 1 : level === "intermediate" ? 2 : 3;
  return (
    <span aria-hidden="true" className="inline-flex h-3.5 items-end gap-[2px]">
      <span className={cn("h-1.5 w-[3px] rounded-[1px]", filled >= 1 ? "bg-foreground" : "bg-border")} />
      <span className={cn("h-2.5 w-[3px] rounded-[1px]", filled >= 2 ? "bg-foreground" : "bg-border")} />
      <span className={cn("h-3.5 w-[3px] rounded-[1px]", filled >= 3 ? "bg-foreground" : "bg-border")} />
    </span>
  );
}

/**
 * A course in a catalogue: the cover with an optional word on it, then the level (a word with a small bar glyph),
 * how long it takes and how many lessons it has, the title, who teaches it, the rating as a number, stars and a
 * count, and the price. A compare-at price is struck through with the discount in words, and a course the learner
 * has started shows a progress bar and "Continue" in place of the price. The whole card is one link, through the
 * title, so there is a single tab stop and nothing is nested inside a link. It keeps no state and renders on the
 * server.
 */
export function CourseCard({
  title,
  cover,
  instructor,
  level,
  duration,
  lessons,
  rating,
  ratingCount,
  price,
  compareAtPrice,
  currency = "EUR",
  progress,
  badge,
  href,
  locale = "en-US",
  headingAs: Heading = "h3",
  labels,
  className,
  ...props
}: CourseCardProps) {
  const words: Required<CourseCardLabels> = { ...WORDS, ...labels };
  const enrolled = progress !== undefined;
  const percent = Math.max(0, Math.min(100, Math.round(progress ?? 0)));
  const done = enrolled && percent >= 100;
  const discount = price !== undefined && compareAtPrice !== undefined && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : 0;
  const ratingText = rating === undefined ? "" : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating);
  const countText = ratingCount === undefined ? "" : new Intl.NumberFormat(locale).format(ratingCount);

  return (
    <Card
      data-slot="course-card"
      data-enrolled={enrolled || undefined}
      className={cn(
        "group/course relative h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] duration-200 hover:border-ring/40 hover:shadow-sm focus-within:border-ring/60 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the card is plain markup */}
        <img
          src={cover.src}
          alt={cover.alt}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover/course:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/course:scale-100"
        />
        {badge ? (
          <Badge variant="outline" className="absolute top-3 left-3 border-border bg-background text-foreground shadow-xs">
            {badge}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pb-5">
        {level || duration || lessons ? (
          <ul role="list" className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
            {level ? (
              <li className="inline-flex items-center gap-1.5">
                <LevelBars level={level} />
                {words[level]}
              </li>
            ) : null}
            {duration ? (
              <li className="inline-flex items-center gap-1.5 tabular-nums">
                <IconClock className="size-3.5" />
                {hoursText(duration, locale)}
              </li>
            ) : null}
            {lessons ? (
              <li className="inline-flex items-center gap-1.5 tabular-nums">
                <IconBookOpen className="size-3.5" />
                {fill(lessons === 1 ? words.lesson : words.lessons, { count: new Intl.NumberFormat(locale).format(lessons) })}
              </li>
            ) : null}
          </ul>
        ) : null}

        <Heading className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
          <a href={href} className="rounded-xl outline-none after:absolute after:inset-0 after:z-10 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40">
            {title}
            {enrolled ? <span className="sr-only">{`, ${done ? words.completed : fill(words.complete, { percent: String(percent) })}. ${done ? words.review : words.continue}`}</span> : null}
          </a>
        </Heading>

        {instructor ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar size="sm">
              {instructor.image ? <AvatarImage src={instructor.image} alt="" /> : null}
              <AvatarFallback>{initialsOf(instructor.name)}</AvatarFallback>
            </Avatar>
            <span>
              <span className="sr-only">{words.instructor} </span>
              {instructor.name}
            </span>
          </p>
        ) : null}

        {rating !== undefined ? (
          <div role="img" aria-label={fill(words.rated, { rating: ratingText }) + (countText ? fill(words.ratedBy, { count: countText }) : "")} className="flex items-center gap-1.5 text-xs">
            <span aria-hidden="true" className="font-semibold tabular-nums">
              {ratingText}
            </span>
            <Rating readOnly value={rating} size={14} />
            {countText ? (
              <span aria-hidden="true" className="text-muted-foreground tabular-nums">
                ({countText})
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pt-2">
          {enrolled ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4">
              <div className="grid gap-2">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {done ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <IconCheck className="size-3.5" strokeWidth={2.25} />
                      {words.completed}
                    </span>
                  ) : (
                    fill(words.complete, { percent: String(percent) })
                  )}
                </p>
                <Progress value={percent} aria-label={words.progress} className="h-1.5" />
              </div>
              <span aria-hidden="true" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none transition-colors group-hover/course:bg-muted motion-reduce:transition-none")}>
                {done ? words.review : words.continue}
                <IconArrowRight />
              </span>
            </div>
          ) : price !== undefined ? (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
              <span className="text-lg leading-none font-semibold tracking-[-0.02em]">{price === 0 ? words.free : money(price, currency, locale)}</span>
              {discount > 0 && compareAtPrice !== undefined ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    <span className="sr-only">{words.was} </span>
                    <s>{money(compareAtPrice, currency, locale)}</s>
                  </span>
                  <span className="text-xs font-medium">{fill(words.off, { percent: String(discount) })}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
