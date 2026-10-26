import type { ComponentProps, ReactNode } from "react";

import { Separator } from "@rhs-ui/primitives/separator";
import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { cn } from "@/lib/utils";

export interface FocusShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark and name, on the left of the header. Usually a link to your site. */
  brand: ReactNode;
  /** The way out, on the right of the header: a link back to where the person came from, or a close button. A ghost Button is pulled out by its own padding, so its text lines up with the margin. */
  exit?: ReactNode;
  /** How wide the column is: narrow 24rem, default 32rem, wide 44rem. */
  width?: "narrow" | "default" | "wide";
  /** "center" puts the column in the middle of the page, "top" starts it near the top (for a longer form). On a short screen both start at the top. */
  align?: "center" | "top";
  /** The legal links of the footer, as plain links: Terms, Privacy, Help. */
  footer?: ReactNode;
  /** The language switcher, at the right end of the footer. */
  language?: ReactNode;
  /** The skip link's text. Default "Skip to content". */
  skipLabel?: string;
  /** The id of the main landmark, which the skip link points at. Default "main". */
  mainId?: string;
  /** The one task on the page. */
  children: ReactNode;
}

const WIDTH = { narrow: "max-w-[24rem]", default: "max-w-[32rem]", wide: "max-w-[44rem]" } as const;

/**
 * A distraction-free frame for one task: a minimal header with your brand
 * and a clear way out, a single column in the middle of the page, and a
 * quiet footer with the legal links and a language switcher. There is no
 * navigation to wander off with: it is the container for sign-in, checkout
 * and form pages. It is at least as tall as the screen (min-h-dvh, not a
 * fixed 100vh), centres the column while there is room and starts at the top
 * when there is not, so the page scrolls normally on a short screen or with
 * the keyboard open. One skip link and one main landmark keep it navigable.
 */
export function FocusShell({ brand, exit, width = "default", align = "center", footer, language, skipLabel = "Skip to content", mainId = "main", children, className, ...props }: FocusShellProps) {
  return (
    <div data-slot="focus-shell" className={cn("flex min-h-dvh flex-col bg-background text-foreground", className)} {...props}>
      <SkipLink target={mainId} label={skipLabel} />
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-8">
        <div data-slot="focus-shell-brand" className="flex items-center text-sm font-semibold">
          {brand}
        </div>
        {/* A ghost button pulls out by its own side padding, so its text ends on the margin the brand and the footer keep. */}
        {exit ? <div className="flex items-center [&>[data-slot=button][data-variant=ghost]]:-mr-3">{exit}</div> : null}
      </header>
      <main id={mainId} tabIndex={-1} className={cn("flex flex-1 flex-col px-4 pb-10 outline-none sm:px-8", align === "top" ? "pt-6 sm:pt-14" : "pt-6")}>
        {/* Auto margins centre the column in the space that is left, and become nothing when the content is taller than that. */}
        <div data-slot="focus-shell-column" data-align={align} className={cn("w-full", WIDTH[width], align === "center" ? "m-auto" : "mx-auto")}>
          {children}
        </div>
      </main>
      {footer || language ? (
        <footer data-slot="focus-shell-footer" className="shrink-0 px-4 pb-6 sm:px-8">
          <Separator className="mb-5" />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 [&_a]:rounded-sm [&_a]:outline-none [&_a]:transition-colors [&_a]:duration-150 [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40 [&_a:hover]:text-foreground">{footer}</div>
            {language ? <div>{language}</div> : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
