"use client";

import type { ReactNode } from "react";

import { IconLogOut } from "@rhs-ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface UserMenuItem {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
  /** A keyboard hint on the right: "⌘,". */
  shortcut?: string;
}

export interface UserMenuProps {
  name: string;
  email: string;
  image?: string;
  /** Groups of items, separated by a rule. */
  groups: readonly (readonly UserMenuItem[])[];
  onSignOut: () => void;
  className?: string;
}

/**
 * The avatar menu in an app's corner: who is signed in (name and email),
 * account links in groups, and sign out last and apart. The trigger names
 * the person ("Account menu for Anouk de Wit"), not just "menu".
 */
export function UserMenu({ name, email, image, groups, onSignOut, className }: UserMenuProps) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Account menu for ${name}`} className={cn("inline-flex size-9 items-center justify-center overflow-clip rounded-full bg-muted text-xs font-medium outline-none ring-offset-2 ring-offset-background focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}>
        {image ? <img src={image} alt="" className="size-full object-cover" /> : initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        {groups.map((group, index) => (
          <div key={index}>
            <DropdownMenuSeparator />
            {group.map((item) => (
              <DropdownMenuItem key={item.label} asChild={Boolean(item.href)} onSelect={item.onSelect}>
                {item.href ? (
                  <a href={item.href} className="flex items-center gap-2 [&_svg]:size-4">{item.icon}<span className="flex-1">{item.label}</span>{item.shortcut ? <span className="text-xs text-muted-foreground">{item.shortcut}</span> : null}</a>
                ) : (
                  <span className="flex w-full items-center gap-2 [&_svg]:size-4">{item.icon}<span className="flex-1">{item.label}</span>{item.shortcut ? <span className="text-xs text-muted-foreground">{item.shortcut}</span> : null}</span>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut} className="gap-2 [&_svg]:size-4"><IconLogOut />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
