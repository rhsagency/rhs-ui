"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { cn } from "@/lib/utils";

export interface ProblemListItem {
  /** The anchor of the problem; a link to #id opens it. */
  id: string;
  /** What the user sees, shown on the row. */
  symptom: string;
  /** The opened panel: cause, fix and the support link, rendered by the server. */
  children: ReactNode;
}

export interface ProblemListProps {
  items: readonly ProblemListItem[];
  /** The id of the problem that starts open, so a deep link can arrive open from the server. */
  defaultOpen?: string;
  /** Put the open problem's id in the address bar, so the URL of what you see can be copied and shared. */
  syncHash?: boolean;
  className?: string;
}

/**
 * One area's problems as an accordion that opens by its anchor: when the page
 * loads with #id, or the hash changes to it, that problem opens, and opening
 * one by hand writes its id to the address bar (replacing, not pushing, so the
 * page does not jump and Back still leaves it). One problem is open at a
 * time; pressing it again closes it. The panels arrive as children, rendered
 * on the server, so this file holds only the open state.
 */
export function ProblemList({ items, defaultOpen, syncHash = true, className }: ProblemListProps) {
  const [open, setOpen] = useState(defaultOpen && items.some((item) => item.id === defaultOpen) ? defaultOpen : "");
  const ids = items.map((item) => item.id).join("\n");

  useEffect(() => {
    const known = ids.split("\n");
    const sync = () => {
      let id = window.location.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        // A malformed escape: compare the raw hash.
      }
      if (known.includes(id)) setOpen(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [ids]);

  const change = (value: string) => {
    setOpen(value);
    if (!syncHash) return;
    try {
      const url = new URL(window.location.href);
      url.hash = value;
      window.history.replaceState(null, "", value ? url : `${url.pathname}${url.search}`);
    } catch {
      // A sandboxed frame may refuse to rewrite its address; the problem still opens.
    }
  };

  return (
    <Accordion data-slot="problem-list" type="single" collapsible value={open} onValueChange={change} className={cn("border-t border-border", className)}>
      {items.map((item) => (
        <AccordionItem key={item.id} id={item.id} value={item.id} className="scroll-mt-28">
          <AccordionTrigger className="py-5 text-base tracking-[-.01em]">{item.symptom}</AccordionTrigger>
          <AccordionContent>{item.children}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
