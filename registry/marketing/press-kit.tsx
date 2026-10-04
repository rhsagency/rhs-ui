import type { ReactNode } from "react";

import { IconDownload } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PressAsset {
  title: string;
  /** "SVG and PNG, 2 MB". */
  detail: string;
  href: string;
  /** A preview of the asset on its own background. */
  preview: ReactNode;
  /** Draw the preview on a dark tile (a light logo). Tiles keep their own background in both themes, like the asset itself. */
  dark?: boolean;
}

export interface PressKitProps {
  title: string;
  description?: string;
  /** Short facts journalists need: founded, team, customers. */
  facts?: readonly { label: string; value: string }[];
  assets: readonly PressAsset[];
  /** "press@example.com" as a link or a contact line. */
  contact?: ReactNode;
  className?: string;
}

/**
 * The press page in one section: the facts a journalist checks (as a
 * definition list), logo and photo downloads on tiles with the right
 * background, and who to email. Every asset is a download link.
 */
export function PressKit({ title, description, facts = [], assets, contact, className }: PressKitProps) {
  return (
    <section data-slot="press-kit" className={cn("py-16 sm:py-20", className)}>
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <h2 className="text-3xl font-medium tracking-[-.04em]">{title}</h2>
          {description ? <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
          {facts.length ? (
            <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
              {facts.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd className="text-right font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {contact ? <div className="mt-8 text-sm">{contact}</div> : null}
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {assets.map((asset) => (
            <li key={`${asset.href}-${asset.title}`}>
              <a href={asset.href} download className="group block overflow-hidden rounded-2xl border border-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                <span className={cn("flex aspect-[16/10] items-center justify-center p-8 [&_svg]:h-10 [&_svg]:w-auto", asset.dark ? "bg-[oklch(0.18_0_0)] text-[oklch(0.97_0_0)]" : "bg-[oklch(0.96_0_0)] text-[oklch(0.18_0_0)]")}>{asset.preview}</span>
                <span className="flex items-center justify-between gap-3 p-4">
                  <span>
                    <span className="block text-sm font-medium">{asset.title}</span>
                    <span className="block text-xs text-muted-foreground">{asset.detail}</span>
                  </span>
                  <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-full border border-border transition-colors group-hover:bg-foreground group-hover:text-background [&_svg]:size-4"><IconDownload /></span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
