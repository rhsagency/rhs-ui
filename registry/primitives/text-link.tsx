import { isValidElement, type ComponentProps, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { IconArrowUpRight, IconDownload } from "@rhs-ui/icons";
import { renderAs, type RenderProp } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

/**
 * The look of every inline link: an underline with its own offset and thickness (both in em, so
 * they scale with the text), a focus ring that is drawn again on every line the link wraps onto,
 * and a heavier weight when it is the current page. Other components can import it to match.
 */
const textLinkVariants = cva(
  [
    "group/text-link rounded-[0.2em] underline box-decoration-clone [text-decoration-skip-ink:auto] [text-decoration-thickness:0.075em] underline-offset-[0.22em]",
    "transition-[color,text-decoration-color] duration-150 motion-reduce:transition-none",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
    "aria-[current]:font-semibold",
    // A link that is off keeps a dotted underline, so it still reads as a link in running text, only one that is not available.
    "aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground/70 aria-disabled:decoration-muted-foreground/50 aria-disabled:decoration-dotted aria-disabled:hover:text-muted-foreground/70 aria-disabled:hover:decoration-muted-foreground/50",
  ],
  {
    variants: {
      tone: {
        /** The default: foreground text with a quiet underline that darkens on hover. */
        underlined: "text-foreground decoration-foreground/35 hover:decoration-foreground focus-visible:decoration-foreground",
        /** For lists of links, where position already says "link": muted, underlined only on hover and focus. */
        subtle: "text-muted-foreground decoration-transparent hover:text-foreground hover:decoration-current focus-visible:text-foreground focus-visible:decoration-current aria-[current]:text-foreground aria-[current]:decoration-current/45",
        /** Takes the colour of the text around it, for banners, alerts and buttons. The focus ring takes it too, stronger than the theme's: the theme's ring colour vanishes on a filled surface. */
        inherit: "text-inherit decoration-current/45 hover:decoration-current focus-visible:decoration-current focus-visible:ring-current/70",
      },
    },
    defaultVariants: { tone: "underlined" },
  },
);

/** A file link's details. Without them, `download` alone just asks the browser to save the file. */
export interface TextLinkDownload {
  /** The name the file is saved under. */
  filename?: string;
  /** The kind of file, as it should read: "PDF", "CSV", "ZIP". */
  type?: string;
  /** The size in bytes (written out as "2.4 MB") or already as text. */
  size?: number | string;
}

export interface TextLinkLabels {
  /** The hidden words after an external link's text. Default "opens in a new tab". */
  newTab?: string;
  /** The hidden word before a file's type and size. Default "download". */
  download?: string;
  /** The hidden words for a link in another language; `{language}` is its name. Default "in {language}". */
  language?: string;
}

export interface TextLinkProps extends Omit<ComponentProps<"a">, "download"> {
  /** `underlined` (default), `subtle` or `inherit`. */
  tone?: "underlined" | "subtle" | "inherit";
  /** Opens in a new tab: adds an up-right arrow that stays on the last word, `rel="noopener"` and a hidden "opens in a new tab". */
  external?: boolean;
  /** A file to save. `true` or a file name for a plain download; `{ type: "PDF", size: 2_400_000 }` also shows what it is and how big. */
  download?: boolean | string | TextLinkDownload;
  /** This link points at the page (or step, or place) you are on: `aria-current` and a heavier weight. `true` means the page. */
  current?: boolean | "page" | "step" | "location" | "date" | "time";
  /** Not available. Renders a dimmed span that is not a tab stop and says it is a link that is disabled. */
  disabled?: boolean;
  /** Render the styles onto your own link (a framework `Link`): pass it as the only child, with the text inside. */
  asChild?: boolean;
  /** The locale for the file size and the name of `hrefLang`. Default "en-US". */
  locale?: string;
  /** The hidden words, for another language. */
  labels?: TextLinkLabels;
}

const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB"] as const;

/** 2400000 becomes "2.4 MB": decimal units, one decimal below 100, none above. */
function formatBytes(bytes: number, locale: string): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < BYTE_UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${BYTE_UNITS[unit] ?? "B"}`;
}

/** "de" becomes "German" in English; a code the browser does not know is left out. */
function languageName(code: string, locale: string): string | null {
  try {
    return new Intl.DisplayNames(locale, { type: "language" }).of(code) ?? null;
  } catch {
    return null;
  }
}

/**
 * Keeps the last word and the icon after it together: a lone arrow on a line of its own looks like a
 * mistake. A string is split at its last space; anything else gets a word joiner, which forbids a break.
 */
function withTail(children: ReactNode, tail: ReactNode): ReactNode {
  if (typeof children === "string") {
    const text = children.replace(/\s+$/, "");
    const cut = text.search(/\S+$/);
    return (
      <>
        {text.slice(0, Math.max(0, cut))}
        <span className="whitespace-nowrap">
          {text.slice(Math.max(0, cut))}
          {tail}
        </span>
      </>
    );
  }
  return (
    <>
      {children}
      <span className="whitespace-nowrap">
        <span aria-hidden="true" className="select-none">
          {"\u2060"}
        </span>
        {tail}
      </span>
    </>
  );
}

/**
 * The inline link, in one place so every state looks the same wherever it is used. It is underlined
 * with a considered offset and thickness, and its focus ring is drawn on every line when the text
 * wraps. It also knows what it points at and says so to everyone: an external link gets a small
 * arrow that stays attached to the last word, `rel="noopener"` and a hidden "opens in a new tab";
 * a file shows its type and size and is announced as a download; the link to the current page is
 * marked with `aria-current` and a heavier weight; and a disabled link becomes a span, so it is not a
 * dead tab stop. `asChild` puts the same look on your framework's link.
 */
export function TextLink(input: TextLinkProps & RenderProp) {
  const { tone, external = false, download, current, disabled = false, asChild = false, locale = "en-US", labels, href, rel, target, hrefLang, className, children, ...props } = renderAs(input);
  const words = { newTab: labels?.newTab ?? "opens in a new tab", download: labels?.download ?? "download", language: labels?.language ?? "in {language}" };
  const file: TextLinkDownload | null = download === undefined || download === false ? null : typeof download === "object" ? download : { filename: typeof download === "string" ? download : undefined };
  const size = file?.size === undefined ? "" : typeof file.size === "number" ? formatBytes(file.size, locale) : file.size;
  const meta = [file?.type, size].filter(Boolean).join(", ");
  const language = hrefLang ? languageName(hrefLang, locale) : null;
  const ariaCurrent = current === true ? "page" : current || undefined;

  const tail = external ? <IconArrowUpRight aria-hidden="true" className="-mr-[0.12em] ml-[0.08em] inline-block size-[0.9em] -translate-y-[0.05em] transition-transform duration-150 motion-safe:group-hover/text-link:translate-x-[0.08em] motion-safe:group-hover/text-link:-translate-y-[0.14em] motion-reduce:transition-none" /> : null;
  const extras = (
    <>
      {external ? <span className="sr-only">, {words.newTab}</span> : null}
      {language ? <span className="sr-only">, {words.language.replace("{language}", language)}</span> : null}
      {file ? (
        <>
          <span className="sr-only">, {words.download}</span>
          {meta ? (
            <>
              {/* A real space, not a margin: when the details wrap onto the next line the space is dropped and they start flush with the link. */}{" "}
              <span className="inline-block text-[0.8125em] font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                <IconDownload aria-hidden="true" className="mr-[0.3em] inline-block size-[1.05em] align-[-0.17em]" />
                {meta}
              </span>
            </>
          ) : (
            <IconDownload aria-hidden="true" className="ml-[0.3em] inline-block size-[0.95em] align-[-0.12em] text-muted-foreground" />
          )}
        </>
      ) : null}
    </>
  );
  const classes = cn(textLinkVariants({ tone }), className);

  if (disabled) {
    // A link with no destination is a span: it takes no focus, and role="link" with aria-disabled lets a screen reader say what it is.
    // With asChild the words are inside your link, which is not rendered.
    const inner = asChild && isValidElement<{ children?: ReactNode }>(children) ? children.props.children : children;
    return (
      <span {...(props as ComponentProps<"span">)} data-slot="text-link" data-tone={tone ?? "underlined"} role="link" aria-disabled="true" aria-current={ariaCurrent} className={classes}>
        {inner}
      </span>
    );
  }

  // Only the attributes that have a value: with asChild they are merged into your link, and an
  // `href: undefined` would wipe the href of a wrapper that spreads its own props after ours.
  const linkProps: ComponentProps<"a"> = {};
  if (href !== undefined) linkProps.href = href;
  if (hrefLang) linkProps.hrefLang = hrefLang;
  if (external) {
    linkProps.target = "_blank";
    linkProps.rel = Array.from(new Set(["noopener", ...(rel ? rel.split(/\s+/) : [])])).join(" ");
  } else {
    if (target !== undefined) linkProps.target = target;
    if (rel !== undefined) linkProps.rel = rel;
  }
  if (file) linkProps.download = file.filename ?? true;
  if (ariaCurrent) linkProps["aria-current"] = ariaCurrent;

  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp data-slot="text-link" data-tone={tone ?? "underlined"} data-external={external || undefined} {...props} {...linkProps} className={classes}>
      {/* Slottable has to be a direct child of the Slot: your link goes there, and everything else goes inside it. */}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : tail ? withTail(children, tail) : children}
      {asChild && tail ? withTail(null, tail) : null}
      {extras}
    </Comp>
  );
}

export { textLinkVariants };
