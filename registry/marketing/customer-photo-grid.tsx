import { useId, type ComponentProps } from "react";

import { IconArrowUpRight, IconCamera, IconCheckCircle } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CustomerPhoto {
  /** Identifies the photo in the grid. */
  id: string;
  /** The picture. It is cropped to a square, so keep the subject in the middle. */
  photo: string;
  /** What the picture shows. Required: it is the only description of the photo for anyone who cannot see it. */
  alt: string;
  /** Who shared it, as written on the original post: "@maren.maakt". It is the name of the link. */
  handle: string;
  /** A few words from the post. Two lines show; the rest is cut. */
  caption?: string;
  /** The original post. */
  href: string;
}

export interface CustomerPhotoGridProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Six photos fill three by two on a desktop and two by three on a phone; any number works. */
  photos: readonly CustomerPhoto[];
  /** The invitation under the grid: "Share yours with #atnorth". */
  cta?: { label: string; href: string };
  /** A line that says the photos are used with consent: "Shared with permission". */
  permission?: string;
}

/**
 * User-generated proof for things that look good in real life: clothes, food, interiors, plants. A tight grid
 * of square photos, three by two on a desktop and two by three on a phone, each one a link to the original
 * post. The customer's handle and a few words of their caption sit on a strip under the photo, always there
 * and never on hover only, so nothing is a mystery on a touch screen. The link is the strip: it is named by
 * the handle and the caption, exactly what is written on it, and it stretches over the whole tile so the photo
 * is part of the target; the photo stays outside the link with its own alt text, which describes the picture.
 * Photos are cropped through AspectRatio, so nothing shifts as they load, and they load lazily. Under the grid
 * sit the invitation to share yours and a line saying the photos are shared with permission. No state of its
 * own, so it renders on the server.
 */
export function CustomerPhotoGrid({ title, description, photos, cta, permission, className, ...props }: CustomerPhotoGridProps) {
  const heading = useId();

  return (
    <section data-slot="customer-photo-grid" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:gap-4 md:grid-cols-3">
        {photos.map((item) => (
          // The tile is the positioned box, so the stretched link and its focus ring are not clipped by the rounded, overflow-hidden card inside it.
          <li key={item.id} className="group/tile relative">
            <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors duration-150 group-hover/tile:border-foreground/30 motion-reduce:transition-none">
              <AspectRatio ratio={1} className="overflow-hidden bg-muted">
                <img
                  src={item.photo}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover/tile:scale-[1.03] motion-reduce:transition-none"
                />
              </AspectRatio>
              <div className="flex flex-1 items-start justify-between gap-2 border-t border-border px-3 py-2.5 sm:px-3.5 sm:py-3">
                <a
                  href={item.href}
                  className="grid min-w-0 gap-0.5 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
                >
                  {/* The handle is the credit and the name of the link, so it wraps on a narrow tile instead of being cut short. */}
                  <span className="text-[0.8125rem] leading-snug font-medium [overflow-wrap:anywhere] sm:text-sm">{item.handle}</span>
                  {item.caption ? <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{item.caption}</span> : null}
                </a>
                {/* Left out below 380px, where its 24px are worth more to the handle: a tile is then 150px wide, and a handle of fourteen letters needs the room. */}
                <IconArrowUpRight
                  aria-hidden="true"
                  className="mt-0.5 hidden size-4 shrink-0 text-muted-foreground transition-transform duration-150 min-[380px]:block motion-safe:group-hover/tile:translate-x-0.5 motion-safe:group-hover/tile:-translate-y-0.5 motion-reduce:transition-none"
                />
              </div>
            </article>
          </li>
        ))}
      </ul>
      {cta || permission ? (
        <div className={cn("mt-8 flex flex-col items-center gap-4 sm:mt-10", cta && permission ? "sm:flex-row-reverse sm:justify-between" : "sm:justify-center")}>
          {cta ? (
            <Button asChild>
              <a href={cta.href}>
                <IconCamera />
                {cta.label}
              </a>
            </Button>
          ) : null}
          {permission ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconCheckCircle aria-hidden="true" className="size-4 shrink-0" />
              {permission}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
