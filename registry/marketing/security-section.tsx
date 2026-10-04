import type { ReactNode } from "react";

import { IconShieldCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SecurityPractice {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface SecuritySectionProps {
  title: string;
  description?: string;
  /** Certifications or standards as short labels: "ISO 27001", "GDPR". Only the ones you hold. */
  standards?: readonly string[];
  practices: readonly SecurityPractice[];
  /** A link to the trust centre or the security page. */
  action?: ReactNode;
  className?: string;
}

/**
 * The "is it safe?" section of a B2B page: the standards you actually meet as
 * chips, and the practices behind them as icon rows. Scannable for the
 * person who has to fill in the vendor questionnaire.
 */
export function SecuritySection({ title, description, standards = [], practices, action, className }: SecuritySectionProps) {
  return (
    <section data-slot="security-section" className={cn("rounded-3xl border border-border bg-muted/40 px-6 py-12 sm:px-12 sm:py-16", className)}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background [&_svg]:size-6"><IconShieldCheck /></span>
          <h2 className="mt-6 text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
          {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
          {standards.length ? (
            <ul aria-label="Standards" className="mt-6 flex flex-wrap gap-2">
              {standards.map((standard) => (
                <li key={standard} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">{standard}</li>
              ))}
            </ul>
          ) : null}
          {action ? <div className="mt-8">{action}</div> : null}
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {practices.map((practice) => (
            <li key={practice.title} className="bg-background p-6">
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border [&_svg]:size-4.5">{practice.icon}</span>
              <h3 className="mt-4 text-sm font-medium">{practice.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{practice.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
