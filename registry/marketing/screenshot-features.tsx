import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface ScreenshotImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What the screen shows, in one sentence: "The Kestrel Today view: tasks for the day on the left, the open task and its comments on the right." */
  alt: string;
  /** Intrinsic width in pixels. The frame takes its proportions from width and height, so nothing jumps while the picture loads. */
  width: number;
  /** Intrinsic height in pixels. */
  height: number;
  /** The words in the window's title bar: "kestrel.app/today". */
  title?: string;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. The default is the width of the section. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the screenshot loads: the seed of the blur. */
  blurDataUrl?: string;
  /** Loads the picture eagerly and at high priority: set it when the section is above the fold. */
  priority?: boolean;
}

export interface ScreenshotFeature {
  /** What you can do, in a few words: "One list for today". */
  title: string;
  /** Two lines on the part of the screenshot it is about. */
  description: string;
  /** Where to read more. The link says Learn more and is named after the feature for a screen reader. */
  href?: string;
  /** Where on the screenshot it is about, as percentages of its width and height. A numbered mark is drawn there, matching the number of the column. */
  marker?: { x: number; y: number };
}

export interface ScreenshotFeaturesLabels {
  /** The link of a feature that has an href. */
  learnMore: string;
  /** What a screen reader adds after the link, so each one is named after its feature. {title} stands for the feature's title. */
  learnMoreAbout: string;
  /** The name of the list of features for assistive technology. */
  features: string;
}

const LABELS: ScreenshotFeaturesLabels = { learnMore: "Learn more", learnMoreAbout: "about {title}", features: "What you see in the screenshot" };

export interface ScreenshotFeaturesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "The product". */
  eyebrow?: string;
  /** The heading: "See how your week comes together". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The screenshot, shown full width in a window frame. */
  screenshot: ScreenshotImage;
  /** Three or four features, each about a part of the screenshot. Under 768px they stack and the screenshot stays full width. */
  features: readonly ScreenshotFeature[];
  /** Plug in next/image or any optimiser. Defaults to a plain <img> with lazy loading, a decoding hint, the size and the sizes you give. */
  renderImage?: (image: ScreenshotImage, options: { className: string; priority: boolean }) => ReactNode;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ScreenshotFeaturesLabels>;
}

function DefaultImage(image: ScreenshotImage, { className, priority }: { className: string; priority: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt} width={image.width} height={image.height} srcSet={image.srcSet} sizes={image.sizes ?? "(min-width: 1280px) 1152px, 100vw"} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={className} />;
}

/** Columns by how many features there are, written out so Tailwind sees every class. Under 768px they stack; four go two by two before they go four across. */
const COLUMNS = ["", "", "@3xl:grid-cols-2", "@3xl:grid-cols-3", "@3xl:grid-cols-2 @5xl:grid-cols-4", "@3xl:grid-cols-3"];

/**
 * The most common features layout, done carefully: a centred heading, one large screenshot in a window frame with
 * a quiet title bar, and three or four columns underneath, each numbered and each about a region of the picture
 * above. Give a feature a marker and its number is drawn on the screenshot where the feature lives, so the eye
 * can go from the column to the place and back. The frame keeps the screenshot's proportions before it loads, a
 * blurred seed of the picture stands in until it arrives, and the picture is lazy unless the section is above
 * the fold. The alt text describes the screen in a sentence; the marks and the dots are decoration, and the marks
 * are sized from the picture, so on a phone they shrink with it instead of covering what they point at. Under
 * 768px the columns stack and the screenshot stays full width. Nothing animates.
 */
export function ScreenshotFeatures({ eyebrow, title, description, screenshot, features, renderImage = DefaultImage, headingLevel = 2, labels: custom, className, ...props }: ScreenshotFeaturesProps) {
  const labels = { ...LABELS, ...custom };
  const priority = screenshot.priority ?? false;
  const marked = features.some((feature) => feature.marker);

  return (
    <section data-slot="screenshot-features" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} align="center" as={headingLevel === 3 ? "h3" : "h2"} />

      <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm @3xl:mt-14">
        <div className="flex h-10 items-center gap-3 border-b border-border bg-muted/50 px-4">
          <span aria-hidden="true" className="flex w-14 shrink-0 gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground">{screenshot.title}</span>
          {/* As wide as the dots, so the title is centred in the bar. */}
          <span aria-hidden="true" className="w-14 shrink-0" />
        </div>
        {/* The picture is a container of its own, so the marks are sized from the picture and not from the screen: a mark that is 24px on a wide page would cover whole lines of a screenshot that is 340px wide on a phone. */}
        <AspectRatio ratio={screenshot.width / screenshot.height} className="@container bg-muted">
          {screenshot.blurDataUrl ? (
            <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url("${screenshot.blurDataUrl}")` } as CSSProperties} />
          ) : null}
          {renderImage(screenshot, { priority, className: "absolute inset-0 size-full object-cover object-top" })}
          {marked
            ? features.map((feature, index) =>
                feature.marker ? (
                  <span
                    key={`${index}-${feature.title}`}
                    aria-hidden="true"
                    style={{ left: `${feature.marker.x}%`, top: `${feature.marker.y}%` } as CSSProperties}
                    className="absolute grid size-[clamp(0.875rem,2.2cqi,1.5rem)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-[length:clamp(0.5625rem,1.2cqi,0.75rem)] leading-none font-medium text-background tabular-nums ring-[length:clamp(1px,0.35cqi,4px)] ring-background/80"
                  >
                    {index + 1}
                  </span>
                ) : null,
              )
            : null}
        </AspectRatio>
      </div>

      <ol role="list" aria-label={labels.features} className={cn("mt-8 grid gap-x-10 gap-y-9 border-t border-border pt-8 @3xl:mt-10", COLUMNS[Math.min(features.length, 5)])}>
        {features.map((feature, index) => (
          <li key={`${index}-${feature.title}`} className="min-w-0">
            <p aria-hidden="true" className="text-xs font-medium text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-3 text-base leading-snug font-medium tracking-[-0.01em]">{feature.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{feature.description}</p>
            {feature.href ? (
              <a
                href={feature.href}
                className="group/link mt-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                {labels.learnMore}
                <span className="sr-only"> {labels.learnMoreAbout.replace("{title}", feature.title)}</span>
                <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
