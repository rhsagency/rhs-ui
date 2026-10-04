import type { ReactNode } from "react";

import { IconDownload } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface DownloadOption {
  /** "macOS", "Windows", "Linux". */
  platform: string;
  icon: ReactNode;
  href: string;
  /** "Apple silicon and Intel", "64-bit installer". */
  detail: string;
  /** "v2.4.1, 92 MB". */
  meta?: string;
}

export interface DownloadSectionProps {
  title: string;
  description?: string;
  options: readonly DownloadOption[];
  /** Release notes, checksums, older versions. */
  footer?: ReactNode;
  className?: string;
}

/**
 * The download page section for a desktop app: a card per platform with the
 * detail people check (chip, installer type) and the version and size, each
 * a real download link. Release notes and checksums go in the footer.
 */
export function DownloadSection({ title, description, options, footer, className }: DownloadSectionProps) {
  return (
    <section data-slot="download-section" className={cn("py-16 text-center sm:py-24", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      {description ? <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      <ul className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {options.map((option) => (
          <li key={option.platform}>
            <a href={option.href} download className="group flex h-full flex-col items-center rounded-3xl border border-border p-8 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <span className="[&_svg]:size-10">{option.icon}</span>
              <span className="mt-5 text-lg font-medium">{option.platform}</span>
              <span className="mt-1 text-sm text-muted-foreground">{option.detail}</span>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                <IconDownload aria-hidden="true" className="size-4" /> Download
              </span>
              {option.meta ? <span className="mt-3 text-xs text-muted-foreground tabular-nums">{option.meta}</span> : null}
            </a>
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-8 text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4">{footer}</div> : null}
    </section>
  );
}
