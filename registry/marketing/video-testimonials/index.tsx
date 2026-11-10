import { useId, type ComponentProps, type ReactNode } from "react";

import { spokenDuration } from "@rhs-ui/marketing/video-testimonials/duration";
import type { TestimonialVideo, VideoTestimonialsLabels } from "@rhs-ui/marketing/video-testimonials/types";
import { VideoCard } from "@rhs-ui/marketing/video-testimonials/video-card";
import { cn } from "@/lib/utils";

export type { TestimonialVideo, TestimonialVideoCaptions, VideoTestimonialsLabels } from "@rhs-ui/marketing/video-testimonials/types";

export interface VideoTestimonialsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** One to four customers on camera; three is the grid this is made for. */
  videos: readonly TestimonialVideo[];
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /**
   * Renders the player for a video in place of the built-in video element, for an embed from your video host. It is
   * called for every card when the grid renders, but what it returns only mounts once that card has been pressed.
   * Fill the 16:9 frame it is given: `className="absolute inset-0 size-full"`.
   */
  renderPlayer?: (video: TestimonialVideo) => ReactNode;
  /** The locale the length is spoken in ("2 minutes 14 seconds"). Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<VideoTestimonialsLabels>;
}

const LABELS: VideoTestimonialsLabels = {
  play: "Play {name}'s story, {duration}",
  close: "Close video",
  hint: "A video with player controls. Press Escape to close it.",
  failed: "This video could not be loaded.",
  captions: "Captions",
};

/** The grid fits the number of cards: three across from 768px is the layout it is made for. */
const columnsFor = (count: number): string => (count <= 1 ? "mx-auto max-w-2xl" : count === 2 ? "sm:grid-cols-2" : count === 3 ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4");

/**
 * Customers on camera, with nothing loaded until someone asks. Each card is
 * one real button: a poster that is always visible (never revealed by an
 * animation), a play disc, the person's name and role and the length as text,
 * named like "Play Maria's story, 2 minutes 14 seconds". Pressing it opens a
 * dialog with a native video (controls, no preload, a captions track when you
 * give one) and starts it; closing the dialog pauses the video and returns focus
 * to the card, and Escape closes it. Hosting the video elsewhere? `renderPlayer`
 * puts your embed in the same dialog and mounts it only when the card is
 * pressed. A page of three customers' faces and voices costs the poster images
 * and nothing more.
 */
export function VideoTestimonials({ videos, title, description, renderPlayer, locale = "en-US", labels, className, ...props }: VideoTestimonialsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="video-testimonials" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className={cn("mt-12 grid gap-x-6 gap-y-10 sm:mt-16", columnsFor(videos.length))}>
        {videos.map((video) => (
          <li key={video.id} className="min-w-0">
            <VideoCard
              video={video}
              playLabel={words.play.replace("{name}", video.name).replace("{duration}", spokenDuration(video.duration, locale))}
              closeLabel={words.close}
              hintLabel={words.hint}
              failedLabel={words.failed}
              captionsLabel={words.captions}
            >
              {renderPlayer ? renderPlayer(video) : null}
            </VideoCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
