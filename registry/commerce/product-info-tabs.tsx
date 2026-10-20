"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { IconChevronDown } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface ProductInfoSection {
  /** A short slug without spaces ("reviews"). It is the URL hash that opens this section: /product#reviews. */
  id: string;
  /** The tab label and the accordion heading. */
  title: string;
  /** The panel. It stays in the document while closed, so search engines still read it. */
  content: ReactNode;
  /** A count beside the title: 128 reads "Reviews 128". */
  badge?: string | number;
}

export interface ProductInfoTabsProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** Description, details, shipping, reviews: one content model, shown as tabs or as an accordion. */
  sections: readonly ProductInfoSection[];
  /** The section that is open first. Defaults to the first one. */
  defaultId?: string;
  /** The viewport width, in px, from which tabs replace the accordion. */
  breakpoint?: number;
  /** Called with the id of the section the visitor (or the URL hash) opened. */
  onChange?: (id: string) => void;
  /** The level of the accordion headings, so the page outline stays in order. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Reads the URL hash on load and when it changes, and keeps it in step with the open section, so a link can point at one. */
  syncHash?: boolean;
  /** Names the tab list for assistive technology. */
  label?: string;
}

/** The count next to a title. It is read after the title: "Reviews, 128". */
function Count({ children }: { children: string | number }) {
  return (
    <Badge variant="secondary" className="tabular-nums">
      {children}
    </Badge>
  );
}

/**
 * Description, details, shipping and reviews as one content model shown two
 * ways: tabs at wide widths and a single-open accordion below the breakpoint,
 * so a product page is never a wall of text. A hash in the URL opens the right
 * section, closed panels stay in the document for search engines, tabs move
 * with the arrow keys and the accordion headings keep a real heading level.
 */
export function ProductInfoTabs({ sections, defaultId, breakpoint = 768, onChange, headingLevel = 3, syncHash = true, label = "Product information", className, ...props }: ProductInfoTabsProps) {
  const query = `(min-width: ${breakpoint}px)`;
  const subscribe = useCallback(
    (notify: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  // The server has no viewport: it renders the tabs, and a phone switches to the accordion as soon as the page is interactive.
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
  // Until that switch a phone would paint a row of tabs that does not fit (and scroll the page sideways), so the row is
  // hidden by CSS for exactly the widths the accordion takes over. The rule is keyed on the breakpoint, like the query.
  const hideTabs = Number.isFinite(breakpoint) ? `@media not all and ${query}{[data-slot="product-info-tabs"][data-breakpoint="${breakpoint}"] [data-slot="product-info-tabs-list"]{display:none}}` : "";

  const [open, setOpen] = useState<string | null>(defaultId ?? sections[0]?.id ?? null);
  // The first panel is simply there; only a change of section fades its panel in, so nothing flickers on load.
  const [changed, setChanged] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef({ sections, onChange });
  useEffect(() => {
    latest.current = { sections, onChange };
  });

  function select(id: string) {
    setOpen(id);
    setChanged(true);
    onChange?.(id);
    if (!syncHash) return;
    try {
      window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    } catch {
      // A sandboxed frame may not touch its own URL; the section is open all the same.
    }
  }

  useEffect(() => {
    if (!syncHash) return;
    const fromHash = () => {
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return; // A malformed hash opens nothing.
      }
      if (!id || !latest.current.sections.some((section) => section.id === id)) return;
      setOpen(id);
      setChanged(true);
      latest.current.onChange?.(id);
      // The panel was hidden when the browser looked for the anchor, so bring the section into view once it is open.
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.requestAnimationFrame(() => root.current?.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" }));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [syncHash]);

  if (!sections.length) return null;
  const Heading = `h${headingLevel}` as "h3";
  // A default or a hash that names no section must not leave the tabs without a panel.
  const current = sections.some((section) => section.id === open) ? open : null;

  return (
    <div ref={root} data-slot="product-info-tabs" data-mode={wide ? "tabs" : "accordion"} data-breakpoint={breakpoint} className={cn("w-full scroll-mt-24", className)} {...props}>
      {wide ? (
        <>
          {hideTabs ? <style dangerouslySetInnerHTML={{ __html: hideTabs }} /> : null}
          <Tabs value={current ?? sections[0]?.id} onValueChange={select}>
            {/* Tabs that do not fit scroll inside their own row and never widen the page; the padding keeps room for the focus ring, which an overflow box would clip. */}
            <div data-slot="product-info-tabs-list" className="relative -my-1 -ml-1 overflow-x-auto overscroll-x-contain py-1 pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList variant="line" aria-label={label} className="flex w-max min-w-full gap-7">
                {sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id} className="text-[0.9375rem]">
                    {section.title}
                    {section.badge !== undefined ? <Count>{section.badge}</Count> : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} forceMount className={cn("pt-7 text-sm leading-relaxed text-muted-foreground data-[state=inactive]:hidden", changed && "data-[state=active]:motion-safe:animate-rhs-panel-in")}>
                {section.content}
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        <AccordionPrimitive.Root type="single" collapsible value={current ?? ""} onValueChange={(id) => (id ? select(id) : setOpen(null))} className="border-t border-border">
          {sections.map((section) => (
            <AccordionPrimitive.Item key={section.id} value={section.id} className="border-b border-border">
              <AccordionPrimitive.Header asChild>
                <Heading>
                  <AccordionPrimitive.Trigger className="group/trigger flex w-full items-center gap-3 rounded-md py-4 text-left text-[0.9375rem] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    {section.title}
                    {section.badge !== undefined ? <Count>{section.badge}</Count> : null}
                    <IconChevronDown aria-hidden="true" className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none" />
                  </AccordionPrimitive.Trigger>
                </Heading>
              </AccordionPrimitive.Header>
              {/* Kept mounted and collapsed with a grid row, so the text is in the document and the height still animates. */}
              <AccordionPrimitive.Content forceMount className="grid transition-[grid-template-rows,visibility] duration-300 ease-out data-[state=closed]:invisible data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] motion-reduce:transition-none">
                <div className="min-h-0 overflow-hidden">
                  <div className="pb-6 text-sm leading-relaxed text-muted-foreground">{section.content}</div>
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      )}
    </div>
  );
}
