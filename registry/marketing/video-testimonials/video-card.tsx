"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { IconClose, IconPlay } from "@rhs-ui/icons";
import type { TestimonialVideo } from "@rhs-ui/marketing/video-testimonials/types";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";

export interface VideoCardProps {
  video: TestimonialVideo;
  /** The name of the card's button, already spelled out: "Play Maria's story, 2 minutes 14 seconds". */
  playLabel: string;
  /** The name of the dialog's close button. */
  closeLabel: string;
  /** What the dialog says about itself to a screen reader. */
  hintLabel: string;
  /** Shown over the player when the video cannot be loaded. */
  failedLabel: string;
  /** The name of a captions track that has no label of its own. */
  captionsLabel: string;
  /** The player from `renderPlayer`. When there is one it takes the place of the video element. */
  children?: ReactNode;
}

/** "Maria Alvarez" is "MA": the card's stand-in when the poster is missing or broken. */
const monogram = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "")).toUpperCase();
};

/**
 * One customer on camera: a poster that is always visible, the person's name
 * and role, and the length, all one button. Pressing it opens a dialog with
 * the video (or your own player) and starts it; closing the dialog stops the
 * video and puts focus back on the card. Nothing about the video is fetched
 * before that press.
 */
export function VideoCard({ video, playLabel, closeLabel, hintLabel, failedLabel, captionsLabel, children }: VideoCardProps) {
  const [open, setOpen] = useState(false);
  const [posterBroken, setPosterBroken] = useState(false);
  const [failed, setFailed] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const roleId = useId();
  const embed = children !== undefined && children !== null;
  const playable = Boolean(video.src) || embed;

  const change = (next: boolean) => {
    // Stop the sound at once: the dialog fades out for a moment before it leaves the page.
    if (!next) player.current?.pause();
    setFailed(false);
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger asChild>
        <button type="button" disabled={!playable} aria-describedby={roleId} className="group/card block w-full cursor-pointer text-left outline-none disabled:cursor-not-allowed disabled:opacity-60">
          <span className="sr-only">{playLabel}</span>
          <span aria-hidden="true" className="relative block aspect-video overflow-hidden rounded-xl border border-border bg-muted transition-shadow duration-150 group-focus-visible/card:ring-[3px] group-focus-visible/card:ring-ring/40 motion-reduce:transition-none">
            {video.poster && !posterBroken ? (
              <img
                src={video.poster}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={() => setPosterBroken(true)}
                className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover/card:scale-[1.03] motion-reduce:transition-none"
              />
            ) : (
              // The initials sit in a small tile in the corner, like an avatar: the play disc owns the middle of the frame.
              <span className="absolute top-3 left-3 grid size-10 place-items-center rounded-lg border border-border bg-background text-sm font-medium tracking-[-0.01em] text-muted-foreground select-none">
                {monogram(video.name)}
              </span>
            )}
            {/* The ring is the disc's own edge, in the opposite tone, so it holds on a poster of any colour. */}
            <span
              className="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background shadow-sm ring-2 ring-background/80 transition-transform duration-200 motion-safe:group-hover/card:scale-110 motion-reduce:transition-none"
            >
              <IconPlay className="size-6 translate-x-px fill-current" />
            </span>
            <span className="absolute right-3 bottom-3 rounded-md bg-foreground px-2 py-1 text-xs leading-none font-medium text-background tabular-nums">
              {video.duration}
            </span>
          </span>
          <span aria-hidden="true" className="mt-4 block">
            <span className="block text-base leading-snug font-medium tracking-[-0.01em] decoration-foreground/40 underline-offset-4 group-hover/card:underline">{video.name}</span>
            <span id={roleId} className="mt-0.5 block text-sm leading-snug text-muted-foreground">
              {video.role}
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // A native video takes focus and starts: the press that opened the dialog is the reader asking for it. An embed keeps the default.
          const node = player.current;
          if (!node) return;
          event.preventDefault();
          node.focus();
          void node.play().catch(() => {});
        }}
        className="w-[min(56rem,calc(100vw_-_2rem),calc((100dvh_-_9rem)*16/9))] max-w-none grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-none"
      >
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border py-2 pr-2 pl-4 sm:pl-5">
          <DialogTitle className="truncate text-sm">
            {video.name}
            <span className="font-normal text-muted-foreground">, {video.role}</span>
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label={closeLabel}>
              <IconClose />
            </Button>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">{hintLabel}</DialogDescription>
        <div className="dark relative aspect-video bg-black text-foreground">
          {embed ? (
            children
          ) : (
            <video
              ref={player}
              src={video.src}
              poster={video.poster}
              controls
              playsInline
              preload="none"
              aria-label={`${video.name}, ${video.role}`}
              onError={() => setFailed(true)}
              className="absolute inset-0 size-full bg-black object-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset"
            >
              {video.captions ? <track kind="captions" src={video.captions.src} srcLang={video.captions.lang} label={video.captions.label ?? captionsLabel} default /> : null}
            </video>
          )}
          {failed ? (
            <div role="alert" className="absolute inset-0 grid place-content-center bg-black px-6 text-center text-sm text-foreground">
              {failedLabel}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
