"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface FaqTabGroup {
  id: string;
  label: string;
  items: readonly { question: string; answer: string }[];
}

export interface FaqTabsProps {
  title: string;
  description?: string;
  groups: readonly FaqTabGroup[];
  className?: string;
}

/**
 * Questions sorted by topic: pill tabs for Billing, Account, Security and
 * so on, each with its own accordion of questions. For longer FAQs where
 * one list would be a wall; the tabs move with the arrow keys and every
 * answer opens in place.
 */
export function FaqTabs({ title, description, groups, className }: FaqTabsProps) {
  return (
    <section data-slot="faq-tabs" className={cn("mx-auto max-w-3xl py-16 sm:py-20", className)}>
      <h2 className="text-center text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-center text-base text-muted-foreground">{description}</p> : null}
      <Tabs defaultValue={groups[0]?.id} className="mt-8 items-center">
        <TabsList variant="pill" aria-label="Topics" className="relative max-w-full overflow-x-auto">
          {groups.map((group) => <TabsTrigger key={group.id} value={group.id}>{group.label}</TabsTrigger>)}
        </TabsList>
        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="mt-4 w-full">
            <Accordion type="single" collapsible className="border-t border-border">
              {group.items.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
