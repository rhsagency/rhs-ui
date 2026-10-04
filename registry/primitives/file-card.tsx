import type { ReactNode } from "react";

import { IconFile, IconFileCode, IconFileImage, IconFileSheet, IconFileText } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FileCardProps {
  name: string;
  /** Bytes. */
  size: number;
  /** "14 Apr 2026", formatted on your side. */
  modified?: string;
  /** A thumbnail for images and documents that have one. */
  thumbnail?: string;
  href?: string;
  /** Menu or buttons: download, share, delete. */
  actions?: ReactNode;
  locale?: string;
  className?: string;
}

const KIND: [RegExp, typeof IconFile, string][] = [
  [/\.(png|jpe?g|gif|webp|avif|svg)$/i, IconFileImage, "Image"],
  [/\.(csv|xlsx?|numbers)$/i, IconFileSheet, "Spreadsheet"],
  [/\.(js|ts|tsx|json|py|go|rb|css|html)$/i, IconFileCode, "Code"],
  [/\.(pdf|docx?|txt|md|pages)$/i, IconFileText, "Document"],
];

/**
 * One file as a card: a thumbnail or a type icon picked from the extension,
 * the name truncated in the middle so the extension stays visible, size and
 * date, and your actions. The card is a link when there is somewhere to go.
 */
export function FileCard({ name, size, modified, thumbnail, href, actions, locale = "en-GB", className }: FileCardProps) {
  const [, Icon, kind] = KIND.find(([pattern]) => pattern.test(name)) ?? [null, IconFile, "File"];
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  const bytes = new Intl.NumberFormat(locale, { style: "unit", unit: size >= 1e6 ? "megabyte" : "kilobyte", maximumFractionDigits: 1 }).format(size >= 1e6 ? size / 1e6 : size / 1e3);
  const title = (
    <span className="flex min-w-0 text-sm font-medium" title={name}>
      <span className="truncate">{base}</span>
      <span className="shrink-0">{ext}</span>
    </span>
  );
  return (
    <article data-slot="file-card" className={cn("group relative overflow-clip rounded-2xl border border-border bg-background", className)}>
      <div className="flex aspect-[4/3] items-center justify-center bg-muted">
        {thumbnail ? <img src={thumbnail} alt="" className="size-full object-cover" /> : <Icon aria-hidden="true" className="size-10 text-muted-foreground" />}
      </div>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          {href ? <a href={href} className="outline-none after:absolute after:inset-0 focus-visible:underline">{title}</a> : title}
          <p className="mt-0.5 text-xs text-muted-foreground" suppressHydrationWarning>{kind} · {bytes}{modified ? ` · ${modified}` : ""}</p>
        </div>
        {actions ? <div className="relative z-10 shrink-0">{actions}</div> : null}
      </div>
    </article>
  );
}
