import type { SVGProps } from "react";

/**
 * RHS UI icons. One drawing hand for every item: a 1.75px stroke on a 24
 * grid with round caps and joins. Closed shapes open at the top right, the
 * angle of the R's leg in the RHS mark; arrows, checks and crosses stay
 * closed so the opening keeps meaning something. Sized by `size` (px) and
 * coloured by `currentColor`, decorative by default (`aria-hidden`); pass a
 * `title` when the icon is the only label.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Rendered size in px, both axes. Defaults to 1em so it follows the text. */
  size?: number | string;
  /** An accessible name when the icon stands alone. */
  title?: string;
}

function Glyph({ size = "1em", d, title, ...rest }: IconProps & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      data-slot="icon"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}

const openSquare = "M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2";

export const IconCheck = (p: IconProps) => <Glyph {...p} d="M5 12.5l4.5 4.5L19 7" />;
export const IconClose = (p: IconProps) => <Glyph {...p} d="M6 6l12 12M18 6L6 18" />;
export const IconPlus = (p: IconProps) => <Glyph {...p} d="M12 5v14M5 12h14" />;
export const IconMinus = (p: IconProps) => <Glyph {...p} d="M5 12h14" />;
export const IconChevronDown = (p: IconProps) => <Glyph {...p} d="M6 9l6 6 6-6" />;
export const IconChevronUp = (p: IconProps) => <Glyph {...p} d="M6 15l6-6 6 6" />;
export const IconChevronRight = (p: IconProps) => <Glyph {...p} d="M9 6l6 6-6 6" />;
export const IconChevronLeft = (p: IconProps) => <Glyph {...p} d="M15 6l-6 6 6 6" />;
export const IconArrowRight = (p: IconProps) => <Glyph {...p} d="M4 12h15M13 6l6 6-6 6" />;
export const IconArrowLeft = (p: IconProps) => <Glyph {...p} d="M20 12H5M11 6l-6 6 6 6" />;
export const IconArrowUpRight = (p: IconProps) => <Glyph {...p} d="M7 17L17 7M8 7h9v9" />;
export const IconSearch = (p: IconProps) => (
  <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6" />
);
export const IconCart = (p: IconProps) => (
  <Glyph {...p} d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6.3M10 20.5h.01M17 20.5h.01" />
);
export const IconBag = (p: IconProps) => <Glyph {...p} d="M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2" />;
export const IconTrash = (p: IconProps) => <Glyph {...p} d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />;
export const IconUpload = (p: IconProps) => <Glyph {...p} d="M12 16V4M6 10l6-6 6 6M4 20h16" />;
export const IconImage = (p: IconProps) => <Glyph {...p} d={`${openSquare}M3 16l5-5 4 4 3-3 6 6M15.5 8.5h.01`} />;
export const IconFile = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5" />;
export const IconInfo = (p: IconProps) => (
  <Glyph {...p} d="M19.44 8.4A8.5 8.5 0 1 1 15.7 4.4M12 11v5M12 8h.01" />
);
export const IconWarning = (p: IconProps) => <Glyph {...p} d="M12 4l9 16H3zM12 10v4M12 17.5h.01" />;
export const IconExternal = (p: IconProps) => (
  <Glyph {...p} d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
);
export const IconSparkle = (p: IconProps) => (
  <Glyph {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
);
export const IconStar = (p: IconProps) => (
  <Glyph {...p} d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
);
export const IconTrendUp = (p: IconProps) => <Glyph {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />;
export const IconTrendDown = (p: IconProps) => <Glyph {...p} d="M3 7l6 6 4-4 8 8M15 17h6v-6" />;
export const IconInbox = (p: IconProps) => (
  <Glyph {...p} d="M3 12.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6.5M3 12.5h5l1.5 3h5l1.5-3h5M3 12.5L6 5h12l3 7.5" />
);
export const IconCommand = (p: IconProps) => (
  <Glyph {...p} d="M10 6a2 2 0 1 0-2 2h8a2 2 0 1 0-2-2v12a2 2 0 1 0 2-2H8a2 2 0 1 0 2 2z" />
);

/** A ring that spins: the loading indicator inside a button or a card. */
export function IconSpinner({ size = "1em", title, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      data-slot="icon-spinner"
      className={["animate-spin motion-reduce:animate-none", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
