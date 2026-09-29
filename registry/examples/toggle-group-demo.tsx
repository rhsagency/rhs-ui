"use client";

import { useState } from "react";

import { IconBoard, IconGrid, IconList } from "@rhs-ui/icons";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";

export default function Demo(): React.JSX.Element {
  const [view, setView] = useState("grid");
  const [filters, setFilters] = useState<string[]>(["open"]);
  return (
    <div className="flex flex-col items-center gap-5">
      <ToggleGroup type="single" aria-label="View" value={view} onValueChange={(value) => value && setView(value)}>
        <ToggleGroupItem value="list" aria-label="List">
          <IconList />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid">
          <IconGrid />
        </ToggleGroupItem>
        <ToggleGroupItem value="board" aria-label="Board">
          <IconBoard />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" size="sm" aria-label="Show" value={filters} onValueChange={setFilters}>
        <ToggleGroupItem value="open">Open</ToggleGroupItem>
        <ToggleGroupItem value="review">In review</ToggleGroupItem>
        <ToggleGroupItem value="done">Done</ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {view} view, showing {filters.length ? filters.join(" and ") : "nothing"}.
      </p>
    </div>
  );
}
