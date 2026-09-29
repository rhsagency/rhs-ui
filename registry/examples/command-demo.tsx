"use client";

import { useState } from "react";

import { IconFolder, IconSearch, IconSettings, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@rhs-ui/primitives/command";

const PAGES = [
  { label: "Projects", icon: IconFolder, shortcut: "G P" },
  { label: "Team", icon: IconUsers, shortcut: "G T" },
  { label: "Settings", icon: IconSettings, shortcut: "G S" },
] as const;

const PROJECTS = ["Northwind rebrand", "Harbour booking app", "Oak Lane webshop"] as const;

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("Pick something, or open the palette.");
  const choose = (label: string) => {
    setLast(`${label} chosen.`);
    setOpen(false);
  };
  const items = (
    <>
      <CommandEmpty>Nothing matches that.</CommandEmpty>
      <CommandGroup heading="Pages">
        {PAGES.map(({ label, icon: Icon, shortcut }) => (
          <CommandItem key={label} onSelect={() => choose(label)}>
            <Icon />
            {label}
            <CommandShortcut>{shortcut}</CommandShortcut>
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Projects">
        {PROJECTS.map((label) => (
          <CommandItem key={label} onSelect={() => choose(label)}>
            {label}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Command className="rounded-lg border border-border">
        <CommandInput placeholder="Search pages and projects..." />
        <CommandList>{items}</CommandList>
      </Command>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <IconSearch />
        Open the palette
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Jump to a page or a project">
        <CommandInput placeholder="Search pages and projects..." />
        <CommandList>{items}</CommandList>
      </CommandDialog>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last}
      </p>
    </div>
  );
}
