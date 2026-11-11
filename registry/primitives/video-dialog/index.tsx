"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { IconClose, IconPlay, IconVolumeOff } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { embedSource } from "@rhs-ui/primitives/video-dialog/embed";
import { cn } from "@/lib/utils";

export interface VideoSource {
  /** The address of the file. */
  src: string;
  /** What kind of file it is, with the codecs when you know them: `video/mp4` or `video/webm; codecs="vp9"`. The browser plays the first one it can. */
  type?: string;
}

export interface VideoCaption {
  /** The address of the WebVTT file. */
  src: string;
  /** What the viewer sees in the captions menu: "English". */
  label: string;
  /** The language of the captions as a code: "en". */
  language: string;
  /** Show these captions from the start. */
  default?: boolean;
}

/** The words the dialog says on its own, for another language or your own wording. */
export interface VideoDialogLabels {
  /** The name of the default poster button, before the title. Default "Play video". */
  watch: string;
  /** The name of the close button. Default "Close". */
  close: string;
  /** The hint shown when the video had to start without sound. Default "Sound is off. Turn it on". */
  unmute: string;
  /** What a screen reader hears after the title. Default "Video player. Use the controls to play, pause and change the sound." */
  description: string;
  /** What shows where the video would be in a browser that cannot play it. Default "This video cannot be played in your browser." */
  unsupported: string;
  /** What shows when there is neither a file nor an embed address. Default "There is no video to play." */
  none: string;
}

export interface VideoDialogProps {
  /** The video files, best first: the browser plays the first type it can. Leave them out when you use `embedUrl`. */
  sources?: readonly VideoSource[];
  /** The picture shown before the video plays: on the default trigger, and in the player until it starts. */
  poster?: string;
  /** Caption tracks. The player's own menu switches them. */
  captions?: readonly VideoCaption[];
  /** What the video is: "Halcyon in 90 seconds". Required: it is the dialog's title, and it names the player and the iframe. */
  title: string;
  /** What opens the dialog: a poster, a button or any single element. Left out, a poster with a play button is drawn from `poster` and `title`; pass `null` for none, when you open it with `open`. */
  trigger?: ReactNode;
  /** Start playing when the dialog opens. Where the browser refuses sound without a click it starts muted and says so. Default true. */
  autoPlay?: boolean;
  /** The width divided by the height of the picture. 16 / 9 by default; a tall clip such as 9 / 16 gets a narrower dialog. */
  ratio?: number;
  /** A player from another site (YouTube, Vimeo, Loom) to show in an iframe. It is created only after the dialog opens, so the page pays nothing for it. Only http, https and your own addresses are used. */
  embedUrl?: string;
  /** Playback started: when the video plays, or for an embed when the player opens. */
  onPlay?: () => void;
  /** The dialog was closed. The video has already been paused by then. */
  onClose?: () => void;
  /** Whether it is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words the dialog says, for translation. */
  labels?: Partial<VideoDialogLabels>;
  /** Classes for the panel, for a different width. */
  className?: string;
}

const DEFAULT_LABELS = {
  watch: "Play video",
  close: "Close",
  unmute: "Sound is off. Turn it on",
  description: "Video player. Use the controls to play, pause and change the sound.",
  unsupported: "This video cannot be played in your browser.",
  none: "There is no video to play.",
} satisfies VideoDialogLabels;

/**
 * The trigger drawn when you give none: the poster with a play button and the title on it. It is a plain function that returns the
 * button, not a component, because the dialog's trigger hands its props (the click, the state) to the element it is given.
 * The play disc and the title chip are white with black marks in both themes on purpose, not by oversight: they sit on a picture, which
 * has no theme, and a fixed pair reads on any poster where a token (white in dark mode, black in light) would vanish on half of them.
 */
function posterTrigger({ title, poster, ratio, label }: { title: string; poster?: string; ratio: number; label: string }) {
  return (
    <button
      type="button"
      data-slot="video-dialog-poster"
      style={{ aspectRatio: ratio }}
      className="group/poster relative block w-full overflow-hidden rounded-xl border border-border bg-muted text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      {poster ? <img src={poster} alt="" className="size-full object-cover" /> : null}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-14 place-items-center rounded-full bg-white text-black shadow-sm ring-1 ring-black/10 transition-transform duration-200 group-hover/poster:scale-105 motion-reduce:transition-none">
          <IconPlay aria-hidden="true" className="size-5 translate-x-px" />
        </span>
      </span>
      <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-md bg-white px-2.5 py-1 text-xs font-medium text-black shadow-xs">
        <span className="sr-only">{label}: </span>
        {title}
      </span>
    </button>
  );
}

/**
 * Watch a video in a dialog without leaving the page. A trigger, which is a poster with a play button unless you give it
 * your own, opens a modal with a player at the proportions of the video. The player uses the browser's own controls and
 * caption tracks, starts when the dialog opens where the browser allows it (and starts muted with a hint to turn the sound
 * on where it does not), pauses the moment the dialog closes and is removed with it, so sound never carries on behind a
 * closed dialog. Focus goes to the player so Space plays and pauses, and returns to the trigger on close. An `embedUrl` is
 * shown in an iframe with the title as its name, created only after the dialog opens, so the page pays nothing for it. The
 * open animation is skipped for a visitor who asks for reduced motion.
 */
export function VideoDialog({ sources, poster, captions, title, trigger, autoPlay = true, ratio = 16 / 9, embedUrl, onPlay, onClose, open, defaultOpen = false, onOpenChange, labels, className }: VideoDialogProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const [soundless, setSoundless] = useState(false);
  const video = useRef<HTMLVideoElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const shape = Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
  const frame = embedUrl ? embedSource(embedUrl, autoPlay) : null;
  const hasVideo = !embedUrl && Boolean(sources?.length);

  // Closed from outside, with `open`, the sound stops at once as well, not when the exit animation ends.
  useEffect(() => {
    if (!isOpen) video.current?.pause();
  }, [isOpen]);

  function change(next: boolean) {
    if (!next) {
      // Paused now, not when the exit animation ends: the sound stops with the click.
      video.current?.pause();
      onClose?.();
    }
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  // The player exists only while the dialog is open. This runs when it appears and starts it.
  const attach = useCallback(
    (element: HTMLVideoElement | null) => {
      video.current = element;
      if (!element || !autoPlay) return;
      setSoundless(false);
      element.play()?.catch((error: unknown) => {
        // Not allowed without a click on the page: start without sound, and say so. Any other refusal (it was closed again) is nothing to say.
        if ((error as { name?: string } | null)?.name !== "NotAllowedError") return;
        element.muted = true;
        setSoundless(true);
        element.play()?.catch(() => {});
      });
    },
    [autoPlay],
  );

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger === null ? null : <DialogTrigger asChild>{trigger ?? posterTrigger({ title, poster, ratio: shape, label: words.watch })}</DialogTrigger>}
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={panel}
          data-slot="video-dialog"
          // Never taller than the screen: the width the height allows at this proportion, less the header and the margins.
          style={{ maxWidth: `min(64rem, calc((100dvh - 9rem) * ${shape}))` }}
          onOpenAutoFocus={(event) => {
            // The player, so Space plays and pauses at once; Radix would pick the close button.
            event.preventDefault();
            (video.current ?? panel.current)?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={() => setSoundless(false)}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-xl outline-none",
            // Written with motion-safe, so under reduced motion there is no entrance at all and a closed panel is gone at once.
            "motion-safe:data-[state=open]:animate-rhs-in motion-safe:data-[state=closed]:animate-rhs-out",
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border py-2 pr-2 pl-4">
            <DialogTitle className="min-w-0 truncate text-sm font-medium tracking-[-0.01em]">{title}</DialogTitle>
            <DialogClose
              aria-label={words.close}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              <IconClose size={16} />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">{words.description}</DialogDescription>
          <div className="relative bg-black">
            <AspectRatio ratio={shape}>
              {frame ? (
                // Created here, after the dialog opened, and gone when it closes.
                <iframe
                  src={frame}
                  title={title}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  onLoad={() => onPlay?.()}
                  className="size-full border-0"
                />
              ) : hasVideo ? (
                <video
                  ref={attach}
                  controls
                  playsInline
                  preload="auto"
                  poster={poster}
                  aria-label={title}
                  onPlay={() => onPlay?.()}
                  onVolumeChange={(event) => {
                    if (!event.currentTarget.muted) setSoundless(false);
                  }}
                  className="size-full bg-black object-contain"
                >
                  {sources?.map((source, index) => <source key={`${index}-${source.type ?? "file"}`} src={source.src} type={source.type} />)}
                  {captions?.map((caption) => <track key={`${caption.language}-${caption.label}`} kind="captions" src={caption.src} srcLang={caption.language} label={caption.label} default={caption.default} />)}
                  {words.unsupported}
                </video>
              ) : (
                <div className="grid size-full place-items-center bg-muted p-6 text-center text-sm text-muted-foreground">{words.none}</div>
              )}
            </AspectRatio>
            {soundless && hasVideo ? (
              <button
                type="button"
                onClick={() => {
                  if (video.current) video.current.muted = false;
                  setSoundless(false);
                }}
                // On the picture, at the top, clear of the controls at the bottom: a solid dark chip, so it reads over any frame.
                className="absolute top-3 left-3 inline-flex h-8 items-center gap-2 rounded-md bg-black/80 px-3 text-xs font-medium text-white outline-none hover:bg-black focus-visible:ring-[3px] focus-visible:ring-white/60"
              >
                <IconVolumeOff aria-hidden="true" className="size-4" />
                {words.unmute}
              </button>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
