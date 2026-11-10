"use client";

import { useId, useState, type ComponentProps } from "react";

import { LengthMeter } from "@rhs-ui/application/seo-fieldset/length-meter";
import { SearchPreview } from "@rhs-ui/application/seo-fieldset/preview";
import { DEFAULT_LABELS, cutOff, finishSlug, fitOf, fill, lengthOf, tidy, trail, typingSlug, type SeoFieldsetLabels, type SeoValue } from "@rhs-ui/application/seo-fieldset/seo";
import { Input } from "@rhs-ui/primitives/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export type { SeoFieldsetLabels, SeoValue } from "@rhs-ui/application/seo-fieldset/seo";

export interface SeoFieldsetProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The page's title, description and slug, when you control the fieldset. */
  value?: SeoValue;
  /** The text to begin with, when the fieldset keeps it itself. */
  defaultValue?: Partial<SeoValue>;
  /** Called with the whole value whenever a field changes. */
  onValueChange?: (value: SeoValue) => void;
  /** The address of the site: "https://northwind.example". The address line of the preview is built from it and the slug. */
  baseUrl: string;
  /** The site's name, on the first line of the preview. Default the host of `baseUrl`. */
  siteName?: string;
  /** The most characters of a title before it is cut off. Default 60. */
  titleLimit?: number;
  /** The most characters of a description before it is cut off. Default 160. */
  descriptionLimit?: number;
  /** The fewest characters that make a good title. Default 30, or the limit when that is lower. */
  titleMin?: number;
  /** The fewest characters that make a good description. Default 70, or the limit when that is lower. */
  descriptionMin?: number;
  /** What the preview shows, in grey, while the title is empty: the page's own heading. */
  fallbackTitle?: string;
  /** What the preview shows, in grey, while the description is empty: the start of the page. */
  fallbackDescription?: string;
  /** Show a field for the slug as well. It is always part of the preview. Default false. */
  editSlug?: boolean;
  /** A name for a plain form submit: the fields are sent as `<name>.title`, `<name>.description` and `<name>.slug`. */
  name?: string;
  /** Turn the whole fieldset off. */
  disabled?: boolean;
  /** The language of the character count and of the text. Default "en-US". */
  locale?: string;
  /** The words the fieldset says, for translation. */
  labels?: SeoFieldsetLabels;
}

/**
 * Two fields for what a page says to search engines, and a card that shows
 * how it would look as a result, updating as you type. A meter under each
 * field reads the length in characters against the range that is recommended
 * ("52 of 60, good", "Too long, cut off at 60") and the preview is cut
 * exactly where that limit says it would be. The address line is built from
 * the site address and the slug in the breadcrumb style of a result. An empty
 * field shows the fallback you pass, in grey, so the preview is never blank,
 * and the preview is named as an example for assistive technology.
 */
export function SeoFieldset({
  value,
  defaultValue,
  onValueChange,
  baseUrl,
  siteName,
  titleLimit = 60,
  descriptionLimit = 160,
  titleMin,
  descriptionMin,
  fallbackTitle,
  fallbackDescription,
  editSlug = false,
  name,
  disabled = false,
  locale = "en-US",
  labels,
  className,
  ...props
}: SeoFieldsetProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const ids = { title: `${base}-title`, description: `${base}-description`, slug: `${base}-slug`, titleHint: `${base}-title-hint`, descriptionHint: `${base}-description-hint`, titleMeter: `${base}-title-meter`, descriptionMeter: `${base}-description-meter` };
  const [own, setOwn] = useState<SeoValue>({ title: "", description: "", slug: "", ...defaultValue });
  const current = value ?? own;
  const minTitle = Math.min(titleMin ?? 30, titleLimit);
  const minDescription = Math.min(descriptionMin ?? 70, descriptionLimit);

  const titleCount = lengthOf(current.title, locale);
  const descriptionCount = lengthOf(current.description, locale);
  const titleFit = fitOf(titleCount, minTitle, titleLimit);
  const descriptionFit = fitOf(descriptionCount, minDescription, descriptionLimit);
  const where = trail(baseUrl, current.slug);
  const site = siteName ?? where.host;
  const titleEmpty = tidy(current.title) === "";
  const descriptionEmpty = tidy(current.description) === "";

  function change(patch: Partial<SeoValue>) {
    const next = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  // A field that turns good or long says so once, as a state: announcing the count at every key would talk over the typing.
  const stateOf = (fit: typeof titleFit, limit: number) => (fit === "long" ? fill(words.long, { limit }) : fit === "good" ? words.goodState : "");

  return (
    <div data-slot="seo-fieldset" className={cn("grid min-w-0 gap-6", className)} {...props}>
      <div className="grid gap-2">
        <Label htmlFor={ids.title}>{words.titleLabel}</Label>
        <p id={ids.titleHint} className="text-xs leading-5 text-muted-foreground">
          {words.titleHint}
        </p>
        <Input
          id={ids.title}
          name={name ? `${name}.title` : undefined}
          value={current.title}
          disabled={disabled}
          placeholder={fallbackTitle}
          autoComplete="off"
          aria-describedby={`${ids.titleHint} ${ids.titleMeter}`}
          onChange={(event) => change({ title: event.target.value })}
        />
        <LengthMeter id={ids.titleMeter} label={fill(words.meterLabel, { field: words.titleLabel })} count={titleCount} min={minTitle} limit={titleLimit} words={words} />
        <p role="status" className="sr-only">
          {stateOf(titleFit, titleLimit)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={ids.description}>{words.descriptionLabel}</Label>
        <p id={ids.descriptionHint} className="text-xs leading-5 text-muted-foreground">
          {words.descriptionHint}
        </p>
        <Textarea
          id={ids.description}
          name={name ? `${name}.description` : undefined}
          value={current.description}
          disabled={disabled}
          placeholder={fallbackDescription}
          rows={3}
          aria-describedby={`${ids.descriptionHint} ${ids.descriptionMeter}`}
          onChange={(event) => change({ description: event.target.value })}
        />
        <LengthMeter id={ids.descriptionMeter} label={fill(words.meterLabel, { field: words.descriptionLabel })} count={descriptionCount} min={minDescription} limit={descriptionLimit} words={words} />
        <p role="status" className="sr-only">
          {stateOf(descriptionFit, descriptionLimit)}
        </p>
      </div>

      {editSlug ? (
        <div className="grid gap-2">
          <Label htmlFor={ids.slug}>{words.slugLabel}</Label>
          {/* On a phone the host would take half of the field, and the preview shows it anyway: it goes above the field, in small grey type, and the field gets all the room. */}
          <p aria-hidden="true" className="truncate text-xs leading-4 text-muted-foreground sm:hidden">
            {where.host}/
          </p>
          <InputGroup className={cn(disabled && "opacity-50")}>
            <InputGroupAddon className="hidden max-w-[55%] sm:flex">
              <span className="truncate">{where.host}/</span>
            </InputGroupAddon>
            <InputGroupInput
              id={ids.slug}
              name={name ? `${name}.slug` : undefined}
              value={current.slug}
              disabled={disabled}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              className="pl-3 sm:pl-0"
              onChange={(event) => change({ slug: typingSlug(event.target.value) })}
              onBlur={() => {
                // Tidied when the field is left, and reported only when the tidying changed something: a bare focus and blur is not an edit.
                const tidied = finishSlug(current.slug);
                if (tidied !== current.slug) change({ slug: tidied });
              }}
            />
          </InputGroup>
        </div>
      ) : name ? (
        <input type="hidden" name={`${name}.slug`} value={current.slug} />
      ) : null}

      <div className="grid gap-3">
        <SearchPreview
          siteName={site}
          host={where.host}
          parts={where.parts}
          url={where.url}
          title={cutOff(titleEmpty ? (fallbackTitle ?? words.untitled) : current.title, titleLimit, locale)}
          description={cutOff(descriptionEmpty ? (fallbackDescription ?? words.undescribed) : current.description, descriptionLimit, locale)}
          titleFallback={titleEmpty}
          descriptionFallback={descriptionEmpty}
          words={words}
        />
        {titleEmpty || descriptionEmpty ? <p className="text-xs leading-5 text-muted-foreground">{words.fallbackNote}</p> : null}
      </div>
    </div>
  );
}
