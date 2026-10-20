import type { ReactNode, SVGProps } from "react";

/**
 * RHS UI icons. One drawing hand for every item: a 1.75px stroke on a 24
 * grid with round caps and joins. Closed shapes open at the top right, the
 * angle of the R's leg in the RHS mark; arrows, checks and crosses stay
 * closed so the opening keeps meaning something. Sized by `size` (px) and
 * coloured by `currentColor`, decorative by default (`aria-hidden`); pass a
 * `title` when the icon is the only label.
 *
 * Import from "@rhs-ui/icons". Animated versions of most glyphs are separate
 * items next to this file: "@rhs-ui/icons/animated/<name>".
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Rendered size in px, both axes. Defaults to 1em so it follows the text. */
  size?: number | string;
  /** An accessible name when the icon stands alone. */
  title?: string;
}

export interface GlyphProps extends IconProps {
  /** A single path: the common case. */
  d?: string;
  /** Several parts, for glyphs that animate or combine shapes. */
  children?: ReactNode;
}

/**
 * The frame every RHS UI icon is drawn in. Use it to draw your own glyph in
 * the same hand: `<Glyph d="M4 12h16" title="Divider" />`.
 */
export function Glyph({ size = "1em", d, title, children, ...rest }: GlyphProps) {
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
      {d ? <path d={d} /> : null}
      {children}
    </svg>
  );
}

/* Arrows & direction -- Moving, pointing and going back. */

export const IconArrowRight = (p: IconProps) => <Glyph {...p} d="M4 12h15M13 6l6 6-6 6" />;
export const IconArrowLeft = (p: IconProps) => <Glyph {...p} d="M20 12H5M11 6l-6 6 6 6" />;
export const IconArrowUp = (p: IconProps) => <Glyph {...p} d="M12 20V5M6 11l6-6 6 6" />;
export const IconArrowDown = (p: IconProps) => <Glyph {...p} d="M12 4v15M6 13l6 6 6-6" />;
export const IconArrowUpRight = (p: IconProps) => <Glyph {...p} d="M7 17L17 7M8 7h9v9" />;
export const IconChevronRight = (p: IconProps) => <Glyph {...p} d="M9 6l6 6-6 6" />;
export const IconChevronLeft = (p: IconProps) => <Glyph {...p} d="M15 6l-6 6 6 6" />;
export const IconChevronUp = (p: IconProps) => <Glyph {...p} d="M6 15l6-6 6 6" />;
export const IconChevronDown = (p: IconProps) => <Glyph {...p} d="M6 9l6 6 6-6" />;
export const IconChevronsRight = (p: IconProps) => <Glyph {...p} d="M6 6l6 6-6 6M13 6l6 6-6 6" />;
export const IconChevronsLeft = (p: IconProps) => <Glyph {...p} d="M18 6l-6 6 6 6M11 6l-6 6 6 6" />;
export const IconChevronsUpDown = (p: IconProps) => <Glyph {...p} d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" />;
export const IconCornerDownRight = (p: IconProps) => <Glyph {...p} d="M5 5v8a2 2 0 0 0 2 2h12M15 11l4 4-4 4" />;
export const IconReturn = (p: IconProps) => <Glyph {...p} d="M20 4.5V11a4 4 0 0 1-4 4H4.5M9 10.5L4.5 15 9 19.5" />;
export const IconUndo = (p: IconProps) => <Glyph {...p} d="M9 13.5L4.5 9 9 4.5M4.5 9H15a5 5 0 0 1 0 10h-3.5" />;
export const IconRedo = (p: IconProps) => <Glyph {...p} d="M15 13.5L19.5 9 15 4.5M19.5 9H9a5 5 0 0 0 0 10h3.5" />;
export const IconRefresh = (p: IconProps) => <Glyph {...p} d="M20 12a8 8 0 1 1-2.34-5.66M17.66 2.84v3.5h-3.5" />;
export const IconRepeat = (p: IconProps) => <Glyph {...p} d="M4 9.5A3.5 3.5 0 0 1 7.5 6H20M17 3l3 3-3 3M20 14.5a3.5 3.5 0 0 1-3.5 3.5H4M7 21l-3-3 3-3" />;

/* Interface */
export const IconSort = (p: IconProps) => <Glyph {...p} d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" />;
export const IconMove = (p: IconProps) => <Glyph {...p} d="M12 4v16M4 12h16M9.5 6.5L12 4l2.5 2.5M9.5 17.5L12 20l2.5-2.5M6.5 9.5L4 12l2.5 2.5M17.5 9.5L20 12l-2.5 2.5" />;
export const IconMaximize = (p: IconProps) => <Glyph {...p} d="M14.5 3.5h6v6M9.5 20.5h-6v-6M20.5 3.5L14 10M3.5 20.5L10 14" />;
export const IconMinimize = (p: IconProps) => <Glyph {...p} d="M4 14h6v6M20 10h-6V4M14 10l6.5-6.5M10 14l-6.5 6.5" />;
export const IconTrendUp = (p: IconProps) => <Glyph {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />;
export const IconTrendDown = (p: IconProps) => <Glyph {...p} d="M3 7l6 6 4-4 8 8M15 17h6v-6" />;
export const IconArrowDownLeft = (p: IconProps) => <Glyph {...p} d="M17 7L7 17M16 17H7V8" />;
export const IconArrowDownRight = (p: IconProps) => <Glyph {...p} d="M7 7l10 10M17 8v9H8" />;
export const IconArrowUpLeft = (p: IconProps) => <Glyph {...p} d="M17 17L7 7M7 16V7h9" />;
export const IconArrowLeftRight = (p: IconProps) => <Glyph {...p} d="M4 8.5h15.5M16 5l3.5 3.5L16 12M20 15.5H4.5M8 12l-3.5 3.5L8 19" />;
export const IconArrowCircleRight = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M8 12h7.5M12.5 8.5L16 12l-3.5 3.5" />;
export const IconArrowCircleDown = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 8v7.5M8.5 12.5L12 16l3.5-3.5" />;
export const IconChevronsDown = (p: IconProps) => <Glyph {...p} d="M6 6l6 6 6-6M6 12.5l6 6 6-6" />;
export const IconChevronsUp = (p: IconProps) => <Glyph {...p} d="M6 18l6-6 6 6M6 11.5l6-6 6 6" />;
export const IconShuffle = (p: IconProps) => <Glyph {...p} d="M3 7h3.5c5 0 6 10 11 10H21M18 14l3 3-3 3M3 17h3.5c1.5 0 2.6-.9 3.5-2.2M13.9 9.2C14.8 7.9 15.9 7 17.5 7H21M18 4l3 3-3 3" />;
export const IconRotateCcw = (p: IconProps) => <Glyph {...p} d="M4 12a8 8 0 1 0 2.34-5.66M6.34 2.84v3.5h3.5" />;
export const IconCornerUpLeft = (p: IconProps) => <Glyph {...p} d="M19 19v-8a2 2 0 0 0-2-2H5M9 5L5 9l4 4" />;
export const IconCursor = (p: IconProps) => <Glyph {...p} d="M5 3.5l5.2 15.5 2.3-6.5 6.5-2.3zM12.5 12.5l6 6" />;

/* Navigation -- Finding your way around an application. */

export const IconHome = (p: IconProps) => (
  <Glyph {...p} d="M14.8 5.8L12 3.5 4 10v9.5a1 1 0 0 0 1 1h4.5V15h5v5.5H19a1 1 0 0 0 1-1V10l-2.8-2.3" />
);
export const IconMenu = (p: IconProps) => <Glyph {...p} d="M4 7h16M4 12h16M4 17h16" />;
export const IconSidebar = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M9 3v18" />
);
export const IconLayout = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 9h18M9 9v12" />
);
export const IconWindow = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 8.5h18M6.5 5.75h.01M9.5 5.75h.01" />
);
export const IconGrid = (p: IconProps) => (
  <Glyph
    {...p}
    d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5M19 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5M9 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4M19 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4"
  />
);
export const IconList = (p: IconProps) => (
  <Glyph {...p} d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
);
export const IconBoard = (p: IconProps) => <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M9 4.5v15M15 4.5v15" />;
export const IconTable = (p: IconProps) => <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M3 9.5h18M3 15h18M9.5 9.5V20" />;
export const IconSearch = (p: IconProps) => (
  <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6" />
);
export const IconFilter = (p: IconProps) => <Glyph {...p} d="M16.8 5H4l6.5 7.5v8l3-1.5v-6.5L20 5" />;
export const IconCommand = (p: IconProps) => (
  <Glyph {...p} d="M10 6a2 2 0 1 0-2 2h8a2 2 0 1 0-2-2v12a2 2 0 1 0 2-2H8a2 2 0 1 0 2 2z" />
);
export const IconExternal = (p: IconProps) => (
  <Glyph {...p} d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
);
export const IconLogIn = (p: IconProps) => (
  <Glyph {...p} d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5M10 16l4-4-4-4M14 12H4" />
);
export const IconLogOut = (p: IconProps) => (
  <Glyph {...p} d="M9.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3.5M16 16l4-4-4-4M20 12H9.5" />
);
export const IconMap = (p: IconProps) => <Glyph {...p} d="M9 4L3.5 6.5v13L9 17l6 3 5.5-2.5v-13L15 7zM9 4v13M15 7v13" />;
export const IconPin = (p: IconProps) => (
  <Glyph
    {...p}
    d="M17.89 7.25A6.5 6.5 0 0 1 18.5 10c0 5.5-6.5 11-6.5 11S5.5 15.5 5.5 10a6.5 6.5 0 0 1 9.25-5.89M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
  />
);
export const IconCompass = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z" />;

/* Status */
export const IconGlobe = (p: IconProps) => (
  <Glyph
    {...p}
    d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z"
  />
);
export const IconSidebarRight = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M15 3v18" />;
export const IconPanelBottom = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 15h18" />;
export const IconColumns = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M12 3v18" />;
export const IconRows = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 12h18" />;
export const IconDashboard = (p: IconProps) => <Glyph {...p} d="M9.5 3.5h-5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1zM19.5 3.5h-5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zM19.5 11.5h-5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1zM9.5 15.5h-5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />;
export const IconSitemap = (p: IconProps) => <Glyph {...p} d="M9.5 3.5h5v5h-5zM3.5 15.5h5v5h-5zM15.5 15.5h5v5h-5zM12 8.5v3.5M6 15.5V12h12v3.5" />;
export const IconNavigation = (p: IconProps) => <Glyph {...p} d="M4 11l16-7-7 16-2-7z" />;
export const IconLocate = (p: IconProps) => <Glyph {...p} d="M18.34 9.04A7 7 0 1 1 14.96 5.66M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M12 12h.01" />;

/* Actions -- The things a button does. */

export const IconCheck = (p: IconProps) => <Glyph {...p} d="M5 12.5l4.5 4.5L19 7" />;
export const IconClose = (p: IconProps) => <Glyph {...p} d="M6 6l12 12M18 6L6 18" />;
export const IconPlus = (p: IconProps) => <Glyph {...p} d="M12 5v14M5 12h14" />;
export const IconPlusCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 8.5v7M8.5 12h7" />;
export const IconMinus = (p: IconProps) => <Glyph {...p} d="M5 12h14" />;
export const IconEdit = (p: IconProps) => (
  <Glyph {...p} d="M13.5 6.5l4 4M4 20l1-4.5L15.6 4.9a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19z" />
);
export const IconCopy = (p: IconProps) => (
  <Glyph
    {...p}
    d="M17.8 9H11a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6.8M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5"
  />
);
export const IconTrash = (p: IconProps) => <Glyph {...p} d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />;
export const IconSave = (p: IconProps) => <Glyph {...p} d="M17.8 3.5H5.5A1.5 1.5 0 0 0 4 5v14a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V6.2zM8 20.5v-6h8v6M8 3.5v4h6" />;
export const IconShare = (p: IconProps) => (
  <Glyph {...p} d="M12 3.5v11M8 7.5l4-4 4 4M8.5 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2.5" />
);
export const IconDownload = (p: IconProps) => <Glyph {...p} d="M12 4v12M6 10l6 6 6-6M4 20h16" />;
export const IconUpload = (p: IconProps) => <Glyph {...p} d="M12 16V4M6 10l6-6 6 6M4 20h16" />;
export const IconLink = (p: IconProps) => (
  <Glyph
    {...p}
    d="M10 13.5a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.66-5.66L12 6.6M14 10.5a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.66 5.66L12 17.4"
  />
);
export const IconBookmark = (p: IconProps) => <Glyph {...p} d="M14.8 3H7.5A1.5 1.5 0 0 0 6 4.5V21l6-4 6 4V6.2" />;
export const IconFlag = (p: IconProps) => <Glyph {...p} d="M5 21V4M5 4.5h13.5L15 9.25 18.5 14H5" />;
export const IconStar = (p: IconProps) => (
  <Glyph {...p} d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
);
export const IconHeart = (p: IconProps) => (
  <Glyph {...p} d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5z" />
);
export const IconThumbsUp = (p: IconProps) => <Glyph {...p} d="M7 10.5v10H4.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM7 10.5l4-7.5a2 2 0 0 1 2 2v3.5h5.2a2 2 0 0 1 2 2.35l-1.1 6a2 2 0 0 1-2 1.65H7" />;
export const IconThumbsDown = (p: IconProps) => <Glyph {...p} d="M17 13.5V3.5h2.5a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1zM17 13.5l-4 7.5a2 2 0 0 1-2-2v-3.5H5.8a2 2 0 0 1-2-2.35l1.1-6a2 2 0 0 1 2-1.65H17" />;
export const IconEye = (p: IconProps) => (
  <Glyph {...p} d="M2.5 12C4.5 7.8 8 5.5 12 5.5s7.5 2.3 9.5 6.5c-2 4.2-5.5 6.5-9.5 6.5S4.5 16.2 2.5 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
);
export const IconEyeOff = (p: IconProps) => (
  <Glyph
    {...p}
    d="M10.7 5.6a10 10 0 0 1 1.3-.1c4 0 7.5 2.3 9.5 6.5a13.6 13.6 0 0 1-2.1 3.1M6.7 6.7C4.9 7.9 3.5 9.7 2.5 12c2 4.2 5.5 6.5 9.5 6.5a9.7 9.7 0 0 0 5.3-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17"
  />
);
export const IconZoomIn = (p: IconProps) => <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6M7.5 10.5h6M10.5 7.5v6" />;
export const IconZoomOut = (p: IconProps) => <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6M7.5 10.5h6" />;
export const IconMoreHorizontal = (p: IconProps) => (
  <Glyph {...p} d="M5 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M17 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0" />
);
export const IconMoreVertical = (p: IconProps) => (
  <Glyph {...p} d="M12 5a1 1 0 1 0 0 2 1 1 0 1 0 0-2M12 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M12 17a1 1 0 1 0 0 2 1 1 0 1 0 0-2" />
);
export const IconGrip = (p: IconProps) => <Glyph {...p} d="M9 6a1 1 0 1 0 0 2 1 1 0 1 0 0-2M9 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M9 16a1 1 0 1 0 0 2 1 1 0 1 0 0-2M15 6a1 1 0 1 0 0 2 1 1 0 1 0 0-2M15 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M15 16a1 1 0 1 0 0 2 1 1 0 1 0 0-2" />;
export const IconSliders = (p: IconProps) => <Glyph {...p} d="M4 7h16M4 12h16M4 17h16M9 5v4M15 10v4M8 15v4" />;
export const IconSettings = (p: IconProps) => (
  <Glyph
    {...p}
    d="M9.89 5.11l.46-2.47h3.3l.46 2.47a7.2 7.2 0 0 1 2.8 1.62l2.37-.84 1.65 2.86-1.91 1.63a7.2 7.2 0 0 1 0 3.24l1.91 1.63-1.65 2.86-2.37-.84a7.2 7.2 0 0 1-2.8 1.62l-.46 2.47h-3.3l-.46-2.47a7.2 7.2 0 0 1-2.8-1.62l-2.37.84-1.65-2.86 1.91-1.63a7.2 7.2 0 0 1 0-3.24L3.07 8.75l1.65-2.86 2.37.84a7.2 7.2 0 0 1 2.8-1.62zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
  />
);
export const IconScissors = (p: IconProps) => <Glyph {...p} d="M9 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.6 8L20 18.5M8.6 16L20 5.5" />;
export const IconPushpin = (p: IconProps) => <Glyph {...p} d="M9 3.5h6M10 3.5v6l-3 3.5h10l-3-3.5v-6M12 13v7.5" />;
export const IconCrop = (p: IconProps) => <Glyph {...p} d="M6 2.5V16a2 2 0 0 0 2 2h13.5M2.5 6H16a2 2 0 0 1 2 2v13.5" />;
export const IconEraser = (p: IconProps) => <Glyph {...p} d="M8.5 20.5h12M4.9 14.9l8.5-8.5a2 2 0 0 1 2.8 0l2.9 2.9a2 2 0 0 1 0 2.8l-7.6 7.6a2 2 0 0 1-1.4.8H8.1a2 2 0 0 1-1.4-.6l-1.8-1.8a2 2 0 0 1 0-3.2zM9.5 10.5l5 5" />;
export const IconWand = (p: IconProps) => <Glyph {...p} d="M4 20L14.5 9.5M12.5 7.5l4 4M18 3v4M16 5h4M20 11v2M19 12h2M11 3v2M10 4h2" />;
export const IconMagnet = (p: IconProps) => <Glyph {...p} d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4" />;
export const IconToggleLeft = (p: IconProps) => <Glyph {...p} d="M16 7H8a5 5 0 0 0 0 10h8a5 5 0 0 0 0-10zM10.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />;
export const IconToggleRight = (p: IconProps) => <Glyph {...p} d="M16 7H8a5 5 0 0 0 0 10h8a5 5 0 0 0 0-10zM18.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />;
export const IconCheckSquare = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M8 12l3 3 5.5-6" />;
export const IconMinusCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M8.5 12h7" />;
export const IconCheckDouble = (p: IconProps) => <Glyph {...p} d="M2.5 12.5L7 17l9.5-10M12.5 16.5l.5.5L22 7" />;

/* Status & time -- What is happening, went well, or went wrong. */

export const IconInfo = (p: IconProps) => (
  <Glyph {...p} d="M19.44 8.4A8.5 8.5 0 1 1 15.7 4.4M12 11v5M12 8h.01" />
);
export const IconWarning = (p: IconProps) => <Glyph {...p} d="M12 4l9 16H3zM12 10v4M12 17.5h.01" />;
export const IconAlertCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 7.5v5M12 16h.01" />;
export const IconCheckCircle = (p: IconProps) => (
  <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M8.5 12.5l2.5 2.5 5-5.5" />
);
export const IconXCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M9 9l6 6M15 9l-6 6" />;
export const IconHelp = (p: IconProps) => (
  <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M9.5 9.75a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.45M12 17h.01" />
);
export const IconSparkle = (p: IconProps) => (
  <Glyph {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
);
export const IconZap = (p: IconProps) => <Glyph {...p} d="M13 3L5 13.5h6.5L11 21l8-10.5h-6.5z" />;
export const IconActivity = (p: IconProps) => <Glyph {...p} d="M3 12h4l2.5-6.5 5 13 2.5-6.5H21" />;
export const IconGauge = (p: IconProps) => <Glyph {...p} d="M4.5 18.5a9 9 0 1 1 15 0M12 13l4-4.5" />;

/* Communication */
export const IconTarget = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />;
export const IconTrophy = (p: IconProps) => <Glyph {...p} d="M8 3.5h8V9a4 4 0 0 1-8 0zM8 5.5H5.5a3 3 0 0 0 3 4.5M16 5.5h2.5a3 3 0 0 1-3 4.5M12 13v3.5M8 20.5h8l-1-4H9z" />;
export const IconRocket = (p: IconProps) => <Glyph {...p} d="M12 3.5c2.5 2.2 3.9 5.3 3.9 8.6 0 1.8-.7 3.5-1.9 5h-4c-1.2-1.5-1.9-3.2-1.9-5 0-3.3 1.4-6.4 3.9-8.6zM13.5 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM8.1 13.8L5.5 16.2v4.3l3.2-2.1M15.9 13.8l2.6 2.4v4.3l-3.2-2.1" />;
export const IconIdea = (p: IconProps) => <Glyph {...p} d="M15.5 15.5A6 6 0 1 0 8.5 15.5c.6.8 1 1.6 1 2.5h5c0-.9.4-1.7 1-2.5zM9.5 21h5" />;

/* People and security */
export const IconBell = (p: IconProps) => (
  <Glyph {...p} d="M17.44 8.46A6 6 0 0 1 18 11v5l1.5 2.5h-15L6 16v-5a6 6 0 0 1 8.54-5.44M10.25 20.75a2 2 0 0 0 3.5 0" />
);
export const IconBellOff = (p: IconProps) => <Glyph {...p} d="M18 11v5l1.5 2.5H6.8M6 16v-5a6 6 0 0 1 6-6 6 6 0 0 1 4.24 1.76M10.25 20.75a2 2 0 0 0 3.5 0M3.5 3.5l17 17" />;
export const IconClock = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 7.5V12l3 2" />;
export const IconCalendar = (p: IconProps) => (
  <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3 10h18M8 3v4M16 3v4" />
);
export const IconHistory = (p: IconProps) => <Glyph {...p} d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 5.5V10h4.5M12 7.5V12l3.5 2" />;
export const IconLoader = (p: IconProps) => <Glyph {...p} d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5" />;
export const IconHourglass = (p: IconProps) => <Glyph {...p} d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5v2.3a4 4 0 0 0 1.6 3.2L12 12l2.9-3a4 4 0 0 0 1.6-3.2V3.5M7.5 20.5v-2.3a4 4 0 0 1 1.6-3.2L12 12l2.9 3a4 4 0 0 1 1.6 3.2v2.3" />;
export const IconTimer = (p: IconProps) => <Glyph {...p} d="M18.8 10.33A7.5 7.5 0 1 1 15.17 6.7M10 2.5h4M12 13.5V10M18.5 6.5L20 5" />;
export const IconAlarm = (p: IconProps) => <Glyph {...p} d="M18.34 10.04A7 7 0 1 1 14.96 6.66M12 9.5V13l2.5 1.5M5 3.5L2.5 6M19 3.5L21.5 6" />;
export const IconCalendarCheck = (p: IconProps) => <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4.5" />;
export const IconCalendarPlus = (p: IconProps) => <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />;
export const IconBadgeCheck = (p: IconProps) => <Glyph {...p} d="M12 3L14.02 4.47L16.5 4.21L17.52 6.48L19.79 7.5L19.53 9.98L21 12L19.53 14.02L19.79 16.5L17.52 17.52L16.5 19.79L14.02 19.53L12 21L9.98 19.53L7.5 19.79L6.48 17.52L4.21 16.5L4.47 14.02L3 12L4.47 9.98L4.21 7.5L6.48 6.48L7.5 4.21L9.98 4.47zM8.5 12l2.5 2.5 4.5-5" />;
export const IconCircleDot = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />;
export const IconFlame = (p: IconProps) => <Glyph {...p} d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-3.8-3-6.2-4.5-10-1.4 2-2 3.6-2 5.5-1.4-1-2.2-2.2-2.4-3.8-2.2 2.2-4.1 5.1-4.1 8.3A6.5 6.5 0 0 0 12 21z" />;
export const IconMedal = (p: IconProps) => <Glyph {...p} d="M8.5 3.5l2.5 6M15.5 3.5l-2.5 6M17 15a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM12 13v4" />;
export const IconCrown = (p: IconProps) => <Glyph {...p} d="M4.5 16L3.5 7l5 4L12 5l3.5 6 5-4-1 9zM5 19.5h14" />;
export const IconSignal = (p: IconProps) => <Glyph {...p} d="M5 20v-3M10 20v-7M15 20V9M20 20V4" />;
export const IconBan = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M6 6l12 12" />;

/* People & access -- Who someone is and what they may reach. */

export const IconUser = (p: IconProps) => (
  <Glyph {...p} d="M16 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4.5 20.5v-1a5.5 5.5 0 0 1 5.5-5.5h4a5.5 5.5 0 0 1 5.5 5.5v1" />
);
export const IconUsers = (p: IconProps) => (
  <Glyph
    {...p}
    d="M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM3 20v-.5A4.5 4.5 0 0 1 7.5 15h3a4.5 4.5 0 0 1 4.5 4.5v.5M15.5 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15a4.5 4.5 0 0 1 3.5 4.4v.6"
  />
);
export const IconUserPlus = (p: IconProps) => <Glyph {...p} d="M14.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20.5v-1A5.5 5.5 0 0 1 8.5 14h3.2M18 14.5v6M15 17.5h6" />;
export const IconUserCheck = (p: IconProps) => <Glyph {...p} d="M14.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20.5v-1A5.5 5.5 0 0 1 8.5 14h3.2M15 17.5l2 2 4-4.5" />;
export const IconLock = (p: IconProps) => (
  <Glyph {...p} d="M16.8 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.3M8 10.5V7a4 4 0 0 1 8 0v3.5M12 15v2.5" />
);
export const IconUnlock = (p: IconProps) => (
  <Glyph {...p} d="M16.8 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.3M8 10.5V7a4 4 0 0 1 7.7-1.5M12 15v2.5" />
);
export const IconKey = (p: IconProps) => (
  <Glyph {...p} d="M11.5 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM10.5 13.5L20 4M16.5 7.5l2.5 2.5M14 10l2 2" />
);
export const IconShield = (p: IconProps) => <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5z" />;
export const IconShieldCheck = (p: IconProps) => (
  <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5zM9 12l2 2 4-4.5" />
);
export const IconShieldAlert = (p: IconProps) => <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5zM12 8.5v4M12 15.5h.01" />;
export const IconFingerprint = (p: IconProps) => <Glyph {...p} d="M4.6 8.4a9 9 0 0 1 13.9-1.9M5.8 17.3A11 11 0 0 0 7 12.3a5 5 0 0 1 8.4-3.7M17.6 9.8A5 5 0 0 1 18 11.8a22 22 0 0 1-.9 6.2M8.4 20.4A14 14 0 0 0 10 13.4a2 2 0 0 1 4 0c0 2.4-.4 4.8-1.2 7" />;
export const IconBuilding = (p: IconProps) => <Glyph {...p} d="M14.8 3H5a1 1 0 0 0-1 1v17h16V6.2M8 7.5h2M14 7.5h2M8 11.5h2M14 11.5h2M8 15.5h2M14 15.5h2M10 21v-3.5h4V21" />;

/* Theme and devices */
export const IconUserMinus = (p: IconProps) => <Glyph {...p} d="M14.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20.5v-1A5.5 5.5 0 0 1 8.5 14h3.2M15 17.5h6" />;
export const IconUserX = (p: IconProps) => <Glyph {...p} d="M14.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20.5v-1A5.5 5.5 0 0 1 8.5 14h3.2M15.5 15l4.5 4.5M20 15l-4.5 4.5" />;
export const IconUserCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.5 18.2a6 6 0 0 1 11 0" />;
export const IconIdCard = (p: IconProps) => <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M9.5 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM5 16a3 3 0 0 1 5 0M13 10h5M13 13.5h4" />;
export const IconScan = (p: IconProps) => <Glyph {...p} d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M9 10h.01M15 10h.01M9.5 14.5a3.5 3.5 0 0 0 5 0" />;
export const IconShieldX = (p: IconProps) => <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5zM9.5 9.5l5 5M14.5 9.5l-5 5" />;
export const IconSmile = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />;
export const IconMeh = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M9 15h6M9 9.5h.01M15 9.5h.01" />;
export const IconFrown = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M8.5 16a4 4 0 0 1 7 0M9 9.5h.01M15 9.5h.01" />;

/* Communication -- Reaching someone, and being reached. */

export const IconMail = (p: IconProps) => (
  <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3.5 7.5l8.5 6 8.5-6" />
);
export const IconMailOpen = (p: IconProps) => <Glyph {...p} d="M3 10.5L12 4l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10.5l7.8 5.2a2 2 0 0 0 2.4 0L21 10.5" />;
export const IconMessage = (p: IconProps) => (
  <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3v3.5l4.5-3.5H19a2 2 0 0 0 2-2V7.2" />
);
export const IconPhone = (p: IconProps) => (
  <Glyph
    {...p}
    d="M8.6 3.5H6A2.5 2.5 0 0 0 3.5 6c0 8 6.5 14.5 14.5 14.5a2.5 2.5 0 0 0 2.5-2.5v-2.6l-4.4-1.8-1.9 2.2a11 11 0 0 1-5.9-5.9l2.2-1.9z"
  />
);
export const IconSend = (p: IconProps) => <Glyph {...p} d="M21 3L10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z" />;
export const IconReply = (p: IconProps) => <Glyph {...p} d="M9 8L5 12l4 4M5 12h8a6 6 0 0 1 6 6v1.5" />;
export const IconAtSign = (p: IconProps) => <Glyph {...p} d="M16 12a4 4 0 1 1-4-4M16 8v5.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2" />;
export const IconMegaphone = (p: IconProps) => (
  <Glyph {...p} d="M4 10v4a1 1 0 0 0 1 1h3l7 4V5L8 9H5a1 1 0 0 0-1 1zM18.5 9.5a3.5 3.5 0 0 1 0 5" />
);
export const IconHeadphones = (p: IconProps) => <Glyph {...p} d="M4 16v-4a8 8 0 0 1 13.66-5.66M20 12.5V16M4 15.5h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM20 15.5h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1z" />;

/* Files and content */
export const IconInbox = (p: IconProps) => (
  <Glyph {...p} d="M3 12.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6.5M3 12.5h5l1.5 3h5l1.5-3h5M3 12.5L6 5h12l3 7.5" />
);
export const IconArchive = (p: IconProps) => <Glyph {...p} d="M17.8 4.5H4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6.7M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5M9.75 12.5h4.5" />;
export const IconMessageText = (p: IconProps) => <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3v3.5l4.5-3.5H19a2 2 0 0 0 2-2V7.2M7.5 9h9M7.5 12.5h6" />;
export const IconMessages = (p: IconProps) => <Glyph {...p} d="M14.5 3.5h-10A1.5 1.5 0 0 0 3 5v7a1.5 1.5 0 0 0 1.5 1.5H6v3l3.5-3h5a1.5 1.5 0 0 0 1.5-1.5V5a1.5 1.5 0 0 0-1.5-1.5zM19 8.5h.5A1.5 1.5 0 0 1 21 10v7a1.5 1.5 0 0 1-1.5 1.5H18V21l-3-2.5h-4.5A1.5 1.5 0 0 1 9 17v-.5" />;
export const IconPhoneCall = (p: IconProps) => <Glyph {...p} d="M8.6 3.5H6A2.5 2.5 0 0 0 3.5 6c0 8 6.5 14.5 14.5 14.5a2.5 2.5 0 0 0 2.5-2.5v-2.6l-4.4-1.8-1.9 2.2a11 11 0 0 1-5.9-5.9l2.2-1.9zM14.5 3.5a6 6 0 0 1 6 6M14.5 7a2.5 2.5 0 0 1 2.5 2.5" />;
export const IconVoicemail = (p: IconProps) => <Glyph {...p} d="M9.5 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20.5 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.5 15h11" />;
export const IconRss = (p: IconProps) => <Glyph {...p} d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14M5.5 18.5h.01" />;
export const IconBroadcast = (p: IconProps) => <Glyph {...p} d="M13 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM12 12v8.5M8 20.5h8M8.5 7.5a5 5 0 0 1 7 0M5.6 4.6a9 9 0 0 1 12.8 0" />;
export const IconNodes = (p: IconProps) => <Glyph {...p} d="M20.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" />;
export const IconLanguage = (p: IconProps) => <Glyph {...p} d="M3.5 5.5h9M8 3.5v2M10.5 5.5c-.8 3.5-3 6.2-6.5 8M6.5 8.5c1.1 2 2.8 3.6 5 4.5M13 20.5l4-9.5 4 9.5M14.3 17.5h5.4" />;
export const IconMessageCircle = (p: IconProps) => <Glyph {...p} d="M20.5 12a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" />;

/* Files & documents -- Anything you open, attach or print. */

export const IconFile = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5" />;
export const IconFileText = (p: IconProps) => (
  <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8.5 13h7M8.5 17h5" />
);
export const IconFilePlus = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M12 12.5v6M9 15.5h6" />;
export const IconFileCheck = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 14.5l2 2 4-4.5" />;
export const IconFolder = (p: IconProps) => (
  <Glyph {...p} d="M17.3 7.5h-5.8l-2-2.5H5A1.5 1.5 0 0 0 3.5 6.5V18A1.5 1.5 0 0 0 5 19.5h14a1.5 1.5 0 0 0 1.5-1.5v-7.3" />
);
export const IconFolderOpen = (p: IconProps) => <Glyph {...p} d="M3.5 19V6.5A1.5 1.5 0 0 1 5 5h4.5l2 2.5h6A1.5 1.5 0 0 1 19 9v1.5M5 19h13.2a1.5 1.5 0 0 0 1.44-1.08l1.6-5.5a1 1 0 0 0-.96-1.28H7.6a1.5 1.5 0 0 0-1.44 1.08L3.5 19" />;
export const IconClipboard = (p: IconProps) => <Glyph {...p} d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2M9.5 3h5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />;
export const IconPaperclip = (p: IconProps) => (
  <Glyph
    {...p}
    d="M20 11.5l-7.6 7.6a5 5 0 0 1-7.07-7.07l8-8a3.3 3.3 0 0 1 4.67 4.67l-7.9 7.9a1.65 1.65 0 0 1-2.33-2.33L15 7"
  />
);
export const IconBook = (p: IconProps) => <Glyph {...p} d="M5 5a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2zM5 19a2 2 0 0 0 2 2h12v-4M9 7h6" />;
export const IconImage = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 16l5-5 4 4 3-3 6 6M15.5 8.5h.01" />
);
export const IconPrinter = (p: IconProps) => <Glyph {...p} d="M7 9V3.5h10V9M7 18H5.5A1.5 1.5 0 0 1 4 16.5v-5A1.5 1.5 0 0 1 5.5 10h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17M7 14.5h10v6H7zM7 12.5h.01" />;

/* Media */
export const IconFileCode = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M10 12.5l-2 2 2 2M14 12.5l2 2-2 2" />;
export const IconFileImage = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8 18.5l3-3.5 2 2 1.5-1.5 2.5 3M9.5 12h.01" />;
export const IconFileSheet = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8 12h8v6.5H8zM8 15.25h8M12 12v6.5" />;
export const IconFileMinus = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 15.5h6" />;
export const IconFileX = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9.5 13l5 5M14.5 13l-5 5" />;
export const IconFileDownload = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M12 11.5v6M9.5 15l2.5 2.5 2.5-2.5" />;
export const IconFiles = (p: IconProps) => <Glyph {...p} d="M9 3.5h7l4 4v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1zM16 3.5v4h4M5 7.5v12a1 1 0 0 0 1 1h9" />;
export const IconFolderPlus = (p: IconProps) => <Glyph {...p} d="M17.3 7.5h-5.8l-2-2.5H5A1.5 1.5 0 0 0 3.5 6.5V18A1.5 1.5 0 0 0 5 19.5h14a1.5 1.5 0 0 0 1.5-1.5v-7.3M12 11v5M9.5 13.5h5" />;
export const IconNotebook = (p: IconProps) => <Glyph {...p} d="M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM9 3.5v17M3.5 7.5H5M3.5 12H5M3.5 16.5H5M12 8h4" />;
export const IconNewspaper = (p: IconProps) => <Glyph {...p} d="M4 5.5h13v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2zM17 9h3v9.5a2 2 0 0 1-4 0M7 9h7M7 12.5h7M7 16h4" />;
export const IconBookOpen = (p: IconProps) => <Glyph {...p} d="M12 6.5c-1.8-1.6-4.6-2-8.5-2v14c3.9 0 6.7.4 8.5 2 1.8-1.6 4.6-2 8.5-2v-14c-3.9 0-6.7.4-8.5 2zM12 6.5v14" />;
export const IconNote = (p: IconProps) => <Glyph {...p} d="M5 4h14a1 1 0 0 1 1 1v9.5L14.5 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM20 14.5h-4.5a1 1 0 0 0-1 1V20" />;

/* Media -- Playing, recording and listening. */

export const IconPlay = (p: IconProps) => <Glyph {...p} d="M7 4.5v15l12-7.5z" />;
export const IconPause = (p: IconProps) => <Glyph {...p} d="M8.5 5v14M15.5 5v14" />;
export const IconStop = (p: IconProps) => <Glyph {...p} d="M17.8 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7.2" />;
export const IconSkipBack = (p: IconProps) => <Glyph {...p} d="M18.5 5.5v13l-9-6.5zM5.5 5v14" />;
export const IconSkipForward = (p: IconProps) => <Glyph {...p} d="M5.5 5.5v13l9-6.5zM18.5 5v14" />;
export const IconVolume = (p: IconProps) => (
  <Glyph {...p} d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12" />
);
export const IconVolumeOff = (p: IconProps) => <Glyph {...p} d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM16 9.5l5 5M21 9.5l-5 5" />;
export const IconMic = (p: IconProps) => <Glyph {...p} d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />;
export const IconMicOff = (p: IconProps) => <Glyph {...p} d="M15 11.5V6a3 3 0 0 0-5.7-1.3M9 9.8V11a3 3 0 0 0 4.4 2.65M5.5 11a6.5 6.5 0 0 0 10.2 5.3M18.5 11a6.5 6.5 0 0 1-.6 2.7M12 17.5V21M3.5 3.5l17 17" />;

/* Commerce */
export const IconCamera = (p: IconProps) => (
  <Glyph
    {...p}
    d="M8 7l1.5-2.5h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM15.5 13.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"
  />
);
export const IconVideo = (p: IconProps) => (
  <Glyph {...p} d="M11.8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.2M15 10.5l6-3.5v10l-6-3.5" />
);
export const IconMusic = (p: IconProps) => <Glyph {...p} d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />;
export const IconRewind = (p: IconProps) => <Glyph {...p} d="M11 6.5v11L4 12zM20 6.5v11L13 12z" />;
export const IconFastForward = (p: IconProps) => <Glyph {...p} d="M13 6.5v11l7-5.5zM4 6.5v11l7-5.5z" />;
export const IconRadio = (p: IconProps) => <Glyph {...p} d="M5 8.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1zM7 8.5L16.5 4M16.5 14.25a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 12.5h2.5M7 16h2.5" />;
export const IconFilm = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M7.5 3v18M16.5 3v18M3 7.5h4.5M3 12h18M3 16.5h4.5M16.5 7.5H21M16.5 16.5H21" />;
export const IconDisc = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />;
export const IconCast = (p: IconProps) => <Glyph {...p} d="M3.5 8V6a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H14M3.5 12a7 7 0 0 1 7 7M3.5 15.5a3.5 3.5 0 0 1 3.5 3.5M3.5 19h.01" />;
export const IconVolumeLow = (p: IconProps) => <Glyph {...p} d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15.5 9a4 4 0 0 1 0 6" />;
export const IconPodcast = (p: IconProps) => <Glyph {...p} d="M13.5 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM11 15.5h2l-.5 5h-1zM7.5 15.5a6 6 0 1 1 9 0M4.8 17.8a9.5 9.5 0 1 1 14.4 0" />;
export const IconSubtitles = (p: IconProps) => <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M7 12h4M13 12h4M7 15.5h7M16 15.5h1" />;
export const IconGamepad = (p: IconProps) => <Glyph {...p} d="M7 7h10a4.5 4.5 0 0 1 4.3 5.8l-1.2 4a2.5 2.5 0 0 1-4.2 1L14 16h-4l-1.9 1.8a2.5 2.5 0 0 1-4.2-1l-1.2-4A4.5 4.5 0 0 1 7 7zM7.5 10.5v3M6 12h3M15.5 11h.01M17.5 13h.01" />;

/* Devices & theme -- The screen it runs on and the light it runs in. */

export const IconMonitor = (p: IconProps) => (
  <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M8 20h8M12 16v4" />
);
export const IconLaptop = (p: IconProps) => <Glyph {...p} d="M16.8 5H6a2 2 0 0 0-2 2v9h16V8.2M2.5 19h19" />;
export const IconSmartphone = (p: IconProps) => (
  <Glyph {...p} d="M14.8 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.2M11 18h2" />
);
export const IconWifi = (p: IconProps) => <Glyph {...p} d="M3.5 9.4a13 13 0 0 1 17 0M6.6 13a8.5 8.5 0 0 1 10.8 0M9.6 16.5a4 4 0 0 1 4.8 0M12 20h.01" />;
export const IconWifiOff = (p: IconProps) => <Glyph {...p} d="M3.5 9.4a13 13 0 0 1 4.4-2.7M12.8 6.6a13 13 0 0 1 7.7 2.8M17.4 13a8.5 8.5 0 0 0-2.7-1.7M6.6 13a8.5 8.5 0 0 1 2.2-1.4M9.6 16.5a4 4 0 0 1 4.3-.5M12 20h.01M3.5 3.5l17 17" />;
export const IconBattery = (p: IconProps) => <Glyph {...p} d="M15.8 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9.2M21 10.5v3M6 10.5h6v3H6z" />;
export const IconPower = (p: IconProps) => <Glyph {...p} d="M12 3.5v8M17.5 6.5a8 8 0 1 1-11 0" />;

/* Data and development */
export const IconSun = (p: IconProps) => (
  <Glyph
    {...p}
    d="M15.63 10.31A4 4 0 1 1 13.69 8.37M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M18.7 5.3l-1.4 1.4"
  />
);
export const IconMoon = (p: IconProps) => <Glyph {...p} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />;
export const IconTablet = (p: IconProps) => <Glyph {...p} d="M16.8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6.2M11 18h2" />;
export const IconWatch = (p: IconProps) => <Glyph {...p} d="M8 6l.8-3h6.4l.8 3M8 18l.8 3h6.4l.8-3M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM12 9.5V12l1.5 1.5" />;
export const IconKeyboard = (p: IconProps) => <Glyph {...p} d="M18.3 6H4.5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V9.2M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14h8" />;
export const IconMouse = (p: IconProps) => <Glyph {...p} d="M12 3a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0V9a6 6 0 0 1 6-6zM12 7v3.5" />;
export const IconCpu = (p: IconProps) => <Glyph {...p} d="M7 7h10v10H7zM10 10h4v4h-4zM10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />;
export const IconHardDrive = (p: IconProps) => <Glyph {...p} d="M3.5 13.5L6 5.5h12l2.5 8M3.5 13.5V18a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5v-4.5zM7 16.5h.01M10.5 16.5h.01" />;
export const IconBluetooth = (p: IconProps) => <Glyph {...p} d="M7 7.5l10 9-5 4.5v-18l5 4.5-10 9" />;
export const IconPlug = (p: IconProps) => <Glyph {...p} d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21" />;
export const IconBatteryCharging = (p: IconProps) => <Glyph {...p} d="M15.8 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9.2M21 10.5v3M11 9.5l-2 2.5h3l-2 2.5" />;
export const IconContrast = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 3.5v17" />;
export const IconPalette = (p: IconProps) => <Glyph {...p} d="M12 3.5a8.5 8.5 0 0 0 0 17c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.8-.5-1.2 0-1 .8-1.8 1.8-1.8h2.1a3.8 3.8 0 0 0 3.8-3.8c0-4.1-3.8-7.2-8.5-7.2zM7.5 12h.01M9.5 8h.01M14.5 8h.01" />;
export const IconTv = (p: IconProps) => <Glyph {...p} d="M17.8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10.2M8.5 3l3.5 4 3.5-4" />;

/* Code & data -- For developer tools and everything behind them. */

export const IconCode = (p: IconProps) => <Glyph {...p} d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />;
export const IconTerminal = (p: IconProps) => (
  <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M7 9l3 3-3 3M12.5 15h4.5" />
);
export const IconBraces = (p: IconProps) => <Glyph {...p} d="M8.5 3.5h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1M15.5 3.5h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />;
export const IconGitBranch = (p: IconProps) => <Glyph {...p} d="M6 6.5v11M8.5 4a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.5 20a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM6 12h9.5" />;
export const IconBug = (p: IconProps) => <Glyph {...p} d="M8 8V6.5a4 4 0 0 1 8 0V8M16.8 8H7v5a5 5 0 0 0 10 0V9.2M3.5 11.5h3.5M17 11.5h3.5M4.5 17.5l2.7-1.6M19.5 17.5l-2.7-1.6M5 5.5l2.2 1.7M19 5.5l-2.2 1.7" />;
export const IconHash = (p: IconProps) => <Glyph {...p} d="M9 4L7 20M17 4l-2 16M4 9.5h16M3.5 15h16" />;
export const IconCube = (p: IconProps) => <Glyph {...p} d="M4 8l8-4.5L20 8v8l-8 4.5L4 16zM12 12l8-4M12 12v8.5M12 12L4 8" />;
export const IconPackage = (p: IconProps) => (
  <Glyph {...p} d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M16 5.25l-8 4.5" />
);
export const IconLayers = (p: IconProps) => <Glyph {...p} d="M12 3l9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5" />;
export const IconWrench = (p: IconProps) => (
  <Glyph {...p} d="M14.5 3.5a5 5 0 0 0-5.8 6.9L3 16.1a1.6 1.6 0 0 0 2.3 2.3l5.7-5.7a5 5 0 0 0 6.9-5.8l-2.6 2.6-2.7-.7-.7-2.7z" />
);
export const IconServer = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5.2M17.8 14H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.8M6.5 6.5h.01M6.5 17.5h.01" />;
export const IconDatabase = (p: IconProps) => (
  <Glyph
    {...p}
    d="M20 5.5c0 1.4-3.6 2.5-8 2.5S4 6.9 4 5.5 7.6 3 12 3s8 1.1 8 2.5zM4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"
  />
);
export const IconCloud = (p: IconProps) => (
  <Glyph {...p} d="M7 18.5a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 16.3 10a4.25 4.25 0 0 1 .2 8.5z" />
);
export const IconChart = (p: IconProps) => <Glyph {...p} d="M4 20h16M7 16v-6M12 16V5M17 16v-3" />;
export const IconPieChart = (p: IconProps) => <Glyph {...p} d="M11.5 4.5a8 8 0 1 0 8 8h-8zM13 3a8 8 0 0 1 8 8h-8z" />;
export const IconGitCommit = (p: IconProps) => <Glyph {...p} d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM3 12h5.5M15.5 12H21" />;
export const IconGitMerge = (p: IconProps) => <Glyph {...p} d="M8.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM6 8v12.5M6 8c0 5 4 8.5 9.5 9" />;
export const IconGitPullRequest = (p: IconProps) => <Glyph {...p} d="M8.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.5 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM6 8v8M18 16V9a2 2 0 0 0-2-2h-4.5M14 4.5L11.5 7 14 9.5" />;
export const IconFunction = (p: IconProps) => <Glyph {...p} d="M9.5 20.5c1.5 0 2.3-.8 2.6-2.3l1.8-10.4c.3-1.5 1.1-2.3 2.6-2.3M8.5 11h7" />;
export const IconChartBar = (p: IconProps) => <Glyph {...p} d="M4 4v16M4 7h9M4 12h14M4 17h6" />;
export const IconChartLine = (p: IconProps) => <Glyph {...p} d="M4 4v16h16M7.5 14l3.5-4 3 3 5-6" />;
export const IconWorkflow = (p: IconProps) => <Glyph {...p} d="M3.5 4.5h6v6h-6zM14.5 13.5h6v6h-6zM6.5 10.5v3a3 3 0 0 0 3 3h5" />;
export const IconPuzzle = (p: IconProps) => <Glyph {...p} d="M10 4.5a2 2 0 0 1 4 0V6h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 0 0 0 4H19v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4h1.5a2 2 0 0 0 0-4H5V7a1 1 0 0 1 1-1h4z" />;
export const IconBot = (p: IconProps) => <Glyph {...p} d="M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 8V5M12 4h.01M9.5 13h.01M14.5 13h.01M2.5 12.5v2M21.5 12.5v2" />;
export const IconCloudUpload = (p: IconProps) => <Glyph {...p} d="M7.5 18a3.5 3.5 0 0 1-.9-6.9A5 5 0 0 1 16.3 10a4.3 4.3 0 0 1 .7 8M12 20.5V13M9 15.5l3-3 3 3" />;
export const IconCloudDownload = (p: IconProps) => <Glyph {...p} d="M7.5 18a3.5 3.5 0 0 1-.9-6.9A5 5 0 0 1 16.3 10a4.3 4.3 0 0 1 .7 8M12 12.5V20M9 17.5l3 3 3-3" />;
export const IconQrCode = (p: IconProps) => <Glyph {...p} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h.01M20 14h.01" />;

/* Commerce -- Buying, paying and shipping. */

export const IconCart = (p: IconProps) => (
  <Glyph {...p} d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6.3M10 20.5h.01M17 20.5h.01" />
);
export const IconBag = (p: IconProps) => <Glyph {...p} d="M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2" />;
export const IconStore = (p: IconProps) => <Glyph {...p} d="M4 10.2V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.8M3.2 9.5L5 4h14l1.8 5.5a3 3 0 0 1-5.6 1.5 3 3 0 0 1-5.4 0 3 3 0 0 1-5.6-1.5zM9.5 20v-5h5v5" />;
export const IconTag = (p: IconProps) => <Glyph {...p} d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5zM8 8h.01" />;
export const IconPercent = (p: IconProps) => (
  <Glyph {...p} d="M19 5L5 19M9.5 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19.5 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
);
export const IconCreditCard = (p: IconProps) => (
  <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3 10h18M7 15h3" />
);
export const IconBanknote = (p: IconProps) => <Glyph {...p} d="M17.8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.2M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM6 10.5v3M18 10.5v3" />;

/* Text and editing */
export const IconWallet = (p: IconProps) => <Glyph {...p} d="M3 8.5A2.5 2.5 0 0 1 5.5 6H17a2 2 0 0 1 2 2v1M3 8.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M21 9.5h-4a2.5 2.5 0 0 0 0 5h4zM16.8 12h.01" />;
export const IconReceipt = (p: IconProps) => <Glyph {...p} d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5zM9 8h6M9 12h6M9 16h3" />;
export const IconTicket = (p: IconProps) => <Glyph {...p} d="M17.8 5.5H5A1.5 1.5 0 0 0 3.5 7v10A1.5 1.5 0 0 0 5 18.5h14a1.5 1.5 0 0 0 1.5-1.5V7.5M14.5 6v2.5M14.5 10.75v2.5M14.5 15.5v2.5" />;
export const IconGift = (p: IconProps) => <Glyph {...p} d="M20 11.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5M3.5 8h17v3.5h-17zM12 8v12M12 8S9.6 8 8.3 7.6A2.3 2.3 0 0 1 9.1 3.2C10.7 3.2 12 8 12 8zM12 8s2.4 0 3.7-.4a2.3 2.3 0 0 0-.8-4.4C13.3 3.2 12 8 12 8z" />;
export const IconBarcode = (p: IconProps) => <Glyph {...p} d="M4 5.5v13M6.5 5.5v13M9.5 5.5v13M11 5.5v13M14 5.5v13M16.5 5.5v13M18 5.5v13M20.5 5.5v13" />;
export const IconTruck = (p: IconProps) => (
  <Glyph
    {...p}
    d="M14 16.5V6H3.5a1 1 0 0 0-1 1v9.5H5M14 9.5h4l3 3.5v3.5h-2M9 16.5h6M9 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
  />
);
export const IconCoins = (p: IconProps) => <Glyph {...p} d="M15 7c0 1.4-2.7 2.5-6 2.5S3 8.4 3 7s2.7-2.5 6-2.5S15 5.6 15 7zM3 7v4c0 1.4 2.7 2.5 6 2.5M3 11v4c0 1.4 2.7 2.5 6 2.5M21 13c0 1.4-2.7 2.5-6 2.5S9 14.4 9 13s2.7-2.5 6-2.5 6 1.1 6 2.5zM9 13v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />;
export const IconEuro = (p: IconProps) => <Glyph {...p} d="M17.5 6.5A6.5 6.5 0 0 0 7 12a6.5 6.5 0 0 0 10.5 5.5M4.5 10.5h9M4.5 13.5h8" />;
export const IconDollar = (p: IconProps) => <Glyph {...p} d="M12 3v18M16.5 7.5C16 6 14.2 5 12 5c-2.5 0-4.5 1.3-4.5 3.3s1.9 2.8 4.5 3.2 4.5 1.2 4.5 3.3S14.5 18 12 18c-2.2 0-4-1-4.5-2.5" />;
export const IconPiggyBank = (p: IconProps) => <Glyph {...p} d="M5 11.5c0-3.3 3.1-6 7-6 2.6 0 4.9 1.2 6.1 3H20v4h-1.2c-.4 1.3-1.3 2.5-2.3 3.3V19h-3v-1.6a8.5 8.5 0 0 1-3 0V19h-3v-2.5C5.9 15.3 5 13.5 5 11.5zM15.5 10h.01M10 8.5h3M5 11.5c-1.2 0-2-.8-2-2" />;
export const IconBasket = (p: IconProps) => <Glyph {...p} d="M3.5 9.5h17l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H6.8a1.5 1.5 0 0 1-1.5-1.3zM8 9.5l3-5.5M16 9.5l-3-5.5M9.5 13v3.5M14.5 13v3.5" />;
export const IconScale = (p: IconProps) => <Glyph {...p} d="M12 4v16M8 20h8M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />;
export const IconBadgePercent = (p: IconProps) => <Glyph {...p} d="M12 3L14.02 4.47L16.5 4.21L17.52 6.48L19.79 7.5L19.53 9.98L21 12L19.53 14.02L19.79 16.5L17.52 17.52L16.5 19.79L14.02 19.53L12 21L9.98 19.53L7.5 19.79L6.48 17.52L4.21 16.5L4.47 14.02L3 12L4.47 9.98L4.21 7.5L6.48 6.48L7.5 4.21L9.98 4.47zM9 15l6-6M9.5 9.5h.01M14.5 14.5h.01" />;
export const IconContactless = (p: IconProps) => <Glyph {...p} d="M8.5 8a6 6 0 0 1 0 8M12 5.5a10 10 0 0 1 0 13M15.5 3a14 14 0 0 1 0 18M5 10.5a2 2 0 0 1 0 3" />;
export const IconLandmark = (p: IconProps) => <Glyph {...p} d="M3.5 9L12 4l8.5 5M5 9.5v7.5M9.5 9.5v7.5M14.5 9.5v7.5M19 9.5v7.5M3.5 20.5h17M3.5 17.5h17" />;

/* Text & editing -- Writing and formatting. */

export const IconText = (p: IconProps) => <Glyph {...p} d="M4 6.5v-2h16v2M12 4.5v15M9 19.5h6" />;
export const IconBold = (p: IconProps) => <Glyph {...p} d="M7.5 4.5h4.8a3.75 3.75 0 0 1 0 7.5H7.5zM7.5 12h5.7a3.75 3.75 0 0 1 0 7.5H7.5z" />;
export const IconItalic = (p: IconProps) => <Glyph {...p} d="M10 4.5h8M6 19.5h8M14.5 4.5l-5 15" />;
export const IconAlignLeft = (p: IconProps) => <Glyph {...p} d="M4 6h16M4 10.5h10M4 15h16M4 19.5h10" />;
export const IconListOrdered = (p: IconProps) => <Glyph {...p} d="M10 6.5h10M10 12h10M10 17.5h10M4.3 5.6l1.2-.6v4.5M4 10h3M4 14.2a1.3 1.3 0 1 1 2.2 1L4 18.6h3.2" />;
export const IconQuote = (p: IconProps) => <Glyph {...p} d="M9.8 6.6C7.2 7.7 5.5 9.9 5.5 12.6c0 2 1.3 3.4 3 3.4s3-1.4 3-3.2c0-1.7-1.2-3-2.9-3M19.3 6.6c-2.6 1.1-4.3 3.3-4.3 6 0 2 1.3 3.4 3 3.4s3-1.4 3-3.2c0-1.7-1.2-3-2.9-3" />;
export const IconUnderline = (p: IconProps) => <Glyph {...p} d="M7 4.5V11a5 5 0 0 0 10 0V4.5M5 20h14" />;
export const IconStrikethrough = (p: IconProps) => <Glyph {...p} d="M4 12h16M16 6.5c-.7-1.5-2.3-2.5-4.3-2.5-2.6 0-4.4 1.5-4.4 3.5 0 1.5.9 2.5 2.4 3M8 17c.6 1.8 2.3 3 4.3 3 2.6 0 4.4-1.5 4.4-3.5 0-.8-.3-1.5-.7-2" />;
export const IconAlignCenter = (p: IconProps) => <Glyph {...p} d="M4 6h16M7 10.5h10M4 15h16M7 19.5h10" />;
export const IconAlignRight = (p: IconProps) => <Glyph {...p} d="M4 6h16M10 10.5h10M4 15h16M10 19.5h10" />;
export const IconAlignJustify = (p: IconProps) => <Glyph {...p} d="M4 6h16M4 10.5h16M4 15h16M4 19.5h16" />;
export const IconHeading = (p: IconProps) => <Glyph {...p} d="M6 4.5v15M18 4.5v15M6 12h12" />;
export const IconListChecks = (p: IconProps) => <Glyph {...p} d="M11 6.5h9M11 12h9M11 17.5h9M3.5 6.5l1.5 1.5 2.5-3M3.5 12l1.5 1.5 2.5-3M3.5 17.5l1.5 1.5 2.5-3" />;
export const IconIndent = (p: IconProps) => <Glyph {...p} d="M4 5h16M11 10h9M11 14h9M4 19h16M4 9l3 3-3 3" />;
export const IconOutdent = (p: IconProps) => <Glyph {...p} d="M4 5h16M11 10h9M11 14h9M4 19h16M7 9l-3 3 3 3" />;
export const IconPilcrow = (p: IconProps) => <Glyph {...p} d="M13 4.5v15M17 4.5v15M19 4.5H9.5a4 4 0 0 0 0 8H13" />;
export const IconHighlighter = (p: IconProps) => <Glyph {...p} d="M9 11l-5.5 5.5V19H8l5.5-5.5M9 11l5.5-5.5a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L13 15M9 11l4 4M14 20.5h6.5" />;

/* Weather & nature -- Forecasts, seasons and the outdoors. */

export const IconCloudRain = (p: IconProps) => <Glyph {...p} d="M7 15.5a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 16.3 7a4.25 4.25 0 0 1 .2 8.5zM8 18.5l-1 2.5M12 18.5l-1 2.5M16 18.5l-1 2.5" />;
export const IconCloudSnow = (p: IconProps) => <Glyph {...p} d="M7 15.5a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 16.3 7a4.25 4.25 0 0 1 .2 8.5zM8 19h.01M12 20.5h.01M16 19h.01" />;
export const IconCloudLightning = (p: IconProps) => <Glyph {...p} d="M7 15.5a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 16.3 7a4.25 4.25 0 0 1 .2 8.5zM12.5 17l-2 2.5h3l-2 2.5" />;
export const IconCloudSun = (p: IconProps) => <Glyph {...p} d="M8.5 3v1.5M3.2 5.2l1 1M1.5 10.5H3M11.8 7.2A4 4 0 0 0 5 10.2M9 20a3 3 0 0 1-.3-6A4.3 4.3 0 0 1 17 12.7a3.7 3.7 0 0 1 .2 7.3z" />;
export const IconWind = (p: IconProps) => <Glyph {...p} d="M3 8.5h10a2.5 2.5 0 1 0-2.5-2.5M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5M3 16.5h7" />;
export const IconSnowflake = (p: IconProps) => <Glyph {...p} d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5" />;
export const IconThermometer = (p: IconProps) => <Glyph {...p} d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0zM12 11v6" />;
export const IconDroplet = (p: IconProps) => <Glyph {...p} d="M12 3.5s-6 6.4-6 11a6 6 0 0 0 12 0c0-4.6-6-11-6-11z" />;
export const IconUmbrella = (p: IconProps) => <Glyph {...p} d="M3.5 12a8.5 8.5 0 0 1 17 0zM12 12v6.5a2 2 0 0 1-4 0M12 2.5v1" />;
export const IconLeaf = (p: IconProps) => <Glyph {...p} d="M5 20C5 11 10 5 20 4c-.5 10-6.5 15.5-15 16zM5 20l7.5-7.5" />;
export const IconTree = (p: IconProps) => <Glyph {...p} d="M12 21v-5M12 3l-6 8h3l-4 5h14l-4-5h3z" />;
export const IconFlower = (p: IconProps) => <Glyph {...p} d="M6 4.5l3 2 3-3 3 3 3-2V9a6 6 0 0 1-12 0zM12 15v6M12 18.5c-1.5-1.8-3.5-2.5-6-2.5.3 2 2.5 3.5 6 3.5" />;
export const IconMountain = (p: IconProps) => <Glyph {...p} d="M3 19.5L9.5 7l4 7.5 2.5-4 5 9zM7.8 10.3l1.7 1.5 1.8-1.5" />;
export const IconSunrise = (p: IconProps) => <Glyph {...p} d="M4 17.5a8 8 0 0 1 16 0M2.5 20.5h19M12 3v5M9 6l3-3 3 3M4.5 11.5l1.3 1M19.5 11.5l-1.3 1" />;
export const IconRainbow = (p: IconProps) => <Glyph {...p} d="M3 17a9 9 0 0 1 18 0M6.5 17a5.5 5.5 0 0 1 11 0M10 17a2 2 0 0 1 4 0" />;
export const IconWaves = (p: IconProps) => <Glyph {...p} d="M3 7q1.5 -2 3 0t3 0q1.5 2 3 0t3 0q1.5 -2 3 0t3 0M3 12q1.5 -2 3 0t3 0q1.5 2 3 0t3 0q1.5 -2 3 0t3 0M3 17q1.5 -2 3 0t3 0q1.5 2 3 0t3 0q1.5 -2 3 0t3 0" />;
export const IconPaw = (p: IconProps) => <Glyph {...p} d="M12 13c-2.8 0-5 2.8-5 5 0 1.4 1 2 2.3 2 1 0 1.7-.5 2.7-.5s1.7.5 2.7.5c1.3 0 2.3-.6 2.3-2 0-2.2-2.2-5-5-5zM7 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM11 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM20 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />;
export const IconSprout = (p: IconProps) => <Glyph {...p} d="M12 20.5V11M12 11c0-3.5-2.5-6-6.5-6 0 3.7 2.6 6 6.5 6zM12 13.5c0-3.2 2.4-5.5 6.5-5.5 0 3.4-2.5 5.5-6.5 5.5zM7.5 20.5h9" />;
export const IconFog = (p: IconProps) => <Glyph {...p} d="M4 9h16M3 13h18M5 17h14M7 5h10" />;
export const IconTornado = (p: IconProps) => <Glyph {...p} d="M3.5 4.5h17M5.5 8.5h13M8 12.5h9M10 16.5h5M11.5 20.5h2" />;
export const IconCloudMoon = (p: IconProps) => <Glyph {...p} d="M16.5 3.5a5 5 0 0 0 4 7.5M8 19.5h8.5a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 7.2 11 4.3 4.3 0 0 0 8 19.5z" />;
export const IconSunset = (p: IconProps) => <Glyph {...p} d="M3 17.5h18M7.5 17.5a4.5 4.5 0 0 1 9 0M12 3v5M9.5 5.5L12 8l2.5-2.5M4.6 10.9l1.4 1.4M19.4 10.9L18 12.3M6 21h12" />;

/* Travel & places -- Getting somewhere and staying there. */

export const IconPlane = (p: IconProps) => <Glyph {...p} d="M12 3c1 0 1.5 1 1.5 2.5V9l7 4v2l-7-2v4.5l2.5 2V21L12 20l-4 1v-1.5l2.5-2V13l-7 2v-2l7-4V5.5C10.5 4 11 3 12 3z" />;
export const IconCar = (p: IconProps) => <Glyph {...p} d="M3.5 16.5V13l1.8-4.6A2 2 0 0 1 7.2 7h9.6a2 2 0 0 1 1.9 1.4l1.8 4.6v3.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM3.5 13h17M6 17.5v2M18 17.5v2M7 15h.01M17 15h.01" />;
export const IconBike = (p: IconProps) => <Glyph {...p} d="M8.5 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM22.5 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM5 16l3.5-7L12 16l3.5-7L19 16M8.5 9h7M7 9h3M15.5 9l-1-3H13" />;
export const IconBus = (p: IconProps) => <Glyph {...p} d="M6 4h12a2 2 0 0 1 2 2v11H4V6a2 2 0 0 1 2-2zM4 11h16M7 17v2.5M17 17v2.5M7.5 14h.01M16.5 14h.01" />;
export const IconTrain = (p: IconProps) => <Glyph {...p} d="M7 3.5h10a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2zM5 10.5h14M8.5 13.5h.01M15.5 13.5h.01M8 17l-2 3.5M16 17l2 3.5" />;
export const IconShip = (p: IconProps) => <Glyph {...p} d="M3 15.5l1.5 4.5h15l1.5-4.5-9-3zM6 14V8.5h12V14M12 12.5V4M9.5 5.5H12" />;
export const IconBed = (p: IconProps) => <Glyph {...p} d="M3 19.5V5M3 14h18v5.5M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5M8.5 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />;
export const IconSuitcase = (p: IconProps) => <Glyph {...p} d="M9 7V4.5h6V7M5.5 7h13a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7zM9 7v13M15 7v13" />;
export const IconTent = (p: IconProps) => <Glyph {...p} d="M2.5 20h19M12 4L3.5 20M12 4l8.5 16M9 20l3-5.5 3 5.5" />;
export const IconCoffee = (p: IconProps) => <Glyph {...p} d="M5 9h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10.5h1.5a2.5 2.5 0 0 1 0 5H17M8.5 3.5V6M12 3.5V6" />;
export const IconUtensils = (p: IconProps) => <Glyph {...p} d="M6 3v6a2 2 0 0 0 4 0V3M8 11v10M16.5 21V3c-2 1.5-3 4-3 7v3h3" />;
export const IconParking = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M9.5 17V7H13a3 3 0 0 1 0 6H9.5" />;
export const IconSignpost = (p: IconProps) => <Glyph {...p} d="M12 3v18M12 5h6l2 2.5-2 2.5h-6M12 12H6l-2 2.5L6 17h6M9 21h6" />;
export const IconFuel = (p: IconProps) => <Glyph {...p} d="M4.5 20.5V5A1.5 1.5 0 0 1 6 3.5h6A1.5 1.5 0 0 1 13.5 5v15.5M3 20.5h12M4.5 10h9M13.5 8.5h2A1.5 1.5 0 0 1 17 10v6a1.5 1.5 0 0 0 3 0V8l-2.5-2.5" />;
export const IconAnchor = (p: IconProps) => <Glyph {...p} d="M13.5 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM12 6.5v14M8.5 10h7M4.5 12.5a7.5 7.5 0 0 0 15 0M4.5 12.5H6.5M19.5 12.5h-2" />;
export const IconRoute = (p: IconProps) => <Glyph {...p} d="M6 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM8.5 17h8a3 3 0 0 0 0-6h-9a3 3 0 0 1 0-6h8" />;
export const IconCastle = (p: IconProps) => <Glyph {...p} d="M4 21V7h2.5v2h2V7h2v2h3V7h2v2h2V7H20v14zM10 21v-4a2 2 0 0 1 4 0v4M4 12h16" />;
export const IconBridge = (p: IconProps) => <Glyph {...p} d="M2.5 16h19M6 6.5V19M18 6.5V19M6 8c1.6 4 3.8 6 6 6s4.4-2 6-6M2.5 11.5c1.5.8 2.5 1 3.5 1M21.5 11.5c-1.5.8-2.5 1-3.5 1M9 12.3V16M12 14v2M15 12.3V16" />;
export const IconLighthouse = (p: IconProps) => <Glyph {...p} d="M9 21l1.5-12h3L15 21zM9.5 9h5l-.5-3h-4zM12 6V3.5M5 21h14M6 4.5l2.5 1.5M18 4.5L15.5 6M9.8 14.5h4.4" />;
export const IconCabin = (p: IconProps) => <Glyph {...p} d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5M16 6.5V4h2v4" />;
export const IconCampfire = (p: IconProps) => <Glyph {...p} d="M12 3c2.5 3 4 5 4 7.5a4 4 0 0 1-8 0c0-1.5.6-2.6 1.5-3.5.2 1.3.8 2 1.5 2.3C11 7.5 11.3 5.3 12 3zM4 20l16-3.5M20 20L4 16.5" />;
export const IconPalmTree = (p: IconProps) => <Glyph {...p} d="M12 9.5c-1 3.5-1.5 7.5-1 11M12 9.5C10 6.5 6.5 6 4 7.5M12 9.5c1.5-3 5-4 7.5-2.5M12 9.5C9 9 6.5 10.5 5.5 13M12 9.5c3 0 5.5 1.5 6.5 4M12 9.5c0-3 1-5 3-6.5M6.5 20.5h10" />;
export const IconVolcano = (p: IconProps) => <Glyph {...p} d="M3 20.5l5.5-10h7l5.5 10zM8.5 10.5L11 13l2-2.5 2.5 0M12 7.5V4.5M9 6L7.5 4M15 6l1.5-2" />;
export const IconFerrisWheel = (p: IconProps) => <Glyph {...p} d="M12 3a7 7 0 1 0 0 14a7 7 0 1 0 0 -14zM12 3v14M5 10h14M7 5l10 10M17 5L7 15M8 21l4-4 4 4M6.5 21h11" />;
export const IconWindmill = (p: IconProps) => <Glyph {...p} d="M9.5 21l1.5-10h2l1.5 10zM12 9L5.5 2.5M12 9l6.5-6.5M12 9l-6.5 6.5M12 9l6.5 6.5M7.5 21h9M11 17h2" />;

/* Health & sport -- Care, fitness and wellbeing. */

export const IconHeartPulse = (p: IconProps) => <Glyph {...p} d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5zM3.8 11.5h4l1.5-2.5 3 5 1.5-2.5h6.4" />;
export const IconStethoscope = (p: IconProps) => <Glyph {...p} d="M5 3.5H4v5a4.5 4.5 0 0 0 9 0v-5h-1M8.5 13v2a4.5 4.5 0 0 0 9 0v-2M19.5 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />;
export const IconPill = (p: IconProps) => <Glyph {...p} d="M10.5 20.5l10-10a4.95 4.95 0 0 0-7-7l-10 10a4.95 4.95 0 0 0 7 7zM8.5 8.5l7 7" />;
export const IconFirstAid = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M12 8v8M8 12h8" />;
export const IconDumbbell = (p: IconProps) => <Glyph {...p} d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />;
export const IconBall = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 7.5l3.3 2.4-1.3 3.9h-4l-1.3-3.9zM12 3.5v4M15.3 9.9l4-1.3M14 13.8l2.5 3.4M10 13.8l-2.5 3.4M8.7 9.9l-4-1.3" />;
export const IconApple = (p: IconProps) => <Glyph {...p} d="M12 7c-1.5-1-5.5-1.5-6.8 2.3-1.3 3.7 1 9.7 3.8 10.7 1.2.4 2-.4 3-.4s1.8.8 3 .4c2.8-1 5.1-7 3.8-10.7C17.5 5.5 13.5 6 12 7zM12 7c0-2 1-3.5 3-4" />;
export const IconHospital = (p: IconProps) => <Glyph {...p} d="M5 21V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v15M3 21h18M12 8.5v5M9.5 11h5M10 21v-3.5h4V21" />;
export const IconAccessibility = (p: IconProps) => <Glyph {...p} d="M13.5 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5l-3 6M12 14.5l3 6" />;
export const IconTennis = (p: IconProps) => <Glyph {...p} d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0 -18zM5.6 5.6c3.3 3.3 3.3 9.5 0 12.8M18.4 5.6c-3.3 3.3-3.3 9.5 0 12.8" />;
export const IconBasketball = (p: IconProps) => <Glyph {...p} d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0 -18zM12 3v18M3 12h18M6 5.2c2.2 3.4 2.2 10.2 0 13.6M18 5.2c-2.2 3.4-2.2 10.2 0 13.6" />;
export const IconSoccer = (p: IconProps) => <Glyph {...p} d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0 -18zM12 8.5l3.3 2.4-1.3 3.9h-4l-1.3-3.9zM12 8.5V3M15.3 10.9l5.2-1.7M14 14.8l3.2 4.4M10 14.8l-3.2 4.4M8.7 10.9L3.5 9.2" />;
export const IconGolf = (p: IconProps) => <Glyph {...p} d="M9 19V3.5l7.5 3.25L9 10M4 19.5c0-1.4 3.6-2.5 8-2.5s8 1.1 8 2.5-3.6 2.5-8 2.5-8-1.1-8-2.5z" />;
export const IconBowling = (p: IconProps) => <Glyph {...p} d="M10 3.5h4c.8 1.5.6 3-.4 4.4 2.3 2 3.3 5 2.4 8.6l-1 4h-6l-1-4c-.9-3.6.1-6.6 2.4-8.6-1-1.4-1.2-2.9-.4-4.4zM10.4 8h3.2" />;
export const IconWhistle = (p: IconProps) => <Glyph {...p} d="M9 9.5h12V13h-6.6A5.5 5.5 0 1 1 9 9.5zM9 15h.01M7.5 9.6V6.5h4" />;
export const IconStopwatch = (p: IconProps) => <Glyph {...p} d="M12 6a7.5 7.5 0 1 0 0 15a7.5 7.5 0 1 0 0 -15zM12 13.5V10M10 2.5h4M12 2.5V6M18.5 6.5L20 5" />;
export const IconSkateboard = (p: IconProps) => <Glyph {...p} d="M2.5 9.5c0 1.4 1.1 2.5 2.5 2.5h14c1.4 0 2.5-1.1 2.5-2.5M7 12v2.5M17 12v2.5M7 14.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 1 0 0 -3.5zM17 14.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 1 0 0 -3.5z" />;
export const IconKite = (p: IconProps) => <Glyph {...p} d="M12 2.5l6 7-6 8-6-8zM6 9.5h12M12 2.5v15M12 17.5c-.8 1.5-2.2 2.2-3.8 1.8-1.5-.4-2.6.4-3.2 2.2" />;
export const IconTooth = (p: IconProps) => <Glyph {...p} d="M7.5 3.5C5 3.5 3.5 5.5 4 8.5c.5 3 2 5 2.5 8 .4 2.5 1.2 4 2.2 4 1.2 0 1.6-2 2-4 .3-1.3.7-2 1.3-2s1 .7 1.3 2c.4 2 .8 4 2 4 1 0 1.8-1.5 2.2-4 .5-3 2-5 2.5-8 .5-3-1-5-3.5-5-1.8 0-3 1-4.5 1s-2.7-1-4.5-1z" />;
export const IconBandage = (p: IconProps) => <Glyph {...p} d="M4.6 14.3l9.7-9.7a3 3 0 0 1 4.2 0l.9.9a3 3 0 0 1 0 4.2l-9.7 9.7a3 3 0 0 1-4.2 0l-.9-.9a3 3 0 0 1 0-4.2zM10 10h.01M14 14h.01M12 12h.01M10 14h.01M14 10h.01" />;
export const IconSyringe = (p: IconProps) => <Glyph {...p} d="M18 2.5l3.5 3.5M19.75 4.25L15.5 8.5M17 10l-8.5 8.5-3-3L14 7zM5.5 15.5l-3 6M11.5 8.5l2 2M9 11l2 2M6.5 13.5l2 2M12.5 5.5l6 6" />;
export const IconEar = (p: IconProps) => <Glyph {...p} d="M6.5 9a5.5 5.5 0 0 1 11 0c0 3-2 4.2-3 5.5-.8 1-1 2-1 3a3 3 0 0 1-6 0M10 9a2 2 0 0 1 4 0c0 1-.8 1.6-1.5 2" />;
export const IconHandWave = (p: IconProps) => <Glyph {...p} d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V13c0 4.5-2.5 8-6.5 8-2.5 0-4-1.2-5.2-3.2L3.6 15a1.5 1.5 0 0 1 2.4-1.8L8 15M19.5 4c.8.7 1.3 1.6 1.5 2.5M3 7.5c.2-1 .7-1.8 1.5-2.5" />;
export const IconFootprints = (p: IconProps) => <Glyph {...p} d="M7 3.5c1.6 0 2.5 1.8 2.5 4s-.6 4.5-2.5 4.5S4.5 9.7 4.5 7.5 5.4 3.5 7 3.5zM4.8 14.5h4.4c0 2-1 3-2.2 3s-2.2-1-2.2-3zM17 8c1.6 0 2.5 1.8 2.5 4s-.6 4.5-2.5 4.5-2.5-2.3-2.5-4.5.9-4 2.5-4zM14.8 19h4.4c0 1.5-1 2.5-2.2 2.5s-2.2-1-2.2-2.5z" />;
export const IconAmbulance = (p: IconProps) => <Glyph {...p} d="M2.5 16.5v-9h11v9M13.5 10.5h4l3 3.5v2.5h-7M8 9.5v4M6 11.5h4M5.5 16.5h0M3 16.5h1M8.5 16.5h6M19 16.5h1.5M7 15.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 1 0 0 -3.5zM17 15.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 1 0 0 -3.5z" />;
export const IconFaceMask = (p: IconProps) => <Glyph {...p} d="M4 9.5c3 0 5-1.5 8-1.5s5 1.5 8 1.5v4c0 3-4 5-8 5s-8-2-8-5zM4 10.5H2.5M20 10.5h1.5M4 13H2.5a2 2 0 0 0 1.7 2M20 13h1.5a2 2 0 0 1-1.7 2M8 12h8M8.5 15h7" />;
export const IconStroller = (p: IconProps) => <Glyph {...p} d="M3.5 10.5h13a5 5 0 0 1-5 5H8.5a5 5 0 0 1-5-5zM16.5 10.5V4.5h-.5A6.5 6.5 0 0 0 9.5 10.5M16.5 6H19M8 15.5l-.8 2M13.5 15.5l.8 2M7 17.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0 -3zM14.5 17.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0 -3z" />;

/* Learning & work -- School, office and the tools of the trade. */

export const IconGraduationCap = (p: IconProps) => <Glyph {...p} d="M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11M21.5 9v5" />;
export const IconBriefcase = (p: IconProps) => <Glyph {...p} d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4.5 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM3.5 12.5h17" />;
export const IconPresentation = (p: IconProps) => <Glyph {...p} d="M3 4.5h18M4.5 4.5v10a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-10M12 15.5v3M8.5 21l3.5-2.5 3.5 2.5" />;
export const IconLibrary = (p: IconProps) => <Glyph {...p} d="M5 4v16M9 4v16M13 5l4 15M3.5 20.5h17" />;
export const IconCalculator = (p: IconProps) => <Glyph {...p} d="M15.8 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.2M8.5 7h7v3h-7zM8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17h.01M12 17h.01M15.5 17h.01" />;
export const IconRuler = (p: IconProps) => <Glyph {...p} d="M3.5 16.5l13-13 4 4-13 13zM7 13l2 2M10 10l2 2M13 7l2 2" />;
export const IconAward = (p: IconProps) => <Glyph {...p} d="M17 9a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM8.5 12.5l-1.5 8 5-2.5 5 2.5-1.5-8" />;
export const IconBackpack = (p: IconProps) => <Glyph {...p} d="M6 10a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v9.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM10 5V3.5h4V5M9 20.5v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5M9 11h6" />;
export const IconFlask = (p: IconProps) => <Glyph {...p} d="M9 3.5h6M10 3.5V9l-5.2 9a1.8 1.8 0 0 0 1.6 2.5h11.2a1.8 1.8 0 0 0 1.6-2.5L14 9V3.5M7.5 14.5h9" />;
export const IconGlasses = (p: IconProps) => <Glyph {...p} d="M10 15a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM21 15a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM10 14.5a2 2 0 0 1 4 0M3 15V9l2-3.5M21 15V9l-2-3.5" />;
export const IconClipboardCheck = (p: IconProps) => <Glyph {...p} d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2M9.5 3h5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 14l2 2 4-4.5" />;
export const IconClipboardList = (p: IconProps) => <Glyph {...p} d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2M9.5 3h5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 11h6M9 15h6" />;
export const IconStapler = (p: IconProps) => <Glyph {...p} d="M3.5 13.5h17v3a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM4.5 13.5l2-6.5h11.5a2 2 0 0 1 2 2.5l-1 4M7 10h10" />;
export const IconStickyNote = (p: IconProps) => <Glyph {...p} d="M4.5 4.5h15v9.5l-5.5 5.5H4.5zM14 19.5V14h5.5M8 9h8M8 12h5" />;
export const IconFountainPen = (p: IconProps) => <Glyph {...p} d="M14.5 4.5l5 5-7.5 7.5-6 1.5 1.5-6zM7.5 12.5l4 4M12 12l-4.5 4.5M17 2l5 5" />;
export const IconBinder = (p: IconProps) => <Glyph {...p} d="M6 3.5h12.5a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 6 3.5zM9 3.5v17M3 8h3M3 12h3M3 16h3M12.5 8h4" />;
export const IconTape = (p: IconProps) => <Glyph {...p} d="M10 5.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0 -13zM10 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0 -5zM10 18.5h11M21 18.5l-1.5-2.5" />;

/* Shapes & layout -- Primitives for editors, canvases and design tools. */

export const IconCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3" />;
export const IconSquare = (p: IconProps) => <Glyph {...p} d="M17.3 3.5H5.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V6.7" />;
export const IconTriangle = (p: IconProps) => <Glyph {...p} d="M12 4l9 16H3z" />;
export const IconHexagon = (p: IconProps) => <Glyph {...p} d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />;
export const IconDiamond = (p: IconProps) => <Glyph {...p} d="M12 3l9 9-9 9-9-9z" />;
export const IconShapes = (p: IconProps) => <Glyph {...p} d="M8.5 3.5l5 8.5h-10zM20.5 16.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3.5 14.5h6v6h-6z" />;
export const IconFrame = (p: IconProps) => <Glyph {...p} d="M7 3v18M17 3v18M3 7h18M3 17h18" />;
export const IconGridDense = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 9h18M3 15h18M9 3v18M15 3v18" />;
export const IconSquareDashed = (p: IconProps) => <Glyph {...p} d="M5 3.5h1M9.5 3.5h5M18 3.5h1a1.5 1.5 0 0 1 1.5 1.5v1M20.5 9.5v5M20.5 18v1a1.5 1.5 0 0 1-1.5 1.5h-1M14.5 20.5h-5M6 20.5H5A1.5 1.5 0 0 1 3.5 19v-1M3.5 14.5v-5M3.5 6V5A1.5 1.5 0 0 1 5 3.5" />;
export const IconComponent = (p: IconProps) => <Glyph {...p} d="M12 3l2.5 2.5L12 8 9.5 5.5zM12 16l2.5 2.5L12 21l-2.5-2.5zM5.5 9.5L8 12l-2.5 2.5L3 12zM18.5 9.5L21 12l-2.5 2.5L16 12z" />;
export const IconSpline = (p: IconProps) => <Glyph {...p} d="M5 17.5C5 10 19 14 19 6.5M6.5 19a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM20.5 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />;
export const IconBrush = (p: IconProps) => <Glyph {...p} d="M9.5 14.5l-3 .5c-1.5.3-2 1.5-2.3 3-.2 1.2-.7 2-1.7 2.5 3.5 1 7.5 0 7.5-3.5zM10.5 15.5L20 6a1.4 1.4 0 0 0-2-2l-9.5 9.5" />;
export const IconPipette = (p: IconProps) => <Glyph {...p} d="M14 6l4 4M17.5 3.5a2.1 2.1 0 0 1 3 3l-3 3-3-3zM14.5 6.5l-9 9V19H9l9-9" />;

/* Food & drink -- Eating, drinking and the kitchen. */

export const IconPizza = (p: IconProps) => <Glyph {...p} d="M3.5 6.5c5.4-3 11.6-3 17 0L12 21zM5.3 9.6c4.4-2.2 9-2.2 13.4 0M10 12.5h.01M14 13h.01M12 16.5h.01" />;
export const IconBurger = (p: IconProps) => <Glyph {...p} d="M4 10.5C4 6.9 7.6 4.5 12 4.5s8 2.4 8 6zM3.5 14h17M5 17h14v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9.5 7.5h.01M13 7h.01" />;
export const IconCake = (p: IconProps) => <Glyph {...p} d="M4.5 20.5v-7A1.5 1.5 0 0 1 6 12h12a1.5 1.5 0 0 1 1.5 1.5v7M3 20.5h18M4.5 16c1.25.9 2.5.9 3.75 0s2.5-.9 3.75 0 2.5.9 3.75 0 2.5-.9 3.75 0M12 12V8.5M12 6.5c-.8-.8-.8-1.8 0-3 .8 1.2.8 2.2 0 3z" />;
export const IconWineGlass = (p: IconProps) => <Glyph {...p} d="M7.5 3h9l.5 4.5a5 5 0 0 1-10 0zM12 12.5v8M8.5 20.5h7M7.2 7h9.6" />;
export const IconBeer = (p: IconProps) => <Glyph {...p} d="M5.5 8h10v10.5a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2zM15.5 10.5h2a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-2M5.5 8a2.5 2.5 0 0 1 2.3-3.8 3 3 0 0 1 5.4 0A2.5 2.5 0 0 1 15.5 8M9 11.5v5.5M12 11.5v5.5" />;
export const IconCocktail = (p: IconProps) => <Glyph {...p} d="M4 4h16l-8 9zM12 13v7.5M8 20.5h8M6.7 7h10.6M16 4l2.5-2" />;
export const IconTeacup = (p: IconProps) => <Glyph {...p} d="M4 10h12v3.5a6 6 0 0 1-6 6 6 6 0 0 1-6-6zM16 11.5h1.5a2.5 2.5 0 0 1 0 5h-2.2M3 21.5h14M8 3.5c-.7.8-.7 1.7 0 2.5M11.5 3.5c-.7.8-.7 1.7 0 2.5" />;
export const IconEgg = (p: IconProps) => <Glyph {...p} d="M12 3.5c3.5 0 6.5 5.5 6.5 10a6.5 6.5 0 0 1-13 0C5.5 9 8.5 3.5 12 3.5z" />;
export const IconFish = (p: IconProps) => <Glyph {...p} d="M21 12c-2 3.2-5 5.5-8.5 5.5-3 0-5.4-1.6-7.3-3.8L2.5 17V7l2.7 3.3C7.1 8.1 9.5 6.5 12.5 6.5 16 6.5 19 8.8 21 12zM16 10.5h.01" />;
export const IconCarrot = (p: IconProps) => <Glyph {...p} d="M4 20l6.5-10.5a3 3 0 0 1 4.6-.4l.3.3a3 3 0 0 1-.4 4.6zM15.5 8.5l3-3M14.2 7.4l.8-4M16.6 9.8l4-.8M8.2 14.2l1.6 1.6M6.2 17.2l1.1 1.1" />;
export const IconCherries = (p: IconProps) => <Glyph {...p} d="M11 17a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM20 15a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM7.5 13.5c.5-4.5 3-8 7.5-10M16.5 11.5c-.3-3.5-.7-5.6-1.5-8M15 3.5c1.6-.4 3.6 0 4.6 1.5-1.6.7-3.1.5-4.6-1.5z" />;
export const IconLemon = (p: IconProps) => <Glyph {...p} d="M5.5 18.5c-1.5-1.5-1.3-3.6-.6-5.6 1.4-4.3 5.7-8.3 10.1-8.8 1.6-.2 2.8 0 3.9.9.9 1.1 1.1 2.3.9 3.9-.5 4.4-4.5 8.7-8.8 10.1-2 .7-4.1.9-5.5-.5zM5.5 18.5L4 20M18.9 5.1L20 4" />;
export const IconIceCream = (p: IconProps) => <Glyph {...p} d="M7.8 11.5a4.2 4.2 0 1 1 8.4 0M6.5 11.5h11L12 21zM8.6 15h6.8" />;
export const IconCookie = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M9 9h.01M14 11h.01M10 15h.01M15 15.5h.01M7.5 12.5h.01" />;
export const IconBread = (p: IconProps) => <Glyph {...p} d="M6.5 11.5a4 4 0 0 1 1-7.8C9 3.3 10.5 3 12 3s3 .3 4.5.7a4 4 0 0 1 1 7.8v8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" />;
export const IconBottle = (p: IconProps) => <Glyph {...p} d="M10 3h4v3.5l1.5 2.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5V9L10 6.5zM8.5 12.5h7M8.5 17h7" />;
export const IconChefHat = (p: IconProps) => <Glyph {...p} d="M7 14.5a4 4 0 1 1 1.5-7.7 4 4 0 0 1 7 0A4 4 0 1 1 17 14.5v5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM7 17h10" />;
export const IconSoup = (p: IconProps) => <Glyph {...p} d="M3.5 11h17a8.5 8.5 0 0 1-17 0zM8 20.5h8M9 7.5c-.8-.9-.8-2.1 0-3M12.5 7.5c-.8-.9-.8-2.1 0-3M16 7.5c-.8-.9-.8-2.1 0-3" />;
export const IconCandy = (p: IconProps) => <Glyph {...p} d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM8.5 12L5 8.5 3.5 12 5 15.5zM15.5 12L19 8.5l1.5 3.5-1.5 3.5z" />;

/* Home & living -- Rooms, furniture and the things in them. */

export const IconSofa = (p: IconProps) => <Glyph {...p} d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3.5 11.5a1.5 1.5 0 0 1 3 0V14h11v-2.5a1.5 1.5 0 0 1 3 0v5.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM5.5 18v2M18.5 18v2" />;
export const IconArmchair = (p: IconProps) => <Glyph {...p} d="M6.5 11V7.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V11M4 12a1.5 1.5 0 0 1 3 0v2.5h10V12a1.5 1.5 0 0 1 3 0v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM6.5 18v2.5M17.5 18v2.5" />;
export const IconLamp = (p: IconProps) => <Glyph {...p} d="M8 3.5h8l2.5 6.5h-13zM12 10v10.5M8.5 20.5h7" />;
export const IconDoor = (p: IconProps) => <Glyph {...p} d="M5.5 21V4.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1V21M3.5 21h17M14.5 12.5h.01" />;
export const IconStairs = (p: IconProps) => <Glyph {...p} d="M3.5 20.5h4v-4h4v-4h4v-4h4v-4" />;
export const IconShower = (p: IconProps) => <Glyph {...p} d="M5 21V7a3.5 3.5 0 0 1 7 0v1M9 11.5a3 3 0 0 1 6 0zM10 14.5h.01M12 15.5h.01M14 14.5h.01M11 18h.01M13 18h.01" />;
export const IconBathtub = (p: IconProps) => <Glyph {...p} d="M3 12h18v2.5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V5.5a2 2 0 0 1 3.7-1M7.5 19.5L6.5 21M16.5 19.5l1 1.5" />;
export const IconWashingMachine = (p: IconProps) => <Glyph {...p} d="M16.3 3H6.5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V6.2M4.5 7.5h15M7.5 5.25h.01M10 5.25h.01M16 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />;
export const IconFridge = (p: IconProps) => <Glyph {...p} d="M15.8 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5.7M5 10h14M8.5 6v1.5M8.5 13v3" />;
export const IconOven = (p: IconProps) => <Glyph {...p} d="M16.8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6.2M4 8h16M8 5.5h.01M11 5.5h.01M7.5 11.5h9v5.5h-9z" />;
export const IconFan = (p: IconProps) => <Glyph {...p} d="M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM12 10.5c-.8-2.9.4-6.5 3.2-6.5 1.6 0 2.4 1.6 1.2 3.4L13.4 11M13.3 12.8c2.9.9 5.4 3.5 4 5.9-.8 1.3-2.6 1.2-3.8-.6l-1.6-3.6M10.7 12.6c-2.2 2-5.6 2.9-7 .5-.7-1.3.2-2.9 2.4-3.2l4.1-.4" />;
export const IconMailbox = (p: IconProps) => <Glyph {...p} d="M8.5 6.5A4.5 4.5 0 0 0 4 11v7.5h16V11a4.5 4.5 0 0 0-4.5-4.5zM8.5 6.5A4.5 4.5 0 0 1 13 11v7.5M12 18.5v3M15.5 6.5v-3H19v2h-3.5M6.5 11h3.5" />;
export const IconHanger = (p: IconProps) => <Glyph {...p} d="M10 5.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9V9L3.5 15.5a1.5 1.5 0 0 0 .9 2.7h15.2a1.5 1.5 0 0 0 .9-2.7L12 9" />;
export const IconBroom = (p: IconProps) => <Glyph {...p} d="M15.5 3l-3.5 8M7.5 10.5l8 3.5-2 6.5L4 17zM9 14.5l-1.5 4.5M12 15.5l-1.2 4.2" />;
export const IconVase = (p: IconProps) => <Glyph {...p} d="M9 3.5h6M10 3.5v3c-2.5 1.5-4 4-4 7 0 3.5 2 6.5 6 6.5s6-3 6-6.5c0-3-1.5-5.5-4-7v-3M6.6 11h10.8" />;
export const IconEasel = (p: IconProps) => <Glyph {...p} d="M12 3v2M4.5 5h15v10h-15zM8.5 15L6.5 21M15.5 15l2 6M12 15v3.5" />;
export const IconFence = (p: IconProps) => <Glyph {...p} d="M5 20.5V7l2-3 2 3v13.5M10 20.5V7l2-3 2 3v13.5M15 20.5V7l2-3 2 3v13.5M3 10h18M3 16h18" />;
export const IconGarage = (p: IconProps) => <Glyph {...p} d="M3 20.5V9l9-5.5L21 9v11.5M6.5 20.5V12h11v8.5M6.5 15h11M6.5 18h11" />;
export const IconRadiator = (p: IconProps) => <Glyph {...p} d="M5 6.5v13M9 6.5v13M13 6.5v13M17 6.5v13M3.5 9h15M3.5 17h15M17 6.5V4.5h2.5" />;
export const IconHouseWindow = (p: IconProps) => <Glyph {...p} d="M5.5 3.5h13v17h-13zM12 3.5v17M5.5 12h13M3.5 20.5h17" />;

/* Business & finance -- Deals, documents, money and the charts behind them. */

export const IconFileSignature = (p: IconProps) => <Glyph {...p} d="M14.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5zM14.5 3v4.5H19M8 17c1-1.5 1.8-2.5 2.5-2.5s.5 2 1.5 2 1.5-1 2-1.5c.4.6.8 1 2 1M8.5 10h4" />;
export const IconStamp = (p: IconProps) => <Glyph {...p} d="M9.5 11.5V9a2.5 2.5 0 1 1 5 0v2.5M5 14.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V17H5zM5 20.5h14" />;
export const IconSafe = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM12 10.5v1.5M6 21v1M18 21v1M3 8.5h1.5M3 15.5h1.5" />;
export const IconGoldBars = (p: IconProps) => <Glyph {...p} d="M3.5 20.5l1.5-5h6l1.5 5zM11.5 20.5l1.5-5h6l1.5 5zM7.5 15.5L9 10.5h6l1.5 5M9.5 6l.5-2.5M14.5 6L14 3.5M12 6.5V3" />;
export const IconChartCandles = (p: IconProps) => <Glyph {...p} d="M7 3.5v3M7 15.5v5M5 6.5h4v9H5zM17 6.5v3M17 18v2.5M15 9.5h4V18h-4zM12 9v2M12 17.5v3M10 11h4v6.5h-4z" />;
export const IconChartArea = (p: IconProps) => <Glyph {...p} d="M3.5 3.5v17h17M6.5 17l4-6 3.5 3 5-6.5V17zM6.5 17h12.5" />;
export const IconChartScatter = (p: IconProps) => <Glyph {...p} d="M3.5 3.5v17h17M8 15.5h.01M11 12h.01M13 15h.01M15.5 9h.01M18 7h.01M9.5 9h.01M17 12.5h.01" />;
export const IconChartRadar = (p: IconProps) => <Glyph {...p} d="M12 3l8.5 6.2-3.3 10H6.8L3.5 9.2zM12 8l4 3-1.5 4.5h-5L8 11zM12 3v5M20.5 9.2L16 11M17.2 19.2l-2.7-3.7M6.8 19.2l2.7-3.7M3.5 9.2L8 11" />;
export const IconPound = (p: IconProps) => <Glyph {...p} d="M16.5 6.5A4 4 0 0 0 9.5 8v3.5c0 3-1.5 6-3 8h11M7 12.5h7" />;
export const IconYen = (p: IconProps) => <Glyph {...p} d="M6.5 4l5.5 8 5.5-8M12 12v8M8 12.5h8M8 16h8" />;
export const IconCashRegister = (p: IconProps) => <Glyph {...p} d="M4 13.5h16l-1 7H5zM6 13.5l1-5h10l1 5M9 8.5V5h6v3.5M9 3.5h6M9 16.5h.01M12 16.5h.01M15 16.5h.01" />;
export const IconAtm = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v8h18V6.2M7 13v7.5h10V13M10 17h4M6.5 7h11" />;
export const IconOfficeTower = (p: IconProps) => <Glyph {...p} d="M6 21V4.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1V21M15 9h3a1 1 0 0 1 1 1v11M3.5 21h17M9 7.5h3M9 11h3M9 14.5h3M10 21v-3h1v3" />;
export const IconFactory = (p: IconProps) => <Glyph {...p} d="M3 21V11l5 3.5V11l5 3.5V11l5 3.5V4.5h3V21zM3 21h18M7 17.5h2M12 17.5h2" />;
export const IconWarehouse = (p: IconProps) => <Glyph {...p} d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 15.5h10M7 18.5h10" />;
export const IconInvoice = (p: IconProps) => <Glyph {...p} d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 7.5h6M9 11h6M9 14.5h3.5" />;
export const IconGrowth = (p: IconProps) => <Glyph {...p} d="M3.5 20.5h17M6 16.5v4M10.5 13v7.5M15 10v10.5M19.5 6v14.5M5 12l4.5-4 4 2.5L20 4M16 4h4v4" />;
export const IconPortfolio = (p: IconProps) => <Glyph {...p} d="M8 7V4.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1V7M3.5 8a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v4.5c0 1-1 2-2.5 2H6c-1.5 0-2.5-1-2.5-2zM4.5 14v5.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V14M12 12v2" />;

/* Science & technology -- Labs, space and the physics underneath. */

export const IconAtom = (p: IconProps) => <Glyph {...p} d="M13 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM20.5 12c0 2.2-3.8 4-8.5 4s-8.5-1.8-8.5-4 3.8-4 8.5-4 8.5 1.8 8.5 4zM16.2 19.4c-1.9 1.1-5.3-1.3-7.6-5.4S5.9 5.7 7.8 4.6s5.3 1.3 7.6 5.4 2.7 8.3.8 9.4zM7.8 19.4c-1.9-1.1-1.5-5.3.8-9.4s5.7-6.5 7.6-5.4 1.5 5.3-.8 9.4-5.7 6.5-7.6 5.4z" />;
export const IconDna = (p: IconProps) => <Glyph {...p} d="M8 3c0 4.5 8 4.5 8 9s-8 4.5-8 9M16 3c0 4.5-8 4.5-8 9s8 4.5 8 9M8.6 5.5h6.8M9.6 9.5h4.8M9.6 14.5h4.8M8.6 18.5h6.8" />;
export const IconMicroscope = (p: IconProps) => <Glyph {...p} d="M9 3.5l4 1.5-2.5 6.5-4-1.5zM8.5 10.5L7.5 13M3.5 21h17M14 21a6 6 0 0 0 1.5-11.5M11 21v-3M9 18h4" />;
export const IconTelescope = (p: IconProps) => <Glyph {...p} d="M3.5 13.5l13-6 2 4.5-13 6zM16.5 7.5l3-1.5 2 4.5-3 1.5M11 14.5l-3 6.5M12.5 14l3 6.5M5.5 18l-1-2.5" />;
export const IconPlanet = (p: IconProps) => <Glyph {...p} d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM7.6 14.4C4.8 15.9 3 17.6 3.6 18.6c.8 1.4 5.3.2 10-2.5s7.9-6.2 7.1-7.6c-.6-1-3-.8-5.9.4" />;
export const IconCircuit = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M7 8h4l2 2v4M17 8h-2M7 16h5M15 14v2.5h2M7.5 8h.01M17 8h.01M7 16h.01" />;
export const IconSolarPanel = (p: IconProps) => <Glyph {...p} d="M4.5 4h15l2 10h-19zM3.5 9h17M9 4l-1 10M15 4l1 10M12 14v4M8 20.5h8" />;
export const IconWindTurbine = (p: IconProps) => <Glyph {...p} d="M12 10.5V21M9 21h6M12 10.5L12 3M12 10.5l6.5 3.8M12 10.5l-6.5 3.8M13.5 10.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />;
export const IconTestTube = (p: IconProps) => <Glyph {...p} d="M9 3h6M10 3v14.5a2 2 0 0 0 4 0V3M10 11h4" />;
export const IconRadiation = (p: IconProps) => <Glyph {...p} d="M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM9.5 12H4a8 8 0 0 1 4-6.9l2.7 4.7M14.5 12H20a8 8 0 0 0-4-6.9l-2.7 4.7M10.7 13.3L8 18a8 8 0 0 0 8 0l-2.7-4.7" />;
export const IconInfinity = (p: IconProps) => <Glyph {...p} d="M12 12c-2-2.5-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1.5 5.5-4zM12 12c2 2.5 3.5 4 5.5 4a4 4 0 0 0 0-8c-2 0-3.5 1.5-5.5 4z" />;
export const IconSigma = (p: IconProps) => <Glyph {...p} d="M17.5 5.5V4h-11l6 8-6 8h11v-1.5" />;
export const IconPi = (p: IconProps) => <Glyph {...p} d="M4.5 6.5h15M8.5 6.5V19M15 6.5V16.5a2.5 2.5 0 0 0 4 2" />;
export const IconBrain = (p: IconProps) => <Glyph {...p} d="M12 5.5a3 3 0 0 0-5.5-1.5A3 3 0 0 0 4 8a3 3 0 0 0 0 5 3 3 0 0 0 2 4.5A3 3 0 0 0 12 19zM12 5.5a3 3 0 0 1 5.5-1.5A3 3 0 0 1 20 8a3 3 0 0 1 0 5 3 3 0 0 1-2 4.5A3 3 0 0 1 12 19zM12 5.5V19M8 9.5c1.3 0 2 .7 2 2M16 9.5c-1.3 0-2 .7-2 2" />;
export const IconVirus = (p: IconProps) => <Glyph {...p} d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM12 7V4M12 20v-3M7 12H4M20 12h-3M8.5 8.5L6.4 6.4M17.6 17.6l-2.1-2.1M8.5 15.5l-2.1 2.1M17.6 6.4l-2.1 2.1M11 3.5h2M11 20.5h2M3.5 11v2M20.5 11v2" />;
export const IconAntenna = (p: IconProps) => <Glyph {...p} d="M12 9v12M8.5 21L12 9l3.5 12M9.5 17h5M7.8 4.8a6 6 0 0 0 0 8.4M16.2 4.8a6 6 0 0 1 0 8.4M13 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />;
export const IconDrone = (p: IconProps) => <Glyph {...p} d="M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM10.6 10.6L7.8 7.8M13.4 10.6l2.8-2.8M10.6 13.4l-2.8 2.8M13.4 13.4l2.8 2.8M8.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM8.5 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20.5 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />;
export const IconOrbit = (p: IconProps) => <Glyph {...p} d="M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M18.5 5.5h.01" />;
export const IconMagnifier = (p: IconProps) => <Glyph {...p} d="M15.5 10.5a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM14 14l6.5 6.5M8.5 9a2 2 0 0 1 2-2" />;

/* Tools & building -- Making, fixing and building things. */

export const IconHammer = (p: IconProps) => <Glyph {...p} d="M14 9.5L4.5 19a1.4 1.4 0 0 0 2 2L16 11.5M12.5 6.5l5 5 2.5-2.5-2-2V5.5L16 3.5h-2.5z" />;
export const IconScrewdriver = (p: IconProps) => <Glyph {...p} d="M14.5 9.5L5 19l-1.5 1.5L3 21l.5-.5M12.5 7.5l4-4 4 4-4 4zM12 10l2 2" />;
export const IconDrill = (p: IconProps) => <Glyph {...p} d="M4 6.5h11a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H4zM17 9h4M8 11.5l-1.5 8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L12.5 11.5M7 4v2.5" />;
export const IconPaintRoller = (p: IconProps) => <Glyph {...p} d="M4.5 3.5h13a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1zM18.5 6h2v5.5H12v3M11 14.5h2v6h-2z" />;
export const IconHardHat = (p: IconProps) => <Glyph {...p} d="M3 17.5h18M4 17.5v-2a8 8 0 0 1 16 0v2M10 8.5V6h4v2.5M8 10.5v3M16 10.5v3" />;
export const IconToolbox = (p: IconProps) => <Glyph {...p} d="M3.5 9h17v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM9 9V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M3.5 13.5h17M10 12v3M14 12v3" />;
export const IconLadder = (p: IconProps) => <Glyph {...p} d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10" />;
export const IconBricks = (p: IconProps) => <Glyph {...p} d="M3.5 5h17v14h-17zM3.5 9.5h17M3.5 14.5h17M9 5v4.5M15 5v4.5M12 9.5v5M6.5 14.5V19M17.5 14.5V19" />;
export const IconCrane = (p: IconProps) => <Glyph {...p} d="M6 21V5M3.5 21h7M6 5h14M6 5l4-2v2M10 5l-4 4M17 5v5M15.5 10h3l-1.5 3zM6 13h3" />;
export const IconShovel = (p: IconProps) => <Glyph {...p} d="M14 10l6-6M18.5 2.5l3 3M14 10l-4.5-1-5 5a2 2 0 0 0 0 2.8l1.7 1.7a2 2 0 0 0 2.8 0l5-5z" />;
export const IconNut = (p: IconProps) => <Glyph {...p} d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />;
export const IconSprayCan = (p: IconProps) => <Glyph {...p} d="M7 9.5h7v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1zM8.5 9.5V7h4v2.5M9.5 7V5h2v2M15.5 4h.01M18 3h.01M18 5.5h.01M20.5 4.5h.01" />;
export const IconBucket = (p: IconProps) => <Glyph {...p} d="M4.5 8.5h15l-1.5 11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM4.5 8.5a7.5 5 0 0 1 15 0" />;
export const IconTrafficCone = (p: IconProps) => <Glyph {...p} d="M9.5 4h5l4 15H5.5zM8 10h8M6.8 14.5h10.4M3.5 19h17" />;
export const IconBlueprint = (p: IconProps) => <Glyph {...p} d="M3.5 5.5a2 2 0 0 1 2-2H20v14H5.5a2 2 0 0 0-2 2zM3.5 19.5a2 2 0 0 0 2 2H20v-4M8 7.5h4v6h5M12 10.5h-4" />;
export const IconSpiritLevel = (p: IconProps) => <Glyph {...p} d="M3 9h18v6H3zM10 9v6M14 9v6M12 11.5h.01M6 12h1.5M16.5 12H18" />;

/* Play & celebration -- Games, parties and moments worth marking. */

export const IconDice = (p: IconProps) => <Glyph {...p} d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />;
export const IconChessPawn = (p: IconProps) => <Glyph {...p} d="M12 3.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0 -5zM9.5 10.5h5M10.5 10.5l-1 6.5h5l-1-6.5M7.5 20.5h9l-1-3.5h-7z" />;
export const IconPlayingCards = (p: IconProps) => <Glyph {...p} d="M9 3.5h8.5A1.5 1.5 0 0 1 19 5v13a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 18V5A1.5 1.5 0 0 1 9 3.5zM7.5 6.5l-2.4.6a1.5 1.5 0 0 0-1.1 1.8l2.8 11a1.5 1.5 0 0 0 1.8 1.1l3.6-.9M13.25 8.5l-2.25 3 2.25 3 2.25-3z" />;
export const IconBalloon = (p: IconProps) => <Glyph {...p} d="M12 3a5.5 6.5 0 0 0-5.5 6.5c0 3.6 2.5 6.5 5.5 6.5s5.5-2.9 5.5-6.5A5.5 6.5 0 0 0 12 3zM11 16l-.5 1.5h3L13 16M12 17.5c0 1.5-1.5 2-1.5 3.5" />;
export const IconPartyPopper = (p: IconProps) => <Glyph {...p} d="M4 20l4.5-12 7.5 7.5zM8.5 8c2 1 4.6 3.5 6 6M13 4.5l.5 1.5M19.5 11l-1.5.5M16 7.5L20 4M15.5 3.5h.01M20.5 8.5h.01" />;
export const IconConfetti = (p: IconProps) => <Glyph {...p} d="M5 4l1 2.5M18 5l-1.5 2M9.5 11l2.5 1M15.5 13.5l-2 2M5.5 15.5l2.5-1M17 19l1.5 1.5M11 19.5h.01M20 10.5h.01M3.5 10h.01M12 4.5h.01" />;
export const IconCandle = (p: IconProps) => <Glyph {...p} d="M9 10.5h6v10H9zM12 10.5V8M12 6c-1-1-1-2.2 0-3.5 1 1.3 1 2.5 0 3.5zM7 20.5h10" />;
export const IconFireworks = (p: IconProps) => <Glyph {...p} d="M12 12V3M12 12l6.4-6.4M12 12h9M12 12l6.4 6.4M12 12v9M12 12l-6.4 6.4M12 12H3M12 12L5.6 5.6" />;
export const IconRibbon = (p: IconProps) => <Glyph {...p} d="M12 12.5L8 21l-1.5-3H3.5l4-8.5M12 12.5l4 8.5 1.5-3h3l-4-8.5M12 3a5 5 0 1 0 0 10a5 5 0 1 0 0 -10z" />;
export const IconTheaterMasks = (p: IconProps) => <Glyph {...p} d="M3.5 4.5c3-1 6-1 9 0v5a4.5 4.5 0 0 1-9 0zM6.5 8h.01M9.5 8h.01M6.5 11c1 .8 2 .8 3 0M13.5 10.5c3-1 5-1 7 0v5a4.5 4.5 0 0 1-8 2.8M15.5 14h.01M18.5 14h.01M15.5 17.5c1-.8 2-.8 3 0" />;
export const IconLantern = (p: IconProps) => <Glyph {...p} d="M9 5.5h6M10 3h4v2.5h-4zM8 5.5h8l1 4v6l-1 3H8l-1-3v-6zM7 9.5h10M7 15.5h10M12 18.5V21" />;

/* Animals -- Pets and the creatures around them. */

export const IconCat = (p: IconProps) => <Glyph {...p} d="M5 10V4l4 3h6l4-3v6a7 7 0 0 1-14 0zM9.5 11.5h.01M14.5 11.5h.01M10.5 15c.9.7 2.1.7 3 0" />;
export const IconDog = (p: IconProps) => <Glyph {...p} d="M7.5 5.5L4.5 4.5l-1 5 3 1.5M16.5 5.5l3-1 1 5-3 1.5M6.5 9a5.5 5.5 0 0 1 11 0v5a5.5 5.5 0 0 1-11 0zM10 11h.01M14 11h.01M11 15h2l-1 1.25z" />;
export const IconBird = (p: IconProps) => <Glyph {...p} d="M16 7.5a2.5 2.5 0 0 0-5 0v2L3.5 17c4.5 1 9.5.2 12-3.6l.5-3.9 3.5.5zM11 9.5l-3.5 3.5M9.5 17.3l-.8 3.2M13 16.7l.4 3.8M15 7.5h.01" />;
export const IconRabbit = (p: IconProps) => <Glyph {...p} d="M9.8 10.2C8.2 7.6 7.8 3.6 9.2 3s2.8 3 2.8 6.5c0-3.5 1.4-7.1 2.8-6.5s1 4.6-.6 7.2a6 6 0 1 1-4.4 0zM10 14h.01M14 14h.01M11 17h2" />;
export const IconTurtle = (p: IconProps) => <Glyph {...p} d="M4 15a8 8 0 0 1 16 0zM20 13h1.2a1.6 1.6 0 0 0 0-3.2H19M6.5 15l-1 3M17.5 15l1 3M9 7.6l2 3.4h2l2-3.4M8.5 15l2.5-4M15.5 15L13 11" />;
export const IconButterfly = (p: IconProps) => <Glyph {...p} d="M12 7.5V19M12 8.5C10 5.5 6.5 3.8 4.6 5S4 11 7.2 12c-2.8 1.2-3.2 4.6-1.5 5.6s4.4-.5 6.3-3.6c1.9 3.1 4.6 4.6 6.3 3.6s1.3-4.4-1.5-5.6C20 11 21.3 6.2 19.4 5S14 5.5 12 8.5zM10.6 4.6L12 7.5l1.4-2.9" />;
export const IconBee = (p: IconProps) => <Glyph {...p} d="M12 8.5c1.9 0 3.5 2 3.5 4.5s-1.6 4.5-3.5 4.5-3.5-2-3.5-4.5 1.6-4.5 3.5-4.5zM8.7 11.5h6.6M8.7 14.5h6.6M12 17.5V20M9.5 9.5C7.5 6 4 6 4 8.5s3 3.2 5 2.3M14.5 9.5c2-3.5 5.5-3.5 5.5-1s-3 3.2-5 2.3" />;
export const IconSnail = (p: IconProps) => <Glyph {...p} d="M4 18.5h12.5M20 9v6.5a3 3 0 0 1-3 3M20 9l-1.2-3.5M20 9l1.5-3M11.5 7a5.5 5.5 0 1 0 0 11a5.5 5.5 0 1 0 0 -11zM11.5 12.5a1.8 1.8 0 1 1 1.8 1.8" />;
export const IconFeather = (p: IconProps) => <Glyph {...p} d="M20 4C13.5 4 8.5 8.5 8 15.5L5.5 20M8 15.5h5.5c3.2-1.6 5.5-5.4 6.5-11.5M9.8 11.5H16" />;
export const IconBone = (p: IconProps) => <Glyph {...p} d="M7.8 4.6a2.5 2.5 0 0 0-3.3 3.3 2.5 2.5 0 1 0 3.3 3.3l5.1 5.1a2.5 2.5 0 1 0 3.3 3.3 2.5 2.5 0 0 0 3.3-3.3 2.5 2.5 0 1 0-3.3-3.3l-5.1-5.1a2.5 2.5 0 1 0-3.3-3.3z" />;

/* Music -- Instruments and sound. */

export const IconGuitar = (p: IconProps) => <Glyph {...p} d="M14 10l5.5-5.5M18 3l3 3M13.2 7.6c-1.4-.4-3 0-4 1-.8.8-1 1.8-1 2.8-1.3.1-2.6.5-3.5 1.4-2 2-1.7 5.4.6 7.6s5.6 2.6 7.6.6c.9-.9 1.3-2.2 1.4-3.5 1 0 2-.2 2.8-1 1-1 1.4-2.6 1-4M9.5 14.5l1 1" />;
export const IconPiano = (p: IconProps) => <Glyph {...p} d="M3.5 5h17v14h-17zM7.5 5v7h2V5M14.5 5v7h2V5M8.5 12v7M15.5 12v7M12 5v14" />;
export const IconDrum = (p: IconProps) => <Glyph {...p} d="M4 8.5c0-1.7 3.6-3 8-3s8 1.3 8 3v7.5c0 1.7-3.6 3-8 3s-8-1.3-8-3zM4 8.5c0 1.7 3.6 3 8 3s8-1.3 8-3M7 11.2v7M17 11.2v7M9 3l3 3M15 3l-3 3" />;
export const IconSpeaker = (p: IconProps) => <Glyph {...p} d="M6.5 3h11a1.5 1.5 0 0 1 1.5 1.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3zM12 11a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0 -7zM12 7.5h.01" />;
export const IconMetronome = (p: IconProps) => <Glyph {...p} d="M9 3h6l3.5 18h-13zM6 15.5h12M12 15.5l4-9.5" />;

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
