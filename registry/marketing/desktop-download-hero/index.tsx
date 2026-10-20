"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { IconChevronDown, IconChevronRight, IconDownload } from "@rhs-ui/icons";
import { detectPlatform, fileTypeOf, platformName, type DesktopCpu, type DesktopPlatform } from "@rhs-ui/marketing/desktop-download-hero/detect";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export type { DesktopCpu, DesktopOs, DesktopPlatform } from "@rhs-ui/marketing/desktop-download-hero/detect";

export interface DesktopDownloadHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The headline beside the download button. */
  title: string;
  /** The support line under the headline. */
  description?: string;
  /** Every build you ship. Put the one most people want first: it is offered when the browser cannot tell more. */
  platforms: readonly DesktopPlatform[];
  /** The version as written: "1.8.2". */
  version: string;
  /** When it shipped, as an ISO date: "2026-10-14". */
  releasedAt: string;
  /** System requirements, one line each. They fold into a details element under the button. */
  requirements?: readonly string[];
  /**
   * "auto" reads the browser after hydration, so the server HTML shows every
   * platform as an equal button and nothing flashes. A platform id fixes the
   * choice. An id that matches nothing, such as "none", keeps the equal list.
   */
  detect?: "auto" | (string & {});
  /**
   * The app, drawn in a window frame beside the copy. Leave it out and the copy
   * takes the whole width. It is a picture next to the copy: give a screenshot
   * alt text, and hide a drawing made of markup with aria-hidden.
   */
  window?: ReactNode;
  /** The title in the window's bar. */
  windowTitle?: string;
  /** Locale for the date. */
  locale?: string;
  /** Time zone for the date; UTC by default so server and browser agree. */
  timeZone?: string;
}

/** A download link's hidden suffix, so a screen reader hears the file type and size as well as the name. */
function Spoken({ platform, withSize = true }: { platform: DesktopPlatform; withSize?: boolean }) {
  const type = fileTypeOf(platform.href);
  return (
    <span className="sr-only">
      {type ? `, ${type} file` : ""}
      {withSize && platform.size ? `, ${platform.size}` : ""}
    </span>
  );
}

/** One fact on the meta line. Its dot sits in the item's own left gutter, so the dot goes where the item goes. */
function MetaFact({ children }: { children: ReactNode }) {
  return (
    <span className="relative pl-6">
      <span aria-hidden="true" className="absolute left-2.5">
        ·
      </span>
      <span className="sr-only">, </span>
      {children}
    </span>
  );
}

/**
 * The version, the size and the date on one line. The wrapper clips the gutter
 * of whatever item starts a line, so a line that wraps never begins or ends on
 * a dot.
 */
function MetaLine({ version, size, releasedAt, dateText }: { version: string; size?: string; releasedAt: string; dateText: string }) {
  return (
    <p className="mt-4 overflow-hidden text-sm text-muted-foreground tabular-nums">
      <span className="-ml-6 flex flex-wrap gap-y-1">
        <span className="pl-6">Version {version}</span>
        {size ? <MetaFact>{size}</MetaFact> : null}
        <MetaFact>
          Released <time dateTime={releasedAt}>{dateText}</time>
        </MetaFact>
      </span>
    </p>
  );
}

/**
 * The opening of a desktop app: one large download button for the visitor's
 * system, the other platforms and architectures in a menu beside it, the
 * version, size and date under it, and the app in a window on the right. The
 * system is read from the browser only after hydration, so the server HTML
 * lists every platform as an equal button and never shows the wrong one; if
 * detection fails, that list simply stays. With a single build there is no
 * menu, and without a window the copy takes the whole width. Every platform is
 * a real download link, and the system requirements fold into a details
 * element.
 */
export function DesktopDownloadHero({
  titleAs: Title = "h2",
  title,
  description,
  platforms,
  version,
  releasedAt,
  requirements = [],
  detect = "auto",
  window: appWindow,
  windowTitle,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: DesktopDownloadHeroProps) {
  const [detected, setDetected] = useState<string | undefined>(undefined);
  const ids = platforms.map((platform) => platform.id).join("|");

  useEffect(() => {
    if (detect !== "auto") return;
    let live = true;
    const nav = navigator as Navigator & { userAgentData?: { platform?: string; getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }> } };
    const base = { userAgent: nav.userAgent, platform: nav.userAgentData?.platform ?? nav.platform, touchPoints: nav.maxTouchPoints };
    setDetected(detectPlatform(platforms, base));
    nav.userAgentData
      ?.getHighEntropyValues?.(["architecture"])
      .then((values) => {
        const cpu: DesktopCpu | undefined = values.architecture === "arm" ? "arm64" : values.architecture === "x86" ? "x64" : undefined;
        if (live && cpu) setDetected(detectPlatform(platforms, { ...base, cpu }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // The platforms are read through their ids, so an inline array does not re-run the detection on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detect, ids]);

  const active = platforms.find((platform) => platform.id === (detect === "auto" ? detected : detect));
  const others = platforms.filter((platform) => platform !== active);
  const date = new Date(releasedAt);
  const dateText = Number.isNaN(date.getTime()) ? releasedAt : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(date);
  return (
    <section
      data-slot="desktop-download-hero"
      className={cn("grid grid-cols-1 gap-12 py-16 sm:py-20", appWindow && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16", className)}
      {...props}
    >
      <div className="min-w-0">
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        <div className={cn("@container mt-9", appWindow ? "max-w-xl" : "max-w-3xl")}>
          {active ? (
            <>
              <div className="flex max-w-md">
                <Button
                  asChild
                  size="lg"
                  className={cn("h-auto min-h-11 min-w-0 flex-1 justify-start py-2 text-left text-balance whitespace-normal sm:whitespace-nowrap", others.length > 0 && "rounded-r-none")}
                >
                  <a href={active.href} download>
                    <IconDownload />
                    Download for {platformName(active)}
                    <Spoken platform={active} />
                  </a>
                </Button>
                {others.length ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg" aria-label="Other platforms and architectures" className="h-auto shrink-0 rounded-l-none border-l-primary-foreground/25 px-3">
                        <IconChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
                      <DropdownMenuLabel>Other platforms</DropdownMenuLabel>
                      {others.map((platform) => (
                        <DropdownMenuItem key={platform.id} asChild>
                          <a href={platform.href} download className="justify-between">
                            <span className="min-w-0 truncate">{platformName(platform)}</span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{[fileTypeOf(platform.href), platform.size].filter(Boolean).join(" · ")}</span>
                          </a>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
              <MetaLine version={version} size={active.size} releasedAt={releasedAt} dateText={dateText} />
            </>
          ) : (
            <>
              <ul className="grid gap-2 @[28rem]:grid-cols-2 @[44rem]:grid-cols-3">
                {platforms.map((platform) => (
                  <li key={platform.id}>
                    <Button asChild variant="outline" size="sm" className="h-9 w-full justify-start">
                      <a href={platform.href} download>
                        <IconDownload />
                        <span className="min-w-0 truncate">
                          {platform.label}
                          {platform.arch ? <span className="font-normal text-muted-foreground"> {platform.arch}</span> : null}
                        </span>
                        <Spoken platform={platform} withSize={false} />
                        {platform.size ? <span className="ml-auto pl-2 text-xs font-normal text-muted-foreground tabular-nums">{platform.size}</span> : null}
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
              <MetaLine version={version} releasedAt={releasedAt} dateText={dateText} />
            </>
          )}
        </div>
        {requirements.length ? (
          <details className="group/requirements mt-6 max-w-md text-sm">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm text-muted-foreground transition-colors duration-150 outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
              <IconChevronRight className="size-4 transition-transform duration-200 group-open/requirements:rotate-90 motion-reduce:transition-none" />
              System requirements
            </summary>
            <ul className="mt-3 grid gap-1.5 pl-[1.375rem] text-muted-foreground">
              {requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
      {appWindow ? (
        <div data-slot="desktop-download-hero-window" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[3rem_1fr_3rem] items-center border-b border-border bg-muted/60 px-4 py-3">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
            </span>
            <span className="truncate text-center text-xs text-muted-foreground">{windowTitle}</span>
          </div>
          {appWindow}
        </div>
      ) : null}
    </section>
  );
}
