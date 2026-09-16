import type { ReactNode, SVGProps } from "react";

/**
 * RHS UI icons. One drawing hand for every item: a 1.75px stroke on a 24
 * grid with round caps and joins. Closed shapes open at the top right, the
 * angle of the R's leg in the RHS mark; arrows, checks and crosses stay
 * closed so the opening keeps meaning something. Sized by `size` (px) and
 * coloured by `currentColor`, decorative by default (`aria-hidden`); pass a
 * `title` when the icon is the only label.
 *
 * Import from "@rhs-ui/icons". Animated versions of a few glyphs are separate
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

/* Arrows and direction */

export const IconArrowRight = (p: IconProps) => <Glyph {...p} d="M4 12h15M13 6l6 6-6 6" />;
export const IconArrowLeft = (p: IconProps) => <Glyph {...p} d="M20 12H5M11 6l-6 6 6 6" />;
export const IconArrowUp = (p: IconProps) => <Glyph {...p} d="M12 20V5M6 11l6-6 6 6" />;
export const IconArrowDown = (p: IconProps) => <Glyph {...p} d="M12 4v15M6 13l6 6 6-6" />;
export const IconArrowUpRight = (p: IconProps) => <Glyph {...p} d="M7 17L17 7M8 7h9v9" />;
export const IconChevronDown = (p: IconProps) => <Glyph {...p} d="M6 9l6 6 6-6" />;
export const IconChevronUp = (p: IconProps) => <Glyph {...p} d="M6 15l6-6 6 6" />;
export const IconChevronRight = (p: IconProps) => <Glyph {...p} d="M9 6l6 6-6 6" />;
export const IconChevronLeft = (p: IconProps) => <Glyph {...p} d="M15 6l-6 6 6 6" />;
export const IconChevronsUpDown = (p: IconProps) => <Glyph {...p} d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" />;
export const IconRefresh = (p: IconProps) => <Glyph {...p} d="M20 12a8 8 0 1 1-2.34-5.66M17.66 2.84v3.5h-3.5" />;
export const IconUndo = (p: IconProps) => <Glyph {...p} d="M9 13.5L4.5 9 9 4.5M4.5 9H15a5 5 0 0 1 0 10h-3.5" />;
export const IconRedo = (p: IconProps) => <Glyph {...p} d="M15 13.5L19.5 9 15 4.5M19.5 9H9a5 5 0 0 0 0 10h3.5" />;
export const IconReturn = (p: IconProps) => <Glyph {...p} d="M20 4.5V11a4 4 0 0 1-4 4H4.5M9 10.5L4.5 15 9 19.5" />;
export const IconExternal = (p: IconProps) => (
  <Glyph {...p} d="M14 4h6v6M20 4l-9 9M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
);
export const IconLogIn = (p: IconProps) => (
  <Glyph {...p} d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5M10 16l4-4-4-4M14 12H4" />
);
export const IconLogOut = (p: IconProps) => (
  <Glyph {...p} d="M9.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3.5M16 16l4-4-4-4M20 12H9.5" />
);
export const IconMaximize = (p: IconProps) => <Glyph {...p} d="M14.5 3.5h6v6M9.5 20.5h-6v-6M20.5 3.5L14 10M3.5 20.5L10 14" />;
export const IconMinimize = (p: IconProps) => <Glyph {...p} d="M4 14h6v6M20 10h-6V4M14 10l6.5-6.5M10 14l-6.5 6.5" />;
export const IconTrendUp = (p: IconProps) => <Glyph {...p} d="M3 17l6-6 4 4 8-8M15 7h6v6" />;
export const IconTrendDown = (p: IconProps) => <Glyph {...p} d="M3 7l6 6 4-4 8 8M15 17h6v-6" />;

export const IconChevronsRight = (p: IconProps) => <Glyph {...p} d="M6 6l6 6-6 6M13 6l6 6-6 6" />;
export const IconChevronsLeft = (p: IconProps) => <Glyph {...p} d="M18 6l-6 6 6 6M11 6l-6 6 6 6" />;
export const IconCornerDownRight = (p: IconProps) => <Glyph {...p} d="M5 5v8a2 2 0 0 0 2 2h12M15 11l4 4-4 4" />;
export const IconMove = (p: IconProps) => <Glyph {...p} d="M12 4v16M4 12h16M9.5 6.5L12 4l2.5 2.5M9.5 17.5L12 20l2.5-2.5M6.5 9.5L4 12l2.5 2.5M17.5 9.5L20 12l-2.5 2.5" />;
export const IconRepeat = (p: IconProps) => <Glyph {...p} d="M4 9.5A3.5 3.5 0 0 1 7.5 6H20M17 3l3 3-3 3M20 14.5a3.5 3.5 0 0 1-3.5 3.5H4M7 21l-3-3 3-3" />;

/* Interface */

export const IconCheck = (p: IconProps) => <Glyph {...p} d="M5 12.5l4.5 4.5L19 7" />;
export const IconClose = (p: IconProps) => <Glyph {...p} d="M6 6l12 12M18 6L6 18" />;
export const IconPlus = (p: IconProps) => <Glyph {...p} d="M12 5v14M5 12h14" />;
export const IconMinus = (p: IconProps) => <Glyph {...p} d="M5 12h14" />;
export const IconSearch = (p: IconProps) => (
  <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6" />
);
export const IconMenu = (p: IconProps) => <Glyph {...p} d="M4 7h16M4 12h16M4 17h16" />;
export const IconMoreHorizontal = (p: IconProps) => (
  <Glyph {...p} d="M5 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0M17 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0" />
);
export const IconMoreVertical = (p: IconProps) => (
  <Glyph {...p} d="M12 5a1 1 0 1 0 0 2 1 1 0 1 0 0-2M12 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M12 17a1 1 0 1 0 0 2 1 1 0 1 0 0-2" />
);
export const IconSliders = (p: IconProps) => <Glyph {...p} d="M4 7h16M4 12h16M4 17h16M9 5v4M15 10v4M8 15v4" />;
export const IconSettings = (p: IconProps) => (
  <Glyph
    {...p}
    d="M9.89 5.11l.46-2.47h3.3l.46 2.47a7.2 7.2 0 0 1 2.8 1.62l2.37-.84 1.65 2.86-1.91 1.63a7.2 7.2 0 0 1 0 3.24l1.91 1.63-1.65 2.86-2.37-.84a7.2 7.2 0 0 1-2.8 1.62l-.46 2.47h-3.3l-.46-2.47a7.2 7.2 0 0 1-2.8-1.62l-2.37.84-1.65-2.86 1.91-1.63a7.2 7.2 0 0 1 0-3.24L3.07 8.75l1.65-2.86 2.37.84a7.2 7.2 0 0 1 2.8-1.62zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
  />
);
export const IconFilter = (p: IconProps) => <Glyph {...p} d="M16.8 5H4l6.5 7.5v8l3-1.5v-6.5L20 5" />;
export const IconSort = (p: IconProps) => <Glyph {...p} d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" />;
export const IconList = (p: IconProps) => (
  <Glyph {...p} d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
);
export const IconGrid = (p: IconProps) => (
  <Glyph
    {...p}
    d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5M19 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5M9 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4M19 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4"
  />
);
export const IconLayout = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 9h18M9 9v12" />
);
export const IconSidebar = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M9 3v18" />
);
export const IconWindow = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 8.5h18M6.5 5.75h.01M9.5 5.75h.01" />
);
export const IconHome = (p: IconProps) => (
  <Glyph {...p} d="M14.8 5.8L12 3.5 4 10v9.5a1 1 0 0 0 1 1h4.5V15h5v5.5H19a1 1 0 0 0 1-1V10l-2.8-2.3" />
);
export const IconBell = (p: IconProps) => (
  <Glyph {...p} d="M17.44 8.46A6 6 0 0 1 18 11v5l1.5 2.5h-15L6 16v-5a6 6 0 0 1 8.54-5.44M10.25 20.75a2 2 0 0 0 3.5 0" />
);
export const IconCalendar = (p: IconProps) => (
  <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3 10h18M8 3v4M16 3v4" />
);
export const IconClock = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 7.5V12l3 2" />;
export const IconEye = (p: IconProps) => (
  <Glyph {...p} d="M2.5 12C4.5 7.8 8 5.5 12 5.5s7.5 2.3 9.5 6.5c-2 4.2-5.5 6.5-9.5 6.5S4.5 16.2 2.5 12zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
);
export const IconEyeOff = (p: IconProps) => (
  <Glyph
    {...p}
    d="M10.7 5.6a10 10 0 0 1 1.3-.1c4 0 7.5 2.3 9.5 6.5a13.6 13.6 0 0 1-2.1 3.1M6.7 6.7C4.9 7.9 3.5 9.7 2.5 12c2 4.2 5.5 6.5 9.5 6.5a9.7 9.7 0 0 0 5.3-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17"
  />
);
export const IconLink = (p: IconProps) => (
  <Glyph
    {...p}
    d="M10 13.5a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.66-5.66L12 6.6M14 10.5a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.66 5.66L12 17.4"
  />
);
export const IconCopy = (p: IconProps) => (
  <Glyph
    {...p}
    d="M17.8 9H11a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6.8M5.5 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5"
  />
);
export const IconEdit = (p: IconProps) => (
  <Glyph {...p} d="M13.5 6.5l4 4M4 20l1-4.5L15.6 4.9a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19z" />
);
export const IconBookmark = (p: IconProps) => <Glyph {...p} d="M14.8 3H7.5A1.5 1.5 0 0 0 6 4.5V21l6-4 6 4V6.2" />;
export const IconFlag = (p: IconProps) => <Glyph {...p} d="M5 21V4M5 4.5h13.5L15 9.25 18.5 14H5" />;
export const IconPin = (p: IconProps) => (
  <Glyph
    {...p}
    d="M17.89 7.25A6.5 6.5 0 0 1 18.5 10c0 5.5-6.5 11-6.5 11S5.5 15.5 5.5 10a6.5 6.5 0 0 1 9.25-5.89M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
  />
);
export const IconGlobe = (p: IconProps) => (
  <Glyph
    {...p}
    d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z"
  />
);
export const IconInbox = (p: IconProps) => (
  <Glyph {...p} d="M3 12.5V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6.5M3 12.5h5l1.5 3h5l1.5-3h5M3 12.5L6 5h12l3 7.5" />
);
export const IconCommand = (p: IconProps) => (
  <Glyph {...p} d="M10 6a2 2 0 1 0-2 2h8a2 2 0 1 0-2-2v12a2 2 0 1 0 2-2H8a2 2 0 1 0 2 2z" />
);

export const IconZoomIn = (p: IconProps) => <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6M7.5 10.5h6M10.5 7.5v6" />;
export const IconZoomOut = (p: IconProps) => <Glyph {...p} d="M16.78 8.82A6.5 6.5 0 1 1 13.55 4.9M20 20l-4.6-4.6M7.5 10.5h6" />;
export const IconGrip = (p: IconProps) => <Glyph {...p} d="M9 6a1 1 0 1 0 0 2 1 1 0 1 0 0-2M9 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M9 16a1 1 0 1 0 0 2 1 1 0 1 0 0-2M15 6a1 1 0 1 0 0 2 1 1 0 1 0 0-2M15 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2M15 16a1 1 0 1 0 0 2 1 1 0 1 0 0-2" />;
export const IconArchive = (p: IconProps) => <Glyph {...p} d="M17.8 3.5H4.5A1.5 1.5 0 0 0 3 5v1.5A1.5 1.5 0 0 0 4.5 8h15A1.5 1.5 0 0 0 21 6.5V5M4.5 8v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8M10 12h4" />;
export const IconHistory = (p: IconProps) => <Glyph {...p} d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 5.5V10h4.5M12 7.5V12l3.5 2" />;
export const IconAtSign = (p: IconProps) => <Glyph {...p} d="M16 12a4 4 0 1 1-4-4M16 8v5.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2" />;
export const IconBellOff = (p: IconProps) => <Glyph {...p} d="M18 11v5l1.5 2.5H6.8M6 16v-5a6 6 0 0 1 6-6 6 6 0 0 1 4.24 1.76M10.25 20.75a2 2 0 0 0 3.5 0M3.5 3.5l17 17" />;
export const IconThumbsUp = (p: IconProps) => <Glyph {...p} d="M7 10.5v10H4.5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM7 10.5l4-7.5a2 2 0 0 1 2 2v3.5h5.2a2 2 0 0 1 2 2.35l-1.1 6a2 2 0 0 1-2 1.65H7" />;
export const IconThumbsDown = (p: IconProps) => <Glyph {...p} d="M17 13.5V3.5h2.5a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1zM17 13.5l-4 7.5a2 2 0 0 1-2-2v-3.5H5.8a2 2 0 0 1-2-2.35l1.1-6a2 2 0 0 1 2-1.65H17" />;
export const IconPlusCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 8.5v7M8.5 12h7" />;
export const IconTable = (p: IconProps) => <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M3 9.5h18M3 15h18M9.5 9.5V20" />;
export const IconBoard = (p: IconProps) => <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M9 4.5v15M15 4.5v15" />;
export const IconMap = (p: IconProps) => <Glyph {...p} d="M9 4.5L3.5 6.8v13L9 17.5l6 2.5 5.5-2.3V8.2M9 4.5v13M15 7v13" />;
export const IconCompass = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M15.5 8.5l-2 5-5 2 2-5z" />;

/* Status */

export const IconInfo = (p: IconProps) => (
  <Glyph {...p} d="M19.44 8.4A8.5 8.5 0 1 1 15.7 4.4M12 11v5M12 8h.01" />
);
export const IconWarning = (p: IconProps) => <Glyph {...p} d="M12 4l9 16H3zM12 10v4M12 17.5h.01" />;
export const IconCheckCircle = (p: IconProps) => (
  <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M8.5 12.5l2.5 2.5 5-5.5" />
);
export const IconXCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M9 9l6 6M15 9l-6 6" />;
export const IconAlertCircle = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M12 7.5v5M12 16h.01" />;
export const IconHelp = (p: IconProps) => (
  <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M9.5 9.75a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.45M12 17h.01" />
);
export const IconSparkle = (p: IconProps) => (
  <Glyph {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
);
export const IconStar = (p: IconProps) => (
  <Glyph {...p} d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
);
export const IconZap = (p: IconProps) => <Glyph {...p} d="M13 3L5 13.5h6.5L11 21l8-10.5h-6.5z" />;

export const IconRocket = (p: IconProps) => <Glyph {...p} d="M12 3.2c2.6 2.1 4 5.3 4 8.6 0 2-.8 4-1.9 5.4h-4.2C8.8 15.8 8 13.8 8 11.8c0-3.3 1.4-6.5 4-8.6zM13.5 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM9.4 15L5.5 17l.8 3.6 3-1.5M14.6 15l3.9 2-.8 3.6-3-1.5" />;
export const IconTarget = (p: IconProps) => <Glyph {...p} d="M19.7 8.41A8.5 8.5 0 1 1 15.59 4.3M16.5 10.2A4.5 4.5 0 1 1 13.8 7.5M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />;
export const IconTrophy = (p: IconProps) => <Glyph {...p} d="M8 3.5h8V9a4 4 0 0 1-8 0zM8 5.5H5.5a3 3 0 0 0 3 4.5M16 5.5h2.5a3 3 0 0 1-3 4.5M12 13v3.5M8 20.5h8l-1-4H9z" />;
export const IconIdea = (p: IconProps) => <Glyph {...p} d="M15.5 15.5A6 6 0 1 0 8.5 15.5c.6.8 1 1.6 1 2.5h5c0-.9.4-1.7 1-2.5zM9.5 21h5" />;

/* People and security */

export const IconUser = (p: IconProps) => (
  <Glyph {...p} d="M16 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4.5 20.5v-1a5.5 5.5 0 0 1 5.5-5.5h4a5.5 5.5 0 0 1 5.5 5.5v1" />
);
export const IconUsers = (p: IconProps) => (
  <Glyph
    {...p}
    d="M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM3 20v-.5A4.5 4.5 0 0 1 7.5 15h3a4.5 4.5 0 0 1 4.5 4.5v.5M15.5 4.6a3.5 3.5 0 0 1 0 6.8M17.5 15a4.5 4.5 0 0 1 3.5 4.4v.6"
  />
);
export const IconLock = (p: IconProps) => (
  <Glyph {...p} d="M16.8 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.3M8 10.5V7a4 4 0 0 1 8 0v3.5M12 15v2.5" />
);
export const IconUnlock = (p: IconProps) => (
  <Glyph {...p} d="M16.8 10.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.3M8 10.5V7a4 4 0 0 1 7.7-1.5M12 15v2.5" />
);
export const IconShield = (p: IconProps) => <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5z" />;
export const IconShieldCheck = (p: IconProps) => (
  <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5zM9 12l2 2 4-4.5" />
);
export const IconKey = (p: IconProps) => (
  <Glyph {...p} d="M11.5 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0zM10.5 13.5L20 4M16.5 7.5l2.5 2.5M14 10l2 2" />
);

export const IconUserPlus = (p: IconProps) => <Glyph {...p} d="M14.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20.5v-1A5.5 5.5 0 0 1 8.5 14h3.2M18 14.5v6M15 17.5h6" />;
export const IconUserCheck = (p: IconProps) => <Glyph {...p} d="M14.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM3 20.5v-1A5.5 5.5 0 0 1 8.5 14h3.2M15 17.5l2 2 4-4.5" />;
export const IconFingerprint = (p: IconProps) => <Glyph {...p} d="M4.6 8.4a9 9 0 0 1 13.9-1.9M5.8 17.3A11 11 0 0 0 7 12.3a5 5 0 0 1 8.4-3.7M17.6 9.8A5 5 0 0 1 18 11.8a22 22 0 0 1-.9 6.2M8.4 20.4A14 14 0 0 0 10 13.4a2 2 0 0 1 4 0c0 2.4-.4 4.8-1.2 7" />;
export const IconShieldAlert = (p: IconProps) => <Glyph {...p} d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5zM12 8.5v4M12 15.5h.01" />;
export const IconBuilding = (p: IconProps) => <Glyph {...p} d="M14.8 3H5a1 1 0 0 0-1 1v17h16V6.2M8 7h2M8 11h2M8 15h2M14 11h2M14 15h2M10 21v-3h4v3" />;

/* Theme and devices */

export const IconSun = (p: IconProps) => (
  <Glyph
    {...p}
    d="M15.63 10.31A4 4 0 1 1 13.69 8.37M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M18.7 5.3l-1.4 1.4"
  />
);
export const IconMoon = (p: IconProps) => <Glyph {...p} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />;
export const IconMonitor = (p: IconProps) => (
  <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M8 20h8M12 16v4" />
);
export const IconSmartphone = (p: IconProps) => (
  <Glyph {...p} d="M14.8 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6.2M11 18h2" />
);
export const IconLaptop = (p: IconProps) => <Glyph {...p} d="M16.8 5H6a2 2 0 0 0-2 2v9h16V8.2M2.5 19h19" />;

export const IconWifi = (p: IconProps) => <Glyph {...p} d="M3.5 9.4a13 13 0 0 1 17 0M6.6 13a8.5 8.5 0 0 1 10.8 0M9.6 16.5a4 4 0 0 1 4.8 0M12 20h.01" />;
export const IconWifiOff = (p: IconProps) => <Glyph {...p} d="M3.5 9.4a13 13 0 0 1 4.4-2.7M12.8 6.6a13 13 0 0 1 7.7 2.8M17.4 13a8.5 8.5 0 0 0-2.7-1.7M6.6 13a8.5 8.5 0 0 1 2.2-1.4M9.6 16.5a4 4 0 0 1 4.3-.5M12 20h.01M3.5 3.5l17 17" />;
export const IconBattery = (p: IconProps) => <Glyph {...p} d="M15.8 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9.2M21 10.5v3M6 10.5h6v3H6z" />;
export const IconPower = (p: IconProps) => <Glyph {...p} d="M12 3.5v8M17.5 6.5a8 8 0 1 1-11 0" />;

/* Data and development */

export const IconChart = (p: IconProps) => <Glyph {...p} d="M4 20h16M7 16v-6M12 16V5M17 16v-3" />;
export const IconPieChart = (p: IconProps) => <Glyph {...p} d="M11.5 4.5a8 8 0 1 0 8 8h-8zM13 3a8 8 0 0 1 8 8h-8z" />;
export const IconActivity = (p: IconProps) => <Glyph {...p} d="M3 12h4l2.5-6.5 5 13 2.5-6.5H21" />;
export const IconDatabase = (p: IconProps) => (
  <Glyph
    {...p}
    d="M20 5.5c0 1.4-3.6 2.5-8 2.5S4 6.9 4 5.5 7.6 3 12 3s8 1.1 8 2.5zM4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"
  />
);
export const IconCloud = (p: IconProps) => (
  <Glyph {...p} d="M7 18.5a3.5 3.5 0 0 1-.4-6.98A5 5 0 0 1 16.3 10a4.25 4.25 0 0 1 .2 8.5z" />
);
export const IconCode = (p: IconProps) => <Glyph {...p} d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />;
export const IconTerminal = (p: IconProps) => (
  <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.2M7 9l3 3-3 3M12.5 15h4.5" />
);
export const IconHash = (p: IconProps) => <Glyph {...p} d="M9 4L7 20M17 4l-2 16M4 9.5h16M3.5 15h16" />;
export const IconLayers = (p: IconProps) => <Glyph {...p} d="M12 3l9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5" />;
export const IconCube = (p: IconProps) => <Glyph {...p} d="M4 8l8-4.5L20 8v8l-8 4.5L4 16zM12 12l8-4M12 12v8.5M12 12L4 8" />;
export const IconPackage = (p: IconProps) => (
  <Glyph {...p} d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9M16 5.25l-8 4.5" />
);
export const IconWrench = (p: IconProps) => (
  <Glyph {...p} d="M14.5 3.5a5 5 0 0 0-5.8 6.9L3 16.1a1.6 1.6 0 0 0 2.3 2.3l5.7-5.7a5 5 0 0 0 6.9-5.8l-2.6 2.6-2.7-.7-.7-2.7z" />
);

export const IconServer = (p: IconProps) => <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5.2M17.8 14H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.8M6.5 6.5h.01M6.5 17.5h.01" />;
export const IconGitBranch = (p: IconProps) => <Glyph {...p} d="M8.5 5.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8.5 18.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19.5 5.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6.5 7.5v9M17.5 7.5v1.5a4.5 4.5 0 0 1-4.5 4.5H6.5" />;
export const IconBug = (p: IconProps) => <Glyph {...p} d="M8 8V6.5a4 4 0 0 1 8 0V8M16.8 8H7v5a5 5 0 0 0 10 0V9.2M3.5 11.5h3.5M17 11.5h3.5M4.5 17.5l2.7-1.6M19.5 17.5l-2.7-1.6M5 5.5l2.2 1.7M19 5.5l-2.2 1.7" />;
export const IconBraces = (p: IconProps) => <Glyph {...p} d="M8.5 3.5h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1M15.5 3.5h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1" />;
export const IconGauge = (p: IconProps) => <Glyph {...p} d="M4.5 18.5a9 9 0 1 1 15 0M12 13l4-4.5" />;

/* Communication */

export const IconMail = (p: IconProps) => (
  <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3.5 7.5l8.5 6 8.5-6" />
);
export const IconSend = (p: IconProps) => <Glyph {...p} d="M21 3L10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z" />;
export const IconMessage = (p: IconProps) => (
  <Glyph {...p} d="M17.8 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3v3.5l4.5-3.5H19a2 2 0 0 0 2-2V7.2" />
);
export const IconPhone = (p: IconProps) => (
  <Glyph
    {...p}
    d="M8.6 3.5H6A2.5 2.5 0 0 0 3.5 6c0 8 6.5 14.5 14.5 14.5a2.5 2.5 0 0 0 2.5-2.5v-2.6l-4.4-1.8-1.9 2.2a11 11 0 0 1-5.9-5.9l2.2-1.9z"
  />
);
export const IconShare = (p: IconProps) => (
  <Glyph {...p} d="M12 3.5v11M8 7.5l4-4 4 4M8.5 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2.5" />
);
export const IconMegaphone = (p: IconProps) => (
  <Glyph {...p} d="M4 10v4a1 1 0 0 0 1 1h3l7 4V5L8 9H5a1 1 0 0 0-1 1zM18.5 9.5a3.5 3.5 0 0 1 0 5" />
);

export const IconReply = (p: IconProps) => <Glyph {...p} d="M9.5 7L4 12.5 9.5 18M4 12.5h9.5a6 6 0 0 1 6 6V20" />;
export const IconMailOpen = (p: IconProps) => <Glyph {...p} d="M3 10.5L12 4l9 6.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10.5l7.8 5.2a2 2 0 0 0 2.4 0L21 10.5" />;
export const IconHeadphones = (p: IconProps) => <Glyph {...p} d="M4 16v-4a8 8 0 0 1 13.66-5.66M20 12.5V16M4 15.5h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM20 15.5h-2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1z" />;

/* Files and content */

export const IconFile = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5" />;
export const IconFileText = (p: IconProps) => (
  <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M8.5 13h7M8.5 17h5" />
);
export const IconFolder = (p: IconProps) => (
  <Glyph {...p} d="M17.3 7.5h-5.8l-2-2.5H5A1.5 1.5 0 0 0 3.5 6.5V18A1.5 1.5 0 0 0 5 19.5h14a1.5 1.5 0 0 0 1.5-1.5v-7.3" />
);
export const IconImage = (p: IconProps) => (
  <Glyph {...p} d="M17.8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.2M3 16l5-5 4 4 3-3 6 6M15.5 8.5h.01" />
);
export const IconUpload = (p: IconProps) => <Glyph {...p} d="M12 16V4M6 10l6-6 6 6M4 20h16" />;
export const IconDownload = (p: IconProps) => <Glyph {...p} d="M12 4v12M6 10l6 6 6-6M4 20h16" />;
export const IconPaperclip = (p: IconProps) => (
  <Glyph
    {...p}
    d="M20 11.5l-7.6 7.6a5 5 0 0 1-7.07-7.07l8-8a3.3 3.3 0 0 1 4.67 4.67l-7.9 7.9a1.65 1.65 0 0 1-2.33-2.33L15 7"
  />
);
export const IconBook = (p: IconProps) => <Glyph {...p} d="M5 5a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2zM5 19a2 2 0 0 0 2 2h12v-4M9 7h6" />;
export const IconTrash = (p: IconProps) => <Glyph {...p} d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />;

export const IconFilePlus = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M12 12.5v6M9 15.5h6" />;
export const IconFileCheck = (p: IconProps) => <Glyph {...p} d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5M9 14.5l2 2 4-4.5" />;
export const IconFolderOpen = (p: IconProps) => <Glyph {...p} d="M3.5 19V6.5A1.5 1.5 0 0 1 5 5h4.5l2 2.5h6A1.5 1.5 0 0 1 19 9v1.5M5 19h13.2a1.5 1.5 0 0 0 1.44-1.08l1.6-5.5a1 1 0 0 0-.96-1.28H7.6a1.5 1.5 0 0 0-1.44 1.08L3.5 19" />;
export const IconClipboard = (p: IconProps) => <Glyph {...p} d="M9 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-2M9.5 3h5a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />;
export const IconSave = (p: IconProps) => <Glyph {...p} d="M17.8 3.5H5.5A1.5 1.5 0 0 0 4 5v14a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19V6.2zM8 20.5v-6h8v6M8 3.5v4h6" />;
export const IconPrinter = (p: IconProps) => <Glyph {...p} d="M7 9V3.5h10V9M7 18H5.5A1.5 1.5 0 0 1 4 16.5v-5A1.5 1.5 0 0 1 5.5 10h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17M7 14.5h10v6H7zM7 12.5h.01" />;

/* Media */

export const IconPlay = (p: IconProps) => <Glyph {...p} d="M7 4.5v15l12-7.5z" />;
export const IconPause = (p: IconProps) => <Glyph {...p} d="M8.5 5v14M15.5 5v14" />;
export const IconVolume = (p: IconProps) => (
  <Glyph {...p} d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12" />
);
export const IconVolumeOff = (p: IconProps) => <Glyph {...p} d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM16 9.5l5 5M21 9.5l-5 5" />;
export const IconMic = (p: IconProps) => <Glyph {...p} d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />;
export const IconCamera = (p: IconProps) => (
  <Glyph
    {...p}
    d="M8 7l1.5-2.5h5L16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM15.5 13.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"
  />
);
export const IconVideo = (p: IconProps) => (
  <Glyph {...p} d="M11.8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.2M15 10.5l6-3.5v10l-6-3.5" />
);

export const IconSkipBack = (p: IconProps) => <Glyph {...p} d="M18.5 5.5v13l-9-6.5zM5.5 5v14" />;
export const IconSkipForward = (p: IconProps) => <Glyph {...p} d="M5.5 5.5v13l9-6.5zM18.5 5v14" />;
export const IconStop = (p: IconProps) => <Glyph {...p} d="M17.8 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7.2" />;
export const IconMusic = (p: IconProps) => <Glyph {...p} d="M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />;
export const IconMicOff = (p: IconProps) => <Glyph {...p} d="M15 11.5V6a3 3 0 0 0-5.7-1.3M9 9.8V11a3 3 0 0 0 4.4 2.65M5.5 11a6.5 6.5 0 0 0 10.2 5.3M18.5 11a6.5 6.5 0 0 1-.6 2.7M12 17.5V21M3.5 3.5l17 17" />;

/* Commerce */

export const IconCart = (p: IconProps) => (
  <Glyph {...p} d="M3 4h2.2l2.3 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6.3M10 20.5h.01M17 20.5h.01" />
);
export const IconBag = (p: IconProps) => <Glyph {...p} d="M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2" />;
export const IconHeart = (p: IconProps) => (
  <Glyph {...p} d="M12 20.5S3.5 15 3.5 9A4.5 4.5 0 0 1 12 6.5 4.5 4.5 0 0 1 20.5 9c0 6-8.5 11.5-8.5 11.5z" />
);
export const IconTag = (p: IconProps) => <Glyph {...p} d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5zM8 8h.01" />;
export const IconPercent = (p: IconProps) => (
  <Glyph {...p} d="M19 5L5 19M9.5 7a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19.5 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
);
export const IconCreditCard = (p: IconProps) => (
  <Glyph {...p} d="M17.8 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.2M3 10h18M7 15h3" />
);
export const IconTruck = (p: IconProps) => (
  <Glyph
    {...p}
    d="M14 16.5V6H3.5a1 1 0 0 0-1 1v9.5H5M14 9.5h4l3 3.5v3.5h-2M9 16.5h6M9 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
  />
);

export const IconWallet = (p: IconProps) => <Glyph {...p} d="M3 8.5A2.5 2.5 0 0 1 5.5 6H17a2 2 0 0 1 2 2v1M3 8.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5M21 9.5h-4a2.5 2.5 0 0 0 0 5h4zM16.8 12h.01" />;
export const IconReceipt = (p: IconProps) => <Glyph {...p} d="M6 3.5h12v17l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5zM9 8h6M9 12h6M9 16h3" />;
export const IconStore = (p: IconProps) => <Glyph {...p} d="M4 10.2V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.8M3.2 9.5L5 4h14l1.8 5.5a3 3 0 0 1-5.6 1.5 3 3 0 0 1-5.4 0 3 3 0 0 1-5.6-1.5zM9.5 20v-5h5v5" />;
export const IconBarcode = (p: IconProps) => <Glyph {...p} d="M4 5.5v13M7 5.5v13M10 5.5v9M13 5.5v13M16.5 5.5v9M20 5.5v13" />;
export const IconTicket = (p: IconProps) => <Glyph {...p} d="M17.8 5H5a1 1 0 0 0-1 1v3.2a2.8 2.8 0 0 1 0 5.6V18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.2a2.8 2.8 0 0 1 0-5.6V7.2M14 5.5v2M14 10.5v3M14 16.5v2" />;
export const IconGift = (p: IconProps) => <Glyph {...p} d="M20 11.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.5M3.5 8h17v3.5h-17zM12 8v12M12 8S9.6 8 8.3 7.6A2.3 2.3 0 0 1 9.1 3.2C10.7 3.2 12 8 12 8zM12 8s2.4 0 3.7-.4a2.3 2.3 0 0 0-.8-4.4C13.3 3.2 12 8 12 8z" />;
export const IconBanknote = (p: IconProps) => <Glyph {...p} d="M17.8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.2M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM6.5 12h.01M17.5 12h.01" />;

/* Text and editing */

export const IconText = (p: IconProps) => <Glyph {...p} d="M4 6.5v-2h16v2M12 4.5v15M9 19.5h6" />;
export const IconBold = (p: IconProps) => <Glyph {...p} d="M7 4.5h6a3.75 3.75 0 0 1 0 7.5H7zM7 12h7a3.75 3.75 0 0 1 0 7.5H7z" />;
export const IconItalic = (p: IconProps) => <Glyph {...p} d="M10 4.5h8M6 19.5h8M14.5 4.5l-5 15" />;
export const IconAlignLeft = (p: IconProps) => <Glyph {...p} d="M4 6h16M4 10.5h10M4 15h16M4 19.5h10" />;
export const IconListOrdered = (p: IconProps) => <Glyph {...p} d="M10 6.5h10M10 12h10M10 17.5h10M4.3 5.6l1.2-.6v4.5M4 10h3M4 14.2a1.3 1.3 0 1 1 2.2 1L4 18.6h3.2" />;
export const IconQuote = (p: IconProps) => <Glyph {...p} d="M9.8 6.6C7.2 7.7 5.5 9.9 5.5 12.6c0 2 1.3 3.4 3 3.4s3-1.4 3-3.2c0-1.7-1.2-3-2.9-3M19.3 6.6c-2.6 1.1-4.3 3.3-4.3 6 0 2 1.3 3.4 3 3.4s3-1.4 3-3.2c0-1.7-1.2-3-2.9-3" />;

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
