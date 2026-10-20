"use client";

import { useRef, useState, type ClipboardEvent, type ComponentProps, type DragEvent } from "react";

import { Glyph, IconClose, IconUpload } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export type UploadState = "idle" | "uploading" | "success" | "error";

export interface RejectedFile {
  /** The file that was left out. */
  file: File;
  /** Why, for your own wording or translation: the type is not accepted, the file is too big, or the batch is full. */
  code: "type" | "size" | "count";
  /** The same in words, ready to show: "report.docx is not a type we accept: use PDF or image." */
  reason: string;
}

export interface UploadButtonLabels {
  /** At rest. Default "Upload files", or "Upload a file" for a single file. */
  idle?: string;
  /** Shown while a file is dragged over the button. Default "Drop to upload". */
  dropping?: string;
  /** Before the percentage while uploading. Default "Uploading". */
  uploading?: string;
  /** When the upload failed. Default "Upload failed". */
  error?: string;
  /** Called with the number of files in the last batch. Default "3 files uploaded". */
  success?: (count: number) => string;
  /** What is accepted, in words, for the refusal "is not a type we accept: use ...". Default is worked out from `accept`: "PNG or SVG". */
  accept?: string;
}

/** Everything a button takes (id, aria-*, data-*, a ref) except what this one sets itself. */
type NativeProps = Omit<ComponentProps<"button">, "children" | "onClick" | "type" | "disabled" | "onDragEnter" | "onDragOver" | "onDragLeave" | "onDrop" | "onPaste" | "aria-busy">;

export interface UploadButtonProps extends NativeProps {
  /** Which files to take, as for the input: ".pdf,image/*". Checked on every route in: the chooser, a drop and a paste. */
  accept?: string;
  /** Allow more than one file at a time. */
  multiple?: boolean;
  /** Choose a whole folder instead of files. */
  directory?: boolean;
  /** The largest file, in bytes. A bigger one is rejected with the reason. */
  maxBytes?: number;
  /** The most files in one batch. */
  maxFiles?: number;
  /** The files that passed and the ones that did not. Start your upload with the first list; show the second wherever suits you. */
  onFiles: (accepted: File[], rejected: RejectedFile[]) => void;
  /** Where the upload is, from you. While `uploading`, the button shows the percentage and a second press cancels. */
  state?: UploadState;
  /** 0 to 1. Leave it out while it is not known and the button shows a spinner instead of a percentage. */
  progress?: number;
  /** Called when the button is pressed while uploading. */
  onCancel?: () => void;
  /** The idle label: "Upload files". */
  label?: string;
  /** Replace any of the default words; each is optional. */
  labels?: UploadButtonLabels;
  /** The number of files for the success label, if it is not the size of the last accepted batch. */
  count?: number;
  /** Locale for the sizes in the messages: "en-US" by default. */
  locale?: string;
  /** Any Button variant. A failed upload turns it destructive. */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
  /** Nothing opens, drops or pastes. */
  disabled?: boolean;
  /** Classes for the button. */
  className?: string;
}

const VIEWS = ["idle", "dropping", "uploading", "success", "error"] as const;
type View = (typeof VIEWS)[number];

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

const tokensOf = (accept: string) => accept.split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokensOf(accept).some((token) => (token.startsWith(".") ? name.endsWith(token) : token.endsWith("/*") ? type.startsWith(token.slice(0, -1)) : type === token));
}

/** How people say a MIME subtype, where its capitals would read as noise ("VND.MS-EXCEL"). The first pattern that matches wins. */
const SUBTYPE_WORDS: readonly (readonly [RegExp, string])[] = [
  [/wordprocessingml|msword|ms-word/, "Word"],
  [/spreadsheetml|ms-excel/, "Excel"],
  [/presentationml|ms-powerpoint/, "PowerPoint"],
  [/^svg/, "SVG"],
  [/^jpe?g$/, "JPEG"],
  [/^webp$/, "WebP"],
  [/^webm$/, "WebM"],
  [/^quicktime$/, "QuickTime"],
  [/^markdown$/, "Markdown"],
  [/^plain$/, "text"],
  [/^zip/, "ZIP"],
];

/** One token of `accept` in words: ".pdf" -> "PDF", "image/*" -> "image", "image/svg+xml" -> "SVG", "text/plain" -> "text". */
function describeToken(token: string): string {
  if (token.startsWith(".")) return token.slice(1).toUpperCase();
  if (token.endsWith("/*")) return token.slice(0, -2);
  // Drop the experimental prefix (x-) and the structured-syntax suffix (+xml, +json), then fall back to the last dotted segment: "vnd.foo.bar" -> "BAR".
  const subtype = (token.split("/")[1] ?? token).replace(/^x-/, "").replace(/\+[a-z]+$/, "");
  const known = SUBTYPE_WORDS.find(([pattern]) => pattern.test(subtype));
  return known ? known[1] : (subtype.split(".").pop() ?? subtype).toUpperCase();
}

/** ".pdf,image/*,text/csv" -> "PDF, image, or CSV". */
function describeAccept(accept: string, locale: string): string {
  const words = [...new Set(tokensOf(accept).map(describeToken))];
  return new Intl.ListFormat(locale, { style: "long", type: "disjunction" }).format(words);
}

const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");
const draw = "transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none";
const errorSolid = "data-[state=error]:bg-destructive data-[state=error]:text-destructive-foreground data-[state=error]:hover:bg-destructive/90";
const errorQuiet = "data-[state=error]:border-destructive data-[state=error]:text-destructive data-[state=error]:hover:text-destructive";

/**
 * A button that opens the file chooser and hands you checked files. It also
 * takes a drop on the button and a paste of files while it has focus. Every
 * file is checked against `accept`, `maxBytes` and `maxFiles`, and each
 * rejection comes with its reason in words. You run the upload and tell the
 * button where it is: the label becomes a percentage with a thin progress
 * line along the bottom edge, a second press cancels, and success shows a
 * check and the count. The list of chosen files is left to File Dropzone or
 * File Trigger.
 */
export function UploadButton({
  accept,
  multiple = false,
  directory = false,
  maxBytes,
  maxFiles,
  onFiles,
  state = "idle",
  progress,
  onCancel,
  label,
  labels,
  count,
  locale = "en-US",
  variant = "outline",
  size,
  disabled = false,
  className,
  ...props
}: UploadButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [taken, setTaken] = useState(0);
  const [note, setNote] = useState("");

  const many = multiple || directory;
  const uploading = state === "uploading";
  const blocked = disabled || uploading;
  const total = count ?? taken;
  const text = {
    idle: labels?.idle ?? label ?? (many ? "Upload files" : "Upload a file"),
    dropping: labels?.dropping ?? "Drop to upload",
    uploading: labels?.uploading ?? "Uploading",
    error: labels?.error ?? "Upload failed",
    success: (labels?.success ?? ((n: number) => `${n} ${n === 1 ? "file" : "files"} uploaded`))(total),
  };
  const view: View = dragging ? "dropping" : state;
  const current = VIEWS.indexOf(view);
  const percent = progress === undefined || !Number.isFinite(progress) ? undefined : Math.round(Math.min(1, Math.max(0, progress)) * 100);

  function take(files: File[]) {
    if (!files.length) return;
    const accepted: File[] = [];
    const rejected: RejectedFile[] = [];
    const room = many ? (maxFiles ?? Number.POSITIVE_INFINITY) : 1;
    for (const file of files) {
      if (!matchesAccept(file, accept)) rejected.push({ file, code: "type", reason: `${file.name} is not a type we accept${accept ? `: use ${labels?.accept ?? describeAccept(accept, locale)}` : ""}.` });
      else if (maxBytes !== undefined && file.size > maxBytes) rejected.push({ file, code: "size", reason: `${file.name} is ${formatBytes(file.size, locale)}, over the ${formatBytes(maxBytes, locale)} limit.` });
      else if (accepted.length >= room) rejected.push({ file, code: "count", reason: `${file.name} was left out: ${room === 1 ? "one file at a time" : `at most ${room} files at a time`}.` });
      else accepted.push(file);
    }
    if (accepted.length) setTaken(accepted.length);
    setNote(rejected.length ? `${rejected.length === 1 ? "1 file was" : `${rejected.length} files were`} not added. ${rejected.map((item) => item.reason).join(" ")}` : "");
    onFiles(accepted, rejected);
  }

  const progressNote =
    state === "uploading" ? (percent === undefined ? text.uploading : `${text.uploading} ${Math.floor(percent / 25) * 25}%`) : state === "success" ? text.success : state === "error" ? text.error : "";

  // The file input and the live regions come first and are sr-only, so the button is the last child: a Button Group can then join it.
  return (
    <>
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        accept={accept}
        multiple={many}
        {...(directory ? { webkitdirectory: "" } : {})}
        onChange={(event) => {
          take(Array.from(event.target.files ?? []));
          // Choosing the same file again must fire a change again.
          event.target.value = "";
        }}
      />
      <span role="status" className="sr-only">
        {note}
      </span>
      <span role="status" className="sr-only">
        {progressNote}
      </span>
      <Button
        {...props}
        data-slot="upload-button"
        data-state={view}
        data-dragging={dragging || undefined}
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        aria-busy={uploading || undefined}
        onClick={() => {
          if (uploading) onCancel?.();
          else input.current?.click();
        }}
        // A file dropped on the button is never left to the browser, which would open it in this tab and abandon an upload under way. While blocked the drop is refused instead.
        onDragEnter={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          if (!blocked) setDragging(true);
        }}
        onDragOver={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = blocked ? "none" : "copy";
          if (!blocked) setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          setDragging(false);
          if (!blocked) take(Array.from(event.dataTransfer.files));
        }}
        onPaste={(event: ClipboardEvent<HTMLButtonElement>) => {
          const files = Array.from(event.clipboardData.files);
          if (blocked || !files.length) return;
          event.preventDefault();
          take(files);
        }}
        className={cn(
          "relative overflow-hidden",
          "data-[dragging=true]:border-ring data-[dragging=true]:ring-[3px] data-[dragging=true]:ring-ring/40",
          variant === "default" ? errorSolid : variant === "destructive" ? undefined : errorQuiet,
          className,
        )}
      >
        <span className="inline-grid">
          {VIEWS.map((name, index) => {
            const active = name === view;
            return (
              <span
                key={name}
                aria-hidden={active ? undefined : true}
                className={cn(
                  "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[opacity,translate] motion-reduce:transition-none",
                  active ? "opacity-100 delay-75 duration-200" : cn("pointer-events-none opacity-0 duration-100 [&_svg]:animate-none", index < current ? "-translate-y-1.5" : "translate-y-1.5"),
                )}
              >
                {name === "idle" || name === "dropping" ? <IconUpload /> : null}
                {name === "success" ? (
                  <Glyph className="shrink-0">
                    <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-100", active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
                  </Glyph>
                ) : null}
                {name === "error" ? (
                  <Glyph className="shrink-0">
                    <path d="M6 6l12 12" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-100", active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
                    <path d="M18 6L6 18" pathLength={1} strokeDasharray={1} className={cn(draw, "delay-200", active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
                  </Glyph>
                ) : null}
                {name === "uploading" ? (
                  <>
                    {text.uploading}
                    {percent === undefined ? <Spinner size={14} label="" role="presentation" aria-hidden="true" /> : <span className="inline-block min-w-[3ch] text-start tabular-nums">{percent}%</span>}
                    <IconClose aria-hidden="true" className="size-3.5 opacity-60" />
                    <span className="sr-only">Press to cancel</span>
                  </>
                ) : (
                  { idle: text.idle, dropping: text.dropping, success: text.success, error: text.error }[name]
                )}
              </span>
            );
          })}
        </span>
        {/* The line along the bottom edge: it fills to the progress, or travels while the progress is not known. Spans only, since a button holds phrasing content. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 block h-0.5 overflow-hidden bg-current/15 transition-opacity duration-200 motion-reduce:transition-none",
            uploading ? "opacity-100" : "opacity-0",
          )}
        >
          <span
            className={cn(
              "block h-full bg-current",
              percent === undefined
                ? "w-2/5 animate-rhs-indeterminate motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-40"
                : "w-full origin-left transition-transform duration-300 ease-out motion-reduce:transition-none",
            )}
            style={percent === undefined ? undefined : { transform: `scaleX(${percent / 100})` }}
          />
        </span>
      </Button>
    </>
  );
}
