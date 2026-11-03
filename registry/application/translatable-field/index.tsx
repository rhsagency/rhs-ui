"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck, IconCopy, IconMinus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

/** One language of the field. */
export interface TranslatableLocale {
  /** The code the value is stored under, and the short name on the tab: `en`, `nl`, `pt-BR`. */
  code: string;
  /** The language in words: "English", "Nederlands". Read out for the tab and used in the messages. */
  label: string;
}

/** What the field holds: the text of each language that has any, by code. A language without text has no key. */
export type TranslatableValue = Record<string, string>;

/** The words the field uses, for translation. `{language}`, `{filled}`, `{total}`, `{count}`, `{max}` and `{over}` are filled in. */
export interface TranslatableFieldLabels {
  /** Beside the label when `required` is set. Default "Required in {language}". */
  required?: string;
  /** On the tab of a language with no text. Default "Missing". */
  missing?: string;
  /** On the tab of the required language while it has no text. Default "Required". */
  needed?: string;
  /** On the tab of a language that is over `maxLength`. Default "Over limit". */
  overLimit?: string;
  /** Said for a language that has its text, for a screen reader. Default "filled". */
  filled?: string;
  /** The progress line. Default "{filled} of {total} languages filled". */
  progress?: string;
  /** The name of the list of tabs. Default "Languages". */
  languages?: string;
  /** Under the field of the default language. Default "Default language". */
  defaultLanguage?: string;
  /** Under the field of another language. Default "Translating from {language}". */
  translating?: string;
  /** The button that fills a language from the default one. Default "Copy from {language}". */
  copy?: string;
  /** The short name of that button on a narrow field. Default "Copy". */
  copyShort?: string;
  /** Said after copying. Default "Copied from {language}". */
  copied?: string;
  /** Takes the copy back. Default "Undo". */
  undo?: string;
  /** Beside the source text when the default language has none. Default "Nothing to copy yet". */
  noSource?: string;
  /** In the empty field of another language. Default "Add the {language} text". */
  placeholder?: string;
  /** The count under the field. Default "{count} / {max}". */
  count?: string;
  /** Said when a language is over `maxLength`. Default "{over} characters over the limit". */
  overBy?: string;
  /** Said when `invalid` is set and the required language has no text. Default "The {language} text is required." */
  requiredMessage?: string;
  /** The name of the field for a screen reader. Default "{label}, {language}". */
  field?: string;
}

export interface TranslatableFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The languages. The default one is moved to the front. */
  locales: readonly TranslatableLocale[];
  /** The text of each language, when you control it. */
  value?: TranslatableValue;
  /** The text to start with, when you do not control it. */
  defaultValue?: TranslatableValue;
  /** Called with the whole record on every change. A language that is emptied loses its key. */
  onValueChange?: (value: TranslatableValue) => void;
  /** The code of the default language: the first tab, the one `required` applies to and the one "Copy from" copies from. Default: the first of `locales`. */
  defaultLocale?: string;
  /** The code of the language on show, when you control it: several fields on one form can follow the same language. */
  locale?: string;
  /** Called with the code of the language that was chosen. */
  onLocaleChange?: (code: string) => void;
  /** A textarea instead of a single line. */
  multiline?: boolean;
  /** The most characters a language should have. It is a guide, not a wall: a longer text is allowed, counted in red and marked "Over limit" on its tab, because a German translation is often longer than its English source. */
  maxLength?: number;
  /** What the field is called. */
  label: string;
  /** The default language must have text. The others never need it. */
  required?: boolean;
  /** Shows what is missing as an error: set it after a failed submit. */
  invalid?: boolean;
  /** Switches the field and its copy button off. The tabs still work, so the text can be read. */
  disabled?: boolean;
  /** The field's name, for a plain form submit: each language goes out in a hidden input called `name[code]`. */
  name?: string;
  /** The words the field uses, for translation. */
  labels?: TranslatableFieldLabels;
}

const DEFAULT_LABELS = {
  required: "Required in {language}",
  missing: "Missing",
  needed: "Required",
  overLimit: "Over limit",
  filled: "filled",
  progress: "{filled} of {total} languages filled",
  languages: "Languages",
  defaultLanguage: "Default language",
  translating: "Translating from {language}",
  copy: "Copy from {language}",
  copyShort: "Copy",
  copied: "Copied from {language}",
  undo: "Undo",
  noSource: "Nothing to copy yet",
  placeholder: "Add the {language} text",
  count: "{count} / {max}",
  overBy: "{over} characters over the limit",
  requiredMessage: "The {language} text is required.",
  field: "{label}, {language}",
} satisfies Required<TranslatableFieldLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

type Status = "filled" | "missing" | "needed" | "over";

/** The field's surface comes from the container, so the input and the tabs read as one box. */
const BARE_FIELD =
  "rounded-none border-0 bg-transparent px-3.5 shadow-none focus-visible:border-transparent focus-visible:ring-0 aria-invalid:border-transparent aria-invalid:ring-0 aria-invalid:focus-visible:ring-0 disabled:opacity-60";

/**
 * One field in many languages. A tab per language, the default one first,
 * each saying in words and an icon where it stands: filled (a check),
 * missing (a dash and the word) or over the limit. Under the tabs the text of
 * the language on show, and for any other language the default text above it
 * with "Copy from English", which fills the field and can be undone.
 * It reports one record, `{ en: "Welcome", nl: "Welkom" }`, and a progress
 * line says how many languages have text. Arrow keys move between the tabs,
 * Enter or a click chooses one and the focus goes into the field, ready to
 * write in that language. `required` applies to the default language only.
 */
export function TranslatableField({
  locales,
  value,
  defaultValue,
  onValueChange,
  defaultLocale,
  locale,
  onLocaleChange,
  multiline = false,
  maxLength,
  label,
  required = false,
  invalid = false,
  disabled = false,
  name,
  labels,
  className,
  ...props
}: TranslatableFieldProps) {
  const text: Required<TranslatableFieldLabels> = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const labelId = `${base}-label`;
  const fieldId = `${base}-field`;
  const noteId = `${base}-note`;
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const focusAfter = useRef(false);

  const source = locales.find((item) => item.code === defaultLocale) ?? locales[0];
  const ordered = source ? [source, ...locales.filter((item) => item !== source)] : [];
  const [own, setOwn] = useState<TranslatableValue>(defaultValue ?? {});
  const [ownLocale, setOwnLocale] = useState(source?.code ?? "");
  const [copied, setCopied] = useState<{ code: string; previous: string } | null>(null);
  const record = value ?? own;
  const active = ordered.find((item) => item.code === (locale ?? ownLocale)) ?? source;

  // The notice that a copy can be undone does not stay for ever.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 8000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  // A language chosen on purpose is written in: the focus follows the tab into the field. It waits a frame, because a press on a tab moves the focus to the tab itself after this has run.
  useEffect(() => {
    if (!focusAfter.current) return;
    focusAfter.current = false;
    const frame = window.requestAnimationFrame(() => field.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [active?.code]);

  if (!source || !active) return null;

  const textOf = (code: string) => record[code] ?? "";
  const isFilled = (code: string) => textOf(code).trim().length > 0;
  const isOver = (code: string) => maxLength !== undefined && textOf(code).length > maxLength;
  const statusOf = (code: string): Status => (isOver(code) ? "over" : isFilled(code) ? "filled" : code === source.code && required ? "needed" : "missing");
  const filledCount = ordered.filter((item) => isFilled(item.code)).length;
  const lacksRequired = required && !isFilled(source.code);
  const isSource = active.code === source.code;
  const activeText = textOf(active.code);
  const activeOver = isOver(active.code);
  const activeInvalid = activeOver || (invalid && isSource && lacksRequired);
  const sourceText = textOf(source.code);

  function write(code: string, next: string) {
    const updated = { ...record };
    if (next === "") delete updated[code];
    else updated[code] = next;
    if (value === undefined) setOwn(updated);
    onValueChange?.(updated);
  }

  function choose(code: string) {
    setCopied(null);
    if (code === active?.code) {
      window.requestAnimationFrame(() => field.current?.focus());
      return;
    }
    focusAfter.current = true;
    if (locale === undefined) setOwnLocale(code);
    onLocaleChange?.(code);
  }

  function copyFromSource() {
    if (isSource || sourceText === "") return;
    setCopied({ code: active?.code ?? "", previous: activeText });
    write(active?.code ?? "", sourceText);
    field.current?.focus();
  }

  function undoCopy() {
    if (!copied) return;
    write(copied.code, copied.previous);
    setCopied(null);
    field.current?.focus();
  }

  const language = { language: source.label };
  const counted = maxLength !== undefined;
  const message = copied && copied.code === active.code ? "copied" : activeOver ? "over" : invalid && isSource && lacksRequired ? "required" : "note";

  const control = multiline ? (
    <Textarea
      ref={field}
      id={fieldId}
      rows={3}
      value={activeText}
      disabled={disabled}
      required={isSource && required}
      aria-required={isSource && required ? true : undefined}
      aria-invalid={activeInvalid || undefined}
      aria-label={fill(text.field, { label, language: active.label })}
      aria-describedby={noteId}
      lang={active.code}
      placeholder={fill(text.placeholder, { language: active.label })}
      onChange={(event) => {
        setCopied(null);
        write(active.code, event.target.value);
      }}
      className={cn(BARE_FIELD, "min-h-24 resize-none py-3 leading-relaxed")}
    />
  ) : (
    <Input
      ref={field}
      id={fieldId}
      value={activeText}
      disabled={disabled}
      required={isSource && required}
      aria-required={isSource && required ? true : undefined}
      aria-invalid={activeInvalid || undefined}
      aria-label={fill(text.field, { label, language: active.label })}
      aria-describedby={noteId}
      lang={active.code}
      placeholder={fill(text.placeholder, { language: active.label })}
      onChange={(event) => {
        setCopied(null);
        write(active.code, event.target.value);
      }}
      className={cn(BARE_FIELD, "h-11")}
    />
  );

  return (
    <div data-slot="translatable-field" data-invalid={invalid || undefined} className={cn("@container grid grid-cols-[minmax(0,1fr)] gap-2", className)} {...props}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Label id={labelId} htmlFor={fieldId} className="flex-wrap gap-x-2 gap-y-0.5 leading-5">
          {label}
          {required ? <span className="text-xs font-normal text-muted-foreground">{fill(text.required, language)}</span> : null}
        </Label>
        {ordered.length > 1 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            <span aria-hidden="true" className="flex gap-0.5">
              {ordered.map((item) => (
                <span key={item.code} className={cn("h-1 w-4 rounded-full", isFilled(item.code) ? "bg-foreground" : "bg-border")} />
              ))}
            </span>
            <span role="status" aria-live="polite">
              {fill(text.progress, { filled: String(filledCount), total: String(ordered.length) })}
            </span>
          </div>
        ) : null}
      </div>

      <Tabs
        value={active.code}
        onValueChange={choose}
        activationMode="manual"
        className={cn(
          "gap-0 rounded-lg border bg-background shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none has-[:is(input,textarea):focus-visible]:ring-[3px]",
          activeInvalid ? "border-destructive has-[:is(input,textarea):focus-visible]:ring-destructive/30" : "border-input has-[:is(input,textarea):focus-visible]:border-ring has-[:is(input,textarea):focus-visible]:ring-ring/40",
        )}
      >
        {/* The tabs wrap onto a second line when the languages do not fit, so none is cut off or out of sight on a narrow screen. */}
        <div className="rounded-t-[inherit] border-b border-border bg-muted/40 p-1.5">
          <TabsList variant="pill" aria-label={text.languages} className="h-auto w-full flex-wrap gap-1 rounded-none bg-transparent p-0">
            {ordered.map((item) => {
              const status = statusOf(item.code);
              const alarm = status === "over" || (status === "needed" && invalid);
              return (
                <TabsTrigger
                  key={item.code}
                  value={item.code}
                  // A tab in alarm sits on the same surface as the field's own errors, so its red text keeps its contrast (on the grey of the strip it falls just short of 4.5:1).
                  className={cn("h-8 shrink-0 gap-1.5 border border-transparent px-2.5 data-[state=active]:border-border", alarm && "border-destructive/30 bg-background data-[state=active]:border-border")}
                >
                  {/* The code is the name people see, so it starts the name a screen reader or a voice command uses ("NL, Nederlands filled"), and what is on show is part of it. */}
                  <span className="text-[0.8125rem] font-semibold tracking-wide text-foreground">{item.code.toUpperCase()}</span>
                  <span className="sr-only">, {item.label}</span>
                  {status === "filled" ? (
                    <>
                      <IconCheck aria-hidden="true" strokeWidth={2.25} className="size-3.5 text-foreground" />
                      <span className="sr-only">{text.filled}</span>
                    </>
                  ) : (
                    <>
                      {alarm ? <IconAlertCircle aria-hidden="true" className="size-3.5 text-destructive" /> : <IconMinus aria-hidden="true" className="size-3.5" />}
                      <span className={cn("text-xs font-normal", alarm ? "font-medium text-destructive" : status === "needed" ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {status === "over" ? text.overLimit : status === "needed" ? text.needed : text.missing}
                      </span>
                    </>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* One panel for every language, kept mounted: the field is never torn down when the tab changes, so the focus that moves into it stays there. */}
        <TabsContent value={active.code} forceMount tabIndex={-1} className="grid">
          {!isSource ? (
            <div className="flex items-center gap-3 border-b border-border bg-muted/25 px-3.5 py-2">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="text-xs text-muted-foreground">{source.label}</span>
                <span lang={source.code} className={cn("text-sm leading-snug", multiline ? "line-clamp-2" : "truncate", sourceText ? "text-foreground" : "text-muted-foreground")}>
                  {sourceText || text.noSource}
                </span>
              </div>
              <Button type="button" variant="ghost" size="sm" disabled={disabled || sourceText === ""} onClick={copyFromSource} aria-label={fill(text.copy, language)} className="shrink-0">
                <IconCopy />
                <span className="hidden @sm:inline">{fill(text.copy, language)}</span>
                <span className="@sm:hidden">{text.copyShort}</span>
              </Button>
            </div>
          ) : null}
          {control}
        </TabsContent>

        <div className="flex items-start justify-between gap-3 border-t border-border px-3.5 py-2 text-xs leading-5">
          <p id={noteId} aria-live="polite" className={cn("min-w-0 flex-1", message === "over" || message === "required" ? "font-medium text-destructive" : "text-muted-foreground")}>
            {message === "copied" ? (
              <>
                {fill(text.copied, language)}.{" "}
                <button type="button" onClick={undoCopy} className="rounded-sm font-medium text-foreground underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {text.undo}
                </button>
              </>
            ) : message === "over" ? (
              fill(text.overBy, { over: String(activeText.length - (maxLength ?? 0)) })
            ) : message === "required" ? (
              fill(text.requiredMessage, language)
            ) : isSource ? (
              text.defaultLanguage
            ) : (
              fill(text.translating, language)
            )}
          </p>
          {counted ? (
            <p className={cn("shrink-0 tabular-nums", activeOver ? "font-medium text-destructive" : "text-muted-foreground")}>{fill(text.count, { count: String(activeText.length), max: String(maxLength) })}</p>
          ) : null}
        </div>
      </Tabs>

      {name ? ordered.map((item) => <input key={item.code} type="hidden" name={`${name}[${item.code}]`} value={textOf(item.code)} disabled={disabled} />) : null}
    </div>
  );
}
