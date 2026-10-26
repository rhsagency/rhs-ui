"use client";

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconAlertCircle, IconHeart } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface LikeButtonProps extends Omit<ComponentProps<"div">, "children" | "onToggle"> {
  /** Whether the signed-in person has liked it. Controlled: update it, and `count`, in `onToggle` before it resolves. */
  liked?: boolean;
  /** Where an uncontrolled button starts. Default false. */
  defaultLiked?: boolean;
  /** How many likes there are, yours included when `liked`. It moves with the button, one up or down. Leave it out to show no number. */
  count?: number;
  /**
   * Called with the next state when the button is pressed. The button flips at once; if this rejects it rolls
   * back, count and all, and says so. Presses are ignored while a request is on its way.
   */
  onToggle?: (next: boolean) => void | Promise<void>;
  /** What pressing does, for the accessible name: "Like this post" gives "Like this post, 42 likes". Default "Like". */
  label?: string;
  /** The glyph, drawn filled once liked. Default a heart. Any `@rhs-ui/icons` glyph works: a thumb, a star. */
  icon?: ReactNode;
  /** A smaller button without a border, for rows of comments. */
  compact?: boolean;
  /** Show the number. Default true. */
  showCount?: boolean;
  /** People who liked it besides you, most relevant first. The tooltip, which otherwise shows the exact count behind an abbreviated one, then reads "Liked by Maya and 41 others". */
  names?: readonly string[];
  /** What the count counts, singular and plural. Default like and likes. */
  noun?: readonly [singular: string, plural: string];
  /** Language of the numbers and of the list of names. Default "en-US". */
  locale?: string;
  /** Disables the button. */
  disabled?: boolean;
}

// A like is a whole person: without this the number shows decimals while it rolls.
const WHOLE = { maximumFractionDigits: 0 } as const;
const SHORT = { notation: "compact", maximumFractionDigits: 1 } as const;
const BURST = [0, 60, 120, 180, 240, 300] as const;

/** Under a thousand the number rolls; above it the abbreviation just arrives, since +1 does not change it. */
function Count({ value, locale }: { value: number; locale: string }) {
  if (value < 1000) return <AnimatedNumber value={value} locale={locale} format={WHOLE} duration={0.45} />;
  const text = new Intl.NumberFormat(locale, SHORT).format(value);
  return (
    <span key={text} className="inline-block tabular-nums transition-[opacity,translate] duration-200 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none">
      {text}
    </span>
  );
}

/**
 * A like button where the count is the point. It answers at once and settles
 * afterwards: pressing it fills the icon, plays one quiet ring on the way in
 * (never on unlike, never under reduced motion) and rolls the count to the
 * new number; if the request fails, icon and count roll back and a short line
 * says so beside the button, on the side that has room. The state is
 * `aria-pressed` on a button named with the exact count ("Like this post,
 * 1,204 likes") while the eye reads "1.2K", so it never rests on colour or an
 * abbreviation; a tooltip shows that exact count too. A polite message
 * confirms the result, and `names` turns the tooltip into "Liked by Maya and
 * 41 others".
 */
export function LikeButton({
  liked,
  defaultLiked = false,
  count,
  onToggle,
  label = "Like",
  icon,
  compact = false,
  showCount = true,
  names,
  noun = ["like", "likes"],
  locale = "en-US",
  disabled = false,
  className,
  ...props
}: LikeButtonProps) {
  const [own, setOwn] = useState(defaultLiked);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The words in the bubble stay while it fades out, after `error` has already cleared.
  const [bubble, setBubble] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [hinting, setHinting] = useState(false);
  const [burst, setBurst] = useState(0);
  const pending = useRef(false);

  const settled = liked ?? own;
  const shown = optimistic ?? settled;
  const busy = optimistic !== null;

  // The count moves with the button. It was written for the state the button starts in: the `liked` prop when controlled, `defaultLiked` when not.
  const reference = liked !== undefined ? settled : defaultLiked;
  const countFor = (state: boolean) => (count === undefined ? undefined : Math.max(0, count + (state ? 1 : 0) - (reference ? 1 : 0)));
  const shownCount = countFor(shown);

  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);
  const word = (value: number) => noun[plural.select(value) === "one" ? 0 : 1];
  const exact = (value: number) => `${numbers.format(value)} ${word(value)}`;
  const tail = (value: number | undefined) => (value === undefined || !showCount ? "" : `, ${exact(value)}`);
  const name = `${label}${tail(shownCount)}`;

  // Who liked it, when names are given; otherwise the exact count behind an abbreviated one ("1,204 likes" for the 1.2K the eye reads).
  const abbreviated = showCount && shownCount !== undefined && shownCount >= 1000;
  const tooltip = names?.length ? likedBy(names, shownCount, shown, locale) : abbreviated ? exact(shownCount) : null;

  // The bubble goes away by itself; the polite region has already said it.
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => {
      setError(null);
      setAnnouncement("");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [error]);

  async function press(): Promise<void> {
    if (pending.current || disabled) return;
    const next = !shown;
    pending.current = true;
    setError(null);
    setOptimistic(next);
    if (next) setBurst((turns) => turns + 1);
    try {
      await onToggle?.(next);
      if (liked === undefined) setOwn(next);
      setAnnouncement(`${next ? "Liked" : "Like removed"}${tail(countFor(next))}`);
    } catch {
      const message = next ? "Could not save your like. Try again." : "Could not remove your like. Try again.";
      setError(message);
      setBubble(message);
      setAnnouncement(message);
    } finally {
      pending.current = false;
      setOptimistic(null);
    }
  }

  const button = (
    <Button
      type="button"
      variant={compact ? "ghost" : "outline"}
      size={compact ? "sm" : "default"}
      aria-pressed={shown}
      aria-label={name}
      aria-busy={busy || undefined}
      disabled={disabled}
      data-liked={shown}
      onClick={() => void press()}
      className={cn(
        "group/like",
        compact
          ? // On a touch screen the small button grows to a 44px target without changing the drawing.
            "relative h-8 gap-1.5 px-2 text-[0.8125rem] text-muted-foreground hover:text-foreground data-[liked=true]:text-foreground [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:inset-x-0 [@media(pointer:coarse)]:after:top-1/2 [@media(pointer:coarse)]:after:h-11 [@media(pointer:coarse)]:after:-translate-y-1/2 [@media(pointer:coarse)]:after:content-['']"
          : "px-3.5",
      )}
    >
      <span className="relative grid size-4 shrink-0 place-items-center">
        {burst > 0 ? (
          // One ring and six specks, once per like. The key starts it over; under reduced motion it is not drawn at all.
          <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0 motion-reduce:hidden">
            <span className="absolute -inset-1 rounded-full border border-current motion-safe:animate-rhs-like-ring" />
            {BURST.map((angle) => (
              <span
                key={angle}
                className="absolute top-1/2 left-1/2 -mt-[1.5px] -ml-[1.5px] size-[3px] rounded-full bg-current motion-safe:animate-rhs-like-dot"
                style={{ "--angle": `${angle}deg` } as CSSProperties}
              />
            ))}
          </span>
        ) : null}
        <span aria-hidden="true" className="col-start-1 row-start-1 [&_svg]:block">
          {icon ?? <IconHeart />}
        </span>
        {/* The same glyph again, filled, so the fill can grow in with a little overshoot instead of switching. */}
        <span
          aria-hidden="true"
          className="col-start-1 row-start-1 scale-50 opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[liked=true]/like:scale-100 group-data-[liked=true]/like:opacity-100 motion-reduce:transition-none [&_svg]:block [&_svg]:fill-current"
        >
          {icon ?? <IconHeart />}
        </span>
      </span>
      {showCount && shownCount !== undefined ? (
        <span aria-hidden="true" className={cn("font-medium tabular-nums transition-colors duration-150 group-data-[liked=true]/like:text-foreground", !compact && "text-muted-foreground")}>
          <Count value={shownCount} locale={locale} />
        </span>
      ) : null}
    </Button>
  );

  return (
    <Popover
      open={error !== null}
      onOpenChange={(open) => {
        if (!open) setError(null);
      }}
    >
      <PopoverAnchor asChild>
        <div data-slot="like-button" className={cn("relative inline-flex max-w-full", className)} {...props}>
          {/* The tooltip is always part of the tree, so the button is the same element whether or not it has something to say: a count growing past 999 must not rebuild it under a keyboard user's focus. */}
          <TooltipProvider>
            <Tooltip open={tooltip ? hinting : false} onOpenChange={setHinting}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              {tooltip ? <TooltipContent>{tooltip}</TooltipContent> : null}
            </Tooltip>
          </TooltipProvider>
          {/* One polite region, for a screen reader: the result of a press, and when it did not save, why. */}
          <div role="status" className="sr-only">
            {announcement}
          </div>
        </div>
      </PopoverAnchor>
      {/* A failed like says so beside the button, on the side that has room, so it never straddles the edge of the card or lands on the next row. It is for the eyes: the polite region has said it. */}
      <PopoverContent
        side="right"
        align="center"
        sideOffset={8}
        collisionPadding={{ top: 8, right: 40, bottom: 8, left: 40 }}
        aria-hidden="true"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="pointer-events-none flex w-max max-w-[min(20rem,var(--radix-popover-content-available-width))] items-start gap-1.5 rounded-md border-destructive/30 px-2.5 py-1.5 text-xs leading-snug text-destructive shadow-sm motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
      >
        <IconAlertCircle className="mt-px size-3.5 shrink-0" />
        <span className="text-balance">{bubble}</span>
      </PopoverContent>
    </Popover>
  );
}

/** "Liked by you, Maya and 40 others": at most two names, then how many more there are. */
function likedBy(names: readonly string[], total: number | undefined, you: boolean, locale: string): string {
  const listed = (you ? ["you", ...names] : [...names]).slice(0, 2);
  const rest = total === undefined ? 0 : Math.max(0, total - listed.length);
  const parts = rest > 0 ? [...listed, `${new Intl.NumberFormat(locale).format(rest)} ${rest === 1 ? "other" : "others"}`] : listed;
  return `Liked by ${new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts)}`;
}
