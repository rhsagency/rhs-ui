"use client";

import { useState } from "react";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@rhs-ui/primitives/menubar";

export default function Demo(): React.JSX.Element {
  const [grid, setGrid] = useState(true);
  const [zoom, setZoom] = useState("100");
  const [last, setLast] = useState("Open a menu; arrow keys move between them.");
  return (
    <div className="flex flex-col items-center gap-3">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={() => setLast("New board.")}>
              New board <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => setLast("Opened.")}>
              Open… <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Export as</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onSelect={() => setLast("Exported as PNG.")}>PNG</MenubarItem>
                <MenubarItem onSelect={() => setLast("Exported as PDF.")}>PDF</MenubarItem>
                <MenubarItem onSelect={() => setLast("Exported as SVG.")}>SVG</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={() => setLast("Undone.")}>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={() => setLast("Redone.")}>
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={grid} onCheckedChange={(checked) => setGrid(checked === true)}>
              Show grid
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
              {["50", "100", "200"].map((level) => (
                <MenubarRadioItem key={level} value={level}>
                  {level}%
                </MenubarRadioItem>
              ))}
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last} Grid {grid ? "on" : "off"}, zoom {zoom}%.
      </p>
    </div>
  );
}
