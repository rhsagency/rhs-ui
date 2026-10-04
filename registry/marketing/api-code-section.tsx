"use client";

import { useState, type ReactNode } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface CodeSample {
  /** The tab label: "cURL", "Node", "Python". */
  label: string;
  code: string;
}

export interface ApiCodeSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Short facts beside the code: "REST and webhooks", "99.99% uptime". */
  points?: readonly { icon?: ReactNode; text: string }[];
  samples: readonly CodeSample[];
  actions?: ReactNode;
  className?: string;
}

/**
 * The developer section of a product page: the pitch on the left, a dark code
 * window with a tab per language and a copy button on the right. Tabs move
 * with the arrow keys; the code stays selectable text.
 */
export function ApiCodeSection({ eyebrow, title, description, points = [], samples, actions, className }: ApiCodeSectionProps) {
  const [active, setActive] = useState(samples[0]?.label ?? "");
  const [copied, setCopied] = useState(false);
  async function copy() {
    const sample = samples.find((item) => item.label === active);
    if (!sample) return;
    await navigator.clipboard.writeText(sample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <section data-slot="api-code-section" className={cn("grid gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16", className)}>
      <div>
        {eyebrow ? <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h2 className="mt-3 text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {points.length ? (
          <ul className="mt-7 space-y-3 text-sm">
            {points.map((point) => (
              <li key={point.text} className="flex items-center gap-3 [&_svg]:size-4.5">{point.icon ?? <IconCheck />}{point.text}</li>
            ))}
          </ul>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <Tabs value={active} onValueChange={setActive} className="dark gap-0 overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-xl">
        <div className="flex items-center justify-between border-b border-border pr-2 pl-5">
          <TabsList aria-label="Language" className="border-b-0 pt-3">
            {samples.map((sample) => (
              <TabsTrigger key={sample.label} value={sample.label} className="text-xs">{sample.label}</TabsTrigger>
            ))}
          </TabsList>
          <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy code"} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4">
            {copied ? <IconCheck /> : <IconCopy />}
          </button>
        </div>
        {samples.map((sample) => (
          <TabsContent key={sample.label} value={sample.label} className="relative overflow-x-auto">
            <pre className="p-5 font-mono text-[0.8125rem] leading-relaxed"><code>{sample.code}</code></pre>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
