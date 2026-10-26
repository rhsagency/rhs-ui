"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconBookOpen, IconFolder, IconUsers } from "@rhs-ui/icons";
import { ScopedSearchField, type SearchScope } from "@rhs-ui/primitives/scoped-search-field";

const SCOPES: readonly SearchScope[] = [
  { value: "docs", label: "Docs", placeholder: "Search docs by title or keyword" },
  { value: "people", label: "People", placeholder: "Search people by name or email" },
  { value: "files", label: "Files", placeholder: "Search files by name or type" },
];

const SCOPES_WITH_ICONS: readonly SearchScope[] = [
  { value: "docs", label: "Docs", placeholder: "Search docs by title or keyword", icon: <IconBookOpen /> },
  { value: "people", label: "People", placeholder: "Search people by name or email", icon: <IconUsers /> },
  { value: "files", label: "Files", placeholder: "Search files by name or type", icon: <IconFolder /> },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Workspace(): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const [last, setLast] = useState<{ query: string; scope: string } | null>(null);

  // The shortcut hint only shows the key: binding it is the page's job, and this is one way to do it.
  useEffect(() => {
    function listen(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || target?.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      box.current?.querySelector("input")?.focus();
    }
    document.addEventListener("keydown", listen);
    return () => document.removeEventListener("keydown", listen);
  }, []);

  return (
    <div className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Search Northwind</h2>
        <p className="text-xs text-muted-foreground">Pick where to look, type, and press Enter. Press / to jump to the field from anywhere on the page.</p>
      </div>
      <div ref={box}>
        <ScopedSearchField scopes={SCOPES_WITH_ICONS} defaultScope="people" defaultQuery="marit" shortcut="/" onSearch={(query, scope) => setLast({ query, scope })} />
      </div>
      <p role="status" className="flex min-h-4 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>onSearch</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{last ? JSON.stringify(last) : "press Enter"}</code>
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: change the scope and the text stays. Escape clears it, and a second Escape leaves the field">
          <Workspace />
        </Example>
        <Example caption="Empty: the field says what it will search, and the shortcut hint takes the place of the clear button">
          <ScopedSearchField scopes={SCOPES_WITH_ICONS} defaultScope="docs" shortcut="/" />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="With a query the clear button appears. A scope can carry an icon of its own">
          <ScopedSearchField scopes={SCOPES_WITH_ICONS} defaultScope="files" defaultQuery="q3 forecast" />
        </Example>
        <Example caption="Narrow, the menu shrinks to the scope's icon, or to the first letter of its label when it has none, and keeps its name for a screen reader. These are 18rem wide">
          <div className="grid gap-3">
            <div className="w-72 max-w-full">
              <ScopedSearchField scopes={SCOPES_WITH_ICONS} defaultScope="people" shortcut="/" />
            </div>
            <div className="w-72 max-w-full">
              <ScopedSearchField scopes={SCOPES} defaultScope="files" defaultQuery="q3 forecast" />
            </div>
          </div>
        </Example>
        <Example caption="Disabled">
          <ScopedSearchField scopes={SCOPES} defaultScope="docs" defaultQuery="release notes" disabled />
        </Example>
      </div>
    </div>
  );
}
