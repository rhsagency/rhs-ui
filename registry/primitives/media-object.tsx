import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface MediaObjectProps {
  /** The picture, icon or avatar on the side. */
  media: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  /** Something on the far side: a time, a menu, a price. */
  aside?: ReactNode;
  /** Media on the left (default) or the right; top-aligned or centred. */
  reverse?: boolean;
  align?: "start" | "center";
  className?: string;
}

/**
 * The oldest pattern in interface design: media beside text. A comment, a
 * notification, a search result, a product line. The text column shrinks
 * and truncates instead of pushing the media out.
 */
export function MediaObject({ media, title, children, aside, reverse = false, align = "start", className }: MediaObjectProps) {
  return (
    <div data-slot="media-object" className={cn("flex gap-3", reverse && "flex-row-reverse", align === "center" ? "items-center" : "items-start", className)}>
      <div className="shrink-0">{media}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {children ? <div className="mt-0.5 text-sm text-muted-foreground">{children}</div> : null}
      </div>
      {aside ? <div className="shrink-0 text-xs text-muted-foreground">{aside}</div> : null}
    </div>
  );
}
