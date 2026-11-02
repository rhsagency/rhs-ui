"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { countText, fill, minutesText, scoreText } from "@rhs-ui/application/recipe-card/format";
import { IconClock, IconHeart, IconUsers, IconUtensils } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Rating } from "@rhs-ui/primitives/rating";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** How hard a recipe is to cook. */
export type RecipeDifficulty = "easy" | "medium" | "hard";

/** The picture at the top. */
export interface RecipeImage {
  /** The picture's address. */
  src: string;
  /** What it shows: "Lemon ricotta pasta in a white bowl". Leave it out for a picture that only decorates. */
  alt?: string;
}

/** How long a recipe takes, in minutes. */
export interface RecipeTime {
  /** Time spent preparing. */
  prep?: number;
  /** Time on the heat or in the oven. */
  cook?: number;
  /** The whole time, when it is not prep plus cook (resting, chilling). Defaults to prep plus cook. */
  total?: number;
}

/** The words the card uses, for translation. `{title}`, `{time}`, `{count}` and `{rating}` are filled in. */
export interface RecipeCardLabels {
  /** The save button's name; it keeps this name whether it is on or off, and `aria-pressed` says which. Default "Save {title} as a favourite". */
  save?: string;
  /** Said when there is no photo. Default "No photo yet". */
  noPhoto?: string;
  /** Said to screen readers before the total time. Default "Total time". */
  totalTime?: string;
  /** The first line of the time tooltip. Default "Prep {time}". */
  prep?: string;
  /** The second line of the time tooltip. Default "Cook {time}". */
  cook?: string;
  /** Said to screen readers before the difficulty. Default "Difficulty". */
  difficulty?: string;
  /** The word for each difficulty. */
  levels?: Partial<Record<RecipeDifficulty, string>>;
  /** Said to screen readers before the servings. Default "Servings". */
  servingsTerm?: string;
  /** What the servings say. Default "Serves {count}". */
  serves?: string;
  /** The name of the list of dietary marks. Default "Dietary". */
  dietary?: string;
  /** What a screen reader hears for the stars. Default "Rated {rating} from {count} reviews". */
  rated?: string;
  /** The same when there is no count. Default "Rated {rating} out of 5". */
  ratedScore?: string;
  /** The same for exactly one review. Default "Rated {rating} from 1 review". */
  ratedOne?: string;
  /** What the rating says when nobody has reviewed yet. Default "No reviews yet". */
  noReviews?: string;
}

export interface RecipeCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** The recipe's name: "Lemon ricotta pasta". It is the one link of the card. */
  title: string;
  /** Its photo. The box keeps its shape from the first paint; without a photo a quiet tile says so. */
  image?: string | RecipeImage;
  /** How long it takes: minutes in all, or prep and cook apart. It is written ("45 min"); with both prep and cook the breakdown is in a tooltip that opens on hover, on focus and on a tap. */
  time?: number | RecipeTime;
  /** How hard it is, written as a word beside three small bars. */
  difficulty?: RecipeDifficulty;
  /** How many people it feeds: "Serves 4". */
  servings?: number;
  /** Dietary marks as words: "Vegetarian", "Gluten-free". Every one is shown and written out, so nobody has to open the recipe to learn that it holds nuts or dairy. */
  dietary?: readonly string[];
  /** The average rating, 0 to 5, drawn as stars with the score and the count; a screen reader hears it as a sentence. */
  rating?: number;
  /** How many reviews the score rests on. Zero says "No reviews yet" in place of the stars. */
  ratingCount?: number;
  /** The recipe's page. The title becomes a link and the whole card opens it, the photo included. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the title becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Whether the recipe is a favourite, controlled. The heart is a toggle with `aria-pressed`. */
  saved?: boolean;
  /** Whether it starts as a favourite, when you do not control `saved`. */
  defaultSaved?: boolean;
  /** The heart was pressed, with the state it asks for. */
  onSave?: (saved: boolean) => void;
  /** Whether the heart is there at all. Without `saved` or `onSave` it still toggles on its own, so a prototype works at once. Default true. */
  saveable?: boolean;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers and units. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: RecipeCardLabels;
}

const DEFAULT_LABELS = {
  save: "Save {title} as a favourite",
  noPhoto: "No photo yet",
  totalTime: "Total time",
  prep: "Prep {time}",
  cook: "Cook {time}",
  difficulty: "Difficulty",
  servingsTerm: "Servings",
  serves: "Serves {count}",
  dietary: "Dietary",
  rated: "Rated {rating} from {count} reviews",
  ratedScore: "Rated {rating} out of 5",
  ratedOne: "Rated {rating} from 1 review",
  noReviews: "No reviews yet",
};

const DEFAULT_LEVELS: Record<RecipeDifficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

const LEVEL_STEPS: Record<RecipeDifficulty, number> = { easy: 1, medium: 2, hard: 3 };

/** What stretches the title's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/** Three bars, as many filled as the recipe is hard. Decorative: the word beside it says the same. */
function Bars({ steps }: { steps: number }) {
  return (
    <span aria-hidden="true" className="flex h-3.5 shrink-0 items-end gap-0.5">
      {[1, 2, 3].map((step) => (
        <span key={step} className={cn("w-[3px] rounded-[1px]", step <= steps ? "bg-foreground" : "bg-border")} style={{ height: 5 + step * 3 }} />
      ))}
    </span>
  );
}

/** The photo, or the quiet tile that stands in for it: a plain picture so the first paint shows it, and the tile again when it is missing or does not load. */
function Photo({ picture, noPhoto }: { picture: RecipeImage | undefined; noPhoto: string }) {
  // The address that failed, so a new address gets its own try.
  const [failed, setFailed] = useState<string | null>(null);
  const element = useRef<HTMLImageElement>(null);
  const src = picture?.src;
  // A picture that failed before the page was live raised its error with nobody listening, so a picture that is done and has no width is a failure.
  // A vector picture can be done and have no natural width in some browsers, so it is left to its error event.
  useEffect(() => {
    const image = element.current;
    const vector = /^data:image\/svg|\.svg(?:[?#]|$)/i.test(src ?? "");
    if (image && !vector && image.complete && image.naturalWidth === 0) setFailed(src ?? null);
  }, [src]);
  if (!picture || failed === picture.src) {
    return (
      <div className="grid size-full place-items-center text-muted-foreground">
        <span className="grid justify-items-center gap-1.5 text-xs">
          <IconUtensils className="size-6" />
          {noPhoto}
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: a plain picture, which any optimiser can replace
    <img
      ref={element}
      src={picture.src}
      alt={picture.alt ?? ""}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(picture.src)}
      className="size-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none motion-safe:group-hover/recipe-card:scale-[1.03]"
    />
  );
}

/**
 * The total time with prep and cook in a tooltip. A tooltip opens on hover and on focus, and a touch screen has neither (a tap does not hover and,
 * on some phones, does not focus), so a press of the button toggles it as well; that is also how a screen reader's activation reaches it. A tap
 * outside closes it, as Escape and leaving do.
 */
function TimeTip({ time, lines }: { time: string; lines: readonly string[] }) {
  const [open, setOpen] = useState(false);
  // Whether it was open when the press began: the press itself closes an open tooltip, and the click that ends it has to toggle from the state before.
  const wasOpen = useRef(false);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onPointerDown={() => {
              wasOpen.current = open;
            }}
            onClick={(event) => {
              // The tooltip's own click would close it again; the toggle is ours. A click without a press (the keyboard, a screen reader) toggles from what it is now.
              event.preventDefault();
              setOpen(!(event.detail === 0 ? open : wasOpen.current));
            }}
            className="relative z-10 -mx-1 inline-flex cursor-default items-center gap-1.5 rounded-sm px-1 outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            <IconClock className="size-4 shrink-0" />
            <span className="tabular-nums underline decoration-muted-foreground/50 decoration-dotted underline-offset-4">{time}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start">
          <span className="grid gap-0.5 tabular-nums">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A recipe as a card in a collection or a search: the photo, the title as
 * the one link of the card, then what a cook wants to know before opening it.
 * The time is written ("45 min") with prep and cook in a tooltip that opens on
 * hover, on focus and on a tap; difficulty is a word beside three bars; servings
 * and the rating are plain facts. Dietary marks are words in chips and never
 * icons alone, so people with allergies and screen readers get them, and every
 * one is shown. The rating is drawn to the score and read as one sentence
 * ("Rated 4.6 from 212 reviews"). The heart beside the title is a toggle with
 * `aria-pressed` whose name carries the recipe, it keeps its own state when you
 * give it none, and it is its own target above the card's link.
 */
export function RecipeCard({
  title,
  image,
  time,
  difficulty,
  servings,
  dietary,
  rating,
  ratingCount,
  href,
  onOpen,
  saved: controlled,
  defaultSaved = false,
  onSave,
  saveable = true,
  headingLevel = 3,
  locale = "en-US",
  labels,
  className,
  ...props
}: RecipeCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const levels = { ...DEFAULT_LEVELS, ...labels?.levels };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [own, setOwn] = useState(defaultSaved);
  const saved = controlled ?? own;
  const canSave = saveable;
  const picture = typeof image === "string" ? { src: image } : image;

  const parts = typeof time === "number" ? { total: time } : time;
  const total = parts ? (parts.total ?? ((parts.prep ?? 0) + (parts.cook ?? 0))) : 0;
  // The breakdown is worth a tooltip only when it says something the total does not: prep and cook both known.
  const breakdown =
    parts && parts.prep !== undefined && parts.cook !== undefined
      ? [fill(text.prep, { time: minutesText(parts.prep, locale) }), fill(text.cook, { time: minutesText(parts.cook, locale) })]
      : null;

  const reviewed = rating !== undefined && (ratingCount === undefined || ratingCount > 0);
  const stars =
    rating === undefined
      ? ""
      : ratingCount === undefined
        ? fill(text.ratedScore, { rating: scoreText(rating, locale) })
        : ratingCount === 1
          ? fill(text.ratedOne, { rating: scoreText(rating, locale) })
          : fill(text.rated, { rating: scoreText(rating, locale), count: countText(ratingCount, locale) });

  const label = <span className="[overflow-wrap:anywhere]">{title}</span>;
  const timeText = total > 0 ? minutesText(total, locale) : null;

  return (
    <article
      data-slot="recipe-card"
      aria-labelledby={titleId}
      className={cn(
        "group/recipe-card relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=recipe-card-open]:focus-visible]:border-ring has-[[data-slot=recipe-card-open]:focus-visible]:ring-[3px] has-[[data-slot=recipe-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="relative overflow-hidden border-b border-border">
        <AspectRatio ratio={4 / 3} className="bg-muted">
          <Photo picture={picture} noPhoto={text.noPhoto} />
        </AspectRatio>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Heading id={titleId} className="min-w-0 text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
            {href ? (
              <a data-slot="recipe-card-open" href={href} onClick={onOpen} className={OPEN}>
                {label}
              </a>
            ) : onOpen ? (
              <button data-slot="recipe-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {label}
              </button>
            ) : (
              label
            )}
          </Heading>
          {canSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-pressed={saved}
              aria-label={fill(text.save, { title })}
              onClick={() => {
                if (controlled === undefined) setOwn(!saved);
                onSave?.(!saved);
              }}
              className={cn("relative z-10 -mt-1 -mr-1.5 shrink-0 rounded-full text-muted-foreground hover:text-foreground", saved && "text-foreground")}
            >
              <IconHeart className={cn("size-[1.125rem] transition-transform duration-200 motion-reduce:transition-none", saved && "scale-110 fill-current")} />
            </Button>
          ) : null}
        </div>

        {timeText || difficulty || servings !== undefined ? (
          <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
            {timeText ? (
              <div className="flex items-center">
                <dt className="sr-only">{text.totalTime}</dt>
                <dd>
                  {breakdown ? (
                    <TimeTip time={timeText} lines={breakdown} />
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <IconClock className="size-4 shrink-0" />
                      <span className="tabular-nums">{timeText}</span>
                    </span>
                  )}
                </dd>
              </div>
            ) : null}
            {difficulty ? (
              <div className="flex items-center">
                <dt className="sr-only">{text.difficulty}</dt>
                <dd className="inline-flex items-center gap-1.5">
                  <Bars steps={LEVEL_STEPS[difficulty]} />
                  {levels[difficulty]}
                </dd>
              </div>
            ) : null}
            {servings !== undefined ? (
              <div className="flex items-center">
                <dt className="sr-only">{text.servingsTerm}</dt>
                <dd className="inline-flex items-center gap-1.5">
                  <IconUsers className="size-4 shrink-0" />
                  <span className="tabular-nums">{fill(text.serves, { count: countText(servings, locale) })}</span>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {rating !== undefined ? (
          reviewed ? (
            <p className="flex items-center gap-1.5 text-[0.8125rem] leading-5">
              <span aria-hidden="true" className="inline-flex items-center gap-1.5">
                <Rating readOnly value={rating} size={14} />
                <span className="font-medium tabular-nums">{scoreText(rating, locale)}</span>
                {ratingCount !== undefined ? <span className="text-muted-foreground tabular-nums">({countText(ratingCount, locale)})</span> : null}
              </span>
              <span className="sr-only">{stars}</span>
            </p>
          ) : (
            <p className="text-[0.8125rem] leading-5 text-muted-foreground">{text.noReviews}</p>
          )
        ) : null}

        {dietary?.length ? (
          <ul aria-label={text.dietary} className="mt-auto flex flex-wrap gap-1.5 pt-0.5">
            {dietary.map((mark) => (
              <li key={mark} className="max-w-full min-w-0">
                <Badge variant="outline" className="h-auto min-h-5 max-w-full py-0.5 text-left leading-snug whitespace-normal [overflow-wrap:anywhere]">
                  {mark}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
