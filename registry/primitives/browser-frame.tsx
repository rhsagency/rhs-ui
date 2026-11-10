import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** `light` and `dark` fix the chrome's own tone whatever the theme of the page; without a tone it follows the theme. */
export type BrowserTone = "light" | "dark";

export interface BrowserFrameProps extends Omit<ComponentProps<"figure">, "title"> {
  /** The address shown in the bar: "northwind.example/overview". Plain text, or a link with `href`. Without it there is no address bar. */
  url?: string;
  /** Makes the address a real link that opens in a new tab. It is a link for assistive technology too; without it the whole bar is decoration. */
  href?: string;
  /** The title of the tab. Without it there is no tab, and the dots and the address share one row. */
  title?: string;
  /** Fix the chrome as `light` or `dark`, for a dark window around a light screenshot. Without it the chrome follows the page's theme tokens. */
  tone?: BrowserTone;
  /** A line shown under the window. Without it a hidden one names the window for a screen reader. */
  caption?: ReactNode;
  /** What the window shows: a screenshot, or live UI. */
  children?: ReactNode;
}

type Chrome = { window: string; strip: string; bar: string; line: string; pill: string; text: string; dot: string };

/** The classes of the chrome in each tone, written out whole: the fixed tones use their own neutral greys, the automatic one the theme's tokens. `pill` is the tint of an address that sits on the bar; `text` is its text. */
const TONES: Record<BrowserTone | "auto", Chrome> = {
  auto: {
    window: "border-border bg-card text-foreground",
    strip: "bg-muted",
    bar: "bg-card",
    line: "border-border",
    pill: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-foreground/15",
  },
  light: {
    window: "border-[oklch(0.905_0_0)] bg-white text-[oklch(0.165_0_0)]",
    strip: "bg-[oklch(0.955_0_0)]",
    bar: "bg-white",
    line: "border-[oklch(0.905_0_0)]",
    pill: "bg-[oklch(0.955_0_0)]",
    text: "text-[oklch(0.42_0_0)]",
    dot: "bg-black/15",
  },
  dark: {
    window: "border-[oklch(0.32_0_0)] bg-[oklch(0.225_0_0)] text-[oklch(0.98_0_0)]",
    strip: "bg-[oklch(0.17_0_0)]",
    bar: "bg-[oklch(0.225_0_0)]",
    line: "border-[oklch(0.32_0_0)]",
    pill: "bg-[oklch(0.17_0_0)]",
    text: "text-[oklch(0.8_0_0)]",
    dot: "bg-white/25",
  },
};

/**
 * A browser window drawn in CSS around a screenshot or live UI: three neutral
 * window dots, an optional tab, an address bar and the page below, in calm
 * monochrome. It is made of lines and radii only: no images, and no copy of
 * any real browser. The chrome follows the theme's tokens, or is fixed as
 * light or dark with `tone`. The address is plain text, or a real link with
 * `href`, in a field of its own that reads against the bar in every tone. The
 * chrome is hidden from assistive technology, and the figure has a single
 * caption (hidden unless you pass `caption`) that says what the window shows.
 * It narrows to 320px without clipping: the address and the tab truncate
 * before anything overflows.
 */
export function BrowserFrame({ url, href, title, tone, caption, children, className, ...props }: BrowserFrameProps) {
  const chrome = TONES[tone ?? "auto"];
  const dots = (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className={cn("size-2.5 rounded-full", chrome.dot)} />
      ))}
    </span>
  );
  // With a tab the address sits on the bar and takes the tint. Without one it sits on the tinted strip, where the same tint would vanish, so it takes the bar's surface and a hairline, and its text is centred like a real address bar.
  const pill = cn("flex h-7 min-w-0 items-center rounded-md px-3 text-xs", chrome.text, title ? chrome.pill : cn("justify-center border", chrome.bar, chrome.line));
  const address = url ? (
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(pill, "w-full outline-none hover:underline hover:underline-offset-2 focus-visible:ring-[3px] focus-visible:ring-ring/40")}>
        <span className="truncate">{url}</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    ) : (
      <span aria-hidden="true" className={cn(pill, "w-full")}>
        <span className="truncate">{url}</span>
      </span>
    )
  ) : null;
  const name = `Browser window showing ${title ? `${title}${url ? `, ${url}` : ""}` : (url ?? "a page")}`;

  return (
    <figure data-slot="browser-frame" data-tone={tone ?? "auto"} className={cn("m-0 w-full min-w-0", className)} {...props}>
      <div className={cn("overflow-hidden rounded-xl border shadow-sm", chrome.window)}>
        {title ? (
          <>
            <div aria-hidden="true" className={cn("flex items-end gap-3 px-3 pt-2.5", chrome.strip)}>
              <span className="mb-[0.6875rem]">{dots}</span>
              <span className={cn("flex h-8 min-w-0 max-w-56 items-center gap-2 rounded-t-lg px-3 text-xs font-medium", chrome.bar)}>
                <span className="size-3 shrink-0 rounded-[4px] bg-current opacity-25" />
                <span className="truncate">{title}</span>
              </span>
            </div>
            {address ? <div className={cn("flex items-center border-b px-3 py-2", chrome.bar, chrome.line)}>{address}</div> : <div className={cn("h-px border-b", chrome.line)} />}
          </>
        ) : (
          <div className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b px-3 py-2.5 sm:grid-cols-[3rem_minmax(0,1fr)_3rem]", chrome.strip, chrome.line)}>
            {dots}
            <div className="flex min-w-0 justify-center">
              <div className="flex w-full max-w-md min-w-0">{address}</div>
            </div>
          </div>
        )}
        <div className="relative min-w-0 [&>img]:block [&>img]:h-auto [&>img]:w-full">{children}</div>
      </div>
      <figcaption className={caption ? "mt-3 text-center text-xs text-muted-foreground" : "sr-only"}>{caption ?? name}</figcaption>
    </figure>
  );
}
