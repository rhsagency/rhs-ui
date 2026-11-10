"use client";

import { useCallback, useState, type ComponentProps, type ReactElement, type ReactNode, type SyntheticEvent } from "react";
import { Slot } from "radix-ui";

import { IconImage, IconRefresh } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ProgressiveImageLabels {
  /** The name of the button on the failure placeholder. Default "Retry". */
  retry?: string;
  /** What a screen reader hears when the image fails. Default "The image could not be loaded." */
  failed?: string;
}

interface ProgressiveImageBase extends Omit<ComponentProps<"div">, "children" | "onLoad" | "onError"> {
  /** The shape reserved for the image, as width divided by height. Without it the shape comes from `width` and `height`, and without those it is 3 / 2. */
  ratio?: number;
  /** The width of the file in pixels. With `height` it sets the shape, and both are written to the img. */
  width?: number;
  /** The height of the file in pixels. */
  height?: number;
  /** A tiny version of the picture, as a data URL, painted blurred under the image until it has loaded. */
  blurDataURL?: string;
  /** Any CSS colour, painted under the blur or alone when you have no blur data. Default is the muted surface. */
  placeholderColor?: string;
  /** The sizes attribute of the img: how wide the image is shown at each viewport. */
  sizes?: string;
  /** The srcset attribute of the img. */
  srcSet?: string;
  /** Load now instead of when the image nears the screen, and with a high fetch priority: for the picture at the top of the page. */
  priority?: boolean;
  /** How the picture fills the frame. Default "cover". */
  fit?: "cover" | "contain";
  /** Shown instead of the picture-and-name placeholder when loading fails. The Retry button stays. */
  fallback?: ReactNode;
  /** Offer Retry when loading fails. Default true. */
  retry?: boolean;
  /** The words used for the Retry button and the failure announcement. */
  labels?: ProgressiveImageLabels;
  /** Called when the picture has loaded. */
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  /** Called when loading fails. */
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
  /** Called when Retry is pressed, so you can swap the address for a fallback host. */
  onRetry?: () => void;
}

interface PlainImage {
  /** Leave it off to render a plain img. */
  asChild?: false;
  /** The address of the picture. Leave it out while it is still unknown (a fetch is on its way): the placeholder holds the space and nothing is requested. */
  src?: string;
  /** What the picture shows. Required, and shown on the failure placeholder. */
  alt: string;
  children?: undefined;
}

interface SlottedImage {
  /** Wrap your own image element, such as a `next/image` with `fill`, and it gets the same placeholder, fade and Retry. */
  asChild: true;
  /** The image element to wrap. It must forward a ref, onLoad and onError to its img, as next/image does. */
  children: ReactElement;
  /** The wrapped element carries its own src. */
  src?: undefined;
  /** Shown on the failure placeholder. The wrapped element keeps its own alt. */
  alt?: string;
}

export type ProgressiveImageProps = ProgressiveImageBase & (PlainImage | SlottedImage);

/** A string written inside url("..."), so a data URL with a quote in it cannot end the value early. */
const cssUrl = (value: string) => `url("${value.replace(/["\\\n\r]/g, (char) => encodeURIComponent(char))}")`;

/** The address of a wrapped image: a string, or the object a static import gives. */
function sourceOf(node: ReactElement | undefined): string | undefined {
  const value = (node?.props as { src?: unknown } | undefined)?.src;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "src" in value && typeof value.src === "string") return value.src;
  return undefined;
}

/**
 * An image that arrives gracefully. The space is reserved with the aspect
 * ratio, so nothing shifts; a blurred placeholder (a tiny `blurDataURL`, or a
 * colour) is painted first and fades away once the sharp image has decoded,
 * and an image that was already there, from the cache or from the server's
 * HTML, shows with no fade at all, so going back to a page never flashes. If
 * loading fails it shows a quiet placeholder with the alt text and a Retry
 * button. It renders a plain img, or with `asChild` wraps your own image
 * element such as next/image. The fade is off under reduced motion, and
 * without script the placeholder steps aside and the image simply shows.
 */
export function ProgressiveImage(props: ProgressiveImageProps) {
  const { src, alt, asChild, children, ratio, width, height, blurDataURL, placeholderColor, sizes, srcSet, priority = false, fit = "cover", fallback, retry = true, labels, onLoad, onError, onRetry, className, ...rest } = props;
  const text = { retry: labels?.retry ?? "Retry", failed: labels?.failed ?? "The image could not be loaded." };
  const identity = asChild ? sourceOf(children) : src;

  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  // True when the picture was already there: the placeholder leaves at once instead of fading.
  const [instant, setInstant] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // A new address starts the picture over.
  const [tracked, setTracked] = useState(identity);
  if (tracked !== identity) {
    setTracked(identity);
    setStatus("loading");
    setInstant(false);
  }

  // An image can finish before React attaches onLoad (a cached one, or one from the server's HTML), and then no event ever comes.
  // One that is already there has been painted under the placeholder, so the placeholder leaves at once; a finished image with no size is either broken or an SVG, and decode() says which.
  const attach = useCallback((node: HTMLElement | null) => {
    const image = node as HTMLImageElement | null;
    if (!image || typeof image.decode !== "function" || !image.complete) return;
    const shown = () => {
      setInstant(true);
      setStatus("loaded");
    };
    if (image.naturalWidth > 0) shown();
    else image.decode().then(shown, () => setStatus("error"));
  }, []);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(event);
    const done = () => setStatus("loaded");
    const image = event.currentTarget;
    if (typeof image.decode === "function") image.decode().then(done, done);
    else done();
  };
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    setStatus("error");
  };
  const retryLoad = () => {
    setStatus("loading");
    setInstant(false);
    setAttempt((count) => count + 1);
    onRetry?.();
  };

  const frame = ratio ?? (width && height ? width / height : 3 / 2);
  const picture = cn("absolute inset-0 size-full", fit === "cover" ? "object-cover" : "object-contain");
  const showImage = status !== "error";

  return (
    <div data-slot="progressive-image" data-state={status} aria-busy={status === "loading" || undefined} className={cn("relative w-full overflow-hidden rounded-lg bg-muted", className)} {...rest}>
      <AspectRatio ratio={frame}>
        {showImage && asChild ? (
          <Slot.Root key={attempt} ref={attach} onLoad={handleLoad} onError={handleError} className={picture}>
            {children}
          </Slot.Root>
        ) : null}
        {showImage && !asChild && src ? (
          <img
            key={attempt}
            ref={attach}
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            srcSet={srcSet}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={picture}
          />
        ) : null}
        <span
          aria-hidden="true"
          data-slot="progressive-image-placeholder"
          style={placeholderColor ? { backgroundColor: placeholderColor } : undefined}
          className={cn(
            "absolute inset-0 overflow-hidden bg-muted noscript:hidden",
            // It leaves with a fade; it comes back (a new picture, a retry) at once.
            status === "loading" ? "visible opacity-100" : "invisible opacity-0 transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none",
            instant && "transition-none",
          )}
        >
          {blurDataURL ? <span className="absolute -inset-[12%] bg-cover bg-center blur-2xl" style={{ backgroundImage: cssUrl(blurDataURL) }} /> : null}
        </span>
        {status === "error" ? (
          <div data-slot="progressive-image-error" className="@container absolute inset-0 grid place-content-center justify-items-center gap-2.5 bg-muted p-3 text-center text-muted-foreground">
            {fallback ?? (
              <>
                <IconImage aria-hidden="true" className="size-5" />
                {alt ? <p className="line-clamp-2 max-w-[22ch] text-xs text-balance @max-[10rem]:hidden">{alt}</p> : null}
              </>
            )}
            {retry ? (
              <Button type="button" variant="outline" size="sm" onClick={retryLoad}>
                <IconRefresh aria-hidden="true" />
                {text.retry}
              </Button>
            ) : null}
          </div>
        ) : null}
      </AspectRatio>
      <span role="status" className="sr-only">
        {status === "error" ? `${text.failed}${alt ? ` ${alt}` : ""}` : ""}
      </span>
    </div>
  );
}
