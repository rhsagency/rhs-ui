import { AnimatedNumber } from "@rhs-ui/application/animated-number";

export interface MetricItem { id: string; label: string; value: number; suffix?: string; description?: string }
export function MetricsBand({ label, metrics, locale = "en-US" }: { label: string; metrics: readonly MetricItem[]; locale?: string }): React.JSX.Element {
  return <section data-slot="metrics-band" aria-label={label} className="py-10"><dl className="grid gap-8 border-y border-border py-10 sm:grid-flow-col sm:auto-cols-fr sm:gap-0 sm:divide-x sm:divide-border">{metrics.map(metric => <div key={metric.id} className="px-6 text-center"><dt className="text-xs font-medium uppercase tracking-[.12em] text-muted-foreground">{metric.label}</dt><dd className="mt-4 text-5xl font-medium tracking-[-.05em]"><AnimatedNumber value={metric.value} locale={locale} /><span className="ml-1 text-muted-foreground">{metric.suffix}</span></dd>{metric.description && <dd className="mt-3 text-xs leading-relaxed text-muted-foreground">{metric.description}</dd>}</div>)}</dl></section>;
}
