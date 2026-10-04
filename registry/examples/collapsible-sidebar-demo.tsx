"use client";

import { useState } from "react";

import { IconChartBar, IconFolder, IconHome, IconInbox, IconLayers, IconSettings, IconUsers } from "@rhs-ui/icons";
import { CollapsibleSidebar } from "@rhs-ui/primitives/collapsible-sidebar";
import { TooltipProvider } from "@rhs-ui/primitives/tooltip";

export default function Demo(): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <TooltipProvider>
      <div className="mx-auto flex h-[30rem] max-w-3xl overflow-clip rounded-2xl border border-border">
        <CollapsibleSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          brand={<><IconLayers />Ledger</>}
          mark={<IconLayers />}
          current="#inbox"
          sections={[
            { links: [{ href: "#home", label: "Home", icon: <IconHome /> }, { href: "#inbox", label: "Inbox", icon: <IconInbox />, badge: 4 }] },
            { title: "Workspace", links: [{ href: "#projects", label: "Projects", icon: <IconFolder /> }, { href: "#reports", label: "Reports", icon: <IconChartBar /> }, { href: "#people", label: "People", icon: <IconUsers /> }] },
          ]}
          footer={<a href="#settings" aria-label="Settings" className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><IconSettings className="size-4" /></a>}
        />
        <div className="flex-1 bg-muted/30 p-6 text-sm text-muted-foreground">Use the toggle at the top of the sidebar.</div>
      </div>
    </TooltipProvider>
  );
}
