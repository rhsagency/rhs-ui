import type { ComponentProps, MouseEventHandler, ReactNode } from "react";

import { IconHeadphones, IconImage, IconPlay, IconVideo, IconZoomIn } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { DEFAULT_MEDIA_LABELS, FINISHED_AT, formatDuration, say, spokenDuration, type MediaCardLabels } from "@rhs-ui/primitives/media-card/time";
import { cn } from "@/lib/utils";

export type { MediaCardLabels } from "@rhs-ui/primitives/media-card/time";

/** What the card opens: a video, a piece of audio (a podcast episode, a track) or an image. */
export type MediaKind = "video" | "audio" | "image";

export interface MediaCardProps extends Omit<ComponentProps<"a">, "title" | "children" | "ref" | "onClick" | "href"> {
  /** What the media is. It sets the icon and word on the badge and the mark in the middle: a play button, or a magnifier for an image. */
  kind: MediaKind;
  /** The picture: a poster, cover art or the image itself. Without it a calm block stands in. It is decoration, so the title is what is read. */
  thumbnail?: string;
  /** The title. Up to two lines. */
  title: string;
  /** The line under the title: who made it, how often it was seen, when. */
  meta?: ReactNode;
  /** The length in seconds, for a video or audio. It sits on the picture in tabular numbers, and a screen reader hears it in words. */
  duration?: number;
  /** How far it was seen or heard, 0 to 1. Draws a thin white line in a dark strip along the bottom of the picture (full when it is finished) and adds "Resume at 12:40" to the name, or "Finished". */
  progress?: number;
  /** Makes the card a link. Without it the card is a button. */
  href?: string;
  /** Runs when the card is pressed. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** The shape of the picture as width divided by height: 1 for square cover art, 4 / 5 for a poster. Give every card of a grid the same one so the rows line up. Default 16 / 9. */
  aspectRatio?: number;
  /** The words of the card, for another language, or "Podcast" for audio. */
  labels?: Partial<MediaCardLabels>;
}

const KIND = {
  video: IconVideo,
  audio: IconHeadphones,
  image: IconImage,
} as const;

/** One shape for every kind, so a grid that mixes videos, episodes and images keeps its rows aligned without being told to. */
const DEFAULT_RATIO = 16 / 9;

/**
 * A card for a video, a podcast episode, a track or an image: the picture with
 * a badge that says what it is (an icon and a word, never colour alone), the
 * length bottom right on a dark chip that holds its contrast on any picture,
 * a play mark in the middle, then the title and a line of details. A thin white
 * line in a dark strip along the bottom shows how far you got (and reads on a
 * pale picture and a white page alike), and the name says where to resume
 * ("Resume at 12:40"). The whole card is one link, or one button without
 * `href`, so there is a single stop for the keyboard and a single target for
 * a finger. Hover only brightens the play mark. The picture follows the
 * aspect ratio you give (16 / 9 unless you say otherwise), so a grid of cards
 * keeps its rows aligned.
 */
export function MediaCard({ kind, thumbnail, title, meta, duration, progress, href, onClick, aspectRatio, labels: labelOverrides, className, target, rel, download, ...props }: MediaCardProps) {
  const labels: MediaCardLabels = { ...DEFAULT_MEDIA_LABELS, ...labelOverrides };
  const KindIcon = KIND[kind];
  const timed = kind !== "image";
  const length = timed && typeof duration === "number" && duration > 0 ? duration : undefined;
  const seen = timed && typeof progress === "number" && progress > 0 ? Math.min(1, progress) : 0;
  const finished = seen >= FINISHED_AT;
  const resume = seen > 0 && !finished ? say(labels.resume, length ? formatDuration(seen * length) : `${Math.round(seen * 100)}%`) : finished ? labels.finished : undefined;
  const word = labels[kind];
  const Affordance = kind === "image" ? IconZoomIn : IconPlay;

  const picture = (
    <span aria-hidden="true" className="relative isolate block overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: aspectRatio ?? DEFAULT_RATIO }}>
      {thumbnail ? <img src={thumbnail} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 size-full object-cover" /> : null}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-foreground/10 ring-inset" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-12 place-items-center rounded-full bg-white/80 text-black shadow-sm ring-1 ring-black/10 transition-[background-color,transform] duration-200 group-hover/media-card:bg-white group-focus-visible/media-card:bg-white group-active/media-card:scale-95 motion-reduce:transition-none">
          <Affordance className={cn("size-5", kind !== "image" && "translate-x-px fill-current")} />
        </span>
      </span>
      <Badge className="absolute top-2 left-2 border-transparent bg-black/70 text-white">
        <KindIcon />
        {word}
      </Badge>
      {length ? <span className="absolute right-2 bottom-2.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs leading-4 font-medium text-white tabular-nums">{formatDuration(length)}</span> : null}
      {seen > 0 ? (
        // A dark strip with the line inside it, so the white reads on a pale picture and on a white page alike. The line is kept 8px in from the sides, clear of the rounded corners.
        <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60 px-2 py-px">
          <span className="block h-full rounded-full bg-white" style={{ width: `${(finished ? 1 : seen) * 100}%` }} />
        </span>
      ) : null}
    </span>
  );

  const text = (
    <span className="grid min-w-0 gap-0.5 px-0.5">
      <span className="line-clamp-2 text-sm leading-snug font-medium tracking-[-0.01em] text-foreground">{title}</span>
      {meta ? <span className="truncate text-xs text-muted-foreground">{meta}</span> : null}
      <span className="sr-only">{[word, length ? say(labels.length, spokenDuration(length)) : undefined, resume].filter(Boolean).join(". ")}</span>
    </span>
  );

  const shared = {
    "data-slot": "media-card",
    "data-kind": kind,
    className: cn(
      "group/media-card relative flex min-w-0 flex-col gap-3 rounded-xl text-left outline-none",
      "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className,
    ),
  };

  return href !== undefined ? (
    <a href={href} target={target} rel={rel} download={download} onClick={onClick} {...shared} {...props}>
      {picture}
      {text}
    </a>
  ) : (
    <button type="button" onClick={onClick} {...shared} {...(props as ComponentProps<"button">)}>
      {picture}
      {text}
    </button>
  );
}
