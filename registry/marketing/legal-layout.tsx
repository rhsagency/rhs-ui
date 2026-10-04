import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  /** Paragraphs of the section, plain text. */
  body: readonly string[];
}

export interface LegalLayoutProps {
  /** The title's element: "h1" (the default) for the terms or privacy page itself, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  title: string;
  /** "Last updated 1 March 2026". */
  updated: string;
  updatedDateTime: string;
  /** A plain-language summary on top, a line each. */
  summary?: readonly string[];
  sections: readonly LegalSection[];
  className?: string;
}

/**
 * Terms, privacy or a DPA that people can actually read: the date it changed,
 * a summary in plain words, numbered sections with anchors, and a sticky
 * contents list beside the text on wide screens.
 */
export function LegalLayout({ titleAs: Title = "h1", title, updated, updatedDateTime, summary = [], sections, className }: LegalLayoutProps) {
  return (
    <article data-slot="legal-layout" className={cn("py-16 sm:py-20", className)}>
      <header className="max-w-3xl">
        <Title className="text-4xl font-medium tracking-[-.05em] sm:text-5xl">{title}</Title>
        <p className="mt-3 text-sm text-muted-foreground"><time dateTime={updatedDateTime}>{updated}</time></p>
        {summary.length ? (
          <div className="mt-8 rounded-2xl bg-muted/60 p-6">
            <p className="text-sm font-medium">In short</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              {summary.map((line) => (
                <li key={line} className="flex gap-2.5"><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />{line}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>
      <div className="mt-12 grid gap-12 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">Contents</p>
          <ol className="mt-4 space-y-2 text-sm">
            {sections.map((section, index) => (
              <li key={section.id}><a href={`#${section.id}`} className="flex gap-2 text-muted-foreground hover:text-foreground"><span className="tabular-nums">{index + 1}.</span>{section.title}</a></li>
            ))}
          </ol>
        </nav>
        <div className="max-w-2xl space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl font-medium tracking-[-.02em]"><span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
