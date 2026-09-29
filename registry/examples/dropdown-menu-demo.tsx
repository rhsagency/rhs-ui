"use client";

import { useState } from "react";

import { IconLogOut, IconMail, IconMessage, IconSettings, IconUser, IconUserPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@rhs-ui/primitives/dropdown-menu";

export default function Demo(): React.JSX.Element {
  const [statusBar, setStatusBar] = useState(true);
  const [density, setDensity] = useState("comfortable");
  const [last, setLast] = useState("Open the menu and choose something.");

  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Workspace</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuLabel>Studio North</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setLast("Profile opened.")}>
              <IconUser />
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLast("Settings opened.")}>
              <IconSettings />
              Settings
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconUserPlus />
                Invite people
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onSelect={() => setLast("Invite by email.")}>
                  <IconMail />
                  By email
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLast("Invite by message.")}>
                  <IconMessage />
                  By message
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={statusBar} onCheckedChange={(checked) => setStatusBar(checked === true)}>
            Show status bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setLast("Signed out. Not really: this is a preview.")}>
            <IconLogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {last} Status bar {statusBar ? "on" : "off"}, {density} density.
      </p>
    </div>
  );
}
