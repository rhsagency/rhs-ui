import { useId, type ComponentProps, type ReactNode } from "react";
import { Slot } from "radix-ui";

import { IconArrowRight, IconArrowUpRight } from "@rhs-ui/icons";
import { Card, CardDescription } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

export interface LinkCardProps extends Omit<ComponentProps<"div">, "title"> {
  /** Where it goes. With `asChild`, put the href on your own link instead. */
  href?: string;
  /** The title, and the text of the card's one link. */
  title: string;
  /** One or two lines under the title. Linked to the link with aria-describedby, so a screen reader hears both. */
  description?: ReactNode;
  /** A glyph or small drawing in a tile above (or beside) the text: `<IconBook />`. Ignored when there is an image. */
  icon?: ReactNode;
  /** A picture for the card. It is decorative unless you give it an alt, because the title already names the card. */
  image?: { src: string; alt?: string };
  /** Opens in a new tab: adds an up-right arrow and a visually hidden "(opens in a new tab)". */
  external?: boolean;
  /** Icon or image above the text (default), or beside it. */
  orientation?: "vertical" | "horizontal";
  /** The heading element for the title. Pick the level the page outline needs, or `p` for no heading. */
  as?: "h2" | "h3" | "h4" | "h5" | "p";
  /** Render the link as your own element, such as a framework link: pass it as the only child, with no text, and give it its own href. The title and the arrow go inside it. */
  asChild?: boolean;
  /** With `asChild`: your link. */
  children?: ReactNode;
}

/**
 * A card that is one link: a tile or picture, the title, a line or two of
 * description and an arrow. The title is the single link and is stretched over
 * the whole card, so there is one tab stop, no interactive element inside
 * another, and the focus ring goes around the card. External links add an
 * up-right arrow and a hidden "opens in a new tab". The arrow nudges on hover
 * unless reduced motion is on. For docs home pages, resource lists and
 * navigation grids.
 */
export function LinkCard({ href, title, description, icon, image, external = false, orientation = "vertical", as: Heading = "h3", asChild = false, children, className, ...props }: LinkCardProps) {
  const descriptionId = useId();
  const Link = asChild ? Slot.Root : "a";
  const Arrow = external ? IconArrowUpRight : IconArrowRight;
  const horizontal = orientation === "horizontal";
  // Only the attributes that have a value. With asChild they are merged into your link, and an `href: undefined`
  // would overwrite the href of a wrapper that spreads its props after its own (`<a href={to} {...props} />`).
  const linkProps: ComponentProps<"a"> = {};
  if (href !== undefined) linkProps.href = href;
  if (external) {
    linkProps.target = "_blank";
    linkProps.rel = "noopener noreferrer";
  }
  if (description) linkProps["aria-describedby"] = descriptionId;
  return (
    <Card
      data-slot="link-card"
      data-orientation={orientation}
      className={cn(
        "group/link-card relative gap-4 transition-[border-color,background-color,box-shadow] duration-200",
        "hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_28%)] hover:bg-muted/40",
        "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
        horizontal ? "flex-row items-start p-4 sm:p-5" : "p-5",
        className,
      )}
      {...props}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; pass your own markup through asChild if you need next/image
        <img src={image.src} alt={image.alt ?? ""} loading="lazy" decoding="async" className={cn("rounded-lg border border-border bg-muted object-cover", horizontal ? "aspect-square w-20 shrink-0 sm:aspect-[4/3] sm:w-36" : "aspect-[16/9] w-full")} />
      ) : icon ? (
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition-colors duration-200 group-hover/link-card:border-[color-mix(in_oklch,var(--border),var(--foreground)_28%)] [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Heading className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]">
          <Link {...linkProps} className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']">
            {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : null}
            {title}
            {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
            <Arrow aria-hidden="true" className={cn("ml-1.5 inline-block size-4 align-[-0.2em] text-muted-foreground transition-[translate,color] duration-200 group-hover/link-card:translate-x-0.5 group-hover/link-card:text-foreground motion-reduce:transition-none motion-reduce:group-hover/link-card:translate-x-0", external && "group-hover/link-card:-translate-y-0.5 motion-reduce:group-hover/link-card:translate-y-0")} />
          </Link>
        </Heading>
        {description ? (
          <CardDescription id={descriptionId} className="leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
      </div>
    </Card>
  );
}
