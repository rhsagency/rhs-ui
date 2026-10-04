import { cn } from "@/lib/utils";

export interface AiSource {
  id: string;
  title: string;
  href: string;
  /** The site or document it comes from: "docs.example.com", "Q3 report.pdf". */
  origin: string;
  /** A short quote the answer relied on. */
  excerpt?: string;
}

export interface AiSourcesProps {
  sources: readonly AiSource[];
  title?: string;
  className?: string;
}

/**
 * Where an answer came from: numbered sources that match the [1] markers in
 * the text, each with its origin and the line that was used. A row that
 * scrolls sideways, so a long list never pushes the answer down.
 */
export function AiSources({ sources, title = "Sources", className }: AiSourcesProps) {
  return (
    <section data-slot="ai-sources" aria-label={title} className={cn("text-sm", className)}>
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      <ol className="flex snap-x gap-2 overflow-x-auto pb-1">
        {sources.map((source, index) => (
          <li key={source.id} className="w-60 shrink-0 snap-start">
            <a href={source.href} className="flex h-full flex-col gap-1.5 rounded-xl border border-border p-3 outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex size-4 items-center justify-center rounded bg-muted font-mono text-[0.625rem] text-foreground tabular-nums">{index + 1}</span>
                <span className="truncate">{source.origin}</span>
              </span>
              <span className="line-clamp-2 font-medium leading-snug">{source.title}</span>
              {source.excerpt ? <span className="line-clamp-2 text-xs text-muted-foreground">{source.excerpt}</span> : null}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
