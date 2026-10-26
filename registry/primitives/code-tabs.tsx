"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface CodeTab {
  /** A stable id. Tabs with the same id in the same `group` switch together. */
  id: string;
  /** What the tab says: "pnpm", "TypeScript", "app/page.tsx". */
  label: string;
  /** The code, as plain text. */
  code: string;
  /** Shown in the header of the code when there is no file name: "bash", "tsx". */
  language?: string;
  /** Shown in the header of the code: "app/page.tsx". */
  filename?: string;
}

export interface CodeTabsProps {
  /** The tabs: an id, a label and the code of each. */
  tabs: readonly CodeTab[];
  /** Code tabs with the same group switch together, so choosing pnpm in one install snippet chooses it in every other. They share it through a `CodeTabsProvider` higher up. */
  group?: string;
  /** The tab shown first. Defaults to the first one. */
  defaultTab?: string;
  /** Called with the id of the tab the person chose. */
  onTabChange?: (id: string) => void;
  /** Remember the choice in localStorage under this key, so it is still there after a reload. The key is read once the page has loaded, so the server and the first paint show `defaultTab`. */
  storageKey?: string;
  /** What the group of tabs is, for a screen reader: "Package manager". */
  label?: string;
  /** Classes for the root. */
  className?: string;
}

interface Shared {
  chosen: Readonly<Record<string, string>>;
  choose: (group: string, id: string) => void;
}

const CodeTabsContext = createContext<Shared | null>(null);

/**
 * The same code in several languages or package managers, as tabs. The tabs are
 * a real tablist with arrow keys, and each panel is a code block with a copy
 * button. Which tab is chosen is held per group, so every code tabs on the page
 * switches together, and in localStorage when `storageKey` is set, so it is
 * still there tomorrow. All panels sit in the same cell and only the chosen one
 * is visible, so the block is as high as the tallest one and the page does not
 * jump when you switch.
 */
export function CodeTabs({ tabs, group, defaultTab, onTabChange, storageKey, label, className }: CodeTabsProps) {
  const shared = useContext(CodeTabsContext);
  const first = tabs[0]?.id ?? "";
  const [own, setOwn] = useState(defaultTab !== undefined && tabs.some((tab) => tab.id === defaultTab) ? defaultTab : first);

  const choose = shared?.choose;
  // Back from a reload: the saved tab wins over the default, and tells its group.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && tabs.some((tab) => tab.id === saved)) {
        setOwn(saved);
        if (group) choose?.(group, saved);
      }
    } catch {
      /* Storage can be blocked; the choice then lasts as long as the page. */
    }
    // Once, when the page has loaded: a later change of tabs must not undo what the person chose.
  }, [storageKey]);

  // What the group chose counts when this block has that tab; otherwise the block keeps its own.
  const wanted = group ? shared?.chosen[group] : undefined;
  const active = wanted !== undefined && tabs.some((tab) => tab.id === wanted) ? wanted : tabs.some((tab) => tab.id === own) ? own : first;

  const select = (id: string) => {
    setOwn(id);
    if (group) choose?.(group, id);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, id);
      } catch {
        /* See above. */
      }
    }
    onTabChange?.(id);
  };

  if (!tabs.length) return null;
  return (
    <Tabs data-slot="code-tabs" value={active} onValueChange={select} className={cn("min-w-0 gap-3", className)}>
      <div className="relative max-w-full overflow-x-auto">
        <TabsList variant="pill" aria-label={label ?? "Code"}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {/* Every panel in one cell: the tallest decides the height, the others are only invisible. */}
      <div className="grid min-w-0">
        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            forceMount
            className="col-start-1 row-start-1 min-w-0 rounded-lg data-[state=inactive]:invisible focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <CodeBlock code={tab.code} filename={tab.filename} language={tab.language} className="h-full" />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

/**
 * Holds the tab each group has chosen, so every `CodeTabs` with the same
 * `group` switches together and a tab chosen on one page is still chosen on the
 * next, when the provider sits in a layout. Put it once around the pages that
 * show code. Without it a code tabs still works, on its own.
 */
export function CodeTabsProvider({ children }: { children: ReactNode }) {
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const choose = useCallback((group: string, id: string) => setChosen((now) => (now[group] === id ? now : { ...now, [group]: id })), []);
  const value = useMemo(() => ({ chosen, choose }), [chosen, choose]);
  return <CodeTabsContext.Provider value={value}>{children}</CodeTabsContext.Provider>;
}
