import { cn } from "@/lib/utils";

export interface NumberedFeature {
  title: string;
  description: string;
}

export interface FeatureNumbersProps {
  title: string;
  description?: string;
  features: readonly NumberedFeature[];
  className?: string;
}

/**
 * Reasons as a numbered list, set like an editorial spread: large outlined
 * numerals, a title and a short paragraph each, in two columns on wide
 * screens. An ordered list, so "three reasons" stays three reasons for a
 * screen reader too.
 */
export function FeatureNumbers({ title, description, features, className }: FeatureNumbersProps) {
  return (
    <section data-slot="feature-numbers" className={cn("py-16 sm:py-24", className)}>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <ol className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
        {features.map((feature, index) => (
          <li key={feature.title} className="grid grid-cols-[4.5rem_1fr] gap-5">
            <span aria-hidden="true" className="text-6xl leading-none font-medium tracking-[-.06em] text-transparent tabular-nums [-webkit-text-stroke:1.25px_var(--color-foreground)]">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="text-xl font-medium tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
