import { IconExternal } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface LinkPreviewProps {
  href: string;
  title: string;
  description?: string;
  /** The page's share image, fetched and proxied on your side. */
  image?: string;
  /** Shown instead of the full URL: "example.com". */
  site?: string;
  /** "row" for chat messages, "card" for feeds. */
  layout?: "row" | "card";
  className?: string;
}

/**
 * The card a link unfolds into in a chat or a feed: the page's image, its
 * title and description and the site, all one link that opens in a new tab
 * and says so. You fetch the metadata server-side (never from the browser,
 * so no tracking pixels load) and pass it in.
 */
export function LinkPreview({ href, title, description, image, site, layout = "card", className }: LinkPreviewProps) {
  const host = site ?? (() => { try { return new URL(href).hostname.replace(/^www\./, ""); } catch { return href; } })();
  return (
    <a data-slot="link-preview" href={href} target="_blank" rel="noopener noreferrer" className={cn("group relative flex overflow-clip rounded-2xl border border-border bg-background outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40", layout === "card" ? "max-w-sm flex-col" : "max-w-lg", className)}>
      {image ? <span className={cn("block shrink-0 bg-muted", layout === "card" ? "aspect-[1.91/1]" : "w-28")}><img src={image} alt="" className="size-full object-cover" /></span> : null}
      <span className="min-w-0 flex-1 p-3.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{host}<IconExternal aria-hidden="true" className="size-3" /><span className="sr-only">(opens in a new tab)</span></span>
        <span className="mt-1 line-clamp-2 block text-sm font-medium text-balance group-hover:underline group-hover:underline-offset-4">{title}</span>
        {description ? <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">{description}</span> : null}
      </span>
    </a>
  );
}
