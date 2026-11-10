import { Fragment } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { initialOf, type Words } from "@rhs-ui/application/seo-fieldset/seo";
import { cn } from "@/lib/utils";

export interface SearchPreviewProps {
  /** The site's name, with its first letter in the round mark. */
  siteName: string;
  /** The address broken into the host and the parts of the path, for the breadcrumb line. */
  host: string;
  parts: readonly string[];
  /** The address as plain text, for a screen reader. */
  url: string;
  /** The title as the result shows it: already cut off at its limit. */
  title: string;
  /** The description as the result shows it: already cut off at its limit. */
  description: string;
  /** The field was empty and the text is the fallback. */
  titleFallback: boolean;
  descriptionFallback: boolean;
  words: Words;
}

/**
 * How a search result would look: the site and its address in a breadcrumb
 * line, the title as the headline and the description under it. It is an
 * example, and says so: a caption and a badge for the eye, and a name for
 * assistive technology that calls it an example. Text that comes from the
 * fallback is grey.
 */
export function SearchPreview({ siteName, host, parts, url, title, description, titleFallback, descriptionFallback, words }: SearchPreviewProps) {
  return (
    <figure data-slot="seo-fieldset-preview" aria-label={words.previewLabel} className="grid gap-3">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="text-sm leading-5 font-medium">{words.previewTitle}</span>
        <Badge variant="outline">{words.previewBadge}</Badge>
      </figcaption>
      <div className="grid gap-3 rounded-xl border border-border bg-background p-4 shadow-xs sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted text-xs font-semibold text-foreground">
            {initialOf(siteName)}
          </span>
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate text-sm leading-4 font-medium">{siteName}</p>
            <p className="truncate text-xs leading-4 text-muted-foreground">
              <span className="sr-only">{url}</span>
              <span aria-hidden="true">
                {host}
                {parts.map((part, index) => (
                  <Fragment key={`${index}-${part}`}>
                    <span className="px-1">&rsaquo;</span>
                    {part}
                  </Fragment>
                ))}
              </span>
            </p>
          </div>
        </div>
        <div className="grid gap-1">
          <p className={cn("text-lg leading-snug font-medium tracking-[-0.01em] break-words underline decoration-foreground/25 underline-offset-[3px]", titleFallback && "text-muted-foreground decoration-muted-foreground/25")}>{title}</p>
          <p className={cn("text-sm leading-relaxed break-words", descriptionFallback ? "text-muted-foreground/80" : "text-muted-foreground")}>{description}</p>
        </div>
      </div>
    </figure>
  );
}
