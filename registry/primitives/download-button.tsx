"use client";

import { useEffect, useRef, useState, type HTMLAttributes } from "react";

import { Glyph, IconDownload } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export type DownloadStatus = "ready" | "preparing" | "done" | "failed";

/** Everything an element takes (id, aria-*, data-*, handlers) except what the button sets itself. It lands on the link or the button, whichever it is. */
type NativeProps = Omit<HTMLAttributes<HTMLElement>, "children" | "onClick" | "aria-label" | "aria-busy">;

interface DownloadButtonBase extends NativeProps {
  /** The file's name with its extension: "Q3 report.pdf". The download is saved under it; the button shows it without the extension and the extension as a chip. */
  fileName: string;
  /** The chip's text when it should not be the extension: "PDF", "ZIP". */
  type?: string;
  /** The size in bytes. Leave it out while it is unknown: it fades in the moment it arrives and joins the accessible name. */
  bytes?: number;
  /** Locale for the size: "en-US" by default. */
  locale?: string;
  /** The words for the other states. The button is as wide as the longest, so nothing moves when they change. */
  labels?: { preparing?: string; done?: string; failed?: string };
  /** How long "Downloaded" stays before the button returns to rest, in milliseconds. */
  resetAfter?: number;
  /** Drive the state yourself. The button then only displays it. */
  status?: DownloadStatus;
  /** Any Button variant. A failure turns it destructive. */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
  /** Classes for the button or link. */
  className?: string;
}

export type DownloadButtonProps = DownloadButtonBase &
  (
    | {
        /** A file that already exists. The button is a real link with the `download` attribute, so it works without script and opens with a middle click. */
        href: string;
        onDownload?: never;
      }
    | {
        href?: never;
        /** Builds the file when it is asked for. Return a URL (a blob URL, say) or a promise of one and the button saves it; return nothing if you start the download yourself. If it rejects, the button offers a retry. */
        onDownload: () => string | void | Promise<string | void>;
      }
  );

/** 2400000 -> "2.4 MB". */
function formatBytes(bytes: number, locale: string): string {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;
  let index = 0;
  let value = bytes;
  while (value >= 1000 && index < units.length - 1) {
    value /= 1000;
    index += 1;
  }
  // "512B", not "512 byte"; the larger units read well as "2.4 MB".
  return new Intl.NumberFormat(locale, { style: "unit", unit: units[index], unitDisplay: index === 0 ? "narrow" : "short", maximumFractionDigits: index > 0 && value < 10 ? 1 : 0 }).format(value);
}

function save(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
}

const fade = "col-start-1 row-start-1 transition-opacity duration-200 motion-reduce:transition-none";
const draw = "transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none";
const failedSolid = "data-[status=failed]:bg-destructive data-[status=failed]:text-destructive-foreground data-[status=failed]:hover:bg-destructive/90";
const failedQuiet = "data-[status=failed]:border-destructive data-[status=failed]:text-destructive data-[status=failed]:hover:text-destructive";

/**
 * A download action that tells you what you get: the file name, a type chip
 * and a human size sit on the button ("Q3 report, PDF, 2.4 MB"), so nobody
 * downloads blindly on mobile data. Give it an `href` for a file that exists
 * (a real link), or `onDownload` for one built on demand, which adds a
 * preparing state, a "Downloaded" confirmation and a retry when it fails. The
 * size is part of the accessible name, and fills in when the parent learns it.
 * The name follows the state and always holds the words drawn on the button, so
 * a failed one is announced as "Try again PDF 2.4 MB, Q3 report".
 */
export function DownloadButton({ fileName, type, bytes, locale = "en-US", labels, resetAfter = 3000, status: controlled, href, onDownload, variant = "outline", size, className, ...props }: DownloadButtonProps) {
  const text = { preparing: "Preparing…", done: "Downloaded", failed: "Try again", ...labels };
  const [own, setOwn] = useState<DownloadStatus>("ready");
  const timer = useRef<number>(undefined);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const status = controlled ?? own;
  const busy = status === "preparing";
  const dot = fileName.lastIndexOf(".");
  const hasExtension = dot > 0 && /^[a-z0-9]{1,5}$/i.test(fileName.slice(dot + 1));
  const name = hasExtension ? fileName.slice(0, dot) : fileName;
  const chip = type ?? (hasExtension ? fileName.slice(dot + 1).toUpperCase() : undefined);
  const sizeText = bytes === undefined ? undefined : formatBytes(bytes, locale);

  const finish = () => {
    window.clearTimeout(timer.current);
    setOwn("done");
    timer.current = window.setTimeout(() => setOwn("ready"), resetAfter);
  };

  async function build() {
    if (busy) return;
    window.clearTimeout(timer.current);
    setOwn("preparing");
    try {
      const url = await onDownload?.();
      if (!alive.current) return;
      if (typeof url === "string") save(url, fileName);
      finish();
    } catch {
      if (alive.current) setOwn("failed");
    }
  }

  const labelsByState: Record<DownloadStatus, string> = { ready: name, preparing: text.preparing, done: text.done, failed: text.failed };
  const states: readonly DownloadStatus[] = ["ready", "preparing", "done", "failed"];
  const current = states.indexOf(status);
  // The name says what the button does now, and it contains every word drawn on it (the label, the type and the size, in that order), so a voice command that names what is on screen finds it.
  const drawn = [chip, sizeText].filter(Boolean).join(" ");
  const accessibleName = status === "ready" ? `Download ${name}${chip ? `, ${chip}` : ""}${sizeText ? `, ${sizeText}` : ""}` : `${labelsByState[status]}${drawn ? ` ${drawn}` : ""}, ${name}`;
  const common = {
    "data-slot": "download-button",
    "data-status": status,
    "aria-label": accessibleName,
    "aria-busy": busy || undefined,
  };
  const style = cn("max-w-full", variant === "default" ? failedSolid : variant === "destructive" ? undefined : failedQuiet, className);
  const content = (
    <>
      <span className="relative grid size-4 shrink-0 place-items-center">
        <IconDownload className={cn(fade, status === "ready" ? "opacity-100" : "opacity-0")} />
        <span className={cn(fade, "grid place-items-center", status === "preparing" ? "opacity-100" : "opacity-0 [&_svg]:animate-none")}>
          <Spinner size={16} label="" role="presentation" aria-hidden="true" />
        </span>
        <Glyph className={cn(fade, status === "done" ? "opacity-100" : "opacity-0")}>
          <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-100", status === "done" ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
        </Glyph>
        <Glyph className={cn(fade, status === "failed" ? "opacity-100" : "opacity-0")}>
          <path d="M6 6l12 12" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-100", status === "failed" ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
          <path d="M18 6L6 18" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-200", status === "failed" ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
        </Glyph>
      </span>
      <span className="inline-grid min-w-0 grid-cols-[minmax(0,1fr)] text-start">
        {states.map((state, index) => (
          <span
            key={state}
            aria-hidden={state === status ? undefined : true}
            className={cn(
              "col-start-1 row-start-1 truncate transition-[opacity,translate] motion-reduce:transition-none",
              state === status ? "opacity-100 delay-75 duration-200" : cn("pointer-events-none opacity-0 duration-100", index < current ? "-translate-y-1.5" : "translate-y-1.5"),
            )}
          >
            {labelsByState[state]}
          </span>
        ))}
      </span>
      {/* A space between the words: a flex container draws none, but a tool that reads the text of the button sees "Q3 report PDF 2.4 MB", not "Q3 reportPDF2.4 MB". */}
      {chip ? (
        <>
          {" "}
          {/* Quiet at rest, but in the failed state (and on a destructive button) the chip and the size take the full colour: at 10px and 12px a softened red is under 4.5:1 on both themes. */}
          <Badge variant="outline" className="h-[1.125rem] shrink-0 rounded-[0.3125rem] border-current/25 bg-transparent px-1.5 font-mono text-[0.625rem] font-medium tracking-wider text-current/80 uppercase group-data-[status=failed]/button:text-current group-data-[variant=destructive]/button:text-current">
            {chip}
          </Badge>
        </>
      ) : null}
      {sizeText ? (
        <>
          {" "}
          <span className="shrink-0 text-xs text-current/70 tabular-nums transition-opacity duration-300 starting:opacity-0 group-data-[status=failed]/button:text-current group-data-[variant=destructive]/button:text-current motion-reduce:transition-none">{sizeText}</span>
        </>
      ) : null}
    </>
  );

  // The live region comes first and is sr-only, so the button is the last child: a Button Group can then join it.
  return (
    <>
      <span role="status" className="sr-only">
        {status === "preparing" ? `${text.preparing} ${name}` : status === "done" ? `${text.done}: ${name}` : status === "failed" ? `${name}: download failed. ${text.failed}` : ""}
      </span>
      {href ? (
        <Button asChild variant={variant} size={size} className={style}>
          <a {...props} href={href} download={fileName} onClick={finish} {...common}>
            {content}
          </a>
        </Button>
      ) : (
        <Button {...props} type="button" variant={variant} size={size} aria-disabled={busy || undefined} onClick={() => void build()} className={style} {...common}>
          {content}
        </Button>
      )}
    </>
  );
}
