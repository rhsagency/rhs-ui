"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconClock, IconClose, IconPlay, IconUsers } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

export interface CourseEnrollImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What the picture shows. Leave it empty when the course's name next to it says enough. */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface CourseEnrollVideo {
  /** The preview file. It is not requested until the dialog opens. */
  src: string;
  /** The video's name, read out and shown in the dialog. Defaults to the course's title. */
  title?: string;
  /** The length as written on the poster: "2:04". */
  duration?: string;
  /** WebVTT captions for the video, switched on by default. */
  captionsSrc?: string;
  /** The captions' language tag. */
  captionsLang?: string;
  /** The captions' name in the player's menu. */
  captionsLabel?: string;
}

export interface CourseEnrollCourse {
  /** The subject, set small above the title: "Design systems". */
  category: string;
  /** The course's name. */
  title: string;
  /** The promise, in a line or two. */
  promise: string;
  /** The still on the enrol card, 16:9. */
  poster: CourseEnrollImage;
  /** A preview. With it the poster is a button that opens the video in a dialog; without it the poster is a picture. */
  video?: CourseEnrollVideo;
}

export interface CourseEnrollInstructor {
  /** The teacher's name. */
  name: string;
  /** What they do: "Principal designer at Halcyon". */
  role?: string;
  /** Their portrait. The initials show until it loads, or when it is left out. */
  avatar?: string;
}

export interface CourseEnrollPrice {
  /** The price in minor units, as Money is: 8900 is 89.00. */
  amount: number;
  /** ISO 4217 code: "EUR". */
  currency: string;
  /** The former price, in minor units. A figure above `amount` strikes it through and works out the saving. */
  was?: number;
}

export interface CourseEnrollInclude {
  /** An element from @rhs-ui/icons. It is decoration; the label says it. */
  icon: ReactNode;
  /** One thing the course comes with: "14 hours of video". */
  label: string;
}

export interface CourseEnrollLabels {
  /** The heading of the outcomes. */
  outcomes: string;
  /** The heading of the included list. */
  includes: string;
  /** The enrol button's text. */
  enroll: string;
  /** The preview button on the poster. */
  preview: string;
  /** Before the instructor's name. */
  taughtBy: string;
  /** The rating count, singular and plural. `{count}` is the number. */
  ratings: { one: string; other: string };
  /** The learner count, singular and plural. `{count}` is the number. */
  learners: { one: string; other: string };
  /** The saving. `{percent}` is the share. */
  off: string;
  /** Read before the price. */
  price: string;
  /** Read before the struck-through price. */
  was: string;
  /** Read before the duration on the poster. */
  duration: string;
  /** The rating's accessible name, with the real figure, singular and plural. `{value}` is the average and `{count}` the number of ratings. */
  rating: { one: string; other: string };
  /** The preview dialog's close button. */
  closeVideo: string;
  /** The preview dialog's description. */
  videoHelp: string;
  /** When the video cannot load. */
  videoError: string;
  /** The retry button after that. */
  retry: string;
}

const LABELS: CourseEnrollLabels = {
  outcomes: "What you will learn",
  includes: "This course includes",
  enroll: "Enrol now",
  preview: "Preview this course",
  taughtBy: "Taught by",
  ratings: { one: "{count} rating", other: "{count} ratings" },
  learners: { one: "{count} learner", other: "{count} learners" },
  off: "{percent} off",
  price: "Price",
  was: "Original price",
  duration: "duration",
  rating: { one: "Rated {value} out of 5 from {count} rating", other: "Rated {value} out of 5 from {count} ratings" },
  closeVideo: "Close the preview",
  videoHelp: "A video with player controls. Press Escape to close it.",
  videoError: "The video could not be loaded.",
  retry: "Try again",
};

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Minor units to text in the visitor's currency: whole amounts drop the zeros, so 8900 reads "€89". */
function formatPrice(minor: number, currency: string, locale: string): string {
  const digits = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const value = minor / 10 ** digits;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: Number.isInteger(value) ? 0 : undefined }).format(value);
}

export interface CourseEnrollHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The course: subject, title, promise, poster and an optional preview video. */
  course: CourseEnrollCourse;
  /** Who teaches it. */
  instructor: CourseEnrollInstructor;
  /** The average and how many ratings it rests on. Shown as stars and read as "4.8 out of 5". */
  rating: { value: number; count: number };
  /** How many people have taken it. */
  learners: number;
  /** What a learner will be able to do afterwards. Three read best. */
  outcomes: readonly string[];
  /** The price, and the former price if there is one. */
  price: CourseEnrollPrice;
  /** What the course comes with, each with an icon: video hours, lessons, a certificate, lifetime access. */
  includes: readonly CourseEnrollInclude[];
  /** The guarantee as plain text under the button, not a badge: "30-day money-back guarantee". */
  guarantee?: string;
  /** The rest of the page's main column, such as the curriculum or the requirements. It sits under the outcomes and the enrol card stays beside it while it scrolls; on a phone it comes after the card, so the button is never buried under a long list. */
  children?: ReactNode;
  /** Called when the visitor presses Enrol. Payment lives elsewhere: this hands your app the click. A function cannot be passed from a Server Component, so a server page uses `enrollHref` instead. */
  onEnroll?: () => void;
  /** Where Enrol leads, as a link, when your checkout is a page. It wins over `onEnroll`. */
  enrollHref?: string;
  /** Locale for the price, the counts and the saving. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CourseEnrollLabels>;
}

/**
 * An online-course opening: the promise on the left with the instructor, the
 * rating, the number of learners and three things you will learn, and on the
 * right an enrol card with a preview poster (it opens the video in a dialog
 * when you pass one), the price with its former price struck through, what is
 * included as an icon list, the enrol button and the guarantee in plain text.
 * The card sits beside the intro from a tablet up and is sticky there, below
 * your header (set `--sticky-top` to its height, for example
 * `className="[--sticky-top:4rem]"`), as long as the window is tall enough to
 * hold it; on a phone it follows the intro, ahead of anything passed as
 * children. Pass the page's own content as children and the card stays beside
 * it while it scrolls. Prices use tabular figures. Payment lives elsewhere:
 * the button hands your app the click, or links to your checkout.
 */
export function CourseEnrollHero({
  titleAs: Title = "h2",
  course,
  instructor,
  rating,
  learners,
  outcomes,
  price,
  includes,
  guarantee,
  children,
  onEnroll,
  enrollHref,
  locale = "en-US",
  labels,
  className,
  ...props
}: CourseEnrollHeroProps) {
  const words = { ...LABELS, ...labels, ratings: { ...LABELS.ratings, ...labels?.ratings }, learners: { ...LABELS.learners, ...labels?.learners }, rating: { ...LABELS.rating, ...labels?.rating } };
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const number = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  /** The label for this many: the singular form for exactly one, the plural for anything else. */
  const form = (forms: { one: string; other: string }, n: number) => (plural.select(n) === "one" ? forms.one : forms.other);
  const score = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rating.value);
  const saving = price.was && price.was > price.amount ? Math.round((1 - price.amount / price.was) * 100) : 0;
  const preview = course.video;
  const posterImage = (
    <>
      {course.poster.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${course.poster.blurDataUrl}")` }} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the poster is any URL or data URI */}
      <img
        src={course.poster.src}
        alt={course.poster.alt}
        width={course.poster.width}
        height={course.poster.height}
        srcSet={course.poster.srcSet}
        sizes={course.poster.sizes ?? "(min-width: 1024px) 24rem, (min-width: 768px) 19rem, 100vw"}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className={cn("absolute inset-0 size-full object-cover", preview && "transition-transform duration-700 ease-out group-hover/poster:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/poster:scale-100")}
      />
    </>
  );

  return (
    <section
      data-slot="course-enroll-hero"
      className={cn(
        "grid grid-cols-1 gap-10 py-16 sm:py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] md:gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-16",
        // With children the left column is two rows and the card spans both: the first row stays as tall as the intro, the second takes what is left.
        children && "md:grid-rows-[auto_1fr]",
        className,
      )}
      {...props}
    >
      {/* The three parts sit in this order on a phone: intro, then the card, then the page's own content. From md the placement below puts the card beside the first two. */}
      <div data-slot="course-enroll-hero-intro" className="min-w-0 md:col-start-1 md:row-start-1">
        <p className="text-sm font-medium text-muted-foreground">{course.category}</p>
        <Title className="mt-3 text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl md:text-4xl lg:text-5xl">{course.title}</Title>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{course.promise}</p>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          {/* Assistive technology gets one sentence with the real figure: the stars alone round to the half star, so "4.8" would be read as "5". */}
          <p className="flex items-center gap-2">
            <span className="sr-only">{fill(form(words.rating, rating.count), { value: score, count: number.format(rating.count) })}</span>
            <span aria-hidden="true" className="flex items-center gap-2">
              <Rating readOnly value={rating.value} size={16} label={score} />
              <span className="font-medium tabular-nums">{score}</span>
              <span className="text-muted-foreground tabular-nums">({fill(form(words.ratings, rating.count), { count: number.format(rating.count) })})</span>
            </span>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground tabular-nums">
            <IconUsers className="size-4 shrink-0" />
            {fill(form(words.learners, learners), { count: number.format(learners) })}
          </p>
        </div>

        <p className="mt-5 flex items-center gap-3 text-sm">
          <Avatar>
            {instructor.avatar ? <AvatarImage src={instructor.avatar} alt="" /> : null}
            <AvatarFallback>{initialsOf(instructor.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="text-muted-foreground">{words.taughtBy} </span>
            <span className="font-medium">{instructor.name}</span>
            {instructor.role ? <span className="block text-muted-foreground">{instructor.role}</span> : null}
          </span>
        </p>

        {outcomes.length ? (
          <div className="mt-10 border-t border-border pt-8">
            <h3 className="text-sm font-medium">{words.outcomes}</h3>
            <ul className="mt-4 grid max-w-xl gap-3">
              {outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed">
                  <IconCheck className="mt-1 size-4 shrink-0" />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Sticky once the window is tall enough to hold the card under the header; a shorter window lets it scroll away rather than hide its lower half. */}
      <div
        data-slot="course-enroll-hero-card"
        className={cn(
          "min-w-0 self-start overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm md:col-start-2 md:row-start-1 md:[@media(min-height:42rem)]:sticky md:[@media(min-height:42rem)]:top-[var(--sticky-top,6rem)]",
          // The card spans the intro and the content, so it stays beside both while it is stuck.
          children && "md:row-span-2",
        )}
      >
        {preview ? (
          <Dialog
            onOpenChange={(open) => {
              if (open) setFailed(false);
              else video.current?.pause();
            }}
          >
            <div className="group/poster relative overflow-hidden bg-muted">
              <AspectRatio ratio={16 / 9}>{posterImage}</AspectRatio>
              {/* The poster is any picture, so the focus ring has two tones: the page's ink on the outside, where it meets the card, and the page's paper inside it, where it meets the picture. One of them stands out from any image in either theme; a single colour would vanish on a picture of its own shade. */}
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="absolute inset-0 grid place-items-center outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground),inset_0_0_0_5px_var(--background)] max-sm:pb-8"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-12 place-items-center rounded-full bg-foreground text-background shadow-sm ring-4 ring-background transition-transform duration-300 group-hover/poster:scale-105 motion-reduce:transition-none motion-reduce:group-hover/poster:scale-100 sm:size-14"
                  >
                    <IconPlay className="ml-0.5 size-5 fill-current" />
                  </span>
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate rounded-full bg-background px-3 py-1.5 text-left text-xs font-medium text-foreground shadow-xs">{words.preview}</span>
                    {preview.duration ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-foreground tabular-nums shadow-xs">
                        <IconClock className="size-3.5 text-muted-foreground" />
                        <span className="sr-only">, {words.duration} </span>
                        {preview.duration}
                      </span>
                    ) : null}
                  </span>
                </button>
              </DialogTrigger>
            </div>
            <DialogContent
              showCloseButton={false}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                const node = video.current;
                if (!node) return;
                node.focus();
                void node.play().catch(() => {});
              }}
              className="w-[min(56rem,calc(100vw_-_2rem),calc((100dvh_-_9rem)*16/9))] max-w-none grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-none"
            >
              <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border py-2 pr-2 pl-4 sm:pl-5">
                <DialogTitle className="truncate text-sm">{preview.title ?? course.title}</DialogTitle>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={words.closeVideo}>
                    <IconClose />
                  </Button>
                </DialogClose>
              </div>
              <DialogDescription className="sr-only">{words.videoHelp}</DialogDescription>
              <div className="dark relative bg-black text-foreground">
                <AspectRatio ratio={16 / 9}>
                  <video
                    ref={video}
                    src={preview.src}
                    poster={course.poster.src}
                    controls
                    playsInline
                    preload="none"
                    aria-label={preview.title ?? course.title}
                    onError={() => setFailed(true)}
                    className="size-full object-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset"
                  >
                    {preview.captionsSrc ? <track kind="captions" src={preview.captionsSrc} srcLang={preview.captionsLang ?? "en"} label={preview.captionsLabel ?? "English"} default /> : null}
                    <a href={preview.src}>{preview.title ?? course.title}</a>
                  </video>
                </AspectRatio>
                {failed ? (
                  <div role="alert" className="absolute inset-0 grid content-center justify-items-center gap-3 bg-black px-6 text-center text-sm">
                    <p>{words.videoError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFailed(false);
                        video.current?.load();
                        void video.current?.play().catch(() => {});
                      }}
                      className="rounded-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60"
                    >
                      {words.retry}
                    </button>
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <AspectRatio ratio={16 / 9} className="overflow-hidden bg-muted">
            {posterImage}
          </AspectRatio>
        )}

        <div className="p-5 sm:p-6">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl font-medium tracking-[-0.04em] tabular-nums">
              <span className="sr-only">{words.price}: </span>
              {formatPrice(price.amount, price.currency, locale)}
            </span>
            {saving ? (
              <>
                <del className="text-base text-muted-foreground tabular-nums">
                  <span className="sr-only">{words.was}: </span>
                  {formatPrice(price.was ?? 0, price.currency, locale)}
                </del>
                <span className="text-sm font-medium tabular-nums">{fill(words.off, { percent: new Intl.NumberFormat(locale, { style: "percent" }).format(saving / 100) })}</span>
              </>
            ) : null}
          </p>

          {enrollHref ? (
            <Button asChild size="lg" className="mt-5 w-full">
              <a href={enrollHref}>{words.enroll}</a>
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={() => onEnroll?.()} className="mt-5 w-full">
              {words.enroll}
            </Button>
          )}
          {guarantee ? <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">{guarantee}</p> : null}

          {includes.length ? (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="text-sm font-medium">{words.includes}</h3>
              <ul className="mt-3 grid gap-2.5">
                {includes.map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span aria-hidden="true" className="grid shrink-0 place-items-center text-foreground [&_svg]:size-4">
                      {item.icon}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {children ? (
        <div data-slot="course-enroll-hero-content" className="min-w-0 border-t border-border pt-10 md:col-start-1 md:row-start-2">
          {children}
        </div>
      ) : null}
    </section>
  );
}
