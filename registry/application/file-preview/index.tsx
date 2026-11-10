"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconDownload, IconExternal, IconFile, IconFileCode, IconFileImage, IconFileSheet, IconFileText, IconFilm, IconMusic, IconPackage, IconPresentation, IconRefresh } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  fill,
  formatBytes,
  glyphOf,
  isCode,
  kindOf,
  lengthOf,
  previewLines,
  typeName,
  type FileGlyph,
  type FilePreviewLabels,
  type PreviewFile,
} from "@rhs-ui/application/file-preview/files";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type { FilePreviewLabels, PreviewFile, PreviewKind } from "@rhs-ui/application/file-preview/files";

export interface FilePreviewProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The file to show: its name, type, size, address and, for a text file, its content. Nothing is fetched on your behalf. */
  file: PreviewFile;
  /** How tall the preview grows: a number of px or any CSS length. A picture or a video is fitted inside it, a PDF is that tall, and a text file scrolls past it. Default "28rem". */
  maxHeight?: number | string;
  /** The Download button was pressed. With it the button is a button and the download is yours (a signed address, a count); without it the button is a link that saves `file.url` under `file.name`. */
  onDownload?: (file: PreviewFile) => void;
  /** Whether the file is being prepared, or could not be: for what you fetch yourself, like the text of a file or a signed address. A picture, a video, an audio file or a PDF that fails to load by itself says so on its own. Default "ready". */
  status?: "ready" | "loading" | "failed";
  /** The Retry button of a `status` of "failed" was pressed. Without it that state has no Retry button. A file that fails to load by itself is retried by the preview. */
  onRetry?: () => void;
  /** Whether a PDF is shown in an embedded viewer. "auto" (the default) does it where the browser has one, which most phones do not, and shows a message and an Open PDF link elsewhere. `false` always shows the link. */
  embedPdf?: boolean | "auto";
  /** The language the size is written in. Default "en-US". */
  locale?: string;
  /** The words the preview says, for translation. */
  labels?: FilePreviewLabels;
}

type LoadState = "loading" | "ready" | "failed";

/** How long a PDF may take before it is called failed: an embedded viewer reports no error of its own. */
const PDF_PATIENCE = 15_000;

const subscribeNever = () => () => undefined;

/** Whether this browser can show a PDF in a frame. Known only in the browser. */
function pdfViewerAvailable(): boolean {
  const reported = (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled;
  return reported ?? Boolean(navigator.mimeTypes?.namedItem("application/pdf"));
}

function Glyph({ glyph, className }: { glyph: FileGlyph; className?: string }) {
  const props = { "aria-hidden": true as const, className };
  switch (glyph) {
    case "image":
      return <IconFileImage {...props} />;
    case "video":
      return <IconFilm {...props} />;
    case "audio":
      return <IconMusic {...props} />;
    case "sheet":
      return <IconFileSheet {...props} />;
    case "slides":
      return <IconPresentation {...props} />;
    case "code":
      return <IconFileCode {...props} />;
    case "archive":
      return <IconPackage {...props} />;
    case "document":
      return <IconFileText {...props} />;
    default:
      return <IconFile {...props} />;
  }
}

interface BlockProps {
  name: string;
  text: Required<FilePreviewLabels>;
  /** Lie over the box it sits in (a picture, a video, a frame) instead of making room for itself. */
  cover?: boolean;
  /** Take no more room than its words need, for a stage that is itself small. */
  compact?: boolean;
}

/** Something is on its way: the shape of what is coming, shimmering, and a line in words. */
function LoadingBlock({ name, text, cover = false }: BlockProps) {
  return (
    <div role="status" className={cn("grid place-items-center", cover ? "absolute inset-0 z-10" : "relative min-h-56")}>
      <Skeleton className="absolute inset-0 rounded-none" />
      <p className="relative rounded-full border border-border bg-background px-3 py-1 text-xs leading-5 text-muted-foreground">{fill(text.loading, { name })}</p>
    </div>
  );
}

/** It did not come: said in words, with the way to try again when there is one. */
function FailedBlock({ name, text, cover = false, compact = false, onRetry }: BlockProps & { onRetry?: () => void }) {
  return (
    <div role="alert" className={cn("grid place-content-center justify-items-center gap-3 px-6 text-center", cover ? "absolute inset-0 z-10 py-6" : compact ? "py-2" : "min-h-56 py-10")}>
      <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-border bg-background">
        <IconAlertCircle className="size-5 text-destructive" />
      </span>
      <p className="max-w-xs text-sm leading-5 font-medium text-balance [overflow-wrap:anywhere]">{fill(text.failed, { name })}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <IconRefresh />
          {text.retry}
        </Button>
      ) : null}
    </div>
  );
}

interface StageProps {
  file: PreviewFile;
  maxHeight: number | string;
  text: Required<FilePreviewLabels>;
  locale: string;
  retry: () => void;
}

/** A picture fitted whole into a box of the usual proportions that never grows past `maxHeight`, so nothing jumps when it arrives. */
function ImageStage({ file, maxHeight, text, retry }: StageProps) {
  const [state, setState] = useState<LoadState>("loading");
  const image = useRef<HTMLImageElement>(null);
  // A picture that was done before this code ran (cached, or a data address) has already fired its events.
  useEffect(() => {
    const element = image.current;
    if (element?.complete) setState(element.naturalWidth > 0 ? "ready" : "failed");
  }, []);
  return (
    <div className="bg-muted/40">
      <div className="mx-auto" style={{ maxWidth: `calc((${lengthOf(maxHeight)}) * 4 / 3)` }}>
        <AspectRatio ratio={4 / 3}>
          <img ref={image} src={file.url} alt={file.name} onLoad={() => setState("ready")} onError={() => setState("failed")} className={cn("size-full object-contain", state !== "ready" && "invisible")} />
          {state === "loading" ? <LoadingBlock cover name={file.name} text={text} /> : null}
          {state === "failed" ? <FailedBlock cover name={file.name} text={text} onRetry={retry} /> : null}
        </AspectRatio>
      </div>
    </div>
  );
}

/** The browser's own video controls in a 16:9 box. With a poster the poster is the loading state. */
function VideoStage({ file, maxHeight, text, retry }: StageProps) {
  const [state, setState] = useState<LoadState>("loading");
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (element.error) setState("failed");
    else if (element.readyState >= 1) setState("ready");
  }, []);
  return (
    <div className="bg-muted/40">
      <div className="mx-auto" style={{ maxWidth: `calc((${lengthOf(maxHeight)}) * 16 / 9)` }}>
        <AspectRatio ratio={16 / 9}>
          <video
            ref={video}
            src={file.url}
            poster={file.poster}
            controls
            playsInline
            preload="metadata"
            aria-label={file.name}
            onLoadedMetadata={() => setState("ready")}
            onError={() => setState("failed")}
            className={cn("size-full bg-black object-contain", state === "failed" && "invisible")}
          />
          {state === "loading" && !file.poster ? <LoadingBlock cover name={file.name} text={text} /> : null}
          {state === "failed" ? <FailedBlock cover name={file.name} text={text} onRetry={retry} /> : null}
        </AspectRatio>
      </div>
    </div>
  );
}

/** The browser's own audio controls, with room around them. */
function AudioStage({ file, text, retry }: StageProps) {
  const [state, setState] = useState<LoadState>("loading");
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    if (element.error) setState("failed");
    else if (element.readyState >= 1) setState("ready");
  }, []);
  return (
    <div className="bg-muted/40 px-4 py-10 sm:px-8">
      {state === "failed" ? (
        <FailedBlock compact name={file.name} text={text} onRetry={retry} />
      ) : (
        <div className="relative mx-auto max-w-xl">
          <audio ref={audio} src={file.url} controls preload="metadata" aria-label={file.name} onLoadedMetadata={() => setState("ready")} onError={() => setState("failed")} className={cn("block w-full", state === "loading" && "invisible")} />
          {state === "loading" ? (
            <div role="status" className="absolute inset-0 grid">
              <Skeleton className="h-full rounded-full" />
              <span className="sr-only">{fill(text.loading, { name: file.name })}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** A PDF in the browser's own viewer, which does the zooming and the paging; where there is none, a message and a link. */
function PdfStage({ file, maxHeight, text, embed, retry }: StageProps & { embed: boolean | "auto" }) {
  const available = useSyncExternalStore(subscribeNever, pdfViewerAvailable, () => null);
  const embedded = embed === "auto" ? available : embed;
  const [state, setState] = useState<LoadState>("loading");
  // A frame says when it has loaded and never that it has not: so waiting too long is the failure.
  useEffect(() => {
    if (embedded !== true || state !== "loading") return;
    const timer = window.setTimeout(() => setState("failed"), PDF_PATIENCE);
    return () => window.clearTimeout(timer);
  }, [embedded, state]);

  // Not known yet: the server and the first render of the browser. A frame is not started for a browser that cannot show it.
  if (embedded === null) return <LoadingBlock name={file.name} text={text} />;
  if (embedded === false) {
    return (
      <div className="grid place-content-center justify-items-center gap-4 px-6 py-12 text-center">
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
          <IconFileText className="size-5" />
        </span>
        <p className="max-w-sm text-sm leading-5 text-pretty text-muted-foreground">{text.pdfUnsupported}</p>
        <Button asChild variant="outline" size="sm">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            {text.openPdf}
            <IconExternal />
            <span className="sr-only"> {text.newTab}</span>
          </a>
        </Button>
      </div>
    );
  }
  return (
    <div className="relative bg-muted/40" style={{ height: lengthOf(maxHeight) }}>
      <iframe src={file.url} title={`${file.name}, PDF`} referrerPolicy="no-referrer" onLoad={() => setState("ready")} className={cn("size-full border-0", state === "failed" && "invisible")} />
      {state === "loading" ? <LoadingBlock cover name={file.name} text={text} /> : null}
      {state === "failed" ? <FailedBlock cover name={file.name} text={text} onRetry={retry} /> : null}
    </div>
  );
}

/** A text or code file, read in place with the code block's copy button, and cut after a few thousand lines. */
function TextStage({ file, maxHeight, text, locale }: StageProps) {
  const LIMIT = 2000;
  const { shown, total, cut } = previewLines(file.text ?? "", LIMIT);
  const number = new Intl.NumberFormat(locale);
  return (
    <div>
      {/* The code block's line numbers are drawn at 60% of the muted colour, which is too faint to read (about 3:1 on its background); here they are the full muted colour. */}
      <div className="relative overflow-auto [&_pre_[aria-hidden=true]]:text-muted-foreground!" style={{ maxHeight: lengthOf(maxHeight) }}>
        <CodeBlock code={shown} language={fill(total === 1 ? text.linesOne : text.lines, { count: number.format(total) })} showLineNumbers={isCode(file)} className="rounded-none border-0" />
      </div>
      {cut ? <p className="border-t border-border px-4 py-2.5 text-xs leading-5 text-muted-foreground tabular-nums">{fill(text.truncated, { shown: number.format(LIMIT), total: number.format(total) })}</p> : null}
    </div>
  );
}

/** The Download button: a link that saves the file, or a button that calls you when you take the download over. */
function DownloadAction({ file, onDownload, text, compact = false }: { file: PreviewFile; onDownload?: (file: PreviewFile) => void; text: Required<FilePreviewLabels>; compact?: boolean }) {
  const label = `${text.download} ${file.name}`;
  // In the header of a narrow card the word makes way for the file name: the button keeps its full name for a screen reader.
  const className = compact ? "@max-sm:size-8 @max-sm:px-0" : undefined;
  const words = compact ? <span className="@max-sm:sr-only">{text.download}</span> : text.download;
  if (onDownload) {
    return (
      <Button type="button" variant={compact ? "outline" : "default"} size={compact ? "sm" : "default"} aria-label={label} onClick={() => onDownload(file)} className={className}>
        <IconDownload />
        {words}
      </Button>
    );
  }
  return (
    <Button asChild variant={compact ? "outline" : "default"} size={compact ? "sm" : "default"} className={className}>
      <a href={file.url} download={file.name} aria-label={label}>
        <IconDownload />
        {words}
      </a>
    </Button>
  );
}

/**
 * A file shown the right way for what it is: a picture fitted whole, a PDF in
 * the browser's own viewer, video and audio with the native controls, a text or
 * code file read in place, and for anything else its icon with its name, its
 * size and a Download button. Every kind that loads has a loading and a failed
 * state, in words, with Retry. Where the browser cannot embed PDFs, which is
 * most phones, it says so and offers an Open PDF link. The preview is a region
 * named by the file's name and type, and zooming and paging are left to the
 * viewer inside it. It fetches nothing itself: give it the file and, for text,
 * its content. Put it in an attachment dialog, a file browser or a review screen.
 */
export function FilePreview({ file, maxHeight = "28rem", onDownload, status = "ready", onRetry, embedPdf = "auto", locale = "en-US", labels, className, ...props }: FilePreviewProps) {
  const text: Required<FilePreviewLabels> = { ...DEFAULT_LABELS, ...labels, types: { ...labels?.types } };
  // A file that failed to load by itself is tried again by mounting its viewer afresh.
  const [attempt, setAttempt] = useState(0);
  const kind = kindOf(file);
  const type = typeName(file, text);
  const size = file.size === undefined ? null : formatBytes(file.size, locale);
  const meta = size ? `${type} · ${size}` : type;
  const retry = () => setAttempt((count) => count + 1);

  const stage: StageProps = { file, maxHeight, text, locale, retry };
  let body: ReactNode;
  if (status === "loading") body = <LoadingBlock name={file.name} text={text} />;
  else if (status === "failed") body = <FailedBlock name={file.name} text={text} onRetry={onRetry} />;
  else if (kind === "image") body = <ImageStage key={`${file.url}|${attempt}`} {...stage} />;
  else if (kind === "video") body = <VideoStage key={`${file.url}|${attempt}`} {...stage} />;
  else if (kind === "audio") body = <AudioStage key={`${file.url}|${attempt}`} {...stage} />;
  else if (kind === "pdf") body = <PdfStage key={`${file.url}|${attempt}`} embed={embedPdf} {...stage} />;
  else if (kind === "text") body = <TextStage {...stage} />;
  else
    body = (
      <div className="grid place-content-center justify-items-center gap-5 px-6 py-12 text-center">
        <span aria-hidden="true" className="grid size-14 place-items-center rounded-xl border border-border bg-muted text-muted-foreground">
          <Glyph glyph={glyphOf(file)} className="size-6" />
        </span>
        <div className="grid gap-1">
          <p className="max-w-xs text-base leading-6 font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]">{file.name}</p>
          <p className="text-sm leading-5 text-muted-foreground tabular-nums">{meta}</p>
          <p className="text-sm leading-5 text-muted-foreground">{text.noPreview}</p>
        </div>
        <DownloadAction file={file} onDownload={onDownload} text={text} />
      </div>
    );

  return (
    <section
      data-slot="file-preview"
      data-kind={kind}
      aria-label={fill(text.region, { name: file.name, type })}
      className={cn("@container w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    >
      {kind !== "other" || status !== "ready" ? (
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
            <Glyph glyph={glyphOf(file)} className="size-4" />
          </span>
          <div className="grid min-w-0 flex-1">
            <p className="truncate text-sm leading-5 font-medium">{file.name}</p>
            <p className="truncate text-xs leading-4 text-muted-foreground tabular-nums">{meta}</p>
          </div>
          <DownloadAction compact file={file} onDownload={onDownload} text={text} />
        </header>
      ) : null}
      {body}
    </section>
  );
}
