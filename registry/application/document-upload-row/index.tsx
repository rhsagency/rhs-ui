"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type DragEvent, type FocusEvent, type ReactNode, type SyntheticEvent } from "react";

import { IconAlertCircle, IconCheck, IconFile, IconMinusCircle, IconPaperclip, IconRefresh, IconSpinner, IconUpload } from "@rhs-ui/icons";
import { acceptsFile, acceptWords, formatBytes, formatPercent } from "@rhs-ui/application/document-upload-row/files";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** Where the document stands. */
export type DocumentStatus = "missing" | "uploading" | "uploaded" | "attention";

/** The file as the row shows it. A `File` fits; so does the name and size your server kept. */
export interface DocumentFile {
  /** The file name, with its extension. */
  name: string;
  /** The size in bytes. */
  size: number;
}

/** The words the row uses, for translation. `{label}`, `{name}`, `{size}`, `{types}` and `{reason}` are filled in. */
export interface DocumentUploadRowLabels {
  /** Beside the name of a document that must be provided. Default "Required". */
  required?: string;
  /** Beside the name of a document that may be left out. Default "Optional". */
  optional?: string;
  /** The status of a document nobody has provided. Default "Missing". */
  missing?: string;
  /** The status while the file is on its way, before the percentage. Default "Uploading". */
  uploading?: string;
  /** The status of a document that was provided. Default "Uploaded". */
  uploaded?: string;
  /** The status of a document with a problem. Default "Needs attention". */
  attention?: string;
  /** The reason shown when the status is "attention" and you gave none. Default "Something is wrong with this file. Replace it to continue." */
  attentionDefault?: string;
  /** The button that opens the file chooser. Default "Choose file". */
  choose?: string;
  /** The button that swaps the file for another. Default "Replace". */
  replace?: string;
  /** The button that takes the file away. Default "Remove". */
  remove?: string;
  /** The button that stops an upload. Default "Cancel". */
  cancel?: string;
  /** The requirement line when you gave no `description` but a `maxSize`. Default "Up to {size}". */
  upTo?: string;
  /** Said when a file's type is not accepted. Default "{name} cannot be used. Accepted: {types}." */
  wrongType?: string;
  /** Said when a file is too big. Default "{name} is {size}. The limit is {max}." */
  tooLarge?: string;
  /** Said when a form is sent without a required document. Default "Add this document to continue." */
  needed?: string;
  /** Said when a file has nothing in it. Default "{name} is empty." */
  empty?: string;
  /** The name of the progress bar. Default "Uploading {name}". */
  progressName?: string;
  /** Read out when the status is missing. Default "{label}: missing." */
  srMissing?: string;
  /** Read out when the status is uploading. Default "{label}: uploading {name}." */
  srUploading?: string;
  /** Read out when the status is uploaded. Default "{label}: uploaded, {name}." */
  srUploaded?: string;
  /** Read out when the status is attention. Default "{label}: needs attention. {reason}" */
  srAttention?: string;
}

export interface DocumentUploadRowProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** What is being asked for: "Passport or ID card". */
  label: string;
  /** What is accepted, in words: "PDF or photo, up to 10 MB". Without it the row says the size limit, when there is one. */
  description?: string;
  /** The types the file input accepts, as the input takes them: ".pdf,image/*". A file of another type is turned away with the reason, before `onFileChange` is called. */
  accept?: string;
  /** The largest file in bytes. A bigger one is turned away with the reason, before `onFileChange` is called. */
  maxSize?: number;
  /** Where the document stands. Leave it out and it follows the file: "uploaded" with one, "missing" without, "attention" when you pass an `error`. */
  status?: DocumentStatus;
  /** How far the upload is, from 0 to 100, while the status is "uploading". Leave it out for an upload with no known end. */
  progress?: number;
  /** The file that is provided. Leave it out and the row remembers the one that was chosen; pass it (or `null`) to control it, or to show what your server already has. */
  file?: DocumentFile | null;
  /** Why the document needs attention, in words: "The scan is blurry. Upload a sharper one." Shown under the file when the status is "attention". */
  error?: string;
  /** Whether the document must be provided. It is said in words beside the name, not only with an asterisk, and a form with a required row will not submit without a file: the row says so and focus goes to its Choose button. */
  required?: boolean;
  /** Called with the chosen file once it passes the type and size checks, and with `null` when it is removed or the upload is cancelled. Start the upload here. */
  onFileChange?: (file: File | null) => void;
  /** The field's name, for a plain form submit: the file input stays in the form, so FormData and server actions get the file. */
  name?: string;
  /** An icon for the document, as an element, in the tile before its name. Default is a page. */
  icon?: ReactNode;
  /** Turns the row off, for a form that was sent. */
  disabled?: boolean;
  /** The language of the sizes and the percentage. Default "en-US". */
  locale?: string;
  /** The words the row uses, for translation. */
  labels?: DocumentUploadRowLabels;
}

const DEFAULT_LABELS = {
  required: "Required",
  optional: "Optional",
  missing: "Missing",
  uploading: "Uploading",
  uploaded: "Uploaded",
  attention: "Needs attention",
  attentionDefault: "Something is wrong with this file. Replace it to continue.",
  choose: "Choose file",
  replace: "Replace",
  remove: "Remove",
  cancel: "Cancel",
  upTo: "Up to {size}",
  wrongType: "{name} cannot be used. Accepted: {types}.",
  tooLarge: "{name} is {size}. The limit is {max}.",
  needed: "Add this document to continue.",
  empty: "{name} is empty.",
  progressName: "Uploading {name}",
  srMissing: "{label}: missing.",
  srUploading: "{label}: uploading {name}.",
  srUploaded: "{label}: uploaded, {name}.",
  srAttention: "{label}: needs attention. {reason}",
} satisfies Required<DocumentUploadRowLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Puts a file into the real input, so FormData has it however it arrived: chosen, or dropped on the row. */
function putInInput(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  try {
    const transfer = new DataTransfer();
    if (file) transfer.items.add(file);
    input.files = transfer.files;
  } catch {
    // A browser without DataTransfer keeps whatever the input already holds.
  }
}

/**
 * One document someone has to provide, as a row: an icon, its name with
 * "Required" or "Optional" said in words, what is accepted, a status (Missing,
 * Uploading with a percentage, Uploaded, Needs attention with the reason), the
 * chosen file with its size, and the buttons that fit the moment: Choose,
 * Replace and Remove, or Cancel while it uploads. It wraps a real file input,
 * so the keyboard, FormData and server actions work, and a file can also be
 * dropped on the row. The type and size are checked before `onFileChange` is
 * called, and a file that fails is turned away with the reason in words. The
 * row never uploads: `onFileChange` is where you start, and `status` and
 * `progress` are how you say how it went. Stack several rows to make a
 * checklist. The status is a polite live region, so a change of state is heard,
 * and when the button that was pressed goes away focus moves to the one that
 * took its place.
 */
export function DocumentUploadRow({
  label,
  description,
  accept,
  maxSize,
  status,
  progress,
  file,
  error,
  required = false,
  onFileChange,
  name,
  icon,
  disabled = false,
  locale = "en-US",
  labels,
  className,
  ...props
}: DocumentUploadRowProps) {
  const text: Required<DocumentUploadRowLabels> = { ...DEFAULT_LABELS, ...labels };
  const labelId = useId();
  const descriptionId = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const choose = useRef<HTMLButtonElement>(null);
  // The file the input holds. Some browsers empty the input when the chooser is opened again and cancelled; this puts it back.
  const held = useRef<File | null>(null);
  const inside = useRef(false);
  const [own, setOwn] = useState<DocumentFile | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const chosen = file === undefined ? own : file;
  const base: DocumentStatus = status ?? (error ? "attention" : chosen ? "uploaded" : "missing");
  const shown: DocumentStatus = problem ? "attention" : base;
  const reason = problem ?? (shown === "attention" ? (error ?? text.attentionDefault) : undefined);
  const hasFile = chosen !== null && chosen !== undefined;
  const uploading = shown === "uploading";
  const requirement = description ?? (maxSize ? fill(text.upTo, { size: formatBytes(maxSize, locale) }) : undefined);
  const percent = typeof progress === "number" ? formatPercent(progress, locale) : null;

  /** The type and size checks. Returns what is wrong, in words, or `null`. */
  function refusal(next: File): string | null {
    if (!acceptsFile(next, accept)) return fill(text.wrongType, { name: next.name, types: acceptWords(accept) });
    if (next.size === 0) return fill(text.empty, { name: next.name });
    if (maxSize !== undefined && next.size > maxSize) return fill(text.tooLarge, { name: next.name, size: formatBytes(next.size, locale), max: formatBytes(maxSize, locale) });
    return null;
  }

  function take(next: File | null) {
    if (next) {
      const wrong = refusal(next);
      if (wrong) {
        setProblem(wrong);
        // The input must not keep a file the row turned away.
        putInInput(input.current, held.current);
        return;
      }
    }
    held.current = next;
    putInInput(input.current, next);
    setProblem(null);
    if (file === undefined) setOwn(next ? { name: next.name, size: next.size } : null);
    onFileChange?.(next);
  }

  function onDrag(event: DragEvent<HTMLDivElement>, entering: boolean) {
    if (disabled || uploading || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setOver(entering);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    if (disabled || uploading || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) take(dropped);
  }

  function onRowBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      inside.current = false;
      setOver(false);
    }
  }

  // The button that was pressed can leave with the state it belonged to (Choose gives way to Cancel, Remove to Choose). Focus goes to the one that took its place.
  useEffect(() => {
    if (!inside.current || document.activeElement !== document.body) return;
    actions.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus({ preventScroll: true });
  }, [shown, hasFile]);

  const sentence =
    shown === "uploaded"
      ? fill(text.srUploaded, { label, name: chosen?.name ?? "" })
      : shown === "uploading"
        ? fill(text.srUploading, { label, name: chosen?.name ?? "" })
        : shown === "attention"
          ? fill(text.srAttention, { label, reason: reason ?? "" })
          : fill(text.srMissing, { label });

  /** A form was sent without this required document. The input is hidden, so the browser's own bubble would point at nothing: say it in the row, and put focus on the button that fixes it. */
  function onNeeded(event: SyntheticEvent<HTMLInputElement>) {
    event.preventDefault();
    setProblem(fill(text.needed, { label }));
    // Every empty row is told. Focus goes to the first invalid control of the form only, which is where the browser would have put it.
    const first = event.currentTarget.form?.querySelector("input:invalid, select:invalid, textarea:invalid");
    if (!first || first === event.currentTarget) choose.current?.focus();
  }

  const chooseButton = (
    <Button ref={choose} type="button" variant="outline" size="sm" disabled={disabled} onClick={() => input.current?.click()}>
      {chosen ? <IconRefresh /> : <IconUpload />}
      {chosen ? text.replace : text.choose}
      <span className="sr-only"> {label}</span>
    </Button>
  );

  return (
    <div
      ref={root}
      data-slot="document-upload-row"
      data-status={shown}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={requirement ? descriptionId : undefined}
      className={cn(
        "@container rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
        shown === "attention" ? "border-destructive/40" : "border-border",
        over && "border-foreground bg-muted/60",
        className,
      )}
      {...props}
      onDragEnter={(event) => onDrag(event, true)}
      onDragOver={(event) => onDrag(event, true)}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={onDrop}
      onFocus={() => {
        inside.current = true;
      }}
      onBlur={onRowBlur}
    >
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-foreground [&_svg]:size-5">
          {icon ?? <IconFile />}
        </span>

        <div className="min-w-0 flex-1">
          {/* The status wraps under the name when the row is narrow, so the name and the description keep the width they need. */}
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <p id={labelId} className="min-w-0 flex-1 basis-40 text-sm leading-5 font-medium">
              {label}
              <span className="ms-2 text-xs font-normal text-muted-foreground">{required ? text.required : text.optional}</span>
            </p>
            {/* Said in the live region below, in a sentence; this is for the eyes. */}
            <Badge aria-hidden="true" variant={shown === "attention" ? "destructive" : shown === "uploaded" ? "muted" : "outline"} className={cn("mt-px", shown === "attention" && "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]")}>
              {shown === "missing" ? <IconMinusCircle /> : shown === "uploading" ? <IconSpinner /> : shown === "uploaded" ? <IconCheck /> : <IconAlertCircle />}
              <span className="tabular-nums">{shown === "missing" ? text.missing : shown === "uploading" ? (percent ? `${text.uploading} ${percent}` : text.uploading) : shown === "uploaded" ? text.uploaded : text.attention}</span>
            </Badge>
          </div>
          {requirement ? (
            <p id={descriptionId} className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {requirement}
            </p>
          ) : null}

          {chosen && shown !== "missing" ? (
            <div className="mt-3 flex min-w-0 items-start gap-2 rounded-lg bg-muted/60 px-2.5 py-2 text-sm">
              <IconPaperclip aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {/* The size drops under the name when the row is narrow, so a file name keeps room for its words and its extension. */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <span className="min-w-0 flex-1 basis-32 leading-5 [overflow-wrap:anywhere]">{chosen.name}</span>
                <span suppressHydrationWarning className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatBytes(chosen.size, locale)}
                </span>
              </div>
            </div>
          ) : null}

          {uploading ? <Progress value={typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : undefined} aria-label={fill(text.progressName, { name: chosen?.name ?? label })} className="mt-3 h-1.5" /> : null}

          {reason ? (
            <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              {reason}
            </p>
          ) : null}

          <div ref={actions} className="mt-3 flex flex-wrap items-center gap-2">
            {uploading ? (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => take(null)} className="text-muted-foreground hover:text-foreground">
                {text.cancel}
                <span className="sr-only"> {label}</span>
              </Button>
            ) : (
              <>
                {chooseButton}
                {chosen ? (
                  <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => take(null)} className="text-muted-foreground hover:text-foreground">
                    {text.remove}
                    <span className="sr-only"> {label}</span>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={input}
        type="file"
        name={name}
        accept={accept}
        required={required && !chosen}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onInvalid={onNeeded}
        onChange={(event) => {
          const next = event.target.files?.[0];
          // Cancelling the chooser can empty the input; that is not a request to remove the file.
          if (!next) putInInput(input.current, held.current);
          else take(next);
        }}
      />
      <p role="status" className="sr-only">
        {sentence}
      </p>
    </div>
  );
}
