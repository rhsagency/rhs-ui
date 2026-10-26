import { useId, type ComponentProps, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CtaPhotoSplitProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The closing ask: "Your first session is on us." */
  title: string;
  /** One or two sentences that make the ask easy to say yes to. */
  description?: string;
  /** What removes the last doubts, a line each: "No contract", "Mats and towels provided". Three at most reads best. */
  points?: readonly string[];
  /** The action: a button, or a button and a quiet second one. */
  actions: ReactNode;
  /** A line under the action that takes away the last worry: "Takes two minutes. We confirm within the hour." */
  note?: string;
  /**
   * The photograph, as an `<img>`, a `<picture>` or your framework's image. It fills its half edge to edge and is
   * cropped to fit, so choose a picture that still works as a wide crop. Give it alt text that says what is in it,
   * or an empty alt when the picture is only atmosphere.
   */
  image: ReactNode;
  /** Which half the photograph takes on a wide screen. "left" by default. On a phone it is always above the copy. */
  imageSide?: "left" | "right";
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
}

/**
 * A closing call to action beside a real photograph, for services, studios and local businesses that sell on
 * people and place: a bordered card split in two, the picture filling one half edge to edge and the headline, a
 * sentence, a short list of reassurances and the action with a note on the other. The photograph is always
 * visible and never revealed by an animation, and its space is fixed (16:9 on a phone, the height of the copy on
 * a wide screen), so the card does not move while the picture loads. It is the light, human version of a closing
 * ask: no dark band, no product shot. It needs no client JavaScript.
 */
export function CtaPhotoSplit({ title, description, points, actions, note, image, imageSide = "left", headingLevel = 2, className, ...props }: CtaPhotoSplitProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <section data-slot="cta-photo-split" data-image-side={imageSide} aria-labelledby={`${id}-title`} className={cn("@container overflow-hidden rounded-3xl border border-border bg-card break-words", className)} {...props}>
      <div className="grid @4xl:grid-cols-2">
        <div
          data-slot="cta-photo-split-image"
          className={cn(
            "relative aspect-video overflow-hidden bg-muted @4xl:aspect-auto @4xl:min-h-[26rem]",
            "[&_img]:absolute [&_img]:inset-0 [&_img]:size-full [&_img]:object-cover",
            imageSide === "right" && "@4xl:order-2",
          )}
        >
          {image}
        </div>
        <div className="flex min-w-0 flex-col justify-center p-6 @md:p-10 @4xl:p-14">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          {points?.length ? (
            <ul role="list" className="mt-6 grid gap-2.5 text-[0.9375rem] leading-snug">
              {points.map((point, index) => (
                <li key={`${index}-${point}`} className="flex items-start gap-3 text-pretty">
                  <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
          {note ? <p className="mt-4 text-sm leading-snug text-pretty text-muted-foreground">{note}</p> : null}
        </div>
      </div>
    </section>
  );
}
