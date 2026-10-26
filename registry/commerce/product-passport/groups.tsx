"use client";

import type { ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { Accordion, AccordionContent, AccordionItem } from "@rhs-ui/primitives/accordion";

export interface PassportGroupsProps {
  /** The groups, in the order they are drawn. `key` is what `defaultOpen` names. */
  groups: readonly { key: string; title: string; content: ReactNode }[];
  /** The keys of the groups that start open. */
  defaultOpen: readonly string[];
  /** The element of every group's title: one level under the passport's own heading. */
  as: "h3" | "h4";
}

/**
 * Care, repair and end of life as an accordion. The accordion primitive wraps its trigger in an h3, which would make
 * every group a sibling of the passport's title when the passport itself sits under a section's h2, so the trigger
 * is built here from Radix's own parts and the title takes the level it should have.
 */
export function PassportGroups({ groups, defaultOpen, as: Title }: PassportGroupsProps) {
  return (
    <Accordion type="multiple" defaultValue={[...defaultOpen]} className="divide-y divide-border">
      {groups.map((group) => (
        <AccordionItem key={group.key} value={group.key} className="border-b-0">
          <AccordionPrimitive.Header asChild>
            <Title className="m-0">
              <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className="group flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-50 @2xl:px-7"
              >
                {group.title}
                <span aria-hidden="true" className="text-xl font-normal transition-transform group-data-[state=open]:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </AccordionPrimitive.Trigger>
            </Title>
          </AccordionPrimitive.Header>
          <AccordionContent className="px-5 @2xl:px-7">{group.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
