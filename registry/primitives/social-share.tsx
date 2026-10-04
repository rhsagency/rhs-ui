"use client";

import { useEffect, useState } from "react";

import { IconCheck, IconLink, IconMail, IconShare } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type ShareTarget = "email" | "linkedin" | "x" | "facebook" | "whatsapp";

const TARGETS: Record<ShareTarget, { label: string; href: (url: string, title: string) => string }> = {
  email: { label: "Email", href: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
  linkedin: { label: "LinkedIn", href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  x: { label: "X", href: (url, title) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
  facebook: { label: "Facebook", href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  whatsapp: { label: "WhatsApp", href: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
};

export interface SocialShareProps {
  url: string;
  title: string;
  targets?: readonly ShareTarget[];
  /** Shown before the buttons. */
  label?: string;
  className?: string;
}

/**
 * Share this page: copy the link, the device's own share sheet where there
 * is one, and plain links to the networks you pick, named in text rather
 * than with brand logos. The copy button says "Copied" for two seconds and
 * announces it.
 */
export function SocialShare({ url, title, targets = ["email", "linkedin", "x", "whatsapp"], label = "Share", className }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  // Decided after mount: the server cannot know, and guessing would mismatch on hydration.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  const item = "inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5";
  return (
    <div data-slot="social-share" role="group" aria-label={label} className={cn("relative flex flex-wrap items-center gap-2", className)}>
      <span aria-hidden="true" className="mr-1 text-xs text-muted-foreground">{label}</span>
      <button type="button" onClick={copy} className={item}>
        {copied ? <IconCheck aria-hidden="true" /> : <IconLink aria-hidden="true" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
      {canShare ? (
        <button type="button" onClick={() => navigator.share({ url, title }).catch(() => undefined)} className={item}>
          <IconShare aria-hidden="true" />More
        </button>
      ) : null}
      {targets.map((target) => (
        <a key={target} href={TARGETS[target].href(url, title)} target={target === "email" ? undefined : "_blank"} rel="noopener noreferrer" className={item}>
          {target === "email" ? <IconMail aria-hidden="true" /> : null}
          {TARGETS[target].label}
          {target === "email" ? null : <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      ))}
    </div>
  );
}
