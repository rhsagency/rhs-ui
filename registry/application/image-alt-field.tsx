"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type DragEvent, type SyntheticEvent } from "react";

import { IconAlertCircle, IconCheck, IconImage, IconInfo, IconPaperclip, IconRefresh, IconTrash, IconUpload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

/** What the field reports: the image that was chosen, how it is described, and whether it needs no description. */
export interface ImageAltValue {
  /** The file that was chosen, or `null` when there is none, or the picture is the one in `src`. */
  file: File | null;
  /** The description, empty when the image is decorative. */
  alt: string;
  /** Whether the image was marked as decorative: a deliberate choice that it needs no description. */
  decorative: boolean;
}

/** The words the field uses, for translation. `{name}`, `{size}`, `{types}`, `{max}` and `{count}` are filled in. */
export interface ImageAltFieldLabels {
  /** The label of the description box. Default "Alt text". */
  field?: string;
  /** Under the label. Default "Read aloud by screen readers, and shown where the image cannot load." */
  fieldHint?: string;
  /** Beside the label when `required` is set. Default "Required". */
  required?: string;
  /** In the empty box. Default "Describe the image for someone who cannot see it". */
  placeholder?: string;
  /** In the box while the image is decorative. Default "Decorative: no description needed". */
  decorativePlaceholder?: string;
  /** The count under the box. Default "{count} / {max}". */
  count?: string;
  /** The checkbox. Default "This image is decorative". */
  decorative?: string;
  /** Under the checkbox. Default "It adds no information, so screen readers skip it. The description stays empty." */
  decorativeHint?: string;
  /** The button that opens the file chooser, before there is an image. Default "Choose an image". */
  choose?: string;
  /** Under it. Default "Or drop one here." */
  chooseHint?: string;
  /** The button that swaps the image. Default "Replace". */
  replace?: string;
  /** The button that takes the image away, with its description. Default "Remove". */
  remove?: string;
  /** Advice while there is no image. Default "Choose an image first, then describe it." */
  adviceNoImage?: string;
  /** Advice while the box is empty. Default "Describe what the image shows, not that it is an image." */
  adviceEmpty?: string;
  /** Advice when the text starts with "image of" or "photo of". Default "Skip \"image of\" and \"photo of\". Screen readers already say it is an image." */
  adviceStarts?: string;
  /** Advice when the text looks like a file name. Default "That looks like a file name. Say what the image shows instead." */
  adviceFilename?: string;
  /** Advice when the text is very short. Default "A little more helps: who or what is in it, and where." */
  adviceShort?: string;
  /** Advice when the text is near the limit. Default "Getting long. Keep what matters here, and leave the rest to the page text." */
  adviceLong?: string;
  /** Advice when the text is fine. Default "Good. This is read aloud in place of the image." */
  adviceGood?: string;
  /** Advice while the image is decorative. Default "Decorative images are skipped by screen readers." */
  adviceDecorative?: string;
  /** The error when `invalid` is set and the image has neither a description nor the decorative mark. Default "Add a description, or mark this image as decorative." */
  missingAlt?: string;
  /** The error when `invalid` and `required` are set and there is no image. Default "Choose an image." */
  missingImage?: string;
  /** Said when a file's type is not accepted. Default "{name} cannot be used. Accepted: {types}." */
  wrongType?: string;
  /** Said when a file is too big. Default "{name} is {size}. The limit is {max}." */
  tooLarge?: string;
}

export interface ImageAltFieldProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The address of the picture, when it already exists: your CDN, or a saved record. A file the person chooses is previewed from the file itself and wins over this. */
  src?: string;
  /** The file, the description and the decorative mark, when you control them. */
  value?: ImageAltValue;
  /** What to start with, when you do not control the value. */
  defaultValue?: Partial<ImageAltValue>;
  /** Called with `{ file, alt, decorative }` on every change: a file chosen or removed, a letter typed, the mark switched. */
  onValueChange?: (value: ImageAltValue) => void;
  /** Called with the chosen file once it passes the type and size checks, and with `null` when the image is removed. Start the upload here. When the picture came from `src`, clear `src` yourself on `null`. */
  onFileChange?: (file: File | null) => void;
  /** The types the file input accepts, as the input takes them. A file of another type is turned away with the reason. Default "image/*". */
  accept?: string;
  /** The largest file in bytes. A bigger one is turned away with the reason. */
  maxSize?: number;
  /** The most characters in the description, shown as a count. Long alt text is rarely better; the usual guide is about 125. Default 125. */
  maxLength?: number;
  /** Marks the description as needed: said in words beside the label, and read out as required. It makes the image needed too: a form is not sent without one, the field shows the error and focus goes to its Choose button. */
  required?: boolean;
  /** Shows what is missing as an error: set it after a failed submit. A description that is empty and not marked decorative is the error; with `required`, so is a missing image. */
  invalid?: boolean;
  /** The field's name, for a plain form submit: the file is `name`, the description `nameAlt` and the mark `nameDecorative`. */
  name?: string;
  /** Turns the whole field off. */
  disabled?: boolean;
  /** The language of the sizes in messages. Default "en-US". */
  locale?: string;
  /** The words the field uses, for translation. */
  labels?: ImageAltFieldLabels;
}

const DEFAULT_LABELS = {
  field: "Alt text",
  fieldHint: "Read aloud by screen readers, and shown where the image cannot load.",
  required: "Required",
  placeholder: "Describe the image for someone who cannot see it",
  decorativePlaceholder: "Decorative: no description needed",
  count: "{count} / {max}",
  decorative: "This image is decorative",
  decorativeHint: "It adds no information, so screen readers skip it. The description stays empty.",
  choose: "Choose an image",
  chooseHint: "Or drop one here.",
  replace: "Replace",
  remove: "Remove",
  adviceNoImage: "Choose an image first, then describe it.",
  adviceEmpty: "Describe what the image shows, not that it is an image.",
  adviceStarts: 'Skip "image of" and "photo of". Screen readers already say it is an image.',
  adviceFilename: "That looks like a file name. Say what the image shows instead.",
  adviceShort: "A little more helps: who or what is in it, and where.",
  adviceLong: "Getting long. Keep what matters here, and leave the rest to the page text.",
  adviceGood: "Good. This is read aloud in place of the image.",
  adviceDecorative: "Decorative images are skipped by screen readers.",
  missingAlt: "Add a description, or mark this image as decorative.",
  missingImage: "Choose an image.",
  wrongType: "{name} cannot be used. Accepted: {types}.",
  tooLarge: "{name} is {size}. The limit is {max}.",
} satisfies Required<ImageAltFieldLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const STARTS = /^(?:an?\s+|the\s+)?(?:image|picture|photo|photograph|graphic|screenshot|icon|illustration)\s*(?:of|showing|with|that|:)/i;
const FILENAME = /\b[\w-]+\.(?:jpe?g|png|gif|webp|avif|svg|heic|tiff?)\b|^(?:img|dsc|dscn|pxl|screenshot|screen shot)[\s_.-]?\d{2,}/i;

type Advice = "noImage" | "empty" | "starts" | "filename" | "short" | "long" | "good" | "decorative";

/** The one line of advice for what is in the box now. It changes with the text, and says nothing worse than it has to. */
function adviceFor(alt: string, decorative: boolean, hasImage: boolean, maxLength: number): Advice {
  if (!hasImage) return "noImage";
  if (decorative) return "decorative";
  const text = alt.trim();
  if (text === "") return "empty";
  if (STARTS.test(text)) return "starts";
  if (FILENAME.test(text)) return "filename";
  if (text.length < 12) return "short";
  if (text.length > maxLength * 0.8) return "long";
  return "good";
}

const ACCEPT_KINDS: Record<string, string> = { "image/*": "image" };
const ACCEPT_SUBTYPES: Record<string, string> = { jpeg: "JPG", jpg: "JPG", "svg+xml": "SVG", webp: "WebP", heic: "HEIC", avif: "AVIF" };

function accepts(file: { name: string; type: string }, accept: string): boolean {
  const rules = accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

/** An `accept` list in words: "image/png,image/webp" becomes "PNG or WebP". */
function typesIn(accept: string): string {
  const words: string[] = [];
  for (const rule of accept.split(",")) {
    const token = rule.trim().toLowerCase();
    if (!token) continue;
    const subtype = token.startsWith(".") ? token.slice(1) : token.split("/")[1];
    const word = ACCEPT_KINDS[token] ?? (subtype ? (ACCEPT_SUBTYPES[subtype] ?? subtype.toUpperCase()) : token);
    if (!words.includes(word)) words.push(word);
  }
  if (words.length <= 1) return words[0] ?? "";
  return `${words.slice(0, -1).join(", ")} or ${words[words.length - 1]}`;
}

function sizeIn(bytes: number, locale: string): string {
  const [amount, unit]: readonly [number, string] = bytes < 1000 ? [bytes, "byte"] : bytes < 1e6 ? [bytes / 1e3, "kilobyte"] : bytes < 1e9 ? [bytes / 1e6, "megabyte"] : [bytes / 1e9, "gigabyte"];
  const options: Intl.NumberFormatOptions = { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: unit === "byte" || unit === "kilobyte" ? 0 : 1 };
  try {
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch {
    // An unknown locale must not take the page down.
    return new Intl.NumberFormat("en-US", options).format(amount);
  }
}

/** An address for a chosen file, made once and given back when the file changes or the field goes. */
function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const made = URL.createObjectURL(file);
    setUrl(made);
    return () => URL.revokeObjectURL(made);
  }, [file]);
  return url;
}

/**
 * Upload an image and describe it in the same place. The image sits on a
 * muted surface with Replace and Remove; under it is a labelled alt text box
 * with a guide length and one line of advice that changes with the text
 * ("Describe what the image shows, not that it is an image", then a nudge
 * against "image of", against a file name, against a single word, against a
 * paragraph, and a quiet "Good" when it is fine). "This image is decorative"
 * is a checkbox that empties the box and switches it off, so decorative is a
 * decision someone makes and not a field that was forgotten; unchecking it
 * brings the old text back. It reports `{ file, alt, decorative }`, and with
 * `invalid` it says what is missing: a description, or the decorative mark.
 * The type and size are checked before a file is taken, a file can be dropped
 * on the field, and the real file input stays in the form.
 */
export function ImageAltField({
  src,
  value,
  defaultValue,
  onValueChange,
  onFileChange,
  accept = "image/*",
  maxSize,
  maxLength = 125,
  required = false,
  invalid = false,
  name,
  disabled = false,
  locale = "en-US",
  labels,
  className,
  ...props
}: ImageAltFieldProps) {
  const text: Required<ImageAltFieldLabels> = { ...DEFAULT_LABELS, ...labels };
  const fieldId = useId();
  const hintId = useId();
  const adviceId = useId();
  const errorId = useId();
  const markId = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  // Whether the cursor is somewhere in the field, which a removed button cannot tell us after it is gone.
  const inside = useRef(false);
  // What was typed before the image was marked decorative, so unchecking it gives it back.
  const stash = useRef("");
  const [own, setOwn] = useState<ImageAltValue>({ file: null, alt: "", decorative: false, ...defaultValue });
  const [problem, setProblem] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  // A form was sent while a required image was still missing: the same error as `invalid`, shown by the field itself.
  const [blocked, setBlocked] = useState(false);

  const current = value ?? own;
  const objectUrl = useObjectUrl(current.file);
  const preview = objectUrl ?? src ?? null;
  const hasImage = preview !== null || current.file !== null;
  const advice = adviceFor(current.alt, current.decorative, hasImage, maxLength);
  const missingAlt = invalid && hasImage && !current.decorative && current.alt.trim() === "";
  const missingImage = (invalid || blocked) && required && !hasImage;
  const error = missingAlt ? text.missingAlt : missingImage ? text.missingImage : null;
  const adviceText = { noImage: text.adviceNoImage, empty: text.adviceEmpty, starts: text.adviceStarts, filename: text.adviceFilename, short: text.adviceShort, long: text.adviceLong, good: text.adviceGood, decorative: text.adviceDecorative }[advice];
  const nearLimit = current.alt.length >= maxLength * 0.9;

  // Choosing an image swaps the picker for the preview, and Remove swaps it back: the button that was pressed leaves, and focus goes to the one that took its place.
  useEffect(() => {
    // Once there is an image the missing one is no longer news; taking it away again starts clean.
    if (hasImage) setBlocked(false);
    if (!inside.current || document.activeElement !== document.body) return;
    root.current?.querySelector<HTMLElement>("[data-primary]:not([disabled])")?.focus({ preventScroll: true });
  }, [hasImage]);

  function update(patch: Partial<ImageAltValue>) {
    const next: ImageAltValue = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  /** Puts a file into the real input, so FormData has what the field shows however it arrived: chosen, or dropped on the field. */
  function putInInput(next: File | null) {
    const element = input.current;
    if (!element) return;
    try {
      const transfer = new DataTransfer();
      if (next) transfer.items.add(next);
      element.files = transfer.files;
    } catch {
      // A browser without DataTransfer keeps whatever the input already holds.
    }
  }

  function take(file: File | null) {
    if (file) {
      const wrong = !accepts(file, accept)
        ? fill(text.wrongType, { name: file.name, types: typesIn(accept) })
        : maxSize !== undefined && file.size > maxSize
          ? fill(text.tooLarge, { name: file.name, size: sizeIn(file.size, locale), max: sizeIn(maxSize, locale) })
          : null;
      if (wrong) {
        setProblem(wrong);
        // The input must not keep a file the field turned away.
        putInInput(current.file);
        return;
      }
    }
    putInInput(file);
    setProblem(null);
    onFileChange?.(file);
    // A new image keeps what was written; taking the image away takes its description with it.
    update(file ? { file } : { file: null, alt: "", decorative: false });
  }

  function mark(next: boolean) {
    if (next) {
      stash.current = current.alt;
      update({ decorative: true, alt: "" });
      return;
    }
    update({ decorative: false, alt: current.alt === "" ? stash.current : current.alt });
    // The box is off until the new state is on the page; then the cursor goes into it.
    requestAnimationFrame(() => area.current?.focus({ preventScroll: true }));
  }

  const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");

  /** A form was sent without the required image. The input is hidden, so the browser's own bubble would point at nothing: show the error in the field, and put focus on the button that fixes it. */
  function onMissing(event: SyntheticEvent<HTMLInputElement>) {
    event.preventDefault();
    setBlocked(true);
    // Focus goes to the first invalid control of the form only, which is where the browser would have put it.
    const first = event.currentTarget.form?.querySelector("input:invalid, select:invalid, textarea:invalid");
    if (!first || first === event.currentTarget) root.current?.querySelector<HTMLElement>("[data-primary]:not([disabled])")?.focus();
  }

  const picker = hasImage ? null : (
    <div className={cn("grid justify-items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center transition-[border-color,background-color] duration-150 motion-reduce:transition-none", over ? "border-foreground bg-muted" : "border-input bg-muted/30", missingImage && "border-destructive")}>
      <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground">
        <IconImage className="size-5" />
      </span>
      <div className="grid justify-items-center gap-1">
        <Button type="button" variant="outline" size="sm" data-primary="" disabled={disabled} onClick={() => input.current?.click()}>
          <IconUpload />
          {text.choose}
        </Button>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{text.chooseHint}</p>
      </div>
    </div>
  );

  return (
    <div
      ref={root}
      data-slot="image-alt-field"
      data-state={hasImage ? (current.decorative ? "decorative" : "image") : "empty"}
      className={cn("@container grid gap-5 rounded-xl border bg-card p-4 text-card-foreground shadow-xs @lg:p-5", missingImage ? "border-destructive/50" : "border-border", className)}
      {...props}
      onFocus={() => {
        inside.current = true;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) inside.current = false;
      }}
      onDragOver={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        setOver(false);
        const dropped = event.dataTransfer.files[0];
        if (dropped) take(dropped);
      }}
    >
      {picker ?? (
        <div className="grid gap-3">
          {/* Capped, so in a wide card the description stays in view: the picture is the context here, the text is the point. It sits centred on the mat. */}
          <div className={cn("relative grid aspect-video max-h-64 w-full place-items-center overflow-hidden rounded-lg border bg-muted transition-[border-color] duration-150 motion-reduce:transition-none", over ? "border-foreground" : "border-border")}>
            {/* The description under it is the alt text; the picture here is only the preview of what is being described. */}
            {preview ? <img key={preview} src={preview} alt="" draggable={false} className="absolute inset-0 size-full object-contain p-2" /> : <IconImage aria-hidden="true" className="size-8 text-muted-foreground" />}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {current.file ? (
              <p className="flex min-w-0 items-center gap-1.5 text-xs leading-5 text-muted-foreground">
                <IconPaperclip aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere]">{current.file.name}</span>
                <span suppressHydrationWarning className="shrink-0 tabular-nums">
                  {sizeIn(current.file.size, locale)}
                </span>
              </p>
            ) : null}
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" data-primary="" disabled={disabled} onClick={() => input.current?.click()}>
                <IconRefresh />
                {text.replace}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => take(null)} className="text-muted-foreground hover:text-foreground">
                <IconTrash />
                {text.remove}
              </Button>
            </div>
          </div>
        </div>
      )}

      {missingImage ? (
        <p id={errorId} role="alert" className="-mt-2 flex items-start gap-1.5 text-xs leading-5 font-medium text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      {problem ? (
        <p role="alert" className="-mt-2 flex items-start gap-1.5 text-xs leading-5 font-medium text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{problem}</span>
        </p>
      ) : null}

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={fieldId}>{text.field}</Label>
          {required ? <span className="text-xs text-muted-foreground">{text.required}</span> : null}
        </div>
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {text.fieldHint}
        </p>
        <Textarea
          ref={area}
          id={fieldId}
          name={name ? `${name}Alt` : undefined}
          rows={3}
          value={current.alt}
          maxLength={maxLength}
          disabled={disabled || !hasImage || current.decorative}
          required={required && !current.decorative}
          aria-required={required || undefined}
          aria-invalid={missingAlt || undefined}
          aria-describedby={[hintId, adviceId, missingAlt ? errorId : null].filter(Boolean).join(" ")}
          placeholder={current.decorative ? text.decorativePlaceholder : text.placeholder}
          onChange={(event) => update({ alt: event.target.value })}
          className="min-h-[5.5rem] resize-none disabled:bg-muted/50 disabled:opacity-100 disabled:placeholder:text-muted-foreground"
        />
        <div className="flex items-start justify-between gap-3 text-xs leading-5">
          <p id={adviceId} className={cn("flex min-w-0 items-start gap-1.5", advice === "good" || advice === "decorative" || advice === "noImage" ? "text-muted-foreground" : "text-foreground")}>
            {advice === "good" ? <IconCheck aria-hidden="true" size={14} strokeWidth={2.25} className="mt-[3px] shrink-0 text-foreground" /> : <IconInfo aria-hidden="true" size={14} className="mt-[3px] shrink-0 text-muted-foreground" />}
            <span>{adviceText}</span>
          </p>
          <p className={cn("shrink-0 tabular-nums", nearLimit ? "font-medium text-foreground" : "text-muted-foreground")}>{fill(text.count, { count: String(current.alt.length), max: String(maxLength) })}</p>
        </div>
        {missingAlt ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs leading-5 font-medium text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
        <Checkbox id={markId} name={name ? `${name}Decorative` : undefined} checked={current.decorative} disabled={disabled || !hasImage} onCheckedChange={(next) => mark(next === true)} className="mt-px" />
        <div className="grid gap-1">
          <Label htmlFor={markId} className="leading-5">
            {text.decorative}
          </Label>
          <p className="text-xs leading-5 text-muted-foreground">{text.decorativeHint}</p>
        </div>
      </div>

      <input
        ref={input}
        type="file"
        name={name}
        accept={accept}
        required={required && !hasImage}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onInvalid={onMissing}
        onChange={(event) => {
          const next = event.target.files?.[0];
          // Cancelling the chooser can empty the input; that is not a request to remove the image.
          if (next) take(next);
        }}
      />
    </div>
  );
}
