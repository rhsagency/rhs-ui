"use client";

import { useState, type ReactNode } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { cn } from "@/lib/utils";

export interface AccordionFeature {
  id: string;
  title: string;
  description: string;
  visual: ReactNode;
}

export interface FeatureAccordionMediaProps {
  title: string;
  description?: string;
  features: readonly AccordionFeature[];
  className?: string;
}

/**
 * Features as an accordion with a picture that follows: open a feature on
 * the left and its visual takes the stage on the right. One is always open.
 * On a phone the visual sits inside the open item instead.
 */
export function FeatureAccordionMedia({ title, description, features, className }: FeatureAccordionMediaProps) {
  const [open, setOpen] = useState(features[0]?.id ?? "");
  const active = features.find((feature) => feature.id === open) ?? features[0];
  return (
    <section data-slot="feature-accordion-media" className={cn("py-16 sm:py-24", className)}>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <Accordion type="single" value={open} onValueChange={(value) => value && setOpen(value)} className="border-t border-border">
          {features.map((feature) => (
            <AccordionItem key={feature.id} value={feature.id}>
              <AccordionTrigger className="text-base">{feature.title}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <div className="mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted lg:hidden">{feature.visual}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div aria-hidden="true" className="hidden aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted lg:block">
          <div key={active?.id} className="size-full">{active?.visual}</div>
        </div>
      </div>
    </section>
  );
}
