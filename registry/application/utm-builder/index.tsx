"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconInfo, IconLink, IconLock } from "@rhs-ui/icons";
import { CopyField } from "@rhs-ui/application/copy-field";
import { EMPTY_UTM, buildLink, parseBase, writingOf, type BaseProblem, type UtmField, type UtmValue } from "@rhs-ui/application/utm-builder/link";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export type { UtmField, UtmValue };

/** The words the builder uses, for translation. `{value}`, `{fixed}`, `{plural}`, `{list}`, `{count}`, `{url}`, `{keys}` and `{name}` are filled in. */
export interface UtmBuilderLabels {
  /** The label of the page field. Default "Website URL". */
  url?: string;
  /** Under it. Default "The page people land on. Its other parameters and its #section are kept." */
  urlHint?: string;
  /** Under it while the address is locked by `baseUrl`. Default "Set by the page you are linking to." */
  urlLocked?: string;
  /** The label of each tag. */
  fields?: Partial<Record<UtmField, string>>;
  /** The line under each tag. */
  hints?: Partial<Record<UtmField, string>>;
  /** The plural of each tag, for the warning about capitals. */
  plurals?: Partial<Record<UtmField, string>>;
  /** Beside the label of a tag that may stay empty. Default "Optional". */
  optional?: string;
  /** The name of a row of suggestions. Default "Suggestions for {name}". */
  suggestionsFor?: string;
  /** The warning about capitals. Default "Reports treat {value} and {fixed} as different {plural}." */
  caseWarning?: string;
  /** The warning about spaces. Default "A space becomes %20 in the link and is easy to mistype." */
  spaceWarning?: string;
  /** The button that applies the fix. Default "Use {fixed}". */
  fix?: string;
  /** The page field is empty. Default "Add the page this link points to." */
  empty?: string;
  /** The address has no scheme. Default "Start the address with https:// so it opens from anywhere." */
  scheme?: string;
  /** The button that adds it. Default "Use {url}". */
  addScheme?: string;
  /** The address is not http or https. Default "Only http and https addresses can carry tags." */
  protocol?: string;
  /** The address is not an address. Default "That does not look like a web address yet. Try https://northwind.example/pricing." */
  invalid?: string;
  /** The heading of the result. Default "Your link". */
  result?: string;
  /** In the result while there is no link yet. Default "Your link appears here once the page and the tags are filled in." */
  placeholder?: string;
  /** The name of the list of tags in the link. Default "Tags in the link". */
  tagList?: string;
  /** The name of the copy button. Default "Copy link". */
  copy?: string;
  /** Said while a tag is missing. Default "Still needed: {list}." */
  needed?: string;
  /** Said while the address is missing or wrong. Default "Fix the website address to build the link." */
  fixAddress?: string;
  /** Said when the link is complete. Default "Ready to copy. {count} tags added." */
  ready?: string;
  /** Said when tags of the same name were already in the address. Default "{keys} was already in the address and has been replaced." */
  replaced?: string;
}

const DEFAULT_LABELS = {
  url: "Website URL",
  urlHint: "The page people land on. Its other parameters and its #section are kept.",
  urlLocked: "Set by the page you are linking to.",
  fields: { source: "Source", medium: "Medium", campaign: "Campaign", term: "Term", content: "Content" },
  hints: {
    source: "Where the visit comes from.",
    medium: "The kind of channel it travels by.",
    campaign: "The name of this push.",
    term: "The paid keyword, when there is one.",
    content: "Tells two links in one message apart.",
  },
  plurals: { source: "sources", medium: "mediums", campaign: "campaigns", term: "terms", content: "content values" },
  optional: "Optional",
  suggestionsFor: "Suggestions for {name}",
  caseWarning: "Reports treat {value} and {fixed} as different {plural}.",
  spaceWarning: "A space becomes %20 in the link and is easy to mistype.",
  fix: "Use {fixed}",
  empty: "Add the page this link points to.",
  scheme: "Start the address with https:// so it opens from anywhere.",
  addScheme: "Use {url}",
  protocol: "Only http and https addresses can carry tags.",
  invalid: "That does not look like a web address yet. Try https://northwind.example/pricing.",
  result: "Your link",
  placeholder: "Your link appears here once the page and the tags are filled in.",
  tagList: "Tags in the link",
  copy: "Copy link",
  needed: "Still needed: {list}.",
  fixAddress: "Fix the website address to build the link.",
  ready: "Ready to copy. {count} tags added.",
  replaced: "{keys} was already in the address and has been replaced.",
} satisfies Required<UtmBuilderLabels>;

const DEFAULT_SUGGESTIONS: Readonly<Record<UtmField, readonly string[]>> = {
  source: ["newsletter", "google", "linkedin", "facebook", "partner"],
  medium: ["email", "cpc", "social", "referral", "affiliate"],
  campaign: [],
  term: [],
  content: [],
};

const PLACEHOLDERS: Readonly<Record<UtmField, string>> = { source: "e.g. newsletter", medium: "e.g. email", campaign: "e.g. spring-sale", term: "e.g. running shoes", content: "e.g. header-button" };

export interface UtmBuilderProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The page and the tags, when you control them. Any field you leave out is empty. */
  value?: Partial<UtmValue>;
  /** What to start with, when you do not control the value. */
  defaultValue?: Partial<UtmValue>;
  /** Called with every field on each change. */
  onValueChange?: (value: UtmValue) => void;
  /** Called with the finished link after typing pauses, and with `null` while the link is not complete. */
  onLinkChange?: (link: string | null) => void;
  /** The suggestions under each tag, to keep naming consistent: the names your team already uses. The defaults are a few common sources and mediums. */
  suggestions?: Partial<Record<UtmField, readonly string[]>>;
  /** Make the term required too. It is optional by default. */
  requireTerm?: boolean;
  /** The page the link points to, when it is already known: the field is filled with it and locked. Without it, people type the address. */
  baseUrl?: string;
  /** The form field's name: the finished link goes out in a hidden input, empty while it is not complete. */
  name?: string;
  /** The language of the lists in messages. Default "en-US". */
  locale?: string;
  /** The words the builder uses, for translation. */
  labels?: UtmBuilderLabels;
}

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A value that follows another one after it has stopped changing for a moment. */
function useSettled<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

interface FieldProps {
  id: string;
  label: string;
  hint: string;
  /** Whether the field must have a value: it is then also the native `required` of the input. */
  required: boolean;
  /** The quiet note beside the label of a field that may stay empty. */
  optional: string;
  value: string;
  placeholder: string;
  suggestions: readonly string[];
  suggestionsName: string;
  warning: ReactNode;
  onChange: (value: string) => void;
}

/** One tag: its label, the field, a line of help, a row of suggestions and, when it needs one, a quiet warning. */
function TagField({ id, label, hint, required, optional, value, placeholder, suggestions, suggestionsName, warning, onChange }: FieldProps) {
  const hintId = `${id}-hint`;
  const warningId = `${id}-warning`;
  return (
    <div data-slot="utm-builder-field" className="grid min-w-0 content-start gap-1.5">
      <div className="flex h-5 items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {required ? null : <span className="text-xs text-muted-foreground">{optional}</span>}
      </div>
      <Input id={id} value={value} placeholder={placeholder} autoComplete="off" spellCheck={false} autoCapitalize="off" required={required} aria-describedby={[hintId, warning ? warningId : null].filter(Boolean).join(" ")} onChange={(event) => onChange(event.target.value)} />
      <p id={hintId} className="text-xs leading-5 text-muted-foreground">
        {hint}
      </p>
      {suggestions.length > 0 ? (
        <div role="group" aria-label={suggestionsName} className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              aria-pressed={value === suggestion}
              onClick={() => onChange(value === suggestion ? "" : suggestion)}
              className="h-6 rounded-full border border-border bg-background px-2.5 text-xs text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background motion-reduce:transition-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {warning ? (
        <p id={warningId} className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-[3px] size-3.5 shrink-0" />
          <span className="min-w-0">{warning}</span>
        </p>
      ) : null}
    </div>
  );
}

const FIX_BUTTON = "rounded-sm font-medium text-foreground underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * Build a tracked link: the page plus source, medium and campaign (and,
 * if you like, term and content), with the finished link shown live and ready
 * to copy. Each tag has suggestions that keep naming consistent, and a quiet
 * warning in words when a value has capitals or spaces ("Reports treat Email
 * and email as different sources"), with a one-click fix. The link keeps the
 * page's own parameters and its #fragment, encodes every value and replaces a
 * tag that was already there. An address that is wrong says what is missing,
 * and one that only lacks https:// is fixed in a click. The result is a status
 * that updates once typing pauses, so a screen reader is not read a new link
 * on every key.
 */
export function UtmBuilder({ value, defaultValue, onValueChange, onLinkChange, suggestions, requireTerm = false, baseUrl, name, locale = "en-US", labels, className, ...props }: UtmBuilderProps) {
  const text = {
    ...DEFAULT_LABELS,
    ...labels,
    fields: { ...DEFAULT_LABELS.fields, ...labels?.fields },
    hints: { ...DEFAULT_LABELS.hints, ...labels?.hints },
    plurals: { ...DEFAULT_LABELS.plurals, ...labels?.plurals },
  };
  const base = useId();
  const [own, setOwn] = useState<UtmValue>({ ...EMPTY_UTM, ...defaultValue });
  const [touched, setTouched] = useState(false);
  const locked = baseUrl !== undefined;
  const current: UtmValue = { ...EMPTY_UTM, ...(value ?? own), ...(locked ? { url: baseUrl } : null) };
  const list = { ...DEFAULT_SUGGESTIONS, ...suggestions };

  function update(patch: Partial<UtmValue>) {
    const next: UtmValue = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  const result = buildLink(current, requireTerm);
  const names = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const needed = names.format(result.missing.map((field) => text.fields[field].toLowerCase()));
  // What the status says, and the link that is reported, follow the typing after a pause.
  const status = result.link
    ? [fill(text.ready, { count: String(result.tags.length) }), result.replaced.length > 0 ? fill(text.replaced, { keys: names.format(result.replaced) }) : ""].filter(Boolean).join(" ")
    : result.problem
      ? text.fixAddress
      : fill(text.needed, { list: needed });
  const settledStatus = useSettled(status, 350);
  const settledLink = useSettled(result.link, 350);
  const settledUrl = useSettled(current.url, 450);
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (settledLink === reported.current) return;
    reported.current = settledLink;
    onLinkChange?.(settledLink);
  }, [settledLink, onLinkChange]);

  // The address is judged once typing pauses, and an empty one only after the field was left.
  const settledBase = parseBase(settledUrl);
  const problem: BaseProblem | null = settledBase.problem === "empty" ? (touched ? "empty" : null) : (settledBase.problem ?? null);
  const urlMessage: Record<BaseProblem, string> = { empty: text.empty, scheme: text.scheme, protocol: text.protocol, invalid: text.invalid };
  const urlId = `${base}-url`;
  const urlHelp = `${base}-url-help`;
  const resultId = `${base}-result`;

  /** One tag as an element, not a component of its own: a component defined here would be a new one on every render and the field would lose the focus at every key. */
  const tag = (field: UtmField) => {
    // Source, medium and campaign are always needed, the term only on request and the content never: the link is complete without it.
    const required = field === "term" ? requireTerm : field !== "content";
    const fieldText = current[field];
    const writing = writingOf(fieldText);
    return (
      <TagField
        id={`${base}-${field}`}
        label={text.fields[field]}
        hint={text.hints[field]}
        required={required}
        optional={text.optional}
        value={fieldText}
        placeholder={PLACEHOLDERS[field]}
        suggestions={list[field]}
        suggestionsName={fill(text.suggestionsFor, { name: text.fields[field].toLowerCase() })}
        warning={
          writing ? (
            <>
              {writing.kind === "case" ? fill(text.caseWarning, { value: fieldText.trim(), fixed: writing.fixed, plural: text.plurals[field] }) : text.spaceWarning}{" "}
              <button type="button" onClick={() => update({ [field]: writing.fixed })} className={FIX_BUTTON}>
                {fill(text.fix, { fixed: writing.fixed })}
              </button>
            </>
          ) : null
        }
        onChange={(next) => update({ [field]: next })}
      />
    );
  };

  return (
    <div data-slot="utm-builder" className={cn("@container grid min-w-0 gap-6", className)} {...props}>
      <div className="grid min-w-0 gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor={urlId}>{text.url}</Label>
          <Input
            id={urlId}
            type="url"
            inputMode="url"
            value={current.url}
            readOnly={locked}
            required
            placeholder="https://northwind.example/pricing"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={problem && touched ? true : undefined}
            aria-describedby={urlHelp}
            onBlur={() => setTouched(true)}
            onChange={(event) => update({ url: event.target.value })}
            className={cn(locked && "bg-muted/40 text-muted-foreground")}
          />
          <div id={urlHelp} className="text-xs leading-5">
            {locked ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <IconLock aria-hidden="true" className="size-3.5 shrink-0" />
                {text.urlLocked}
              </p>
            ) : problem ? (
              <p className={cn(touched ? "font-medium text-destructive" : "text-muted-foreground")}>
                {urlMessage[problem]}
                {problem === "scheme" && settledBase.suggestion ? (
                  <>
                    {" "}
                    <button type="button" onClick={() => update({ url: settledBase.suggestion ?? "" })} className={FIX_BUTTON}>
                      {fill(text.addScheme, { url: settledBase.suggestion })}
                    </button>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-muted-foreground">{text.urlHint}</p>
            )}
          </div>
        </div>

        <div className="grid gap-5 @lg:grid-cols-2 @lg:gap-x-4">
          {tag("source")}
          {tag("medium")}
        </div>
        {tag("campaign")}
        <div className="grid gap-5 @lg:grid-cols-2 @lg:gap-x-4">
          {tag("term")}
          {tag("content")}
        </div>
      </div>

      {/* A group, not a section: a section with a name is a landmark of the page, and a form widget should not add one. */}
      <div role="group" aria-labelledby={resultId} data-slot="utm-builder-result" data-state={result.link ? "ready" : "incomplete"} className="grid min-w-0 gap-3 rounded-xl border border-border bg-muted/30 p-4">
        <p id={resultId} className="text-sm font-semibold tracking-[-0.01em]">
          {text.result}
        </p>
        {result.link ? (
          <div className="grid min-w-0">
            {/* A long link scrolls inside its field; a grid item that is allowed to shrink keeps it from widening the page. */}
            <div className="min-w-0">
              <CopyField value={result.link} label={text.copy} />
            </div>
            {/* The field shows the start of a long link, so the tags are listed as they are written in it: encoding included. */}
            <ul aria-label={text.tagList} className="flex flex-wrap gap-1.5">
              {result.tags.map((tag) => (
                <li key={tag.key} className="inline-flex max-w-full items-center rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[0.6875rem] leading-5">
                  <span className="shrink-0 text-muted-foreground">{tag.key}=</span>
                  <span className="min-w-0 truncate text-foreground">{tag.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="flex items-start gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
            <IconLink aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{text.placeholder}</span>
          </p>
        )}
        <p role="status" className="text-xs leading-5 text-muted-foreground">
          {settledStatus}
        </p>
      </div>

      {name ? <input type="hidden" name={name} value={result.link ?? ""} /> : null}
    </div>
  );
}

