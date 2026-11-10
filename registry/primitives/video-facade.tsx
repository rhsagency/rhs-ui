"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { IconFilm, IconPlay } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { cn } from "@/lib/utils";

/** Where the video lives: YouTube (the no-cookie player), Vimeo (with do-not-track), or `file` for your own video file. */
export type VideoProvider = "youtube" | "vimeo" | "file";

export interface VideoFacadeLabels {
  /** The name of the play button; `{title}` is the video's title. Default "Play video: {title}". */
  play?: string;
  /** The line under the poster, before it is pressed; `{provider}` is "YouTube" or "Vimeo". Default "{provider} loads when you press play." */
  notice?: string;
  /** The same line once the player is there. Default "Playing from {provider}." */
  playing?: string;
}

export interface VideoFacadeProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** Default `file` when you pass `src`, otherwise `youtube`. */
  provider?: VideoProvider;
  /** The id of the video at YouTube or Vimeo: letters, digits, `-` and `_`. */
  videoId?: string;
  /** The address of your own video file, for `provider="file"`. */
  src?: string;
  /** The picture shown until it is pressed. Without it, or when it cannot load, a calm block with the title stands in. */
  poster?: string;
  /** The title of the video. It is shown on the poster and is the name of the player. Required. */
  title: string;
  /** The length: seconds (252) or text ("4:12"). Shown on the poster and in the button's name. */
  duration?: number | string;
  /** The shape of the frame as width divided by height. Default 16 / 9. */
  aspect?: number;
  /** Called when the poster is pressed. Call `event.preventDefault()` to keep the poster, for example while you ask for consent first. */
  onActivate?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** The words used for the button and the line under the poster. */
  labels?: VideoFacadeLabels;
}

const NAMES = { youtube: "YouTube", vimeo: "Vimeo" } as const;

/** 252 becomes "4:12" and 3725 becomes "1:02:05"; text is shown as it comes. */
function clock(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

function embedUrl(provider: "youtube" | "vimeo", id: string): string {
  const safe = encodeURIComponent(id);
  return provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&playsinline=1&rel=0` : `https://player.vimeo.com/video/${safe}?autoplay=1&dnt=1`;
}

/**
 * A poster that becomes the player only when it is pressed, so a page with a
 * video loads no video code until someone wants it. Before the press there is
 * a picture, a play button, the title and the length, all one button, and no
 * request to YouTube or Vimeo at all, which helps Core Web Vitals and privacy;
 * a short line under it names the provider that will load. Pressing swaps the
 * poster for the player (the YouTube no-cookie embed, Vimeo with do-not-track,
 * or a video element for your own file), starts it, and moves focus into it.
 * The frame keeps the shape of the poster, so nothing jumps, and a missing or
 * broken poster falls back to a calm block with the title. `onActivate` lets
 * you stop the swap with `event.preventDefault()` to ask for consent first.
 */
export function VideoFacade({ provider, videoId, src, poster, title, duration, aspect = 16 / 9, onActivate, labels, className, ...props }: VideoFacadeProps) {
  const kind: VideoProvider = provider ?? (src ? "file" : "youtube");
  const playable = kind === "file" ? Boolean(src) : Boolean(videoId && /^[\w-]+$/.test(videoId));
  const [active, setActive] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const player = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (active) player.current?.focus();
  }, [active]);

  const length = clock(duration);
  const hasPoster = Boolean(poster) && !posterFailed;
  const playing = active && playable;
  const name = kind === "file" ? undefined : NAMES[kind];
  const note = (playing ? (labels?.playing ?? "Playing from {provider}.") : (labels?.notice ?? "{provider} loads when you press play.")).replace("{provider}", name ?? "");

  const activate = (event: MouseEvent<HTMLButtonElement>) => {
    onActivate?.(event);
    if (!event.defaultPrevented) setActive(true);
  };

  return (
    <div data-slot="video-facade" data-state={playing ? "playing" : "idle"} className={cn("w-full", className)} {...props}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
        <AspectRatio ratio={aspect}>
          {playing && kind === "file" ? (
            <video
              ref={(node) => {
                player.current = node;
              }}
              src={src}
              poster={hasPoster ? poster : undefined}
              controls
              autoPlay
              playsInline
              preload="auto"
              aria-label={title}
              className="absolute inset-0 size-full bg-black object-contain"
            />
          ) : null}
          {playing && kind !== "file" ? (
            <iframe
              ref={(node) => {
                player.current = node;
              }}
              src={embedUrl(kind, videoId ?? "")}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full border-0"
            />
          ) : null}
          {!playing ? (
            <button
              type="button"
              disabled={!playable}
              onClick={activate}
              aria-label={`${(labels?.play ?? "Play video: {title}").replace("{title}", title)}${length ? `, ${length}` : ""}`}
              className="group/facade absolute inset-0 block cursor-pointer outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {hasPoster ? (
                <img
                  src={poster}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => setPosterFailed(true)}
                  className="size-full object-cover transition-transform duration-500 ease-out group-hover/facade:scale-[1.02] motion-reduce:transition-none"
                />
              ) : (
                <span className="absolute inset-0 flex flex-col items-start justify-start gap-2 bg-muted p-4 text-left sm:p-6">
                  <IconFilm aria-hidden="true" className="size-5 text-muted-foreground" />
                  <span className="line-clamp-2 max-w-[78%] text-base leading-snug font-medium tracking-[-0.02em] text-balance text-foreground sm:text-xl">{title}</span>
                </span>
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/facade:bg-black/10 group-focus-visible/facade:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.95),inset_0_0_0_4px_rgba(0,0,0,0.5)] motion-reduce:transition-none"
              />
              {/* On a picture the play button sits in the middle; on the plain block it moves down to the corner, clear of the title. */}
              <span aria-hidden="true" className={cn("absolute inset-0 grid", hasPoster ? "place-items-center" : "items-end justify-items-start p-3 sm:p-4")}>
                <span className={cn("grid place-items-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-foreground/10 transition-transform duration-200 group-hover/facade:scale-105 group-active/facade:scale-95 motion-reduce:transition-none", hasPoster ? "size-14 sm:size-16" : "size-10 sm:size-14")}>
                  <IconPlay className="size-6 translate-x-0.5 fill-current" />
                </span>
              </span>
              <span aria-hidden="true" className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                {/* On a narrow poster the title wraps to a second line instead of being cut in the middle of a word. */}
                {hasPoster ? <span className="line-clamp-2 min-w-0 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs">{title}</span> : <span />}
                {length ? <span className="shrink-0 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background tabular-nums">{length}</span> : null}
              </span>
            </button>
          ) : null}
        </AspectRatio>
      </div>
      {name ? (
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          {note}
        </p>
      ) : null}
    </div>
  );
}
