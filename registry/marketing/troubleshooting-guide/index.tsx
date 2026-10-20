import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Callout } from "@rhs-ui/primitives/callout";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { cn } from "@/lib/utils";
import { ProblemList } from "@rhs-ui/marketing/troubleshooting-guide/problem-list";
import type {
  ProblemImage,
  ProblemStep,
  TroubleshootingArea,
  TroubleshootingLabels,
  TroubleshootingProblem,
} from "@rhs-ui/marketing/troubleshooting-guide/types";

export type {
  ProblemCode,
  ProblemImage,
  ProblemStep,
  TroubleshootingArea,
  TroubleshootingLabels,
  TroubleshootingProblem,
} from "@rhs-ui/marketing/troubleshooting-guide/types";

export interface TroubleshootingGuideProps extends Omit<ComponentProps<"div">, "children"> {
  /** Problems grouped by area, in the order they should be read. */
  areas: readonly TroubleshootingArea[];
  /** Your support page. Each "Still stuck?" link adds the symptom to its query string, so the form arrives pre-filled. */
  supportHref: string;
  /** The query parameter that carries the symptom. */
  symptomParam?: string;
  /** The id of a problem that starts open, for a deep link you resolve on the server. A link that targets a problem opens it either way. */
  defaultOpen?: string;
  /** Write the open problem's id to the address bar, so support can copy the URL of what they see. On by default. */
  syncHash?: boolean;
  /** Renders the support links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Draws a screenshot: plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: ProblemImage, className: string) => ReactNode;
  /** Replaces any of the fixed words, for another language. */
  labels?: Partial<TroubleshootingLabels>;
}

const LABELS: TroubleshootingLabels = {
  cause: "Likely cause",
  fix: "Fix",
  stuck: "Still stuck?",
  contact: "Contact support",
  problemCount: (count) => `${count} ${count === 1 ? "problem" : "problems"}`,
};

function DefaultImage(image: ProblemImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className={className} />;
}

/** Adds the symptom to the support link's query string, keeping any hash. */
function withSymptom(href: string, param: string, symptom: string): string {
  const hashAt = href.indexOf("#");
  const base = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  return `${base}${base.includes("?") ? "&" : "?"}${encodeURIComponent(param)}=${encodeURIComponent(symptom)}${hash}`;
}

const caption = "text-xs font-medium tracking-[.14em] text-muted-foreground uppercase";

/**
 * Problems listed by what the user sees, in the order people actually debug:
 * the symptom in their words, the likely cause, then numbered fix steps with
 * optional code to copy or a screenshot, and a Still stuck? line that links to
 * support with the symptom pre-filled. Problems are grouped by area (Sign-in,
 * Billing, Sync), open in an accordion one at a time, and have stable ids, so
 * support can link straight to one: a link that targets a problem opens it on
 * arrival, and opening one writes its id to the address bar for copying. It
 * differs from an FAQ by that fixed order of symptom, cause and fix. Areas are
 * h2 and problems h3, so the guide sits directly under your page's h1.
 */
export function TroubleshootingGuide({
  areas,
  supportHref,
  symptomParam = "symptom",
  defaultOpen,
  syncHash = true,
  linkAs: Link = "a",
  renderImage = DefaultImage,
  labels,
  className,
  ...props
}: TroubleshootingGuideProps) {
  const uid = useId();
  const text = { ...LABELS, ...labels };

  const renderStep = (step: string | ProblemStep, index: number) => {
    const detail: ProblemStep = typeof step === "string" ? { text: step } : step;
    return (
      <li key={index} className="flex gap-3.5">
        <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs font-medium text-muted-foreground tabular-nums">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 text-base leading-relaxed text-foreground/85">
          {detail.text}
          {detail.code ? <CodeBlock code={detail.code.code} language={detail.code.language} filename={detail.code.filename} className="mt-3 bg-card" /> : null}
          {detail.image ? (
            <figure className="mt-3">
              <div className="overflow-hidden rounded-xl border border-border bg-muted">{renderImage(detail.image, "block w-full")}</div>
              {detail.image.caption ? <figcaption className="mt-2 text-sm text-muted-foreground">{detail.image.caption}</figcaption> : null}
            </figure>
          ) : null}
        </div>
      </li>
    );
  };

  const renderProblem = (problem: TroubleshootingProblem) => (
    <div className="grid gap-6 pb-6">
      <div>
        <p className={caption}>{text.cause}</p>
        <div className="mt-2 text-base leading-relaxed text-foreground/85">{problem.cause}</div>
      </div>
      {problem.warning ? <Callout tone="warning">{problem.warning}</Callout> : null}
      <div>
        <p className={caption}>{text.fix}</p>
        <ol role="list" className="mt-4 grid gap-5">
          {problem.steps.map(renderStep)}
        </ol>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-5 text-sm">
        <span className="text-muted-foreground">{text.stuck}</span>
        <Link
          href={problem.support?.href ?? withSymptom(supportHref, symptomParam, problem.symptom)}
          className="group/support inline-flex items-center gap-1.5 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {problem.support?.label ?? text.contact}
          <IconArrowRight size={16} aria-hidden="true" className="transition-transform duration-150 group-hover/support:translate-x-0.5 motion-reduce:transition-none" />
        </Link>
      </p>
    </div>
  );

  return (
    <div data-slot="troubleshooting-guide" className={cn("py-12 sm:py-16", className)} {...props}>
      {areas.map((area) => (
        <section
          key={area.id}
          id={area.id}
          aria-labelledby={`${uid}-${area.id}`}
          className="grid scroll-mt-24 gap-x-12 gap-y-6 border-t border-border py-12 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-[14rem_minmax(0,1fr)]"
        >
          <header className="lg:sticky lg:top-[var(--sticky-top,6rem)] lg:self-start">
            {area.icon ? (
              <span aria-hidden="true" className="mb-4 grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground [&_svg]:size-5">
                {area.icon}
              </span>
            ) : null}
            <h2 id={`${uid}-${area.id}`} className="text-xl font-semibold tracking-[-.025em] text-balance">
              {area.title}
            </h2>
            {area.description ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{area.description}</p> : null}
            <p className="mt-3 text-sm text-muted-foreground tabular-nums">{text.problemCount(area.problems.length)}</p>
          </header>
          <ProblemList
            defaultOpen={defaultOpen}
            syncHash={syncHash}
            items={area.problems.map((problem) => ({ id: problem.id, symptom: problem.symptom, children: renderProblem(problem) }))}
          />
        </section>
      ))}
    </div>
  );
}
