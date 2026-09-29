"use client";

import { useState } from "react";

import { SearchInput } from "@rhs-ui/primitives/search-input";

const COMPONENTS = ["Accordion", "Alert", "Avatar", "Badge", "Button", "Calendar", "Card", "Checkbox", "Combobox", "Dialog", "Menubar", "Popover", "Select", "Tabs", "Toast"];

export default function Demo(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const found = COMPONENTS.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="grid w-full max-w-sm gap-3">
      <SearchInput aria-label="Search components" placeholder="Search components" shortcut="/" value={query} onValueChange={setQuery} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {found.length} {found.length === 1 ? "component" : "components"}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {found.map((name) => (
          <li key={name} className="rounded-md border border-border px-2 py-1 text-xs">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
