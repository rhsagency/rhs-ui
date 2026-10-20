"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconClock, IconClose, IconFileText, IconPlay, IconSubtitles } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface WatchDemoHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The promise, in a line. */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** One or two actions beside the video: the trial or sign-up button. */
  actions?: ReactNode;
  /** The still shown before anyone presses play: a URL or a data URI, 16:9. */
  poster: string;
  /** What the poster shows. Leave empty when the play button's name says enough. */
  posterAlt?: string;
  /** The video file. It is not requested until the dialog opens. */
  videoSrc: string;
  /** WebVTT captions for the video, switched on by default. */
  captionsSrc?: string;
  /** The captions' language tag. */
  captionsLang?: string;
  /** The captions' name in the player's menu. */
  captionsLabel?: string;
  /** The length as written on the chip: "2:04". */
  duration: string;
  /** The play button's name: "Watch the 2-minute demo". It sits on the poster in one line and is cut short with an ellipsis on a narrow screen, so keep it brief. */
  playLabel?: string;
  /** The dialog's title. Defaults to the play label. */
  videoTitle?: string;
  /** Where the transcript lives. It is linked under the poster and in the dialog. */
  transcriptHref?: string;
  /** Start playing as soon as the dialog opens, since pressing the poster was the visitor's choice. */
  autoPlay?: boolean;
}

/**
 * A hero whose picture is a poster frame: the copy and actions on one side,
 * on the other a 16:9 still with a duration chip and a large play button.
 * Pressing it opens the video in a dialog with native controls and captions,
 * moves focus to the player, pauses when the dialog closes and hands focus
 * back to the poster. Nothing is downloaded until then, and a transcript link
 * serves people who cannot watch. Unlike a muted background clip, here the
 * video is a choice the visitor makes.
 */
export function WatchDemoHero({
  titleAs: Title = "h2",
  title,
  description,
  actions,
  poster,
  posterAlt = "",
  videoSrc,
  captionsSrc,
  captionsLang = "en",
  captionsLabel = "English",
  duration,
  playLabel = "Watch the demo",
  videoTitle,
  transcriptHref,
  autoPlay = true,
  className,
  ...props
}: WatchDemoHeroProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  return (
    <section data-slot="watch-demo-hero" className={cn("grid grid-cols-1 items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16", className)} {...props}>
      <div>
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <div className="min-w-0">
        <Dialog
          onOpenChange={(open) => {
            if (open) setFailed(false);
            else video.current?.pause();
          }}
        >
          <div className="group/poster relative rounded-2xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted">
              <AspectRatio ratio={16 / 9}>
                {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the poster is any URL or data URI */}
                <img
                  src={poster}
                  alt={posterAlt}
                  className="size-full object-cover transition-transform duration-700 ease-out group-hover/poster:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/poster:scale-100"
                />
              </AspectRatio>
            </div>
            <DialogTrigger asChild>
              <button
                type="button"
                className="absolute inset-0 grid place-items-center rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 max-sm:pb-8"
              >
                {/* Below sm the disc is smaller and sits in the space above the chips, so on a short poster the two never meet. */}
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-full bg-foreground text-background shadow-sm ring-4 ring-background transition-transform duration-300 group-hover/poster:scale-105 motion-reduce:transition-none motion-reduce:group-hover/poster:scale-100 sm:size-20 sm:ring-[6px]"
                >
                  <IconPlay className="ml-0.5 size-5 fill-current sm:size-7" />
                </span>
                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 sm:inset-x-4 sm:bottom-4">
                  {/* One line, whatever the width: the label gives way before the duration does, and it stays whole in the button's name. */}
                  <span className="min-w-0 truncate rounded-full bg-background px-3 py-2 text-left text-xs font-medium text-foreground shadow-xs sm:px-3.5 sm:text-sm">{playLabel}</span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background px-3 py-2 text-xs font-medium text-foreground tabular-nums shadow-xs">
                    <IconClock className="size-3.5 text-muted-foreground" />
                    <span className="sr-only">, duration </span>
                    {duration}
                  </span>
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
              if (autoPlay) void node.play().catch(() => {});
            }}
            className="w-[min(56rem,calc(100vw_-_2rem),calc((100dvh_-_9rem)*16/9))] max-w-none grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-none"
          >
            {/* min-w-0: a grid item will not shrink below its content otherwise, so a long title would widen the whole dialog past the screen and push the close button out of sight. The title is cut with an ellipsis instead. */}
            <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border py-2 pr-2 pl-4 sm:pl-5">
              <DialogTitle className="truncate text-sm">{videoTitle ?? playLabel}</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close video">
                  <IconClose />
                </Button>
              </DialogClose>
            </div>
            <DialogDescription className="sr-only">A video with captions and player controls. Press Escape to close it.</DialogDescription>
            <div className="dark relative bg-black text-foreground">
              <AspectRatio ratio={16 / 9}>
                <video
                  ref={video}
                  src={videoSrc}
                  poster={poster}
                  controls
                  playsInline
                  preload="none"
                  aria-label={videoTitle ?? playLabel}
                  onError={() => setFailed(true)}
                  className="size-full object-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset"
                >
                  {captionsSrc ? <track kind="captions" src={captionsSrc} srcLang={captionsLang} label={captionsLabel} default /> : null}
                  <a href={videoSrc}>Download the video</a>
                </video>
              </AspectRatio>
              {failed ? (
                <div role="alert" className="absolute inset-0 grid content-center justify-items-center gap-3 bg-black px-6 text-center text-sm">
                  <p>The video could not be loaded.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFailed(false);
                      video.current?.load();
                      if (autoPlay) void video.current?.play().catch(() => {});
                    }}
                    className="rounded-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60"
                  >
                    Try again
                  </button>
                </div>
              ) : null}
            </div>
            {transcriptHref ? (
              <p className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-sm text-muted-foreground sm:px-5">
                <IconFileText className="size-4 shrink-0" />
                <a href={transcriptHref} className="underline underline-offset-4 outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  Read the transcript
                </a>
              </p>
            ) : null}
          </DialogContent>
        </Dialog>
        {captionsSrc || transcriptHref ? (
          <p className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {captionsSrc ? (
              <span className="inline-flex items-center gap-2">
                <IconSubtitles className="size-4" />
                Captions are on
              </span>
            ) : (
              <span />
            )}
            {transcriptHref ? (
              <a
                href={transcriptHref}
                className="inline-flex items-center gap-2 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <IconFileText className="size-4" />
                Read the transcript
              </a>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}
