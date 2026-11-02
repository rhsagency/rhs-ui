import { useId, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { ScrollRegion } from "@rhs-ui/marketing/app-screens-row/scroll-region";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { cn } from "@/lib/utils";

export interface AppScreen {
  /** The address of the screenshot. A data: URI works too. */
  src: string;
  /** What the screen shows, in one sentence: "The week view, with Tuesday's dinner open." */
  alt: string;
  /** The caption under the phone, in a few words: "Plan your week". */
  caption: string;
  /** Intrinsic width in pixels. It goes on the image so the browser knows its proportions before it loads. */
  width: number;
  /** Intrinsic height in pixels. */
  height: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. The default is the width of a phone in the row. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the screenshot loads: the seed of the blur. */
  blurDataUrl?: string;
  /** Loads the picture eagerly and at high priority: set it for a row that is above the fold. */
  priority?: boolean;
}

export interface AppScreensRowLabels {
  /** The name of the sideways scroll region on a phone, read out when it takes focus. */
  region: string;
}

const LABELS: AppScreensRowLabels = { region: "App screens" };

export interface AppScreensRowProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Your week, sorted". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Four to six screenshots in the order you want them told. Each is drawn inside a phone frame, at a 9:19.5 screen, so crop them to that. */
  screens: readonly AppScreen[];
  /** How far the scroller runs on past the edges of the section on a phone: a number of px, or a CSS length such as "1.5rem" or "var(--page-gutter)". Pass your page's side padding and the row reaches the edges of the screen instead of stopping at the margin, which says "swipe" far better. It does nothing where the row is a grid. 0 by default. */
  bleed?: number | string;
  /** Which screen is larger on a wide section. The middle one by default; a number outside the list makes them all the same size. */
  featuredIndex?: number;
  /** Plug in next/image or any optimiser. Defaults to a plain <img> with lazy loading, a decoding hint, the size and the sizes you give. */
  renderImage?: (screen: AppScreen, options: { className: string; priority: boolean }) => ReactNode;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AppScreensRowLabels>;
}

function DefaultImage(screen: AppScreen, { className, priority }: { className: string; priority: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={screen.src} alt={screen.alt} width={screen.width} height={screen.height} srcSet={screen.srcSet} sizes={screen.sizes ?? "(min-width: 896px) 20vw, 62vw"} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={className} />;
}

/** The proportions of a phone screen, 9 wide to 19.5 high. */
const SCREEN = 9 / 19.5;

/**
 * One phone, drawn in CSS: a bezel, a screen and a camera pill, every measure a share of the phone's own width
 * (cqw), so it is the same phone at 150px as at 300px. The bezel is the ink colour in the light theme and the card
 * colour in the dark one, so it follows the page and never needs a picture of a device.
 */
function Phone({ screen, featured, children }: { screen: AppScreen; featured: boolean; children: ReactNode }) {
  return (
    <div data-slot="app-screens-row-phone" data-featured={featured || undefined} className="@container mx-auto w-full max-w-62 @4xl:self-end @4xl:data-[featured]:max-w-74">
      <div className="relative rounded-[15cqw] bg-foreground p-[3.4cqw] shadow-sm ring-1 ring-foreground/10 dark:bg-card dark:ring-foreground/20">
        <span aria-hidden="true" className="absolute top-[6.4cqw] left-1/2 z-10 h-[6.2cqw] w-[24cqw] -translate-x-1/2 rounded-full bg-foreground dark:bg-background" />
        {/* The side keys, a hair outside the bezel. */}
        <span aria-hidden="true" className="absolute top-[26cqw] -left-[0.8cqw] h-[9cqw] w-[1cqw] rounded-l-[0.5cqw] bg-foreground dark:bg-card" />
        <span aria-hidden="true" className="absolute top-[38cqw] -left-[0.8cqw] h-[9cqw] w-[1cqw] rounded-l-[0.5cqw] bg-foreground dark:bg-card" />
        <span aria-hidden="true" className="absolute top-[32cqw] -right-[0.8cqw] h-[14cqw] w-[1cqw] rounded-r-[0.5cqw] bg-foreground dark:bg-card" />
        <div className="relative overflow-hidden rounded-[11.6cqw] bg-muted">
          <AspectRatio ratio={SCREEN}>
            {screen.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${screen.blurDataUrl}")` } as CSSProperties} /> : null}
            {children}
          </AspectRatio>
        </div>
      </div>
    </div>
  );
}

/**
 * A row of phone screens with a caption under each: the app, shown the way
 * people look at an app, one screen after the other. Every screen is a figure
 * with a caption, in a phone drawn in CSS (a bezel, a screen and a camera
 * pill that scale with the phone, in both themes, for no bytes). On a wide
 * section the row is a grid in which the featured screen, the middle one by
 * default, is larger and the others stand on the same line, so they sit a
 * little lower and the captions line up under them. On a phone the row becomes
 * a sideways scroller that snaps to a screen, with the next one peeking in so it
 * is clear there is more; the scroller is a labelled region the keyboard can
 * reach and scroll, and it is a stop in the tab order only while there is
 * something to scroll. The screenshots keep their proportions before they load,
 * a blurred seed stands in until they arrive, and they are lazy unless you say
 * the row is above the fold. Nothing animates.
 */
export function AppScreensRow({ title, description, screens, bleed = 0, featuredIndex, renderImage = DefaultImage, headingLevel = 2, labels: custom, className, style, ...props }: AppScreensRowProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const featured = featuredIndex ?? Math.floor((screens.length - 1) / 2);
  // One column per screen, the featured one a fifth wider: set as a variable so only the wide layout uses it.
  const columns = screens.map((_, index) => (index === featured ? "minmax(0,1.22fr)" : "minmax(0,1fr)")).join(" ");

  return (
    <section
      data-slot="app-screens-row"
      aria-labelledby={`${id}-title`}
      style={{ "--phone": "min(14.5rem, 62cqw)", ...style } as CSSProperties}
      className={cn("@container w-full break-words", className)}
      {...props}
    >
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      <ScrollRegion
        aria-label={labels.region}
        style={{ "--bleed": typeof bleed === "number" ? `${bleed}px` : bleed } as CSSProperties}
        className="relative -mx-(--bleed) mt-10 snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl py-2 outline-none [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_45%,transparent)_transparent] [scrollbar-width:thin] focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:scroll-auto @xl:scroll-px-(--bleed) @4xl:mx-0 @4xl:mt-14 @4xl:snap-none @4xl:overflow-visible [@media(pointer:coarse)]:[&::-webkit-scrollbar]:hidden [@media(pointer:coarse)]:[scrollbar-width:none]"
      >
        <ul
          role="list"
          style={{ "--cols": columns } as CSSProperties}
          className="flex w-max min-w-full gap-4 px-[calc(50%_-_var(--phone)/2)] @xl:px-(--bleed) @4xl:mx-auto @4xl:grid @4xl:w-auto @4xl:min-w-0 @4xl:max-w-5xl @4xl:[grid-template-columns:var(--cols)] @4xl:gap-x-8 @4xl:gap-y-6 @4xl:px-0"
        >
          {screens.map((screen, index) => {
            const isFeatured = index === featured;
            return (
              <li key={`${index}-${screen.caption}`} className="flex w-(--phone) shrink-0 snap-center @xl:snap-start @4xl:row-span-2 @4xl:grid @4xl:w-auto @4xl:grid-rows-subgrid">
                <figure className="flex w-full min-w-0 flex-col @4xl:row-span-2 @4xl:grid @4xl:grid-rows-subgrid">
                  <Phone screen={screen} featured={isFeatured}>
                    {renderImage(screen, { priority: screen.priority ?? false, className: "absolute inset-0 size-full object-cover object-top" })}
                  </Phone>
                  <figcaption
                    data-featured={isFeatured || undefined}
                    className="mt-5 text-center text-sm leading-snug text-balance text-muted-foreground @4xl:mt-0 @4xl:data-[featured]:font-medium @4xl:data-[featured]:text-foreground"
                  >
                    {screen.caption}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </ScrollRegion>
    </section>
  );
}
