import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ChangelogEntry {
  version: string;
  /** Formatted for the reader. */
  date: string;
  dateTime: string;
  title: string;
  body: ReactNode;
  /** Short labels such as New, Improved, Fixed. */
  tags?: readonly string[];
}

export interface ChangelogListProps {
  title?: string;
  entries: readonly ChangelogEntry[];
  className?: string;
}

/**
 * Releases on a time rail: the version and date stay in a narrow left column
 * (sticky on wide screens), the story of the release on the right.
 */
export function ChangelogList({ title = "Changelog", entries, className }: ChangelogListProps) {
  return (
    <section data-slot="changelog-list" className={cn("py-16 sm:py-24", className)}>
      <h2 className="mb-12 text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
      <ol className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.version} className="grid gap-4 border-t border-border py-10 md:grid-cols-[12rem_1fr] md:gap-12">
            <div className="md:sticky md:top-24 md:self-start">
              <p className="font-mono text-sm">{entry.version}</p>
              <time dateTime={entry.dateTime} className="text-sm text-muted-foreground">{entry.date}</time>
            </div>
            <article>
              {entry.tags?.length ? (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{tag}</li>
                  ))}
                </ul>
              ) : null}
              <h3 className="text-xl font-medium tracking-[-.02em]">{entry.title}</h3>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">{entry.body}</div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
