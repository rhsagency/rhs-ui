"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  IconBell,
  IconBold,
  IconCart,
  IconInbox,
  IconItalic,
  IconLink,
  IconPlus,
  IconRedo,
  IconRefresh,
  IconSettings,
  IconStar,
  IconTrash,
  IconUndo,
} from "@rhs-ui/icons";
import { IconButton, IconButtonProvider } from "@rhs-ui/primitives/icon-button";
import { Separator } from "@rhs-ui/primitives/separator";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [starred, setStarred] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const refresh = () => {
    setRefreshing(true);
    timer.current = window.setTimeout(() => setRefreshing(false), 1600);
  };

  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <Example caption="Hover or focus a button to see its tooltip and shortcut">
        <IconButtonProvider>
          <div role="group" aria-label="Text formatting" className="mb-9 inline-flex max-w-full items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-xs">
            <IconButton icon={<IconBold />} label="Bold" shortcut={["⌘", "B"]} side="bottom" tooltip={{ defaultOpen: true }} pressed={bold} onClick={() => setBold((value) => !value)} />
            <IconButton icon={<IconItalic />} label="Italic" shortcut={["⌘", "I"]} pressed={italic} onClick={() => setItalic((value) => !value)} />
            <IconButton icon={<IconLink />} label="Add link" shortcut={["⌘", "K"]} />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <IconButton icon={<IconUndo />} label="Undo" shortcut={["⌘", "Z"]} />
            <IconButton icon={<IconRedo />} label="Redo" shortcut={["⇧", "⌘", "Z"]} disabled />
          </div>
        </IconButtonProvider>
      </Example>

      <Example caption="A count or a dot on the corner">
        <div className="flex items-center gap-4">
          <IconButton variant="outline" icon={<IconInbox />} label="Inbox" badge={12} badgeLabel="unread messages" />
          <IconButton variant="outline" icon={<IconBell />} label="Notifications" badge badgeLabel="alerts" />
          <IconButton variant="outline" icon={<IconCart />} label="Cart" badge={124} badgeLabel="items" />
          <IconButton variant="outline" icon={<IconStar />} label="Star" pressed={starred} onClick={() => setStarred((value) => !value)} />
        </div>
      </Example>

      <Example caption="Variants">
        <div className="flex items-center gap-2">
          <IconButton icon={<IconSettings />} label="Settings" />
          <IconButton variant="outline" icon={<IconSettings />} label="Settings" />
          <IconButton variant="secondary" icon={<IconSettings />} label="Settings" />
          <IconButton variant="default" icon={<IconPlus />} label="New project" />
          <IconButton variant="destructive" icon={<IconTrash />} label="Delete" />
        </div>
      </Example>

      <Example caption="Sizes: 28, 32 and 40px, each with a 44px touch target">
        <div className="flex items-center gap-2">
          <IconButton variant="outline" size="sm" icon={<IconSettings />} label="Settings, small" />
          <IconButton variant="outline" size="md" icon={<IconSettings />} label="Settings, medium" />
          <IconButton variant="outline" size="lg" icon={<IconSettings />} label="Settings, large" />
        </div>
      </Example>

      <Example caption="Loading keeps the width and the focus">
        <div className="flex items-center gap-2">
          <IconButton variant="outline" icon={<IconRefresh />} label="Refresh" shortcut="R" loading={refreshing} onClick={refresh} />
          <IconButton variant="secondary" icon={<IconRefresh />} label="Refreshing" loading />
        </div>
      </Example>
    </div>
  );
}
