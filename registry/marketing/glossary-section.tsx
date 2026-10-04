import { cn } from "@/lib/utils";

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface GlossarySectionProps {
  title: string;
  description?: string;
  terms: readonly GlossaryTerm[];
  className?: string;
}

const anchor = (letter: string) => `glossary-${letter.toLowerCase()}`;

/**
 * A glossary: terms grouped under their first letter in a definition list,
 * with an A to Z bar on top that jumps to each letter (letters without terms
 * are shown but not links). Good for SEO pages and onboarding docs alike.
 */
export function GlossarySection({ title, description, terms, className }: GlossarySectionProps) {
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term));
  const groups = new Map<string, GlossaryTerm[]>();
  for (const item of sorted) {
    const letter = item.term.charAt(0).toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), item]);
  }
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return (
    <section data-slot="glossary-section" className={cn("py-16 sm:py-20", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em]">{title}</h2>
      {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      <nav aria-label="Letters" className="mt-8 flex flex-wrap gap-1 border-y border-border py-3 text-sm">
        {alphabet.map((letter) => groups.has(letter) ? (
          <a key={letter} href={`#${anchor(letter)}`} className="inline-flex size-8 items-center justify-center rounded-md font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">{letter}</a>
        ) : (
          <span key={letter} aria-hidden="true" className="inline-flex size-8 items-center justify-center text-muted-foreground/40">{letter}</span>
        ))}
      </nav>
      <div className="mt-10 space-y-10">
        {[...groups.entries()].map(([letter, items]) => (
          <div key={letter} id={anchor(letter)} className="grid scroll-mt-20 gap-4 sm:grid-cols-[4rem_1fr]">
            <h3 className="text-3xl font-medium tracking-[-.04em] text-muted-foreground">{letter}</h3>
            <dl className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.term} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <dt className="font-medium">{item.term}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{item.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
