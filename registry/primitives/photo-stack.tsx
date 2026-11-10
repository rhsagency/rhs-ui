import type { ComponentProps, CSSProperties, MouseEventHandler } from "react";

import { cn } from "@/lib/utils";

export interface StackPhoto {
  /** The address of the picture. */
  src: string;
  /** What the picture shows. Only the cover's is exposed to assistive technology, because the pile is one thing; a link or button with a caption is named by the caption alone, so none is. */
  alt: string;
}

export type PhotoStackSize = "sm" | "md" | "lg";

export interface PhotoStackLabels {
  /** The word for one photo. Default "photo". */
  photo?: string;
  /** The word for several photos. Default "photos". */
  photos?: string;
}

export interface PhotoStackProps extends Omit<ComponentProps<"a">, "title" | "children" | "onClick" | "href" | "ref"> {
  /** Up to five pictures, the cover first. The rest are ignored: a pile of more than five only looks heavier. */
  photos: readonly StackPhoto[];
  /** The name of the album or set: "Summer 2025". It is shown under the pile and, with the count, names the whole stack. */
  title: string;
  /** How many photos the album holds in all, which can be more than the pile shows. The chip counts the ones that are not in the pile. Default the length of `photos`. */
  count?: number;
  /** The width of the pile: 76, 108 or 148px. Default `md`. */
  size?: PhotoStackSize;
  /** The shape of one photo as width divided by height. Default 1. */
  ratio?: number;
  /** Makes the stack a link. With `onClick` and no `href` it is a button; with neither it is a plain, labelled picture. */
  href?: string;
  /** Runs when the stack is pressed. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Open the pile a little on hover and on keyboard focus. Touch screens keep it closed, and so does reduced motion. Default true. */
  fanOnHover?: boolean;
  /** Show the title and the count under the pile. Without them the pile stands alone and its name is read, not shown. Default true. */
  showCaption?: boolean;
  /** The words for "photo" and "photos", for another language. */
  labels?: PhotoStackLabels;
}

const WIDTH: Record<PhotoStackSize, number> = { sm: 76, md: 108, lg: 148 };

/**
 * Where each photo of the pile lies, from the cover down: a turn in degrees and a shift as a share of the photo, closed
 * (`rest`) and opened (`fan`). They are fixed numbers, not random ones, so the server draws the pile the browser draws.
 */
const LAYERS = [
  { rest: ["0deg", "0%", "0%"], fan: ["0deg", "0%", "-3%"] },
  { rest: ["-5deg", "-4%", "1%"], fan: ["-9deg", "-14%", "2%"] },
  { rest: ["4.5deg", "5%", "1.5%"], fan: ["8.5deg", "15%", "2.5%"] },
  { rest: ["-10deg", "-7%", "3%"], fan: ["-17deg", "-27%", "6%"] },
  { rest: ["9.5deg", "8%", "3.5%"], fan: ["16deg", "28%", "7%"] },
] as const;

const PLACE = "[transform:translate(var(--x),var(--y))_rotate(var(--r))]";
const OPEN = "motion-safe:group-hover/stack:[transform:translate(var(--fx),var(--fy))_rotate(var(--fr))] motion-safe:group-focus-visible/stack:[transform:translate(var(--fx),var(--fy))_rotate(var(--fr))]";

/**
 * A small pile of photos for an album or a set of attachments: the cover on
 * top, the rest peeking out from under it at fixed small angles, and a chip
 * that counts the photos the pile does not show. Hover or keyboard focus opens
 * the pile a little; a touch screen leaves it closed, and so does reduced
 * motion. The whole stack is one link, one button or, with neither, one
 * labelled picture, named "Summer 2025, 24 photos" so a screen reader hears one
 * thing and not five pictures. The title and the count sit under the pile
 * unless you turn them off; a link or button with that caption is named by the
 * caption itself, so what a voice-control user says matches what is on screen.
 * It is plain markup with no script, so it renders on the server as it does in
 * the browser.
 */
export function PhotoStack({ photos, title, count, size = "md", ratio = 1, href, onClick, fanOnHover = true, showCaption = true, labels, className, style, ...props }: PhotoStackProps) {
  const shown = photos.slice(0, LAYERS.length);
  const total = Math.max(count ?? photos.length, shown.length);
  const rest = total - shown.length;
  const word = total === 1 ? (labels?.photo ?? "photo") : (labels?.photos ?? "photos");
  const name = `${title}, ${total} ${word}`;
  const width = WIDTH[size];
  const interactive = href !== undefined || Boolean(onClick);
  // A link or button with a visible caption is named by that caption: an aria-label that differs from the words on screen (WCAG 2.5.3) is not.
  const named = interactive && showCaption;

  const pile = (
    <span className="relative block max-w-full" style={{ width, aspectRatio: ratio }}>
      {shown
        .map((photo, index) => ({ photo, index }))
        .reverse()
        .map(({ photo, index }) => {
          const layer = LAYERS[index] as (typeof LAYERS)[number];
          const vars = { "--r": layer.rest[0], "--x": layer.rest[1], "--y": layer.rest[2], "--fr": layer.fan[0], "--fx": layer.fan[1], "--fy": layer.fan[2] } as CSSProperties;
          return (
            <span
              key={index}
              style={vars}
              className={cn(
                "absolute inset-[6%] block overflow-hidden rounded-[10%/8%] border-2 border-background bg-muted shadow-sm ring-1 ring-foreground/10 transition-transform duration-300 ease-out motion-reduce:transition-none",
                PLACE,
                fanOnHover && OPEN,
              )}
            >
              <img src={photo.src} alt={index === 0 && !named ? photo.alt : ""} loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
            </span>
          );
        })}
      {rest > 0 ? (
        <span aria-hidden="true" className="absolute right-[2%] bottom-[2%] z-10 rounded-full bg-foreground px-2 py-0.5 text-xs leading-4 font-semibold text-background tabular-nums shadow-sm ring-2 ring-background">
          +{rest}
        </span>
      ) : null}
    </span>
  );

  const text = showCaption ? (
    <span className="grid max-w-56 min-w-0 gap-0.5" style={{ paddingLeft: Math.round(width * 0.06) }}>
      <span className="truncate text-sm leading-snug font-medium tracking-[-0.01em] text-foreground">{title}</span>
      {/* The comma is for the ear: it keeps the name, read from these two lines, as "Summer 2025, 24 photos". */}
      <span className="sr-only">, </span>
      <span className="truncate text-xs text-muted-foreground tabular-nums">
        {total} {word}
      </span>
    </span>
  ) : null;

  const shared = {
    "data-slot": "photo-stack",
    "data-fan": fanOnHover ? "hover" : "off",
    style: style as CSSProperties | undefined,
    className: cn(
      "group/stack flex w-fit max-w-full min-w-0 flex-col gap-3 rounded-xl text-left outline-none",
      interactive && "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background",
      className,
    ),
  };

  if (href !== undefined) {
    return (
      <a href={href} aria-label={named ? undefined : name} onClick={onClick} {...props} {...shared}>
        {pile}
        {text}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" aria-label={named ? undefined : name} onClick={onClick} {...(props as ComponentProps<"button">)} {...shared}>
        {pile}
        {text}
      </button>
    );
  }
  return (
    <div role="group" aria-label={name} {...(props as ComponentProps<"div">)} {...shared}>
      {pile}
      {text}
    </div>
  );
}
