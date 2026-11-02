"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type PointerEvent } from "react";

import { IconAlertCircle, IconFile, IconFileCode, IconFileImage, IconFileSheet, IconFileText, IconInfo } from "@rhs-ui/icons";
import { cleanExtension, cleanName, DEFAULT_LABELS, describeRefused, isTaken, nextFreeName, splitName, type FileNameLabels } from "@rhs-ui/primitives/filename-field/names";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export type { FileNameLabels } from "@rhs-ui/primitives/filename-field/names";

export interface FileNameFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "maxLength" | "name" | "children"> {
  /** The whole name, extension included: "quarterly-report.pdf". */
  value?: string;
  /** The name to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the whole name (the extension put back behind the name, spaces trimmed) on every change, and whether it can be used: not empty and not already taken. */
  onValueChange?: (name: string, state: { valid: boolean }) => void;
  /** The names that exist already, extension included. A name that matches one (capitals ignored) is flagged in words, with the next free one as a button. */
  taken?: readonly string[];
  /** The longest whole name, extension included. Default 255. */
  maxLength?: number;
  /** Let the extension be edited too, in a box of its own, with a warning while it differs from the one you started with. The box stays when it is emptied, so an extension can be typed back or added to a name that had none. Default false: it is fixed. */
  extensionEditable?: boolean;
  /** The field's name for a plain form submit: the whole name in one hidden input. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<FileNameLabels>;
}

const IMAGES = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg", ".heic"]);
const SHEETS = new Set([".csv", ".tsv", ".xls", ".xlsx", ".ods", ".numbers"]);
const CODE = new Set([".js", ".ts", ".tsx", ".jsx", ".json", ".html", ".css", ".xml", ".yml", ".yaml", ".sh", ".py"]);
const TEXT = new Set([".txt", ".md", ".doc", ".docx", ".pdf", ".rtf", ".odt", ".pages"]);

/** A file icon that suits the extension: the picture, the sheet, the code, the document. */
function iconFor(extension: string) {
  const known = extension.toLowerCase();
  return IMAGES.has(known) ? IconFileImage : SHEETS.has(known) ? IconFileSheet : CODE.has(known) ? IconFileCode : TEXT.has(known) ? IconFileText : IconFile;
}

// InputGroup keeps its neutral focus ring even on an invalid field; a clash keeps its error colour while someone is fixing it.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

/**
 * Renaming a file without breaking it. The name is the only thing in the input:
 * the extension sits behind it as a fixed part of the field, so it cannot be
 * deleted by accident, and typing or pasting it again is caught. Characters a
 * file name cannot hold are refused with the reason in words ("Names cannot
 * contain a slash"), spaces at the ends are trimmed, and a name that is in
 * `taken` is flagged with the next free one offered. Focusing the field selects
 * the whole name, the way a file manager does when you rename. With
 * `extensionEditable` the extension gets a box of its own and a warning when it
 * changes; the box stays when it is emptied (even for a name that had no
 * extension), so one can always be typed back or added. It reports the whole
 * name, extension included.
 */
export function FileNameField({
  value,
  defaultValue = "",
  onValueChange,
  taken = [],
  maxLength = 255,
  extensionEditable = false,
  name,
  labels: labelOverrides,
  disabled,
  className,
  onFocus,
  onBlur,
  onPointerDown,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ref,
  ...props
}: FileNameFieldProps) {
  const uid = useId();
  const messageId = `${uid}-message`;
  const extensionId = `${uid}-extension`;
  const labels: FileNameLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const initial = splitName(value ?? defaultValue);
  const [base, setBase] = useState(initial.base);
  const [extension, setExtension] = useState(initial.extension);
  const [synced, setSynced] = useState(value);
  // What the extension box shows while it has the focus: a lone dot stays in it, though it is no extension yet.
  const [draftExtension, setDraftExtension] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [left, setLeft] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);
  // The extension the field started with, to warn when an editable one is changed.
  const original = useRef(initial.extension);
  // A press that put the focus in the field must not take the selection away again when the button comes up.
  const pressing = useRef(false);
  const selectedByPress = useRef(false);
  const announce = useRef<number | undefined>(undefined);

  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const whole = (nextBase: string, nextExtension: string) => nextBase.trim().replace(/\.+$/, "") + nextExtension;

  // A name that arrives from outside replaces what is typed, unless it is only the tidy form of it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== whole(base, extension)) {
      const parts = splitName(value);
      setBase(parts.base);
      setExtension(parts.extension);
      setDraftExtension(null);
    }
  }

  useEffect(() => () => window.clearTimeout(announce.current), []);

  const trimmed = base.trim().replace(/\.+$/, "");
  const full = trimmed + extension;
  const clash = trimmed !== "" && isTaken(full, taken);
  const empty = trimmed === "" && left;
  const free = clash ? nextFreeName(full, taken) : null;
  const changed = extensionEditable && extension.toLowerCase() !== original.current.toLowerCase();

  function report(nextBase: string, nextExtension: string) {
    const next = whole(nextBase, nextExtension);
    onValueChange?.(next, { valid: nextBase.trim() !== "" && !isTaken(next, taken) });
  }

  /** A note that goes by itself: it says what was just refused, and does not stay to be read after the key that caused it. */
  function flash(message: string) {
    window.clearTimeout(announce.current);
    setNote(message);
    announce.current = window.setTimeout(() => setNote(null), 4500);
  }

  function type(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const cleaned = cleanName(node.value, node.selectionStart ?? node.value.length, Math.max(1, maxLength - extension.length));
    let next = cleaned.value;
    let caret = cleaned.caret;
    let message = cleaned.refused.length > 0 ? labels.forbidden(describeRefused(cleaned.refused)) : cleaned.tooLong ? labels.tooLong(maxLength) : null;
    // The extension is fixed behind the name: typing or pasting it again would double it.
    if (!extensionEditable && extension !== "" && next.length > extension.length && next.toLowerCase().endsWith(extension.toLowerCase())) {
      next = next.slice(0, -extension.length);
      caret = next.length;
      message = labels.duplicateExtension(extension);
    }
    // The field is put right here, before React looks at it, so a key that is dropped does not throw the caret to the end.
    if (node.value !== next) {
      node.value = next;
      node.setSelectionRange(caret, caret);
    }
    setBase(next);
    if (message) flash(message);
    report(next, extension);
  }

  function typeExtension(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const raw = node.value;
    const draft = cleanExtension(raw, true);
    // Put right here, before React looks at it, so the dot that is kept in front does not throw the caret to the end.
    if (raw !== draft) {
      const caret = node.selectionStart ?? raw.length;
      node.value = draft;
      const at = Math.max(draft.startsWith(".") ? 1 : 0, Math.min(draft.length, caret + draft.length - raw.length));
      node.setSelectionRange(at, at);
    }
    // A dot on its own stays in the box, but the name is reported without an extension until something follows it.
    const next = draft === "." ? "" : draft;
    setDraftExtension(draft);
    setExtension(next);
    report(base, next);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    setLeft(true);
    setNote(null);
    window.clearTimeout(announce.current);
    if (trimmed !== base) {
      setBase(trimmed);
      report(trimmed, extension);
    }
  }

  function use(next: string) {
    const parts = splitName(next);
    setBase(parts.base);
    setExtension(parts.extension);
    report(parts.base, parts.extension);
    input.current?.focus();
  }

  function press(event: PointerEvent<HTMLInputElement>) {
    onPointerDown?.(event);
    pressing.current = true;
  }

  const Icon = iconFor(extension);
  const problem = empty ? labels.empty : clash ? labels.taken(full) : null;
  const message = problem ?? note ?? (changed ? labels.extensionChanged(original.current, extension) : null);
  const shownExtension = draftExtension ?? extension;

  return (
    <div data-slot="filename-field" className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <InputGroup className={STAYS_RED}>
        <InputGroupAddon aria-hidden="true">
          <Icon />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...props}
          ref={attach}
          disabled={disabled}
          value={base}
          aria-label={props.id === undefined && ariaLabel === undefined && labelledBy === undefined ? labels.name : ariaLabel}
          aria-labelledby={labelledBy}
          aria-invalid={problem ? true : undefined}
          aria-describedby={[describedBy, extension !== "" && !extensionEditable ? extensionId : "", message ? messageId : ""].filter(Boolean).join(" ") || undefined}
          onChange={type}
          onBlur={leave}
          onPointerDown={press}
          onFocus={(event: FocusEvent<HTMLInputElement>) => {
            onFocus?.(event);
            // Like a file manager: the name is selected, the extension is not part of it.
            event.currentTarget.select();
            selectedByPress.current = pressing.current;
          }}
          onMouseUp={(event) => {
            if (selectedByPress.current) event.preventDefault();
            selectedByPress.current = false;
            pressing.current = false;
          }}
        />
        {extensionEditable ? (
          // The box stays whatever it holds: emptied, it shows its placeholder and still has the focus, and a name without an extension can be given one.
          <span
            data-value={shownExtension === "" ? labels.extensionPlaceholder : shownExtension}
            className={cn(
              "relative inline-grid h-full min-w-12 shrink-0 rounded-r-[inherit] border-l border-border text-sm transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-muted/40 has-[input:focus-visible]:bg-muted has-[input:disabled]:hover:bg-transparent",
              // What the box holds (or its placeholder), drawn unseen in the same cell, gives the box its width: a count of ch is never right for a proportional face.
              "after:invisible after:col-start-1 after:row-start-1 after:pr-3.5 after:pl-3 after:whitespace-pre after:content-[attr(data-value)]",
            )}
          >
            <input
              type="text"
              size={1}
              aria-label={labels.extension}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              disabled={disabled}
              placeholder={labels.extensionPlaceholder}
              value={shownExtension}
              onChange={typeExtension}
              onBlur={() => setDraftExtension(null)}
              className="col-start-1 row-start-1 h-full w-full min-w-0 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
          </span>
        ) : extension === "" ? null : (
          <span id={extensionId} aria-disabled={disabled || undefined} className="flex h-full shrink-0 items-center rounded-r-[inherit] border-l border-border bg-muted/50 px-3 text-sm text-muted-foreground select-none">
            <span aria-hidden="true">{extension}</span>
            <span className="sr-only">{labels.fixedExtension(extension)}</span>
          </span>
        )}
      </InputGroup>
      <div role="status">
        {message ? (
          <p id={messageId} className={cn("mt-1.5 flex items-start gap-1.5 text-xs", problem ? "text-destructive" : "text-muted-foreground")}>
            {problem ? <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" /> : <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />}
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {message}
              {free ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => use(free)}
                    className="-mx-0.5 rounded-sm px-0.5 text-left font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    {labels.useFree(free)}
                  </button>
                </>
              ) : null}
            </span>
          </p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={full} disabled={disabled} /> : null}
    </div>
  );
}
